import {Component, ElementRef, Input, NgZone, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ConfigurationService} from '../../services-system/configuration.service';
import {AppService, ToastLevel} from '../../services-system/app.service';
import {ActivatedRoute, Router} from '@angular/router';
import {CredentialsService} from '../../services/credentials.service';
import {SessionService} from '../../services/session.service';
import {FederatedAccountService} from '../../services/federated-account.service';
import {Workspace} from '../../models/workspace';
import {AwsAccount} from '../../models/aws-account';
import {TrusterAccountService} from '../../services/truster-account.service';
import {AzureAccountService} from '../../services/azure-account.service';
import {IdpResponseType, WorkspaceService} from '../../services/workspace.service';

@Component({
  selector: 'app-setup-first-account',
  templateUrl: './setup-first-account.component.html',
  styleUrls: ['./setup-first-account.component.scss']
})
export class SetupFirstAccountComponent implements OnInit {

  toggleOpen = true;
  roles: string[] = [];
  checkDisabled = false;

  accountType = 'AWS';

  @Input() selectedAccount;
  @Input() selectedAccountNumber = '';
  @Input() selectedRole = '';

  @Input() fedUrl = '';
  @Input() fedUrlAzure = '';

  federatedRoles: { name: string, roleArn: string }[] = [];
  federatedAccounts: AwsAccount[] = [];

  workspace: Workspace;
  accounts: AwsAccount[];
  accountId;

  @Input() selectedType = 'federated';
  @ViewChild('roleInput', {static: false}) roleInput: ElementRef;

  public form = new FormGroup({
    idpArn: new FormControl('', [Validators.required]),
    accountNumber: new FormControl('', [Validators.required, Validators.maxLength(12), Validators.minLength(12)]),
    subscriptionId: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required]),
    federatedOrTruster: new FormControl('', [Validators.required]),
    federatedRole: new FormControl('', [Validators.required]),
    federatedAccount: new FormControl('', [Validators.required]),
    federationUrl: new FormControl('', [Validators.required, Validators.pattern('https?://.+')]),
  });

  /* Setup the first account for the application */
  constructor(
    private configurationService: ConfigurationService,
    private appService: AppService,
    private router: Router,
    private ngZone: NgZone,
    private activatedRoute: ActivatedRoute,
    private credentialsService: CredentialsService,
    private sessionService: SessionService,
    private workspaceService: WorkspaceService,
    private trusterAccountService: TrusterAccountService,
    private fedAccountService: FederatedAccountService,
    private azureAccountService: AzureAccountService) {
  }

  ngOnInit() {

    // Get the workspace and the accounts you need
    this.workspace = this.configurationService.getDefaultWorkspaceSync();
    this.accounts = this.fedAccountService.listFederatedAccountInWorkSpace();

    // Show the federated accounts
    this.federatedAccounts = this.accounts;

    // Check if we already have the fed Url: [this and many other element: we must decide if we want to create a simple create and a edit separately or fuse them together, i'm keeping them here until the refactoring is done]
    const config = this.configurationService.getConfigurationFileSync();
    if (config !== undefined && config !== null) {
      this.fedUrl = config.federationUrl;
      this.fedUrlAzure = config.federationUrlAzure;
    }

    // only for start screen
    this.form.controls['federatedOrTruster'].disable({ onlySelf: true });
  }

  getFedRoles() {
    // Get the appropriate roles
    const account = this.accounts.filter(acc => (acc.accountId === this.selectedAccount))[0];

    if (account !== undefined && account !== null) {

      this.federatedRoles = account.awsRoles;

      // Set the federated role automatically
      this.selectedAccountNumber = account.accountNumber;
      this.selectedRole = this.federatedRoles[0].name;
    }
  }

  /**
   * Set the account number when the event is called
   * @param event - the event to call
   */
  setAccountNumber(event) {
    this.form.controls['accountNumber'].setValue(this.appService.extractAccountNumberFromIdpArn(event.target.value));
  }

  /**
   * Save the first account in the workspace
   */
  saveAccount() {
    // Before we need to save the first workspace and call google: this is done only the first ime so it is not used in other classes
    // Now we get the default configuration to obtain the previously saved idp url
    const configuration = this.configurationService.getConfigurationFileSync();
    // Update Configuration
    configuration.federationUrl = this.form.value.federationUrl;
    this.configurationService.updateConfigurationFileSync(configuration);

    // Set our response type
    const responseType = IdpResponseType.SAML;

    // When the token is received save it and go to the setup page for the first account
    const sub = this.workspaceService.googleEmit.subscribe((googleToken) => this.ngZone.run(() => this.createNewWorkspace(googleToken, configuration.federationUrl, responseType)));

    // Call the service for working on the first login event to the user idp
    // We add the helper for account choosing just to be sure to give the possibility to call the correct user
    this.workspaceService.getIdpTokenInSetup(configuration.federationUrl, responseType);
  }

  /**
   * When the data from Google is received, generate a new workspace or check errors, etc.
   */
  createNewWorkspace(googleToken, federationUrl, responseType) {
    console.log(federationUrl);

    const name = 'default';
    const result = this.workspaceService.createNewWorkspace(googleToken, federationUrl, name, responseType);
    if (result) {
      this.decideSavingMethodAndSave();
    } else {
      // Error: return to dependencies page
      this.appService.toast('Can\'t create a new workspace for first account', ToastLevel.ERROR, 'Creation error');
    }

  }

  decideSavingMethodAndSave() {
    if (this.accountType === 'AWS') {
      if (this.selectedType === 'federated') {
        this.saveAwsFederatedAccount();
      } else {
        this.saveAwsTrusterAccount();
      }
    } else {
      this.saveAzureAccount();
    }
  }

  saveAzureAccount() {
    if (this.formValid()) {
      try {
        // Try to create the truster account
        const created = this.azureAccountService.addAzureAccountToWorkSpace(
          this.form.value.subscriptionId,
          this.form.value.name);

        // When you create an account you also define a possible session: in this case, being the only one we default it to true
        this.sessionService.addSession(
          this.form.value.subscriptionId,
          null,
          `background-1`,
          true);

        if (created) {
          // Then go to next page
          this.router.navigate(['/sessions', 'session-selected'], {queryParams: {accountId: this.accountId}});
        } else {
          this.appService.toast('Subscription Id must be unique', ToastLevel.WARN, 'Add Account');
        }
      } catch (err) {
        this.appService.toast(err, ToastLevel.ERROR);
      }
    } else {
      this.appService.toast('Missing required parameters for account', ToastLevel.WARN, 'Add required elements to Account');
    }
  }

  /**
   * This will be removed after created the correct file also in normal mode
   */
  saveAwsTrusterAccount() {
    if (this.formValid()) {
      try {
        // Try to create the truster account
        const created = this.trusterAccountService.addTrusterAccountToWorkSpace(
          this.form.value.accountNumber,
          this.form.value.name,
          this.generateRolesFromNames(this.form.value.accountNumber),
          this.form.value.idpArn,
          this.form.value.myRegion);
        if (created) {
          // Then go to next page
          this.router.navigate(['/sessions', 'session-selected'], {queryParams: {accountId: this.accountId}});
        } else {
          this.appService.toast('Account number must be unique', ToastLevel.WARN, 'Add Account');
        }
      } catch (err) {
        this.appService.toast(err, ToastLevel.ERROR);
      }
    } else {
      this.appService.toast('Add at least one role to the account', ToastLevel.WARN, 'Add Role to Account');
    }
  }

  saveAwsFederatedAccount() {
    if (this.formValid()) {
      try {
        // Add a federation Account to the workspace
        this.fedAccountService.addFederatedAccountToWorkSpace(
          this.form.value.accountNumber,
          this.form.value.name,
          this.generateRolesFromNames(this.form.value.accountNumber),
          this.form.value.idpArn, this.form.value.myRegion);

        // When you create an account you also define a possible session: in this case, being the only one we default it to true
        this.sessionService.addSession(
          this.form.value.accountNumber,
          this.generateRolesFromNames(this.form.value.accountNumber)[0].name,
          `background-1`,
          true);

        // Then go to next page
        this.router.navigate(['/sessions', 'session-selected'], {queryParams: {accountId: this.accountId}});
        // Then go to the dashboard
        // this.router.navigate(['/sessions', 'session-selected'], {queryParams: {firstAccount: true}});
      } catch (err) {
        this.appService.toast(err, ToastLevel.ERROR);
      }
    } else {
      this.appService.toast('Add at least one role to the account', ToastLevel.WARN, 'Add Role to Account');
    }
  }

  /**
   * Remove a role given a name
   * @param roleName - {string} to check against
   */
  removeRole(roleName: string) {
    const index = this.roles.indexOf(roleName);
    if (index > -1) {
      this.roles.splice(index, 1);
    }
  }

  /**
   * Set a role name when Return is called
   * @param keyEvent - the keyevent which is calle don keyup
   */
  setRoleName(keyEvent) {
    const roleName = this.roleInput.nativeElement.value;
    this.checkDisabled = (roleName !== '');

    if (keyEvent.code === 'Enter' && this.roles.indexOf(roleName) === -1 && roleName !== '') {
      this.roles.push(roleName);
      this.roleInput.nativeElement.value = null;
      this.checkDisabled = false;
    }
  }

  /**
   * By using the names we create the corresponding roles to be pushed inside the account configuration
   * @param accountNumber - the account number we use to construct the role arn
   * @returns - {any[]} - returns a list of aws roles
   */
  generateRolesFromNames(accountNumber: string) {
    const awsRoles = [];
    this.roles.forEach(role => {
      awsRoles.push({
        name: role,
        roleArn: `arn:aws:iam::${accountNumber}:role/${role}`
      });
    });
    return awsRoles;
  }

  /**
   * Because the form is complex we need a custom form validation
   * In the future we will put this in a service to create validation factory:
   * this way depending on new accounts we jkust need to pass the form object to the validator
   */
  formValid() {
    // First check the type of account we are creating
    if (this.accountType === 'AWS') {

      // Both have roles check
      const checkRoles = this.roles.length > 0;

      // We are in AWS check if we are saving a Federated or a Truster
      if (this.selectedType === 'federated') {
        // Check Federated fields
        const checkFields = this.form.controls['name'].valid &&
                            this.form.controls['federationUrl'].valid &&
                            this.form.controls['accountNumber'].valid &&
                            this.form.controls['idpArn'].valid;

        return checkRoles && checkFields;
      } else {
        // Check Truster fields
        const checkFields = this.form.controls['name'].valid &&
                            this.form.controls['federationUrl'].valid &&
                            this.form.controls['accountNumber'].valid &&
                            this.form.controls['federatedAccount'].valid &&
                            this.form.controls['federatedRole'].valid;

        return checkRoles && checkFields;
      }
    } else {
      // Check Azure fields
      return this.form.controls['name'].valid &&
             this.form.controls['federationUrl'].valid &&
             this.form.controls['subscriptionId'].valid;
    }
    return false;
  }

  setAccountType(name) {
    this.accountType = name;
  }
}

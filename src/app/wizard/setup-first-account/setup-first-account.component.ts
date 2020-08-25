import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ConfigurationService} from '../../services-system/configuration.service';
import {AppService, ToastLevel} from '../../services-system/app.service';
import {ActivatedRoute, Router} from '@angular/router';
import {CredentialsService} from '../../services/credentials.service';
import {SessionService} from '../../services/session.service';
import {FederatedAccountService} from '../../services/federated-account.service';
import {Workspace} from '../../models/workspace';
import {AwsAccount} from '../../models/aws-account';

@Component({
  selector: 'app-setup-first-account',
  templateUrl: './setup-first-account.component.html',
  styleUrls: ['./setup-first-account.component.scss']
})
export class SetupFirstAccountComponent implements OnInit {

  toggleOpen = true;
  roles: string[] = [];
  checkDisabled = false;

  @Input() selectedAccount = '';
  @Input() selectedAccountNumber = '';
  @Input() selectedRole = '';

  @Input() fedUrl = '';
  @Input() fedUrlAzure = '';

  types = [{type: 'federated'}, {type: 'truster'}];
  federatedRoles: { name: string, roleArn: string }[] = [];

  workspace: Workspace;
  accounts: AwsAccount[];
  accountId;

  @Input() selectedType;
  @ViewChild('roleInput', {static: false}) roleInput: ElementRef;

  public form = new FormGroup({
    idpArn: new FormControl('', [Validators.required]),
    accountNumber: new FormControl('', [Validators.required, Validators.maxLength(12), Validators.minLength(12)]),
    name: new FormControl('', [Validators.required]),
    ssoUrl: new FormControl('', [Validators.required]),
    federatedOrTruster: new FormControl('', [Validators.required]),
    federatedRole: new FormControl('', [Validators.required]),
    federationUrl: new FormControl('', [Validators.required, Validators.pattern('https?://.+')]),
  });

  /* Setup the first account for the application */
  constructor(
    private configurationService: ConfigurationService,
    private appService: AppService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private credentialsService: CredentialsService,
    private sessionService: SessionService,
    private fedAccountService: FederatedAccountService) {
  }

  ngOnInit() {
    const sub = this.activatedRoute.queryParams.subscribe(params => {
      this.accountId = params['accountId'];
      if (!this.accountId.isEmpty) {
        // Get the workspace and the accounts you need
        this.workspace = this.configurationService.getDefaultWorkspaceSync();
        this.accounts = this.fedAccountService.listFederatedAccountInWorkSpace();

        // Get the appropriate roles
        const account = this.accounts.filter(acc => (acc.accountId === this.accountId))[0];
        this.federatedRoles = account.awsRoles;

        // Set the federated role automatically
        this.selectedAccount = account.accountNumber;
        this.selectedAccountNumber = account.accountNumber;
        this.selectedRole = this.federatedRoles[0].name;

        // Check if we already have the fed Url: [this and many other element: we must decide if we want to create a simple create and a edit separately or fuse them together, i'm keeping them here until the refactoring is done]
        const config = this.configurationService.getConfigurationFileSync();
        this.fedUrl = config.federationUrl;
        this.fedUrlAzure = config.federationUrlAzure;
      }
    });
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
    if (this.form.valid && this.roles.length > 0) {
      try {
        // If the form is valid we save the first account in the configuration
        const workspace = this.configurationService.getDefaultWorkspaceSync();
        const configuration = this.configurationService.getConfigurationFileSync();

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

        // Update Configuration
        const config = this.configurationService.getConfigurationFileSync();
        config.federationUrl = this.form.value.federationUrl;
        this.configurationService.updateConfigurationFileSync(config);

        // When we define a new session and we want to activate it: use the refresh credential emit
        this.credentialsService.refreshCredentialsEmit.emit();

        // Then go to next page: in this case we go to the spinning are for first token and workspace definition in the normal version we use the url below
        this.router.navigate(['/wizard', 'setup-spinner-for-login']);
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


}

import {Component, ElementRef, Input, NgZone, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ConfigurationService} from '../../services-system/configuration.service';
import {AppService} from '../../services-system/app.service';
import {ActivatedRoute, Router} from '@angular/router';
import {CredentialsService} from '../../services/credentials.service';
import {SessionService} from '../../services/session.service';
import {Workspace} from '../../models/workspace';
import {AwsAccount} from '../../models/aws-account';
import {WorkspaceService} from '../../services/workspace.service';
import {ProviderManagerService} from '../../services/provider-manager.service';
import {AccountType} from '../../models/AccountType';

@Component({
  selector: 'app-create-account',
  templateUrl: './create-account.component.html',
  styleUrls: ['./create-account.component.scss']
})
export class CreateAccountComponent implements OnInit {

  toggleOpen = true;
  roles: string[] = [];
  accountType;
  firstTime = false;
  ssoInserted = false;
  providerSelected = false;

  @Input() selectedAccount;
  @Input() selectedAccountNumber = '';
  @Input() selectedRole = '';

  @Input() fedUrl = '';

  federatedRoles: { name: string, roleArn: string }[] = [];
  federatedAccounts: AwsAccount[] = [];

  workspace: Workspace;
  accounts: AwsAccount[];
  accountId;

  eAccountType = AccountType;

  @Input() selectedType = 'federated';
  @ViewChild('roleInput', {static: false}) roleInput: ElementRef;

  public form = new FormGroup({
    idpArn: new FormControl('', [Validators.required]),
    accountNumber: new FormControl('', [Validators.required, Validators.maxLength(12), Validators.minLength(12)]),
    subscriptionId: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required]),
    role: new FormControl('', [Validators.required]),
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
    private providerManagerService: ProviderManagerService
  ) {}

  ngOnInit() {

    this.activatedRoute.queryParams.subscribe(params => {

      // Get the workspace and the accounts you need
      this.workspace = this.configurationService.getDefaultWorkspaceSync();
      this.accounts = this.providerManagerService.getFederatedAccounts();

      // Add parameters to check what to do with form data
      this.firstTime = params['firstTime'];
      this.ssoInserted = (this.workspace.idpUrl !== undefined && this.workspace.idpUrl !== null);

      // Show the federated accounts
      this.federatedAccounts = this.accounts;

      // Check if we already have the fed Url: [this and many other element: we must decide if we want to create a simple create and a edit separately or fuse them together, i'm keeping them here until the refactoring is done]
      const config = this.configurationService.getConfigurationFileSync();
      if (config !== undefined && config !== null) {
        this.fedUrl = config.federationUrl;
      }

      // only for start screen
      if (this.firstTime) {
        this.form.controls['federatedOrTruster'].disable({ onlySelf: true });
      }
    });
  }

  /**
   * Get all the federated roles
   */
  getFedRoles() {
    // Get the role data
    const roleData = this.providerManagerService.getFederatedRoles(this.accounts, this.selectedAccount);
    // Get the appropriate roles
    this.federatedRoles = roleData.federatedRoles;
    // Set the federated role automatically
    this.selectedAccountNumber = roleData.selectedAccountNumber;
    this.selectedRole = roleData.selectedrole;
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
    if (this.firstTime) {
      this.providerManagerService.saveFirstAccount(
        this.accountId,
        this.accountType,
        this.selectedAccount,
        this.selectedRole,
        this.selectedType,
        this.form
      );
    } else {
      this.providerManagerService.saveAccount(
        this.accountId,
        this.accountType,
        this.selectedAccount,
        this.selectedRole,
        this.selectedType,
        this.form
      );
    }

  }

  setAccountType(name) {
    this.accountType = name;
    this.providerSelected = true;
  }

  formValid() {
    return this.providerManagerService.formValid(this.form, this.accountType, this.selectedType);
  }

  goBack() {
    // this.router.navigate(['/sessions', 'session-selected']);
  }
}

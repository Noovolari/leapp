import {Component, ElementRef, Input, NgZone, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ConfigurationService} from '../../services-system/configuration.service';
import {AppService, LoggerLevel} from '../../services-system/app.service';
import {ActivatedRoute, Router} from '@angular/router';
import {CredentialsService} from '../../services/credentials.service';
import {SessionService} from '../../services/session.service';
import {Workspace} from '../../models/workspace';
import {AwsAccount} from '../../models/aws-account';
import {WorkspaceService} from '../../services/workspace.service';
import {ProviderManagerService} from '../../services/provider-manager.service';
import {AccountType} from '../../models/AccountType';
import {Session} from '../../models/session';

@Component({
  selector: 'app-create-account',
  templateUrl: './create-account.component.html',
  styleUrls: ['./create-account.component.scss']
})
export class CreateAccountComponent implements OnInit {

  firstTime = false;
  providerSelected = false;
  typeSelection = false;
  hasOneGoodSession = false;
  hasSsoUrl = false;

  toggleOpen = true;
  roles: string[] = [];
  accountType;
  provider;

  @Input() selectedSession;
  @Input() selectedAccountNumber = '';
  @Input() selectedRole = '';
  @Input() fedUrl = '';

  federatedRoles: { name: string, roleArn: string }[] = [];
  federatedAccounts: AwsAccount[] = [];

  workspace: Workspace;
  accounts: AwsAccount[];
  accountId;

  regions = [];
  selectedRegion;

  eAccountType = AccountType;

  @ViewChild('roleInput', {static: false}) roleInput: ElementRef;

  public form = new FormGroup({
    idpArn: new FormControl('', [Validators.required]),
    accountNumber: new FormControl('', [Validators.required, Validators.maxLength(12), Validators.minLength(12)]),
    subscriptionId: new FormControl('', [Validators.required]),
    tenantId: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required]),
    role: new FormControl('', [Validators.required]),
    federatedOrTruster: new FormControl('', [Validators.required]),
    federatedRole: new FormControl('', [Validators.required]),
    federatedAccount: new FormControl('', [Validators.required]),
    federationUrl: new FormControl('', [Validators.required, Validators.pattern('https?://.+')]),
    plainUser: new FormControl('', [Validators.required]),
    secretKey: new FormControl('', [Validators.required]),
    accessKey: new FormControl('', [Validators.required]),
    awsRegion: new FormControl(''),
    mfaDevice: new FormControl('')
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
      const sessions = this.providerManagerService.getFederatedAndPlainAccounts();
      this.accounts = sessions.map((sess: Session) => {
        return {
          session: sess,
          accountName: sess.account.accountName
        };
      });

      // Add parameters to check what to do with form data
      this.hasOneGoodSession = sessions.length > 0;
      this.firstTime = params['firstTime'] || !this.hasOneGoodSession; // This way we also fix potential incongruence when you have half saved setup
      this.fedUrl = this.workspace.idpUrl;
      this.hasSsoUrl = this.fedUrl && this.fedUrl !== '';

      // Show the federated accounts
      this.federatedAccounts = this.accounts;

      // only for start screen
      if (this.firstTime) {
        this.form.controls['federatedOrTruster'].disable({ onlySelf: true });
      }

      this.regions = this.appService.getRegions();
      this.selectedRegion = this.regions[0].region;
    });
  }

  /**
   * Get all the federated roles
   */
  getFedRoles() {
    // Get the role data
    const roleData = this.providerManagerService.getFederatedRole(this.accounts, this.selectedSession);
    // Get the appropriate roles
    this.federatedRoles = [roleData.federatedRole];
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
    this.appService.logger(`Saving account...`, LoggerLevel.INFO, this);

    if (this.firstTime) {
      this.providerManagerService.saveFirstAccount(
        this.accountId,
        this.accountType,
        this.selectedSession,
        this.selectedRole,
        this.selectedRegion,
        this.form
      );
    } else {
      this.providerManagerService.saveAccount(
        this.accountId,
        this.accountType,
        this.selectedSession,
        this.selectedRole,
        this.selectedRegion,
        this.form
      );
    }
  }

  setProvider(name) {
    this.provider = name;
    this.providerSelected = true;
    if (name === AccountType.AZURE) {
      this.accountType = AccountType.AZURE;
    }
    if (name === AccountType.AWS) {
      this.typeSelection = true;
    }
  }

  setAccountType(name) {
    this.accountType = name;
  }

  formValid() {
    return this.providerManagerService.formValid(this.form, this.accountType);
  }

  goBack() {
    this.workspace = this.configurationService.getDefaultWorkspaceSync();

    this.appService.logger(`Going back (this.workspace && this.workspace.sessions && this.workspace.sessions.length > 0): ${this.workspace && this.workspace.sessions && this.workspace.sessions.length > 0}`, LoggerLevel.INFO, this);

    if (this.workspace && this.workspace.sessions && this.workspace.sessions.length > 0) {
      this.router.navigate(['/sessions', 'session-selected']);
    } else {
      this.accountType = undefined;
      this.provider = undefined;
      this.hasOneGoodSession = false;
      this.hasSsoUrl = false;
      this.providerSelected = false;
      this.typeSelection = false;
      this.firstTime = true;
    }
  }

  setAccessStrategy(strategy) {
    this.accountType = strategy;
    this.provider = strategy;
    this.typeSelection = false;
    this.appService.logger(`Setting an access strategy we want to create`, LoggerLevel.INFO, this, JSON.stringify({ strategy }, null, 3));
  }

  openAccessStrategyDocumentation() {
    this.appService.openExternalUrl('https://github.com/Noovolari/leapp/blob/master/README.md');
  }

  openSSODocumentation() {
    this.appService.openExternalUrl('https://github.com/Noovolari/leapp/blob/master/.github/tutorials/G_SUITE_FEDERATION_SETUP');
  }
}

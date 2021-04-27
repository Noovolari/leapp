import {Component, ElementRef, Input, NgZone, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ConfigurationService} from '../../services-system/configuration.service';
import {AppService, LoggerLevel} from '../../services-system/app.service';
import {ActivatedRoute, Router} from '@angular/router';
import {SessionService} from '../../services/session.service';
import {WorkspaceService} from '../../services/workspace.service';
import {ProviderManagerService} from '../../services/provider-manager.service';
import {AccountType} from '../../models/AccountType';
import {AntiMemLeak} from '../../core/anti-mem-leak';
import {environment} from '../../../environments/environment';
import * as uuid from 'uuid';
import {AwsPlainService} from '../../strategies/aws-plain.service';
import {Account} from '../../models/account';


@Component({
  selector: 'app-create-account',
  templateUrl: './create-account.component.html',
  styleUrls: ['./create-account.component.scss']
})
export class CreateAccountComponent extends AntiMemLeak implements OnInit {

  firstTime = false;
  providerSelected = false;
  typeSelection = false;
  hasOneGoodSession = false;
  hasSsoUrl = false;

  accountType;
  provider;

  @Input() selectedSession;
  @Input() selectedAccountNumber = '';
  @Input() selectedRole = '';
  @Input() fedUrl = '';

  idps: { value: string, label: string}[] = [];
  selectedIdpUrl: {value: string, label: string};

  federatedRoles: { name: string, roleArn: string }[] = [];
  federatedAccounts = [];

  accounts = [];
  accountId;

  regions = [];
  selectedRegion;
  locations = [];
  selectedLocation;

  profiles: { value: string, label: string}[] = [];
  selectedProfile: {value: string, label: string};

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
    mfaDevice: new FormControl(''),
    awsProfile: new FormControl('', [Validators.required]),
    azureLocation: new FormControl('', [Validators.required])
  });

  /* Setup the first account for the application */
  constructor(
    private configurationService: ConfigurationService,
    private appService: AppService,
    private router: Router,
    private ngZone: NgZone,
    private activatedRoute: ActivatedRoute,
    private sessionService: SessionService,
    private workspaceService: WorkspaceService,
    private providerManagerService: ProviderManagerService,
    private awsPlainService: AwsPlainService
  ) { super(); }

  ngOnInit() {

    this.subs.add(this.activatedRoute.queryParams.subscribe(params => {

      // Get the workspace and the accounts you need
      const workspace = this.workspaceService.get();

      // Add parameters to check what to do with form data
      if (workspace.idpUrl && workspace.idpUrl.length > 0) {
        workspace.idpUrl.forEach(idp => {
          if (idp !== null) {
            this.idps.push({value: idp.id, label: idp.url});
          }
        });
      }

      // Add parameters to check what to do with form data
      workspace.profiles.forEach(idp => {
          if (idp !== null && idp.name !== environment.defaultAzureProfileName) {
            this.profiles.push({value: idp.id, label: idp.name});
          }
      });

      this.hasOneGoodSession = workspace.sessions.length > 0;
      this.firstTime = params['firstTime'] || !this.hasOneGoodSession; // This way we also fix potential incongruence when you have half saved setup

      // Show the federated accounts
      this.federatedAccounts = this.accounts;

      // only for start screen
      if (this.firstTime) {
        this.form.controls['federatedOrTruster'].disable({ onlySelf: true });
      }

      this.regions = this.appService.getRegions();
      this.locations = this.appService.getLocations();

      this.selectedRegion = workspace.defaultRegion || environment.defaultRegion || this.regions[0].region;
      this.selectedLocation = workspace.defaultLocation || environment.defaultLocation || this.locations[0].location;
      this.selectedProfile = workspace.profiles.filter(p => p.name === 'default').map(p => ({ value: p.id, label: p.name }))[0];
    }));
  }

  /**
   * Get all the federated roles
   */
  getFedRoles() {
    // Get the role data
    const roleData = this.providerManagerService.getFederatedRole(this.selectedSession);
    // Get the appropriate roles
    this.federatedRoles = roleData.map(rd => rd.federatedRole);
    // Set the federated role automatically
    this.selectedAccountNumber = roleData.map(rd => rd.selectedAccountNumber)[0];
    this.selectedRole = roleData.map(rd => rd.selectedrole)[0];
  }

  addNewSSO(tag: string) {
    return {value: uuid.v4(), label: tag};
  }

  addNewProfile(tag: string) {
    return {value: uuid.v4(), label: tag};
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
    const selectedUrl = this.selectedIdpUrl ? {id: this.selectedIdpUrl.value, url: this.selectedIdpUrl.label } : undefined;
    const selectedProfile = this.selectedProfile ? {id: this.selectedProfile.value, name: this.selectedProfile.label } : undefined;

    let account: Account;
    switch (this.accountType) {
      case (AccountType.AWS_PLAIN_USER):
        account = this.awsPlainService.createAccount( this.form.value.name, this.accountType, this.selectedRegion,
          {accessKey: this.form.value.accessKey.trim(),
            secretKey: this.form.value.secretKey.trim(),
            profileId: this.selectedProfile.value,
            mfaDevice: this.form.value.mfaDevice.trim(),
          });
        break;
    }
    this.sessionService.create(account, this.selectedProfile.value);

    this.providerManagerService.saveAccount(
      this.accountId,
      this.accountType,
      this.selectedSession,
      this.selectedRole,
      this.selectedRegion,
      selectedUrl,
      selectedProfile,
      this.form
    );

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
    const workspace = this.workspaceService.get();

    if (workspace.sessions.length > 0) {
      this.router.navigate(['/sessions', 'session-selected']);
    } else {
      this.accountType = undefined;
      this.provider = undefined;
      this.hasOneGoodSession = false;
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


  goToAwsSso() {
    this.router.navigate(['/integrations', 'aws-sso']);
  }
}

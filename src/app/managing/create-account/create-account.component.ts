import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ConfigurationService} from '../../services/configuration.service';
import {AppService, LoggerLevel} from '../../services/app.service';
import {ActivatedRoute, Router} from '@angular/router';
import {SessionService} from '../../services/session.service';
import {WorkspaceService} from '../../services/workspace.service';
import {SessionType} from '../../models/session-type';
import {environment} from '../../../environments/environment';
import * as uuid from 'uuid';
import {AwsPlainAccountRequest, AwsPlainService} from '../../services/session/aws-plain.service';
import {AwsTrusterAccountRequest, AwsTrusterService} from '../../services/session/aws-truster.service';

@Component({
  selector: 'app-create-account',
  templateUrl: './create-account.component.html',
  styleUrls: ['./create-account.component.scss']
})
export class CreateAccountComponent implements OnInit {

  @Input() selectedSession;
  @Input() selectedAccountNumber = '';
  @Input() selectedRole = '';
  @Input() selectedSamlUrl = '';

  @ViewChild('roleInput', {static: false}) roleInput: ElementRef;

  firstTime = false;
  providerSelected = false;
  typeSelection = false;
  hasOneGoodSession = false;
  hasSsoUrl = false;

  sessionType;
  provider;

  idps: { value: string; label: string}[] = [];
  selectedIdpUrl: {value: string; label: string};

  profiles: { value: string; label: string}[] = [];
  selectedProfile: {value: string; label: string};

  assumableAccounts = [];

  regions = [];
  selectedRegion;
  locations = [];
  selectedLocation;

  eAccountType = SessionType;

  public form = new FormGroup({
    idpArn: new FormControl('', [Validators.required]),
    accountNumber: new FormControl('', [Validators.required, Validators.maxLength(12), Validators.minLength(12)]),
    subscriptionId: new FormControl('', [Validators.required]),
    tenantId: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required]),
    role: new FormControl('', [Validators.required]),
    roleArn: new FormControl('', [Validators.required]),
    federatedOrTruster: new FormControl('', [Validators.required]),
    federatedRole: new FormControl('', [Validators.required]),
    federatedAccount: new FormControl('', [Validators.required]),
    federationUrl: new FormControl('', [Validators.required, Validators.pattern('https?://.+')]),
    secretKey: new FormControl('', [Validators.required]),
    accessKey: new FormControl('', [Validators.required]),
    awsRegion: new FormControl(''),
    mfaDevice: new FormControl(''),
    awsProfile: new FormControl('', [Validators.required]),
    azureLocation: new FormControl('', [Validators.required]),
    assumableAccount: new FormControl('', [Validators.required])
  });

  /* Setup the first account for the application */
  constructor(
    private configurationService: ConfigurationService,
    private appService: AppService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private sessionService: SessionService,
    private workspaceService: WorkspaceService,
    private awsPlainService: AwsPlainService,
    private awsTrusterService: AwsTrusterService
  ) {}

  ngOnInit() {

    this.activatedRoute.queryParams.subscribe(params => {

      // Get the workspace and the accounts you need
      const workspace = this.workspaceService.get();

      // We get all the applicable idp urls
      if (workspace.idpUrl && workspace.idpUrl.length > 0) {
        workspace.idpUrl.forEach(idp => {
          if (idp !== null) {
            this.idps.push({value: idp.id, label: idp.url});
          }
        });
      }

      // We got all the applicable profiles
      // Note: we don't use azure profile so we remove default azure profile from the list
      workspace.profiles.forEach(idp => {
          if (idp !== null && idp.name !== environment.defaultAzureProfileName) {
            this.profiles.push({value: idp.id, label: idp.name});
          }
      });

      // This way we also fix potential incongruences when you have half saved setup
      this.hasOneGoodSession = workspace.sessions.length > 0;
      this.firstTime = params['firstTime'] || !this.hasOneGoodSession;

      // Show the assumable accounts
      this.assumableAccounts = this.sessionService.listAwsAssumable().map(session => {
        return {
          accountName: session.account.accountName,
          session
        };
      });
      console.log(this.assumableAccounts);



      // Only for start screen: disable Truster creation
      if (this.firstTime) {
        this.form.controls['federatedOrTruster'].disable({ onlySelf: true });
      }

      // Get all regions and locations from app service lists
      this.regions = this.appService.getRegions();
      this.locations = this.appService.getLocations();

      // Select default values
      this.selectedRegion = workspace.defaultRegion || environment.defaultRegion || this.regions[0].region;
      this.selectedLocation = workspace.defaultLocation || environment.defaultLocation || this.locations[0].location;
      this.selectedProfile = workspace.profiles.filter(p => p.name === 'default').map(p => ({ value: p.id, label: p.name }))[0];
    });
  }

  /**
   * Add a new single sing-on url to list
   *
   * @param tag
   */
  addNewSSO(tag: string): { value: string; label: string } {
   return { value: uuid.v4(), label: tag };
  }

  /**
   * Add a new profile to list
   *
   * @param tag
   */
  addNewProfile(tag: string): { value: string; label: string } {
   return { value: uuid.v4(), label: tag };
  }

  /**
   * Save the first account in the workspace
   */
  saveSession() {
    this.appService.logger(`Saving account...`, LoggerLevel.info, this);

    switch (this.sessionType) {
      case (SessionType.awsPlain):
        const awsPlainAccountRequest: AwsPlainAccountRequest = {
          accountName: this.form.value.name.trim(),
          region: this.selectedRegion,
          accessKey: this.form.value.accessKey.trim(),
          secretKey: this.form.value.secretKey.trim(),
          mfaDevice: this.form.value.mfaDevice.trim()
        };
        this.awsPlainService.create(awsPlainAccountRequest, this.selectedProfile.value);
        break;
      case (SessionType.awsTruster):
        const awsTrusterAccountRequest: AwsTrusterAccountRequest = {
          accountName: this.form.value.name.trim(),
          region: this.selectedRegion,
          roleArn: this.form.value.roleArn.trim(),
          parentSessionId: this.selectedSession.sessionId
        };
        this.awsTrusterService.create(awsTrusterAccountRequest, this.selectedProfile.value);
        break;
    }
    this.router.navigate(['/sessions', 'session-selected']);
  }

  /**
   * Form validation mechanic
   */
  formValid() {
    // TODO: validate form
    return true;
  }

  /**
   * First step of the wizard: set the Cloud provider or go to the SSO integration
   *
   * @param name
   */
  setProvider(name) {
    this.provider = name;
    this.providerSelected = true;
    if (name === SessionType.azure) {
      this.sessionType = SessionType.azure;
    }
    if (name === SessionType.awsFederated) {
      this.typeSelection = true;
    }
  }

  /**
   * Second step of wizard: set the strategy in the UI
   *
   * @param strategy
   */
  setAccessStrategy(strategy) {
    this.sessionType = strategy;
    this.provider = strategy;
    this.typeSelection = false;
  }

  /**
   * Open the Leapp documentation in the default browser
   *
   */
  openAccessStrategyDocumentation() {
    this.appService.openExternalUrl('https://github.com/Noovolari/leapp/blob/master/README.md');
  }

  /**
   * Go to the Single Sing-On integration page
   *
   */
  goToAwsSso() {
    this.router.navigate(['/integrations', 'aws-sso']);
  }

  /**
   * Go to Session Selection screen or to first stage of wizard
   * depending if if there are sessions already or not
   *
   */
  goBack() {
    const workspace = this.workspaceService.get();

    if (workspace.sessions.length > 0) {
      this.router.navigate(['/sessions', 'session-selected']);
    }/* else {
      this.accountType = undefined;
      this.provider = undefined;
      this.hasOneGoodSession = false;
      this.providerSelected = false;
      this.typeSelection = false;
      this.firstTime = true;
    }*/
  }
}

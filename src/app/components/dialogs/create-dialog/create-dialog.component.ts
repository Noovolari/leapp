import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AppService, LoggerLevel, ToastLevel} from '../../../services/app.service';
import {ActivatedRoute, Router} from '@angular/router';
import {AwsSessionService} from '../../../services/session/aws/aws-session.service';
import {WorkspaceService} from '../../../services/workspace.service';
import {SessionType} from '../../../models/session-type';
import {environment} from '../../../../environments/environment';
import * as uuid from 'uuid';
import {AwsIamUserService, AwsIamUserSessionRequest} from '../../../services/session/aws/methods/aws-iam-user.service';
import {
  AwsIamRoleChainedService,
  AwsIamRoleChainedSessionRequest
} from '../../../services/session/aws/methods/aws-iam-role-chained.service';
import {LeappParseError} from '../../../errors/leapp-parse-error';
import {
  AwsIamRoleFederatedService,
  AwsIamRoleFederatedSessionRequest
} from '../../../services/session/aws/methods/aws-iam-role-federated.service';
import {AzureService, AzureSessionRequest} from '../../../services/session/azure/azure.service';
import {LoggingService} from '../../../services/logging.service';
import {BsModalService} from 'ngx-bootstrap/modal';
import {openIntegrationEvent} from '../../integration-bar/integration-bar.component';
import {Constants} from "../../../models/constants";

@Component({
  selector: 'app-create-dialog',
  templateUrl: './create-dialog.component.html',
  styleUrls: ['./create-dialog.component.scss']
})

export class CreateDialogComponent implements OnInit {

  @Input() selectedSession;
  @Input() selectedAccountNumber = '';
  @Input() selectedRole = '';
  @Input() selectedSamlUrl = '';

  @ViewChild('roleInput', {static: false})
  roleInput: ElementRef;

  firstTime = false;
  providerSelected = false;
  typeSelection = false;
  hasOneGoodSession = false;
  hasSsoUrl = false;
  eConstants = Constants;

  sessionType;
  provider;

  idpUrls: { value: string; label: string}[] = [];
  selectedIdpUrl: {value: string; label: string};

  profiles: { value: string; label: string}[] = [];
  selectedProfile: {value: string; label: string};

  assumerAwsSessions = [];

  regions = [];
  selectedRegion;
  locations = [];
  selectedLocation;

  eSessionType = SessionType;

  public form = new FormGroup({
    idpArn: new FormControl('', [Validators.required]),
    accountNumber: new FormControl('', [Validators.required, Validators.maxLength(12), Validators.minLength(12)]),
    subscriptionId: new FormControl('', [Validators.required]),
    tenantId: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required]),
    role: new FormControl('', [Validators.required]),
    roleArn: new FormControl('', [Validators.required]),
    roleSessionName: new FormControl('', [Validators.pattern('[a-zA-Z\\d\\-\\_\\@\\=\\,\\.]+')]),
    federatedOrIamRoleChained: new FormControl('', [Validators.required]),
    federatedRole: new FormControl('', [Validators.required]),
    federationUrl: new FormControl('', [Validators.required, Validators.pattern('https?://.+')]),
    secretKey: new FormControl('', [Validators.required]),
    accessKey: new FormControl('', [Validators.required]),
    awsRegion: new FormControl(''),
    mfaDevice: new FormControl(''),
    awsProfile: new FormControl('', [Validators.required]),
    azureLocation: new FormControl('', [Validators.required]),
    assumerSession: new FormControl('', [Validators.required]),
    selectAccessStrategy: new FormControl(SessionType.awsIamRoleFederated, [Validators.required])
  });

  /* Setup the first account for the application */
  constructor(
    public appService: AppService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public workspaceService: WorkspaceService,
    private awsIamRoleFederatedService: AwsIamRoleFederatedService,
    private awsIamUserService: AwsIamUserService,
    private awsIamRoleChainedService: AwsIamRoleChainedService,
    private awsSessionService: AwsSessionService,
    private azureService: AzureService,
    private loggingService: LoggingService,
    private bsModalService: BsModalService
  ) {}

  ngOnInit() {

    this.activatedRoute.queryParams.subscribe(params => {

      // Get the workspace and the accounts you need
      const workspace = this.workspaceService.getWorkspace();

      // We get all the applicable idp urls
      if (workspace.idpUrls && workspace.idpUrls.length > 0) {
        workspace.idpUrls.forEach(idp => {
          if (idp !== null && idp.id) {
            this.idpUrls.push({value: idp.id, label: idp.url});
          }
        });
      }

      // We got all the applicable profiles
      // Note: we don't use azure profile so we remove default azure profile from the list
      workspace.profiles.forEach(idp => {
        if (idp !== null && idp.name !== environment.defaultAzureProfileName && idp.id) {
          this.profiles.push({value: idp.id, label: idp.name});
        }
      });

      // This way we also fix potential incongruences when you have half saved setup
      this.hasOneGoodSession = workspace.sessions.length > 0;
      this.firstTime = params['firstTime'] || !this.hasOneGoodSession;

      // Show the assumable accounts
      this.assumerAwsSessions = this.awsSessionService.listAssumable().map(session => ({
        sessionName: session.sessionName,
        session
      }));

      // Only for start screen: disable IAM Chained creation
      if (this.firstTime) {
        this.form.controls['federatedOrIamRoleChained'].disable({ onlySelf: true });
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
   * Add a new UUID
   */
  addNewUUID(): string {
    return uuid.v4();
  }

  /**
   * Save the first account in the workspace
   */
  saveSession() {
    this.loggingService.logger(`Saving account...`, LoggerLevel.info, this);
    this.addProfileToWorkspace();
    this.saveNewSsoRolesToWorkspace();
    this.createSession();
    this.router.navigate(['/dashboard']).then(_ => {});
  }

  /**
   * Form validation mechanic
   */
  formValid() {
    let result = false;
    switch (this.sessionType) {
      case SessionType.awsIamRoleFederated:
        result = this.form.get('name').valid &&
                 this.selectedProfile &&
                 this.form.get('awsRegion').valid &&
                 this.form.get('awsRegion').value !== null &&
                 this.form.get('roleArn').valid &&
                 this.selectedIdpUrl &&
                 this.form.get('idpArn').valid;
        break;
      case SessionType.awsIamRoleChained:
        result = this.form.get('name').valid &&
                 this.selectedProfile &&
                 this.form.get('awsRegion').valid &&
                 this.form.get('awsRegion').value !== null &&
                 this.form.get('roleArn').valid &&
                 this.form.get('roleSessionName').valid &&
                 this.selectedSession;
        break;
      case SessionType.awsIamUser:
        result = this.form.get('name').valid &&
                 this.selectedProfile &&
                 this.form.get('awsRegion').valid &&
                 this.form.get('awsRegion').value !== null &&
                 this.form.get('mfaDevice').valid &&
                 this.form.get('accessKey').valid &&
                 this.form.get('secretKey').valid;
        break;
      case SessionType.azure:
        result = this.form.get('name').valid &&
                 this.form.get('subscriptionId').valid &&
                 this.form.get('tenantId').valid &&
                 this.form.get('azureLocation').valid;
        break;
    }
    return result;
  }

  /**
   * First step of the wizard: set the Cloud provider or go to the SSO integration
   *
   * @param name
   */
  setProvider(name) {
    this.provider = name;
    this.providerSelected = true;
    this.sessionType = name;
    this.typeSelection = name.toString().indexOf('aws') > -1;
  }

  /**
   * Second step of wizard: set the strategy in the UI
   *
   * @param strategy
   */
  setAccessStrategy(strategy) {
    console.log(strategy);

    this.sessionType = strategy;
    this.provider = strategy;
    this.typeSelection = false;

    if(strategy === SessionType.awsIamRoleFederated) {
      this.hasSsoUrl = true;
    }
  }

  /**
   * Open the Leapp documentation in the default browser
   *
   */
  openAccessStrategyDocumentation() {
    let url = 'https://docs.leapp.cloud/latest/configuring-session/configure-aws-iam-role-federated/';
    if(this.provider === SessionType.awsIamRoleChained) {
      url = 'https://docs.leapp.cloud/latest/configuring-session/configure-aws-iam-role-chained/';
    } else if(this.provider === SessionType.awsIamUser) {
      url = 'https://docs.leapp.cloud/latest/configuring-session/configure-aws-iam-user/';
    }
    this.appService.openExternalUrl(url);
  }

  /**
   * Go to the Single Sing-On integration page
   *
   */
  goToAwsSso() {
    this.appService.closeModal();
    setTimeout(() => { openIntegrationEvent.next(true) }, 100)
  }

  /**
   * Go to Session Selection screen by closing the modal
   */
  goBack() {
    this.appService.closeModal();
  }

  getNameForProvider(provider: SessionType) {
    switch (provider) {
      case SessionType.azure: return 'Microsoft Azure session';
      case SessionType.google: return 'Google Cloud session';
      case SessionType.alibaba: return 'Alibaba Cloud session';
      default: return 'Amazon AWS session';
    }
  }

  getIconForProvider(provider: SessionType) {
    switch (provider) {
      case SessionType.azure: return 'azure-logo.svg';
      case SessionType.google: return 'google.png';
      case SessionType.alibaba: return 'alibaba.png';
      default: return (this.workspaceService.getWorkspace().colorTheme === Constants.darkTheme || this.workspaceService.getWorkspace().colorTheme === Constants.systemDefaultTheme && this.appService.isDarkMode()) ? 'aws-dark.png' : 'aws.png';
    }
  }

  closeModal() {
    this.appService.closeModal();
  }

  selectedIdpUrlEvent($event: { items: any[]; item: any }) {
    this.idpUrls = $event.items;
    this.selectedIdpUrl = $event.item;
    console.log($event);
  }

  /**
   * Save actual session based on Session Type
   *
   * @private
   */
  private createSession() {
    if(this.formValid()) {
      switch (this.sessionType) {
        case (SessionType.awsIamRoleFederated):
          const awsFederatedAccountRequest: AwsIamRoleFederatedSessionRequest = {
            accountName: this.form.value.name.trim(),
            region: this.selectedRegion,
            idpUrl: this.selectedIdpUrl.value.trim(),
            idpArn: this.form.value.idpArn.trim(),
            roleArn: this.form.value.roleArn.trim()
          };
          this.awsIamRoleFederatedService.create(awsFederatedAccountRequest, this.selectedProfile.value);
          break;
        case (SessionType.awsIamUser):
          const awsIamUserSessionRequest: AwsIamUserSessionRequest = {
            accountName: this.form.value.name.trim(),
            region: this.selectedRegion,
            accessKey: this.form.value.accessKey.trim(),
            secretKey: this.form.value.secretKey.trim(),
            mfaDevice: this.form.value.mfaDevice.trim()
          };
          this.awsIamUserService.create(awsIamUserSessionRequest, this.selectedProfile.value);
          break;
        case (SessionType.awsIamRoleChained):
          const awsIamRoleChainedAccountRequest: AwsIamRoleChainedSessionRequest = {
            accountName: this.form.value.name.trim(),
            region: this.selectedRegion,
            roleArn: this.form.value.roleArn.trim(),
            roleSessionName: this.form.value.roleSessionName.trim(),
            parentSessionId: this.selectedSession.sessionId
          };
          this.awsIamRoleChainedService.create(awsIamRoleChainedAccountRequest, this.selectedProfile.value);
          break;
        case (SessionType.azure):
          const azureSessionRequest: AzureSessionRequest = {
            region: this.selectedLocation,
            sessionName: this.form.value.name,
            subscriptionId: this.form.value.subscriptionId,
            tenantId: this.form.value.tenantId
          };
          this.azureService.create(azureSessionRequest);
          break;
      }

      this.appService.toast(`Session: ${this.form.value.name}, created.`, ToastLevel.success, '');
      this.closeModal();
    } else {
      this.appService.toast(`Session is missing some required properties, please fill them.`, ToastLevel.warn, '');
    }
  }

  /**
   * Save a new Single Sign on object in workspace if new
   *
   * @private
   */
  private saveNewSsoRolesToWorkspace() {
    if(this.sessionType === SessionType.awsIamRoleFederated) {
      try {
        const ipdUrl = { id: this.selectedIdpUrl.value, url: this.selectedIdpUrl.label };
        if(!this.workspaceService.getIdpUrl(ipdUrl.id)) {
          this.workspaceService.addIdpUrl(ipdUrl);
        }
      } catch(err) {
        throw new LeappParseError(this, err.message);
      }
    }
  }

  /**
   * Save a New profile if is not in the workspace
   *
   * @private
   */
  private addProfileToWorkspace() {
    try {
      const profile = { id: this.selectedProfile.value, name: this.selectedProfile.label };
      if(!this.workspaceService.getProfileName(profile.id)) {
        this.workspaceService.addProfile(profile);
      }
    } catch(err) {
      throw new LeappParseError(this, err.message);
    }
  }


}


import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AppService, ToastLevel} from '../../../services/app.service';
import {ActivatedRoute, Router} from '@angular/router';
import {SessionType} from '../../../models/session-type';
import {WorkspaceService} from '../../../services/workspace.service';
import {KeychainService} from '../../../services/keychain.service';
import {environment} from '../../../../environments/environment';
import {SessionService} from '../../../services/session.service';
import {Constants} from '../../../models/constants';
import {Session} from '../../../models/session';
import {AwsIamUserSession} from '../../../models/aws-iam-user-session';
import * as uuid from 'uuid';
import {AwsSessionService} from '../../../services/session/aws/aws-session.service';
import {AwsIamRoleChainedSession} from '../../../models/aws-iam-role-chained-session';
import {AwsIamRoleFederatedSession} from '../../../models/aws-iam-role-federated-session';
import {AzureSession} from '../../../models/azure-session';

@Component({
  selector: 'app-edit-dialog',
  templateUrl: './edit-dialog.component.html',
  styleUrls: ['./edit-dialog.component.scss']
})
export class EditDialogComponent implements OnInit {
  @ViewChild('roleInput', {static: false}) roleInput: ElementRef;

  @Input()
  selectedSessionId: string;

  provider = SessionType.awsIamRoleFederated;
  selectedSession: Session;
  eSessionType = SessionType;

  selectedAccountNumber = '';
  selectedRole = '';

  selectedRegion;
  regions = [];

  selectedLocation;
  locations = [];

  idpUrls: { value: string; label: string}[] = [];
  selectedIdpUrl: {value: string; label: string};

  assumerAwsSessions = [];
  selectedAssumerSession;

  public form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    awsRegion: new FormControl(''),

    idpArn: new FormControl('', [Validators.required]),
    roleArn: new FormControl('', [Validators.required]),
    federationUrl: new FormControl('', [Validators.required, Validators.pattern('https?://.+')]),

    secretKey: new FormControl('', [Validators.required]),
    accessKey: new FormControl('', [Validators.required]),
    mfaDevice: new FormControl(''),

    roleSessionName: new FormControl('', [Validators.pattern('[a-zA-Z\\d\\-\\_\\@\\=\\,\\.]+')]),
    assumerSession: new FormControl('', [Validators.required]),

    azureLocation: new FormControl(''),
    subscriptionId: new FormControl('', [Validators.required]),
    tenantId: new FormControl('', [Validators.required]),
  });

  /* Setup the first account for the application */
  constructor(
    private appService: AppService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private workspaceService: WorkspaceService,
    private keychainService: KeychainService,
    private sessionService: SessionService,
    private awsSessionService: AwsSessionService
  ) {}

  ngOnInit() {
    // Get the workspace and the account you need
    this.selectedSession = this.workspaceService.sessions.find(session => session.sessionId === this.selectedSessionId);

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

    // Get the region
    this.regions = this.appService.getRegions();
    this.selectedRegion = this.regions.find(r => r.region === this.selectedSession.region)?.region;
    this.form.controls['awsRegion'].setValue(this.selectedRegion);

    // Get the location
    this.locations = this.appService.getLocations();
    this.selectedRegion = this.locations.find(r => r.region === this.selectedSession.region)?.location;
    this.form.controls['azureLocation'].setValue(this.selectedLocation);

    // Get other readonly properties
    this.form.controls['name'].setValue(this.selectedSession.sessionName);

    // FOR IAM ROLE CHAINED AND FEDERATED ROLE
    if(this.selectedSession.type === SessionType.awsIamRoleFederated || this.selectedSession.type === SessionType.awsIamRoleChained) {
      this.form.controls['roleArn'].setValue((this.selectedSession as any).roleArn);
    }

    // FOR IAM ROLE FEDERATED
    if(this.selectedSession.type === SessionType.awsIamRoleFederated) {
      const idpUrlString = this.workspaceService.getIdpUrl((this.selectedSession as AwsIamRoleFederatedSession).idpUrlId);
      this.selectedIdpUrl = { label: idpUrlString, value: (this.selectedSession as AwsIamRoleFederatedSession).idpUrlId};
      this.form.controls['federationUrl'].setValue(idpUrlString);

      this.form.controls['idpArn'].setValue((this.selectedSession as AwsIamRoleFederatedSession).idpArn);
    }

    // FOR IAM ROLE CHAINED
    if(this.selectedSession.type === SessionType.awsIamRoleChained) {
      // Show the assumable accounts
      this.assumerAwsSessions = this.awsSessionService.listAssumable().map(session => ({
        sessionName: session.sessionName,
        session
      }));
      this.selectedAssumerSession = this.sessionService.get((this.selectedSession as AwsIamRoleChainedSession).parentSessionId);

      this.form.controls['roleSessionName'].setValue((this.selectedSession as AwsIamRoleChainedSession).roleSessionName);
    }

    // FOR IAM USER
    if(this.selectedSession.type === SessionType.awsIamUser) {
      this.form.controls['mfaDevice'].setValue((this.selectedSession as AwsIamUserSession).mfaDevice);

      this.keychainService.getSecret(environment.appName, `${this.selectedSession.sessionId}-iam-user-aws-session-access-key-id`).then(value => {
        this.form.controls['accessKey'].setValue(value);
      });
      this.keychainService.getSecret(environment.appName, `${this.selectedSession.sessionId}-iam-user-aws-session-secret-access-key`).then(value => {
        this.form.controls['secretKey'].setValue(value);
      });
    }

    // FOR AZURE
    if(this.selectedSession.type === SessionType.azure) {
      this.form.controls['subscriptionId'].setValue((this.selectedSession as AzureSession).subscriptionId);
      this.form.controls['tenantId'].setValue((this.selectedSession as AzureSession).tenantId);
    }
  }
  /**
   * Save the edited account in the workspace
   */
  saveAccount() {
    if (this.formValid()) {

      this.selectedSession.sessionName =  this.form.controls['name'].value;
      this.selectedSession.region      =  this.selectedRegion;
      (this.selectedSession as AwsIamUserSession).mfaDevice   =  this.form.controls['mfaDevice'].value;
      this.keychainService.saveSecret(environment.appName, `${this.selectedSession.sessionId}-iam-user-aws-session-access-key-id`, this.form.controls['accessKey'].value).then(_ => {});
      this.keychainService.saveSecret(environment.appName, `${this.selectedSession.sessionId}-iam-user-aws-session-secret-access-key`, this.form.controls['secretKey'].value).then(_ => {});

      this.sessionService.update(this.selectedSession.sessionId, this.selectedSession);

      this.appService.toast(`Session: ${this.form.value.name}, edited.`, ToastLevel.success, '');
      this.closeModal();
    } else {
      this.appService.toast(`One or more parameters are invalid, check your choices.`, ToastLevel.warn, '');
    }
  }

  formValid() {
    let result = false;
    switch (this.selectedSession.type) {
      case SessionType.awsIamRoleFederated:
        result = this.form.get('name').valid &&
          this.form.get('awsRegion').valid &&
          this.form.get('awsRegion').value !== null &&
          this.form.get('roleArn').valid &&
          this.selectedIdpUrl &&
          this.form.get('idpArn').valid;
        break;
      case SessionType.awsIamRoleChained:
        result = this.form.get('name').valid &&
          this.form.get('awsRegion').valid &&
          this.form.get('awsRegion').value !== null &&
          this.form.get('roleArn').valid &&
          this.form.get('roleSessionName').valid &&
          this.selectedAssumerSession;
        break;
      case SessionType.awsIamUser:
        result = this.form.get('name').valid &&
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

  goBack() {
    this.appService.closeModal();
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

  addNewUUID(): string {
    return uuid.v4();
  }

  selectedIdpUrlEvent($event: { items: any[]; item: any }) {
    this.idpUrls = $event.items;
    this.selectedIdpUrl = $event.item;
  }
}


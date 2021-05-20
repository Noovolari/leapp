import {Component, Inject, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {Session} from '../../models/session';
import {SessionService} from '../../services/session.service';
import {AppService, LoggerLevel, ToastLevel} from '../../services/app.service';
import {Router} from '@angular/router';
import {AwsFederatedAccount} from '../../models/aws-federated-account';
import {SsmService} from '../../services/ssm.service';
import {AzureAccount} from '../../models/azure-account';
import {SessionType} from '../../models/session-type';
import {WorkspaceService} from '../../services/workspace.service';
import {environment} from '../../../environments/environment';
import {KeychainService} from '../../services/keychain.service';
import {AwsSsoAccount} from '../../models/aws-sso-account';
import * as uuid from 'uuid';
import {AwsPlainAccount} from '../../models/aws-plain-account';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {FileService} from '../../services/file.service';
import {SessionProviderService} from '../../services/session-provider.service';
import {LeappNotFoundError} from '../../errors/leapp-not-found-error';
import {SessionStatus} from '../../models/session-status';

@Component({
  selector: 'app-session-card',
  templateUrl: './session-card.component.html',
  styleUrls: ['./session-card.component.scss'],

})

export class SessionCardComponent implements OnInit {

  @Input()
  session!: Session;

  @ViewChild('ssmModalTemplate', { static: false })
  ssmModalTemplate: TemplateRef<any>;

  @ViewChild('defaultRegionModalTemplate', { static: false })
  defaultRegionModalTemplate: TemplateRef<any>;

  @ViewChild('defaultProfileModalTemplate', { static: false })
  defaultProfileModalTemplate: TemplateRef<any>;

  eSessionType = SessionType;
  eSessionStatus = SessionStatus;

  modalRef: BsModalRef;

  // Ssm instances
  ssmloading = true;
  selectedSsmRegion;
  selectedDefaultRegion;
  openSsm = false;
  awsRegions = [];
  regionOrLocations = [];
  instances = [];
  duplicateInstances = [];
  sessionDetailToShow;
  placeholder;
  selectedProfile: any;
  profiles: { id: string; name: string }[];

  private sessionService: SessionService;

  constructor(private workspaceService: WorkspaceService,
              private keychainService: KeychainService,
              private appService: AppService,
              private fileService: FileService,
              private router: Router,
              private ssmService: SsmService,
              private sessionProviderService: SessionProviderService,
              private modalService: BsModalService) {
  }

  ngOnInit() {
    // Generate a singleton service for the concrete implementation of SessionService
    this.sessionService = this.sessionProviderService.getService(this.session.account.type);

    // Set regions for ssm and for default region, same with locations,
    // add the correct placeholder to the select
    this.awsRegions = this.appService.getRegions();

    this.profiles = this.workspaceService.get().profiles;

    const azureLocations = this.appService.getLocations();
    this.regionOrLocations = this.session.account.type !== SessionType.azure ? this.awsRegions : azureLocations;
    this.placeholder = this.session.account.type !== SessionType.azure ? 'Select a default region' : 'Select a default location';
    this.selectedDefaultRegion = this.session.account.region;
    this.selectedProfile = this.session.profileId;

    switch (this.session.account.type) {
      case(SessionType.aws):
        this.sessionDetailToShow = (this.session.account as AwsFederatedAccount).role.name;
        break;
      case(SessionType.azure):
        this.sessionDetailToShow = (this.session.account as AzureAccount).subscriptionId;
        break;
      case(SessionType.awsPlainUser):
        this.sessionDetailToShow = (this.session.account as AwsPlainAccount).accountName;
        break;
      case(SessionType.awsSso):
        this.sessionDetailToShow = (this.session.account as AwsSsoAccount).role.name;
        break;
    }
  }

  /**
   * Start the selected session
   */
  startSession() {
    this.sessionService.start(this.session.sessionId).then(() => {}, error => {
      console.log(error);
    });

    this.appService.logger(
      `Starting Session`,
      LoggerLevel.info,
      this,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        id: this.session.sessionId,
        account: this.session.account.accountName,
        type: this.session.account.type
      }, null, 3));
  }

  /**
   * Stop session
   */
  stopSession() {
    // Eventually close the tray
    this.sessionService.stop(this.session.sessionId).then(() => {}, error => {
      console.log(error);
    });


    this.appService.logger(
      `Stopped Session`,
      LoggerLevel.info,
      this,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        id: this.session.sessionId,
        account: this.session.account.accountName,
        type: this.session.account.type
      }, null, 3));
  }

  removeAccount(session, event) {
    event.stopPropagation();
    this.appService.confirmDialog('do you really want to delete this account?', () => {
      this.sessionService.delete(session.sessionId);
      this.appService.logger('Session Deleted', LoggerLevel.info, this, JSON.stringify({ timespan: new Date().toISOString(), id: session.id, account: session.account.accountName, type: session.account.type }, null, 3));
    });
  }

  editAccount(session, event) {
    event.stopPropagation();
    this.router.navigate(['/managing', 'edit-account'], {queryParams: { sessionId: session.id }});
  }

  /**
   * Copy credentials in the clipboard
   */
  copyCredentials(session: Session, type: number, event) {
    this.openDropDown(event);
    try {
      const workspace = this.workspaceService.get();
      if (workspace) {
        const sessionAccount = (session.account as AwsFederatedAccount);
        const texts = {
          1: sessionAccount.accountNumber,
          2: sessionAccount.role ? `arn:aws:iam::${(session.account as AwsFederatedAccount).accountNumber}:role/${(session.account as AwsFederatedAccount).role.name}` : ''
        };

        const text = texts[type];

        this.appService.copyToClipboard(text);
        this.appService.toast('Your information have been successfully copied!', ToastLevel.success, 'Information copied!');
      }
    } catch (err) {
      this.appService.toast(err, ToastLevel.warn);
      this.appService.logger(err, LoggerLevel.error, this, err.stack);
    }
  }

  switchCredentials() {
    if (this.session.status === SessionStatus.active) {
      this.stopSession();
    } else {
      this.startSession();
    }
  }

  openDropDown(event) {
    event.stopPropagation();
  }

  // ============================== //
  // ========== SSM AREA ========== //
  // ============================== //
  addNewProfile(tag: string) {
    return {id: uuid.v4(), name: tag};
  }

  /**
   * SSM Modal open given the correct session
   *
   * @param session - the session to check for possible ssm sessions
   */
  ssmModalOpen(session) {
    // Reset things before opening the modal
    this.instances = [];
    this.ssmloading = false;
    this.modalRef = this.modalService.show(this.ssmModalTemplate, { class: 'ssm-modal'});
  }

  /**
   * SSM Modal open given the correct session
   *
   * @param session - the session to check for possible ssm sessions
   */
  changeRegionModalOpen(session) {
    // open the modal
    this.modalRef = this.modalService.show(this.defaultRegionModalTemplate, { class: 'ssm-modal'});
  }

  /**
   * Set the region for ssm init and launch the mopethod form the server to find instances
   *
   * @param event - the change select event
   * @param session - The session in which the AWS region need to change
   */
  changeSsmRegion(event, session: Session) {
    if (this.selectedSsmRegion) {
      this.ssmloading = true;

      const account = `Leapp-ssm-data-${session.profileId}`;

      // Set the aws credentials to instanziate the ssm client
      this.keychainService.getSecret(environment.appName, account).then(creds => {
        const credentials = JSON.parse(creds);

        // Check the result of the call
        this.ssmService.setInfo(credentials, this.selectedSsmRegion).subscribe(result => {
          this.instances = result.instances;
          this.duplicateInstances = this.instances;
          this.ssmloading = false;
        }, () => {
          this.instances = [];
          this.ssmloading = false;
        });
      });

    }
  }

  /**
   * Set the region for the session
   */
  changeRegion() {
    if (this.selectedDefaultRegion) {

      if (this.session.status === SessionStatus.active) {
        this.sessionService.stop(this.session.sessionId);
      }

      this.session.account.region = this.selectedDefaultRegion;
      // this.sessionService.invalidateSessionToken(this.session);
      // this.sessionService.update(this.session);

      if (this.session.status === SessionStatus.active) {
        this.startSession();
      } else {
      }


      this.appService.toast('Default region has been changed!', ToastLevel.success, 'Region changed!');
      this.modalRef.hide();
    }
  }

  /**
   * Start a new ssm session
   *
   * @param instanceId - instance id to start ssm session
   */
  startSsmSession(instanceId) {
    this.instances.forEach(instance => {
 if (instance.InstanceId === instanceId) {
 instance.loading = true;
}
});

    this.ssmService.startSession(instanceId, this.selectedSsmRegion);

    setTimeout(() => {
      this.instances.forEach(instance => {
 if (instance.InstanceId === instanceId) {
 instance.loading = false;
}
});
    }, 4000);

    this.openSsm = false;
    this.ssmloading = false;
  }

  searchSSMInstance(event) {
    if (event.target.value !== '') {
      this.instances = this.duplicateInstances.filter(i =>
                                 i.InstanceId.indexOf(event.target.value) > -1 ||
                                 i.IPAddress.indexOf(event.target.value) > -1 ||
                                 i.Name.indexOf(event.target.value) > -1);
    } else {
      this.instances = this.duplicateInstances;
    }
  }

  getProfileIcon(active, name) {
    const color = active ? ' orange' : '';
    return name === environment.defaultAwsProfileName ? ('home' + color) : ('user' + color);
  }

  getProfileName(id) {
    const workspace = this.workspaceService.get();
    const profile = workspace.profiles.filter(p => p.id === id)[0];
    if (profile) {
      return profile.name;
    } else {
      return environment.defaultAwsProfileName;
    }
  }

  changeProfile() {
    if (this.selectedProfile) {
      if (this.session.status === SessionStatus.active) {
        this.sessionService.stop(this.session.sessionId);
      }

      // this.sessionService.addProfile(this.selectedProfile);
      // this.sessionService.updateSessionProfile(this.session, this.selectedProfile);

      if (this.session.status === SessionStatus.active) {
        this.startSession();
      } else {
      }

      this.appService.toast('Profile has been changed!', ToastLevel.success, 'Profile changed!');
      this.modalRef.hide();
    }
  }

  changeProfileModalOpen() {
    this.selectedProfile = null;
    this.modalRef = this.modalService.show(this.defaultProfileModalTemplate, { class: 'ssm-modal'});
  }

  goBack() {
    this.modalRef.hide();
  }
}

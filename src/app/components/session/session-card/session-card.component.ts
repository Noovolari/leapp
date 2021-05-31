import {Component, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {Session} from '../../../models/session';
import {SessionService} from '../../../services/session.service';
import {AppService, LoggerLevel, ToastLevel} from '../../../services/app.service';
import {Router} from '@angular/router';
import {AwsFederatedSession} from '../../../models/aws-federated-session';
import {SsmService} from '../../../services/ssm.service';
import {SessionType} from '../../../models/session-type';
import {WorkspaceService} from '../../../services/workspace.service';
import {environment} from '../../../../environments/environment';
import {KeychainService} from '../../../services/keychain.service';
import {AwsSsoSession} from '../../../models/aws-sso-session';
import * as uuid from 'uuid';
import {AwsPlainSession} from '../../../models/aws-plain-session';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {FileService} from '../../../services/file.service';
import {SessionProviderService} from '../../../services/session-provider.service';
import {SessionStatus} from '../../../models/session-status';
import {AwsTrusterSession} from '../../../models/aws-truster-session';
import {LeappNotAwsAccountError} from '../../../errors/leapp-not-aws-account-error';

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

  ssmLoading = true;
  selectedSsmRegion;
  selectedDefaultRegion;
  openSsm = false;
  awsRegions = [];
  regionOrLocations = [];
  instances = [];
  duplicateInstances = [];
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
              private modalService: BsModalService) {}

  ngOnInit() {
    // Generate a singleton service for the concrete implementation of SessionService
    this.sessionService = this.sessionProviderService.getService(this.session.type);

    // Set regions and locations
    this.awsRegions = this.appService.getRegions();
    const azureLocations = this.appService.getLocations();

    // Get profiles
    this.profiles = this.workspaceService.get().profiles;

    // Array and labels for regions and locations
    this.regionOrLocations = this.session.type !== SessionType.azure ? this.awsRegions : azureLocations;
    this.placeholder = this.session.type !== SessionType.azure ? 'Select a default region' : 'Select a default location';

    // Pre selected Region and Profile
    this.selectedDefaultRegion = this.session.region;
    this.selectedProfile = this.getProfileId(this.session);
  }

  /**
   * Used to call for start or stop depending on session status
   */
  switchCredentials() {
    if (this.session.status === SessionStatus.active) {
      this.stopSession();
    } else {
      this.startSession();
    }
  }

  /**
   * Start the selected session
   */
  startSession() {
    this.sessionService.start(this.session.sessionId);
    this.logSessionData(this.session, `Starting Session`);
  }

  /**
   * Stop session
   */
  stopSession() {
    this.sessionService.stop(this.session.sessionId);
    this.logSessionData(this.session, `Stopped Session`);
  }

  /**
   * Delete a session from the workspace
   *
   * @param session - the session to remove
   * @param event - for stopping propagation bubbles
   */
  deleteSession(session, event) {
    event.stopPropagation();

    const trusterSessions = this.sessionService.listTruster(session);
    const dialogMessage = this.generateDeleteDialogMessage(trusterSessions);

    this.appService.confirmDialog(dialogMessage, () => {
      this.sessionService.delete(session.sessionId);
      this.logSessionData(session, 'Session Deleted');
    });
  }

  private generateDeleteDialogMessage(trusterSessions: Session[]): string {
    let trusterSessionString = '';
    trusterSessions.forEach(sess => {
      trusterSessionString += `<li><div class="removed-sessions"><b>${sess.sessionName}</b></div></li>`;
    });
    if (trusterSessionString !== '') {
      return 'This session has truster sessions: <br><ul>' +
        trusterSessionString +
        '</ul><br>Removing the session will also remove the truster session associated with it. Do you want to proceed?';
    } else {
      return 'Do you really want to delete this session?';
    }
  }

  /**
   * Edit Session
   *
   * @param session - the session to edit
   * @param event - to remove propagation bubbles
   */
  editSession(session, event) {
    event.stopPropagation();
    this.router.navigate(['/managing', 'edit-account'], {queryParams: { sessionId: session.id }});
  }

  /**
   * Copy credentials in the clipboard
   */
  copyCredentials(session: Session, type: number, event) {
    event.stopPropagation();
    try {
      const workspace = this.workspaceService.get();
      if (workspace) {
        const texts = {
          1: (session as AwsFederatedSession).roleArn ? `${(session as AwsFederatedSession).roleArn.split('/')[0].substring(13, 25)}` : '',
          2: (session as AwsFederatedSession).roleArn ? `${(session as AwsFederatedSession).roleArn}` : ''
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
    this.ssmLoading = false;
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
      this.ssmLoading = true;

      const account = `Leapp-ssm-data-${this.getProfileId(session)}`;

      // Set the aws credentials to instanziate the ssm client
      this.keychainService.getSecret(environment.appName, account).then(creds => {
        const credentials = JSON.parse(creds);

        // Check the result of the call
        this.ssmService.setInfo(credentials, this.selectedSsmRegion).subscribe(result => {
          this.instances = result.instances;
          this.duplicateInstances = this.instances;
          this.ssmLoading = false;
        }, () => {
          this.instances = [];
          this.ssmLoading = false;
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

      this.session.region = this.selectedDefaultRegion;
      // this.sessionService.invalidateSessionToken(this.session);
      // this.sessionService.update(this.session);

      if (this.session.status === SessionStatus.active) {
        this.startSession();
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
    this.ssmLoading = false;
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

  getProfileId(session: Session): string {
    if(session.type !== SessionType.azure) {
      return (session as any).profileId;
    } else {
      throw new LeappNotAwsAccountError(this, 'cannot retrieve profile id of an account that is not an AWS one');
    }
  }

  getProfileName(profileId: string): string {
    const profileName = this.workspaceService.getProfileName(profileId);
    return profileName ? profileName : environment.defaultAwsProfileName;
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

  /**
   * Close modals
   */
  goBack() {
    this.modalRef.hide();
  }

  private logSessionData(session: Session, message: string): void {
    this.appService.logger(
      message,
      LoggerLevel.info,
      this,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        id: session.sessionId,
        account: session.sessionName,
        type: session.type
      }, null, 3));
  }
}

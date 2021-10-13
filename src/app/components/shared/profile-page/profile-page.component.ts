import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {Workspace} from '../../../models/workspace';
import {FormControl, FormGroup} from '@angular/forms';
import {AppService, LoggerLevel, ToastLevel} from '../../../services/app.service';
import {FileService} from '../../../services/file.service';
import {Router} from '@angular/router';
import {Constants} from '../../../models/constants';
import {environment} from '../../../../environments/environment';
import * as uuid from 'uuid';
import {AwsIamRoleFederatedSession} from '../../../models/aws-iam-role-federated-session';
import {WorkspaceService} from '../../../services/workspace.service';
import {SessionStatus} from '../../../models/session-status';
import {SessionFactoryService} from '../../../services/session-factory.service';
import {SessionType} from '../../../models/session-type';
import {AwsSessionService} from '../../../services/session/aws/aws-session.service';
import {LoggingService} from '../../../services/logging.service';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProfilePageComponent implements OnInit {

  eConstants = Constants;
  awsProfileValue: { id: string; name: string };
  idpUrlValue;
  editingIdpUrl: boolean;
  editingAwsProfile: boolean;

  showProxyAuthentication = false;
  proxyProtocol = 'https'; // Default
  proxyUrl;
  proxyPort = '8080'; // Default
  proxyUsername;
  proxyPassword;

  workspace: Workspace;

  locations: { location: string }[];
  regions: { region: string }[];
  selectedLocation: string;
  selectedRegion: string;
  selectedBrowserOpening = Constants.inApp.toString();

  public form = new FormGroup({
    idpUrl: new FormControl(''),
    awsProfile: new FormControl(''),
    proxyUrl: new FormControl(''),
    proxyProtocol: new FormControl(''),
    proxyPort: new FormControl(''),
    proxyUsername: new FormControl(''),
    proxyPassword: new FormControl(''),
    showAuthCheckbox: new FormControl(''),
    regionsSelect: new FormControl(''),
    locationsSelect: new FormControl(''),
    defaultBrowserOpening: new FormControl('')
  });

  /* Simple profile page: shows the Idp Url and the workspace json */
  private sessionService: any;

  constructor(
    private appService: AppService,
    private loggingService: LoggingService,
    private fileService: FileService,
    private sessionProviderService: SessionFactoryService,
    private awsSessionService: AwsSessionService,
    private workspaceService: WorkspaceService,
    private router: Router
  ) {}

  ngOnInit() {
    this.workspace = this.workspaceService.get();
    this.idpUrlValue = '';
    this.proxyProtocol = this.workspace.proxyConfiguration.proxyProtocol;
    this.proxyUrl = this.workspace.proxyConfiguration.proxyUrl;
    this.proxyPort = this.workspace.proxyConfiguration.proxyPort;
    this.proxyUsername = this.workspace.proxyConfiguration.username || '';
    this.proxyPassword = this.workspace.proxyConfiguration.password || '';

    this.form.controls['idpUrl'].setValue(this.idpUrlValue);
    this.form.controls['proxyUrl'].setValue(this.proxyUrl);
    this.form.controls['proxyProtocol'].setValue(this.proxyProtocol);
    this.form.controls['proxyPort'].setValue(this.proxyPort);
    this.form.controls['proxyUsername'].setValue(this.proxyUsername);
    this.form.controls['proxyPassword'].setValue(this.proxyPassword);

    const isProxyUrl = this.workspace.proxyConfiguration.proxyUrl && this.workspace.proxyConfiguration.proxyUrl !== 'undefined';
    this.proxyUrl = isProxyUrl ? this.workspace.proxyConfiguration.proxyUrl : '';

    if (this.proxyUsername || this.proxyPassword) {
      this.showProxyAuthentication = true;
    }

    this.regions = this.appService.getRegions();
    this.locations = this.appService.getLocations();
    this.selectedRegion   = this.workspace.defaultRegion || environment.defaultRegion;
    this.selectedLocation = this.workspace.defaultLocation || environment.defaultLocation;
    this.selectedBrowserOpening = this.workspace.awsSsoConfiguration.browserOpening || Constants.inApp.toString();

    this.appService.validateAllFormFields(this.form);
  }

  /**
   * Save the idp-url again
   */
  saveOptions() {
    if (this.form.valid) {
      this.workspace.proxyConfiguration.proxyUrl = this.form.controls['proxyUrl'].value;
      this.workspace.proxyConfiguration.proxyProtocol = this.form.controls['proxyProtocol'].value;
      this.workspace.proxyConfiguration.proxyPort = this.form.controls['proxyPort'].value;
      this.workspace.proxyConfiguration.username = this.form.controls['proxyUsername'].value;
      this.workspace.proxyConfiguration.password = this.form.controls['proxyPassword'].value;
      this.workspaceService.updateProxyConfiguration(this.workspace.proxyConfiguration);

      this.workspace.defaultRegion = this.selectedRegion;
      this.workspaceService.updateDefaultRegion(this.workspace.defaultRegion);

      this.workspace.defaultLocation = this.selectedLocation;
      this.workspaceService.updateDefaultLocation(this.workspace.defaultLocation);

      this.workspace.awsSsoConfiguration.browserOpening = this.selectedBrowserOpening;
      this.workspaceService.updateBrowserOpening(this.selectedBrowserOpening);

      if (this.checkIfNeedDialogBox()) {

        this.appService.confirmDialog('You\'ve set a proxy url: the app must be restarted to update the configuration.', (res) => {
          if (res !== Constants.confirmClosed) {
            this.loggingService.logger('User have set a proxy url: the app must be restarted to update the configuration.', LoggerLevel.info, this);
            this.appService.restart();
          }
        });
      } else {
        this.loggingService.logger('Option saved.', LoggerLevel.info, this, JSON.stringify(this.form.getRawValue(), null, 3));
        this.loggingService.toast('Option saved.', ToastLevel.info, 'Options');
        this.router.navigate(['/sessions', 'session-selected']);
      }
    }
  }

  /**
   * Check if we need a dialog box to request restarting the application
   */
  checkIfNeedDialogBox() {
    return this.form.controls['proxyUrl'].value !== undefined &&
      this.form.controls['proxyUrl'].value !== null &&
      (this.form.controls['proxyUrl'].dirty ||
       this.form.controls['proxyProtocol'].dirty ||
       this.form.controls['proxyPort'].dirty ||
       this.form.controls['proxyUsername'].dirty ||
       this.form.controls['proxyPassword'].dirty);
  }

  /**
   * Return to home screen
   */
  goBack() {
    this.router.navigate(['/', 'sessions', 'session-selected']);
  }

  manageIdpUrl(id) {


    const idpUrl = this.workspaceService.getIdpUrl(id);
    if (this.form.get('idpUrl').value !== '') {
      if (!idpUrl) {
        this.workspaceService.addIdpUrl({ id: uuid.v4(), url: this.form.get('idpUrl').value });
      } else {
        this.workspaceService.updateIdpUrl(id, this.form.get('idpUrl').value);
      }
    }
    this.editingIdpUrl = false;
    this.idpUrlValue = undefined;
    this.form.get('idpUrl').setValue('');
    this.workspace = this.workspaceService.get();
  }

  editIdpUrl(id) {
    const idpUrl = this.workspace.idpUrls.filter(u => u.id === id)[0];
    this.idpUrlValue = idpUrl;
    this.form.get('idpUrl').setValue(idpUrl.url);
    this.editingIdpUrl = true;
  }

  deleteIdpUrl(id) {
    // Assumable sessions with this id
    this.sessionService = this.sessionProviderService.getService(SessionType.awsIamRoleFederated);
    let sessions = this.sessionService.list().filter(s => (s as AwsIamRoleFederatedSession).idpUrlId === id);

    // Add iam Role Chained from iam role iam_federated_role
    sessions.forEach(parent => {
      const childs = this.sessionService.listIamRoleChained(parent);
      sessions = sessions.concat(childs);
    });

    // Get only names for display
    let sessionsNames = sessions.map(s => `<li><div class="removed-sessions"><b>${s.sessionName}</b> - <small>${(s as AwsIamRoleFederatedSession).roleArn.split('/')[1]}</small></div></li>`);
    if (sessionsNames.length === 0) {
      sessionsNames = ['<li><b>no sessions</b></li>'];
    }

    // Ask for deletion
    this.appService.confirmDialog(`Deleting this Idp url will also remove these sessions: <br><ul>${sessionsNames.join('')}</ul>Do you want to proceed?`, (res) => {
      if (res !== Constants.confirmClosed) {
        this.loggingService.logger(`Removing idp url with id: ${id}`, LoggerLevel.info, this);

        this.workspaceService.removeIdpUrl(id);

        sessions.forEach(session => {
          this.sessionService.delete(session.sessionId);
        });

        this.workspace = this.workspaceService.get();
      }
    });
  }

  async manageAwsProfile(id: string | number) {

    const profileIndex = this.workspaceService.get().profiles.findIndex(p => p.id === id.toString());
    if (this.form.get('awsProfile').value !== '') {
      if (profileIndex === -1) {
        this.workspaceService.addProfile({ id: uuid.v4(), name: this.form.get('awsProfile').value });
      } else {
        this.workspaceService.updateProfile(id.toString(), this.form.get('awsProfile').value);

        for(let i = 0; i < this.workspaceService.sessions.length; i++) {
          const sess = this.workspaceService.sessions[i];
          this.sessionService = this.sessionProviderService.getService(sess.type);

          if( (sess as any).profileId === id.toString()) {
            if ((sess as any).status === SessionStatus.active) {
              await this.sessionService.stop(sess.sessionId);
              await this.sessionService.start(sess.sessionId);
            }
          }
        }
      }
    }
    this.editingAwsProfile = false;
    this.awsProfileValue = undefined;
    this.form.get('awsProfile').setValue('');
    this.workspace = this.workspaceService.get();
  }

  editAwsProfile(id: string) {
    const profile = this.workspace.profiles.filter(u => u.id === id)[0];
    this.awsProfileValue = profile;
    this.form.get('awsProfile').setValue(profile.name);
    this.editingAwsProfile = true;
  }

  deleteAwsProfile(id: string) {
    // With profile
    const sessions = this.awsSessionService.list().filter(sess => (sess as any).profileId === id);

    // Get only names for display
    let sessionsNames = sessions.map(s => `<li><div class="removed-sessions"><b>${s.sessionName}</b> - <small>${(s as AwsIamRoleFederatedSession).roleArn ? (s as AwsIamRoleFederatedSession).roleArn.split('/')[1] : ''}</small></div></li>`);
    if (sessionsNames.length === 0) {
      sessionsNames = ['<li><b>no sessions</b></li>'];
    }

    // Ask for deletion
    this.appService.confirmDialog(`Deleting this profile will set default to these sessions: <br><ul>${sessionsNames.join('')}</ul>Do you want to proceed?`, async (res) => {
      if (res !== Constants.confirmClosed) {
        this.loggingService.logger(`Reverting to default profile with id: ${id}`, LoggerLevel.info, this);
        this.workspaceService.removeProfile(id);
        // Reverting all sessions to default profile
        for(let i = 0; i < sessions.length; i++) {
          const sess = sessions[i];
          this.sessionService = this.sessionProviderService.getService(sess.type);

          let wasActive = false;
          if ((sess as any).status === SessionStatus.active) {
            wasActive = true;
            await this.sessionService.stop(sess.sessionId);
          }

          (sess as any).profileId = this.workspaceService.getDefaultProfileId();
          this.sessionService.update(sess.sessionId, sess);

          if(wasActive) {
            this.sessionService.start(sess.sessionId);
          }
        }

        this.workspace = this.workspaceService.get();
      }
    });
  }
}

import {Component, OnInit} from '@angular/core';
import {Workspace} from '../../../models/workspace';
import {ConfigurationService} from '../../../services/configuration.service';
import {FormControl, FormGroup} from '@angular/forms';
import {AppService, LoggerLevel, ToastLevel} from '../../../services/app.service';
import {FileService} from '../../../services/file.service';
import {Router} from '@angular/router';
import {Constants} from '../../../models/constants';
import {environment} from '../../../../environments/environment';
import * as uuid from 'uuid';
import {AwsFederatedSession} from '../../../models/aws-federated-session';
import {AwsSessionService} from '../../../services/aws-session.service';
import {WorkspaceService} from '../../../services/workspace.service';
import {Session} from '../../../models/session';
import {SessionType} from '../../../models/session-type';
import {AwsPlainSession} from '../../../models/aws-plain-session';
import {AwsTrusterSession} from '../../../models/aws-truster-session';
import {AwsSsoSession} from '../../../models/aws-sso-session';
import {LeappNotAwsAccountError} from '../../../errors/leapp-not-aws-account-error';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit {

  activeTab = 1;

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
    locationsSelect: new FormControl('')
  });

  /* Simple profile page: shows the Idp Url and the workspace json */
  constructor(
    private configurationService: ConfigurationService,
    private appService: AppService,
    private fileService: FileService,
    private sessionService: AwsSessionService,
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

      this.workspace.defaultRegion = this.selectedRegion;
      this.workspace.defaultLocation = this.selectedLocation;

      // this.workspaceService.update(this.workspace);

      if (this.checkIfNeedDialogBox()) {

        this.appService.confirmDialog('You\'ve set a proxy url: the app must be restarted to update the configuration.', (res) => {
          if (res !== Constants.confirmClosed) {
            this.appService.logger('User have set a proxy url: the app must be restarted to update the configuration.', LoggerLevel.info, this);
            this.appService.restart();
          }
        });
      } else {
        this.appService.logger('Option saved.', LoggerLevel.info, this, JSON.stringify(this.form.getRawValue(), null, 3));
        this.appService.toast('Option saved.', ToastLevel.info, 'Options');
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
    const idpUrl = this.workspace.idpUrl.findIndex(u => u.id === id);
    if (this.form.get('idpUrl').value !== '') {
      if (idpUrl === -1) {
        this.workspace.idpUrl.push({ id: uuid.v4(), url: this.form.get('idpUrl').value });
      } else {
        this.workspace.idpUrl[idpUrl].url = this.form.get('idpUrl').value;
      }
      // this.workspaceService.updatethis.workspace);
    }
    this.editingIdpUrl = false;
    this.idpUrlValue = undefined;
    this.form.get('idpUrl').setValue('');
  }

  editIdpUrl(id) {
    const idpUrl = this.workspace.idpUrl.filter(u => u.id === id)[0];
    this.idpUrlValue = idpUrl;
    this.form.get('idpUrl').setValue(idpUrl.url);
    this.editingIdpUrl = true;
  }

  deleteIdpUrl(id) {
    // Federated
    const sessions = this.workspace.sessions.filter(s => (s as AwsFederatedSession).idpUrlId !== undefined && (s as AwsFederatedSession).idpUrlId === id);

    // Add trusters from federated
    /* federated.forEach(fed => {
      const childs = this.sessionService.listChilds(fed);
      sessions = sessions.concat(childs);
    }); */

    // Get only names for display
    let sessionsNames = sessions.map(s => `<li><div class="removed-sessions"><b>${s.sessionName}</b> - <small>${(s as AwsFederatedSession).roleArn.split('/')[1]}</small></div></li>`);
    if (sessionsNames.length === 0) {
      sessionsNames = ['<li><b>no sessions</b></li>'];
    }

    // Ask for deletion
    this.appService.confirmDialog(`Deleting this Idp url will also remove these sessions: <br><ul>${sessionsNames.join('')}</ul>Do you want to proceed?`, (res) => {
      if (res !== Constants.confirmClosed) {
        this.appService.logger(`Removing idp url with id: ${id}`, LoggerLevel.info, this);
        const idpUrl = this.workspace.idpUrl.findIndex(u => u.id === id);
        this.workspace.idpUrl.splice(idpUrl, 1);
        // this.workspaceService.update(this.workspace);
        sessions.forEach(session => {
          this.sessionService.delete(session.sessionId);
        });
      }
    });
  }

  manageAwsProfile(id: string | number) {
    const profileIndex = this.workspace.profiles.findIndex(p => p.id === id);
    if (this.form.get('awsProfile').value !== '') {
      if (profileIndex === -1) {
        this.workspace.profiles.push({ id: uuid.v4(), name: this.form.get('awsProfile').value });
      } else {
        this.workspace.profiles[profileIndex].name = this.form.get('awsProfile').value;
      }
      // this.workspaceService.update(this.workspace);
    }
    this.editingAwsProfile = false;
    this.awsProfileValue = undefined;
    this.form.get('awsProfile').setValue('');
  }

  editAwsProfile(id: string) {
    const profile = this.workspace.profiles.filter(u => u.id === id)[0];
    this.awsProfileValue = profile;
    this.form.get('awsProfile').setValue(profile.name);
    this.editingAwsProfile = true;
  }

  deleteAwsProfile(id: string) {
    // Federated
    const sessions = this.workspace.sessions.filter(s => this.getProfileId(s) === id);

    // Get only names for display
    let sessionsNames = sessions.map(s => `<li><div class="removed-sessions"><b>${s.sessionName}</b> - <small>${(s as AwsFederatedSession).roleArn ? (s as AwsFederatedSession).roleArn.split('/')[1] : ''}</small></div></li>`);
    if (sessionsNames.length === 0) {
      sessionsNames = ['<li><b>no sessions</b></li>'];
    }

    // Ask for deletion
    this.appService.confirmDialog(`Deleting this profile will set default to these sessions: <br><ul>${sessionsNames.join('')}</ul>Do you want to proceed?`, (res) => {
      if (res !== Constants.confirmClosed) {
        this.appService.logger(`Reverting to default profile with id: ${id}`, LoggerLevel.info, this);
        const profileToDelete = this.workspace.profiles.findIndex(p => p.id === id);
        this.workspace.profiles.splice(profileToDelete, 1);
        // this.workspaceService.update(this.workspace);
        // this.sessionService.replaceAllProfileId(id, defaultId);
      }
    });
  }

  getProfileId(session: Session): string {
    if(session.type !== SessionType.azure) {
      return (session as any).profileId;
    } else {
      throw new LeappNotAwsAccountError(this, 'cannot retrieve profile id of an account that is not an AWS one');
    }
  }
}

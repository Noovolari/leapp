import {Component, OnInit} from '@angular/core';
import {Workspace} from '../../models/workspace';
import {ConfigurationService} from '../../services-system/configuration.service';
import {FormControl, FormGroup} from '@angular/forms';
import {AppService, LoggerLevel, ToastLevel} from '../../services-system/app.service';
import {FileService} from '../../services-system/file.service';
import {Router} from '@angular/router';
import {AntiMemLeak} from '../../core/anti-mem-leak';
import {constants} from '../../core/enums/constants';
import {environment} from '../../../environments/environment';
import * as uuid from 'uuid';
import {AwsAccount} from '../../models/aws-account';
import {SessionService} from '../../services/session.service';
import {IdpResponseType, WorkspaceService} from '../../services/workspace.service';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent extends AntiMemLeak implements OnInit {

  activeTab = 1;

  idpUrlValue;
  editingIdpUrl: boolean;

  showProxyAuthentication = false;
  proxyProtocol = 'https'; // Default
  proxyUrl;
  proxyPort = '8080'; // Default
  proxyUsername;
  proxyPassword;

  workspaceData: Workspace;

  locations: { location: string }[];
  regions: { region: string }[];
  selectedLocation: string;
  selectedRegion: string;

  public form = new FormGroup({
    idpUrl: new FormControl(''),
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
    private sessionService: SessionService,
    private workspaceService: WorkspaceService,
    private router: Router
  ) { super(); }

  ngOnInit() {
    this.workspaceData = this.configurationService.getDefaultWorkspaceSync();
    if (this.workspaceData === undefined || this.workspaceData.proxyConfiguration === undefined) {
      this.workspaceService.createNewWorkspace(undefined, undefined, 'default', IdpResponseType.SAML);
      this.workspaceData = this.configurationService.getDefaultWorkspaceSync();
    }
    if (this.workspaceData.name && this.workspaceData.name !== '') {

      this.idpUrlValue = '';
      this.proxyProtocol = this.workspaceData.proxyConfiguration.proxyProtocol;
      this.proxyUrl = this.workspaceData.proxyConfiguration.proxyUrl;
      this.proxyPort = this.workspaceData.proxyConfiguration.proxyPort;
      this.proxyUsername = this.workspaceData.proxyConfiguration.username || '';
      this.proxyPassword = this.workspaceData.proxyConfiguration.password || '';

      this.form.controls['idpUrl'].setValue(this.idpUrlValue);
      this.form.controls['proxyUrl'].setValue(this.proxyUrl);
      this.form.controls['proxyProtocol'].setValue(this.proxyProtocol);
      this.form.controls['proxyPort'].setValue(this.proxyPort);
      this.form.controls['proxyUsername'].setValue(this.proxyUsername);
      this.form.controls['proxyPassword'].setValue(this.proxyPassword);

      this.proxyUrl = this.workspaceData.proxyConfiguration.proxyUrl && this.workspaceData.proxyConfiguration.proxyUrl !== 'undefined' ?
                              this.workspaceData.proxyConfiguration.proxyUrl : '';

      if (this.proxyUsername || this.proxyPassword) {
        this.showProxyAuthentication = true;
      }

      this.regions = this.appService.getRegions();
      this.locations = this.appService.getLocations();
      this.selectedRegion   = this.workspaceData.defaultRegion || environment.defaultRegion;
      this.selectedLocation = this.workspaceData.defaultLocation || environment.defaultLocation;


      this.appService.validateAllFormFields(this.form);
    }
  }

  /**
   * Save the idp-url again
   */
  saveOptions() {
    if (this.form.valid) {
      this.workspaceData.proxyConfiguration.proxyUrl = this.form.controls['proxyUrl'].value;
      this.workspaceData.proxyConfiguration.proxyProtocol = this.form.controls['proxyProtocol'].value;
      this.workspaceData.proxyConfiguration.proxyPort = this.form.controls['proxyPort'].value;
      this.workspaceData.proxyConfiguration.username = this.form.controls['proxyUsername'].value;
      this.workspaceData.proxyConfiguration.password = this.form.controls['proxyPassword'].value;

      this.workspaceData.defaultRegion = this.selectedRegion;
      this.workspaceData.defaultLocation = this.selectedLocation;

      this.configurationService.updateWorkspaceSync(this.workspaceData);

      if (this.checkIfNeedDialogBox()) {

        this.appService.confirmDialog('You\'ve set a proxy url: the app must be restarted to update the configuration.', (res) => {
          if (res !== constants.CONFIRM_CLOSED) {
            this.appService.logger('User have set a proxy url: the app must be restarted to update the configuration.', LoggerLevel.INFO, this);
            this.appService.restart();
          }
        });
      } else {
        this.appService.logger('Option saved.', LoggerLevel.INFO, this, JSON.stringify(this.form.getRawValue(), null, 3));
        this.appService.toast('Option saved.', ToastLevel.INFO, 'Options');
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
    const idpUrl = this.workspaceData.idpUrl.findIndex(u => u && u.id === id);
    if (this.form.get('idpUrl').value !== '') {
      if (idpUrl === -1) {
        this.workspaceData.idpUrl.push({ id: uuid.v4(), url: this.form.get('idpUrl').value });
      } else {
        this.workspaceData.idpUrl[idpUrl].url = this.form.get('idpUrl').value;
      }
      this.configurationService.updateWorkspaceSync(this.workspaceData);
    }
    this.editingIdpUrl = false;
    this.idpUrlValue = undefined;
    this.form.get('idpUrl').setValue('');
  }

  editIdpUrl(id) {
    const idpUrl = this.workspaceData.idpUrl.filter(u => u && u.id === id)[0];
    this.idpUrlValue = idpUrl;
    this.form.get('idpUrl').setValue(idpUrl.url);
    this.editingIdpUrl = true;
  }

  deleteIdpUrl(id) {
    // Federated
    const federated = this.workspaceData.sessions.filter(s => (s.account as AwsAccount).idpUrl !== undefined && (s.account as AwsAccount).idpUrl === id);
    let sessions = federated;

    // Add trusters from federated
    federated.forEach(fed => {
      const childs = this.sessionService.childSessions(fed);
      sessions = sessions.concat(childs);
    });

    // Get only names for display
    let sessionsNames = sessions.map(s => {
      return `<li><div class="removed-sessions"><b>${s.account.accountName}</b> - <small>${(s.account as AwsAccount).role.name}</small></div></li>`;
    });
    if (sessionsNames.length === 0) {
      sessionsNames = ['<li><b>no sessions</b></li>'];
    }

    // Ask for deletion
    this.appService.confirmDialog(`Deleting this Idp url will also remove these sessions: <br><ul>${sessionsNames.join('')}</ul>Do you want to proceed?`, (res) => {
      if (res !== constants.CONFIRM_CLOSED) {
        this.appService.logger(`Removing idp url with id: ${id}`, LoggerLevel.INFO, this);
        const idpUrl = this.workspaceData.idpUrl.findIndex(u => u && u.id === id);
        this.workspaceData.idpUrl.splice(idpUrl, 1);
        this.configurationService.updateWorkspaceSync(this.workspaceData);
        sessions.forEach(s => {
          this.sessionService.removeSession(s);
        });
      }
    });
  }
}

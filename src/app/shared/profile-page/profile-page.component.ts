import {Component, OnInit} from '@angular/core';
import {Workspace} from '../../models/workspace';
import {ConfigurationService} from '../../services-system/configuration.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AppService, LoggerLevel, ToastLevel} from '../../services-system/app.service';
import {FileService} from '../../services-system/file.service';
import {Router} from '@angular/router';
import {AntiMemLeak} from '../../core/anti-mem-leak';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent extends AntiMemLeak implements OnInit {

  name = '';
  email = '';

  idpUrlValue;

  showProxyAuthentication = false;
  proxyProtocol = 'https'; // Default
  proxyUrl;
  proxyPort = '8080'; // Default
  proxyUsername;
  proxyPassword;

  workspaceData: Workspace;

  public form = new FormGroup({
    idpUrl: new FormControl(''),
    proxyUrl: new FormControl(''),
    proxyProtocol: new FormControl(''),
    proxyPort: new FormControl(''),
    proxyUsername: new FormControl(''),
    proxyPassword: new FormControl('')
  });

  /* Simple profile page: shows the Idp Url and the workspace json */
  constructor(
    private configurationService: ConfigurationService,
    private appService: AppService,
    private fileService: FileService,
    private router: Router
  ) { super(); }

  ngOnInit() {
    this.workspaceData = this.configurationService.getDefaultWorkspaceSync();
    if (this.workspaceData.name && this.workspaceData.name !== '') {
      this.idpUrlValue = this.workspaceData.idpUrl;

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

      this.name = this.workspaceData.name;
      this.email = localStorage.getItem('hook_email') || 'not logged in yet';
      this.appService.validateAllFormFields(this.form);
    }
  }

  /**
   * Save the idp-url again
   */
  saveOptions() {
    if (this.form.valid) {
      this.workspaceData.idpUrl = this.form.value.idpUrl;

      this.workspaceData.proxyConfiguration.proxyUrl = this.form.controls['proxyUrl'].value;
      this.workspaceData.proxyConfiguration.proxyProtocol = this.form.controls['proxyProtocol'].value;
      this.workspaceData.proxyConfiguration.proxyPort = this.form.controls['proxyPort'].value;
      this.workspaceData.proxyConfiguration.username = this.form.controls['proxyUsername'].value;
      this.workspaceData.proxyConfiguration.password = this.form.controls['proxyPassword'].value;

      this.configurationService.updateWorkspaceSync(this.workspaceData);

      if (this.form.controls['proxyUrl'].value !== undefined &&
        this.form.controls['proxyUrl'].value !== null &&
        this.form.controls['proxyUrl'].value !== '') {

        this.appService.logger('User have set a proxy url: the app must be restarted to update the configuration.', LoggerLevel.INFO, this);
        this.appService.toast('You\'ve set a proxy url: the app must be restarted to update the configuration.', ToastLevel.WARN, 'Force restart');
        this.appService.restart();
      }

      this.appService.logger('Option saved.', LoggerLevel.INFO, this, JSON.stringify(this.form.getRawValue(), null, 3));
      this.appService.toast('Option saved.', ToastLevel.INFO, 'Options');
    }
  }

  /**
   * Return to home screen
   */
  goBack() {
    this.router.navigate(['/', 'sessions', 'session-selected']);
  }

}

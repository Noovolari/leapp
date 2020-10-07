import {Component, OnInit} from '@angular/core';
import {Workspace} from '../../models/workspace';
import {ConfigurationService} from '../../services-system/configuration.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AppService, ToastLevel} from '../../services-system/app.service';
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
  idpUrlValueAzure;
  proxyUrl;
  workspaceData: Workspace;

  public form = new FormGroup({
    idpUrl: new FormControl('', [Validators.required]),
    proxyUrl: new FormControl('')
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
      this.proxyUrl = this.workspaceData.proxyUrl;
      this.form.controls['idpUrl'].setValue(this.idpUrlValue);
      this.form.controls['proxyUrl'].setValue(this.proxyUrl);
      this.name = this.workspaceData.name;
      this.email = localStorage.getItem('hook_email') || 'not logged in yet';
      this.appService.validateAllFormFields(this.form);
    }
  }

  /**
   * Save the idp-url again
   */
  saveIdpUrls() {
    if (this.form.valid) {
      this.workspaceData.idpUrl = this.form.value.idpUrl;

      /* if (this.form.controls['proxyUrl'].value !== undefined &&
          this.form.controls['proxyUrl'].value !== null &&
          this.form.controls['proxyUrl'].value !== '') {
            this.workspaceData.proxyUrl = this.form.controls['proxyUrl'].value;
      } */

      this.workspaceData.proxyUrl = this.form.controls['proxyUrl'].value;

      this.configurationService.updateWorkspaceSync(this.workspaceData);

      if (this.form.controls['proxyUrl'].value !== undefined &&
        this.form.controls['proxyUrl'].value !== null &&
        this.form.controls['proxyUrl'].value !== '') {
        this.appService.toast('You\'ve set a proxy url: the app must be restarted to update the configuration.', ToastLevel.WARN, 'Force restart');
        this.appService.restart();
      }
    }
  }

  /**
   * Return to home screen
   */
  goBack() {
    this.router.navigate(['/', 'sessions', 'session-selected']);
  }
}

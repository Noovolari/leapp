import {Component, OnInit} from '@angular/core';
import {Workspace} from '../../models/workspace';
import {ConfigurationService} from '../../services-system/configuration.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AppService} from '../../services-system/app.service';
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
  workspaceData: Workspace;

  public form = new FormGroup({
    idpUrl: new FormControl('', [Validators.required]),
    idpUrlAzure: new FormControl('', [Validators.required]),
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
      this.idpUrlValueAzure = this.workspaceData.idpUrlAzure;
      this.form.controls['idpUrl'].setValue(this.idpUrlValue);
      this.form.controls['idpUrlAzure'].setValue(this.idpUrlValueAzure);
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
      this.workspaceData.idpUrlAzure = this.form.value.idpUrlAzure;
      this.configurationService.updateWorkspaceSync(this.workspaceData);
    }
  }

  /**
   * Return to home screen
   */
  goBack() {
    this.router.navigate(['/', 'sessions', 'session-selected']);
  }
}

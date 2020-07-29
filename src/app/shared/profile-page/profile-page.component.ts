import {Component, OnInit} from '@angular/core';
import {Workspace} from '../../models/workspace';
import {ConfigurationService} from '../../services-system/configuration.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AppService, LoggerLevel, ToastLevel} from '../../services-system/app.service';
import {Configuration} from '../../models/configuration';
import {FileService} from '../../services-system/file.service';
import {Router} from '@angular/router';
import {AntiMemLeak} from '../../core/anti-mem-leak';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent extends AntiMemLeak implements OnInit {

  name = '';
  email = '';
  idpUrlValue;

  workspaceData: Workspace;

  // Modal Reference and data
  modalRef: BsModalRef;

  public form = new FormGroup({
    idpUrl: new FormControl('', [Validators.required]),
  });

  constructor(
    private configurationService: ConfigurationService,
    private appService: AppService,
    private fileService: FileService,
    private router: Router,
    private modalService: BsModalService
  ) { super(); }

  ngOnInit() {
    this.workspaceData = this.configurationService.getDefaultWorkspaceSync();
    if (this.workspaceData.name && this.workspaceData.name !== '') {
      this.idpUrlValue = this.workspaceData.idpUrl;
      this.form.controls['idpUrl'].setValue(this.idpUrlValue);
      this.name = this.workspaceData.name;
      this.email = localStorage.getItem('hook_email') || 'not logged in yet';
      this.appService.validateAllFormFields(this.form);
    }
  }

  /**
   * Save the idp-url again
   */
  saveIdpUrl() {
    if (this.form.valid) {
      this.workspaceData.idpUrl = this.form.value.idpUrl;
      this.configurationService.updateWorkspaceSync(this.workspaceData);
    }
  }

  /**
   * Return to home screen
   */
  goBack() {
    this.router.navigate(['/', 'sessions', 'session-selected']);
  }

  /**
   * open a workspace viewer
   */
  showWorkspaceJson(template) {
    this.modalRef = this.modalService.show(template);
  }
}

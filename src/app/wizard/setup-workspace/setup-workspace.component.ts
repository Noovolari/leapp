import {Component, OnInit} from '@angular/core';
import {WorkspaceService} from '../../services/workspace.service';
import {ConfigurationService} from '../../services-system/configuration.service';
import {Router} from '@angular/router';
import {AppService, ToastLevel} from '../../services-system/app.service';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AntiMemLeak} from '../../core/anti-mem-leak';

@Component({
  selector: 'app-setup-workspace',
  templateUrl: './setup-workspace.component.html',
  styleUrls: ['./setup-workspace.component.scss']
})
export class SetupWorkspaceComponent extends AntiMemLeak implements OnInit {


  form = new FormGroup({
    name: new FormControl('', [Validators.required])
  });

  constructor(
    private router: Router,
    private workspaceService: WorkspaceService,
    private configurationService: ConfigurationService,
    private appService: AppService
  ) { super(); }

  ngOnInit() {
    localStorage.removeItem('workspace');
  }

  /**
   * Submit from form...
   */
  submit() {
    if (this.form.valid) {
      // Get Idp and Auth Url as STEP 1a - calling the idp url
      const sub = this.workspaceService.getFederationUrl(this.form.value.name).subscribe(
        response => this.startAuthenticationProcess(response),
        err => {this.appService.toast(err.error, ToastLevel.ERROR, 'Fderation Url retrieve error'); }
      );

      this.subs.add(sub);
    }
  }

  /**
   * Clear workspace form
   */
  clearForm() {
    this.form.reset();
  }

  // ======================================= //
  // ======= Authentication Process ======== //
  // ======================================= //

  /**
   * Step 1b: Get the idp Form passing the workspace name
   * @param response - {{idpUrl: string; cognitoUrl: string, responseType?: string}} the response we will receive if everything is ok
   */
  private startAuthenticationProcess(response: string) {
    // Then go to next page
    console.log();
    localStorage.setItem('workspace', this.form.value.name);
    this.router.navigate(['/wizard', 'setup-spinner-for-login']);
  }

}

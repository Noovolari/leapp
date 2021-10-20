import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AppService} from '../../services/app.service';
import {WorkspaceService} from '../../services/workspace.service';
import {AwsSsoRoleService, SsoRoleSession} from '../../services/session/aws/methods/aws-sso-role.service';
import {Constants} from '../../models/constants';
import {AwsSsoOidcService, BrowserWindowClosing} from '../../services/aws-sso-oidc.service';

@Component({
  selector: 'app-aws-sso',
  templateUrl: './aws-sso.component.html',
  styleUrls: ['./aws-sso.component.scss']
})
export class AwsSsoComponent implements OnInit, BrowserWindowClosing {

  eConstants = Constants;
  isAwsSsoActive: boolean;
  regions = [];
  selectedRegion;
  portalUrl;
  loadingInBrowser = false;
  loadingInApp = false;
  selectedBrowserOpening: string;

  public form = new FormGroup({
    portalUrl: new FormControl('', [Validators.required, Validators.pattern('https?://.+')]),
    awsRegion: new FormControl('', [Validators.required]),
    defaultBrowserOpening: new FormControl('', [Validators.required])
  });

  constructor(
    private appService: AppService,
    private awsSsoRoleService: AwsSsoRoleService,
    private router: Router,
    private workspaceService: WorkspaceService,
    private awsSsoOidcService: AwsSsoOidcService
  ) {}

  ngOnInit() {
    this.awsSsoOidcService.listeners.push(this);

    this.awsSsoRoleService.awsSsoActive().then(res => {
      this.isAwsSsoActive = res;
      this.loadingInBrowser = false;
      this.loadingInApp = false;
      this.setValues();
    });
  }

  async login() {
    if (this.form.valid && !this.loadingInApp && !this.loadingInBrowser) {
      this.loadingInBrowser = (this.selectedBrowserOpening === Constants.inBrowser.toString());
      this.loadingInApp = (this.selectedBrowserOpening === Constants.inApp.toString());

      this.workspaceService.setAwsSsoConfiguration(
        this.selectedRegion,
        this.form.value.portalUrl,
        this.selectedBrowserOpening,
        this.workspaceService.getAwsSsoConfiguration().expirationTime
      );

      try {
        const ssoRoleSessions: SsoRoleSession[] = await this.awsSsoRoleService.sync();
        ssoRoleSessions.forEach(ssoRoleSession => {
          this.awsSsoRoleService.create(ssoRoleSession, this.workspaceService.getDefaultProfileId());
        });
        this.router.navigate(['/sessions', 'session-selected']);
        this.loadingInBrowser = false;
        this.loadingInApp = false;
      } catch (err) {
        await this.logout();
        throw err;
      }
    }
  }

  async logout() {
    await this.awsSsoRoleService.logout();
    this.isAwsSsoActive = false;
    this.loadingInBrowser = false;
    this.loadingInApp = false;
    this.setValues();
  }

  async forceSync() {
    try {
      const ssoRoleSessions: SsoRoleSession[] = await this.awsSsoRoleService.sync();
      ssoRoleSessions.forEach(ssoRoleSession => {
        this.awsSsoRoleService.create(ssoRoleSession, ssoRoleSession.profileId);
      });
      this.router.navigate(['/sessions', 'session-selected']);
      this.loadingInBrowser = false;
      this.loadingInApp = false;
    } catch(err) {
      await this.logout();
      throw err;
    }
  }

  async goBack() {
    await this.router.navigate(['/sessions', 'session-selected']);
  }

  gotoWebForm() {
    // TODO: call aws sso oidc service directly
    this.awsSsoRoleService.interrupt();
    this.login();
  }

  setValues() {
    this.regions = this.appService.getRegions();
    const region = this.workspaceService.getAwsSsoConfiguration().region;
    const portalUrl = this.workspaceService.getAwsSsoConfiguration().portalUrl;
    this.selectedBrowserOpening = this.workspaceService.getAwsSsoConfiguration().browserOpening || Constants.inApp;

    this.selectedRegion = region || this.regions[0].region;
    this.portalUrl = portalUrl;
    this.form.controls['portalUrl'].setValue(portalUrl);
  }

  closeLoadingScreen() {
    // TODO: call aws sso oidc service directly
    this.awsSsoRoleService.interrupt();
    this.loadingInBrowser = false;
    this.loadingInApp = false;
  }

  catchClosingBrowserWindow(): void {
    this.loadingInBrowser = false;
    this.loadingInApp = false;
  }
}

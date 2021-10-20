import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AppService} from '../../services/app.service';
import {WorkspaceService} from '../../services/workspace.service';
import {AwsSsoRoleService, SsoRoleSession} from '../../services/session/aws/methods/aws-sso-role.service';
import {Constants} from '../../models/constants';
import {AwsSsoOidcService} from "../../services/aws-sso-oidc.service";

@Component({
  selector: 'app-aws-sso',
  templateUrl: './aws-sso.component.html',
  styleUrls: ['./aws-sso.component.scss']
})
export class AwsSsoComponent implements OnInit {

  eConstants = Constants;
  isAwsSsoActive: boolean;
  regions = [];
  selectedRegion;
  portalUrl;
  loading = false;
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
    this.awsSsoRoleService.awsSsoActive().then(res => {
      this.isAwsSsoActive = res;
      this.loading = false;
      this.setValues();
    });
  }

  async login() {
    if (this.form.valid) {
      this.loading = (this.selectedBrowserOpening === Constants.inBrowser.toString());

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
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/sessions', 'session-selected']);
        }, 1500);
      } catch (err) {
        this.loading = false;
        await this.logout();
        throw err;
      }
    }
  }

  async logout() {
    await this.awsSsoRoleService.logout();
    this.isAwsSsoActive = false;
    this.loading = false;
    this.setValues();
  }

  async forceSync() {
    try {
      const ssoRoleSessions: SsoRoleSession[] = await this.awsSsoRoleService.sync();
      ssoRoleSessions.forEach(ssoRoleSession => {
        this.awsSsoRoleService.create(ssoRoleSession, ssoRoleSession.profileId);
      });
      this.loading = false;
      setTimeout(() => {
        this.router.navigate(['/sessions', 'session-selected']);
      });
    } catch(err) {
      this.loading = false;
      await this.logout();
      throw err;
    }
  }

  async goBack() {
    await this.router.navigate(['/sessions', 'session-selected']);
  }

  gotoWebForm() {
    this.appService.openExternalUrl(this.portalUrl);
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
}

import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AppService, LoggerLevel, ToastLevel} from '../../services/app.service';
import {WorkspaceService} from '../../services/workspace.service';
import {AwsSsoRoleService, SsoRoleSession} from '../../services/session/aws/methods/aws-sso-role.service';
import {Constants} from '../../models/constants';
import {AwsSsoOidcService, BrowserWindowClosing} from '../../services/aws-sso-oidc.service';
import {LoggingService} from '../../services/logging.service';
import {AwsSsoIntegration} from '../../models/aws-sso-integration';
import {AwsSsoIntegrationService} from "../../services/aws-sso-integration.service";

@Component({
  selector: 'app-aws-sso',
  templateUrl: './aws-sso.component.html',
  styleUrls: ['./aws-sso.component.scss']
})
export class AwsSsoComponent implements OnInit, BrowserWindowClosing {

  eConstants = Constants;
  regions = [];
  selectedAwsSsoConfiguration: AwsSsoIntegration;
  loadingInBrowser = false;
  loadingInApp = false;

  public awsSsoConfigurations: AwsSsoIntegration[];
  public modifying: number;

  public form = new FormGroup({
    portalUrl: new FormControl('', [Validators.required, Validators.pattern('https?://.+')]),
    awsRegion: new FormControl('', [Validators.required]),
    defaultBrowserOpening: new FormControl('', [Validators.required])
  });

  public logoutLoadings: any;

  constructor(
    private appService: AppService,
    private awsSsoRoleService: AwsSsoRoleService,
    private router: Router,
    private workspaceService: WorkspaceService,
    private awsSsoOidcService: AwsSsoOidcService,
    private loggingService: LoggingService,
    private awsSsoIntegrationService: AwsSsoIntegrationService
  ) {}

  ngOnInit() {
    this.awsSsoOidcService.listeners.push(this);

    this.loadingInBrowser = false;
    this.loadingInApp = false;

    this.setValues();
  }

  async logout(configurationId: string) {
    this.logoutLoadings[configurationId] = true;
    this.selectedAwsSsoConfiguration = this.workspaceService.getAwsSsoIntegration(configurationId);
    await this.awsSsoIntegrationService.logout(this.selectedAwsSsoConfiguration.id);

    this.loadingInBrowser = false;
    this.loadingInApp = false;

    this.setValues();
  }

  async forceSync(configurationId: string) {
    this.selectedAwsSsoConfiguration = this.workspaceService.getAwsSsoIntegration(configurationId);

    if (this.selectedAwsSsoConfiguration && !this.loadingInApp) {
      this.loadingInBrowser = (this.selectedAwsSsoConfiguration.browserOpening === Constants.inBrowser.toString());
      this.loadingInApp = (this.selectedAwsSsoConfiguration.browserOpening === Constants.inApp.toString());

      try {
        const ssoRoleSessions: SsoRoleSession[] = await this.awsSsoIntegrationService.sync(this.selectedAwsSsoConfiguration.id);
        ssoRoleSessions.forEach(ssoRoleSession => {
          ssoRoleSession.awsSsoConfigurationId = configurationId;
          this.awsSsoRoleService.create(ssoRoleSession, this.workspaceService.getDefaultProfileId());
        });
        this.router.navigate(['/sessions', 'session-selected']);
        this.loadingInBrowser = false;
        this.loadingInApp = false;
      } catch (err) {
        await this.logout(configurationId);
        throw err;
      }
    }
  }

  async goBack() {
    await this.router.navigate(['/sessions', 'session-selected']);
  }

  async gotoWebForm(configurationId: string) {
    // TODO: call aws sso oidc service directly
    this.awsSsoRoleService.interrupt();
    await this.forceSync(configurationId);
  }

  setValues() {
    this.modifying = 0;
    this.regions = this.appService.getRegions();
    this.awsSsoConfigurations = this.workspaceService.listAwsSsoIntegrations();
    this.logoutLoadings = {};
    this.awsSsoConfigurations.forEach(sc => {
      this.logoutLoadings[sc.id] = false;
    });

    this.selectedAwsSsoConfiguration = {
      id: 'new AWS Single Sign-On',
      region: this.regions[0].region,
      portalUrl: '',
      browserOpening: Constants.inApp,
      accessTokenExpiration: undefined
    };
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

  async isAwsSsoActive(awsSsoConfiguration: AwsSsoIntegration) {
    const isAwsSsoAccessTokenExpired = await this.awsSsoIntegrationService.isAwsSsoAccessTokenExpired(awsSsoConfiguration.id);
    return !isAwsSsoAccessTokenExpired;
  }

  openAddModal(modifying, currentAwsSsoConfiguration) {
    this.modifying = modifying;
    this.selectedAwsSsoConfiguration = currentAwsSsoConfiguration;

    this.form.get('portalUrl').setValue(this.selectedAwsSsoConfiguration.portalUrl);
    this.form.get('awsRegion').setValue(this.selectedAwsSsoConfiguration.region);
    this.form.get('defaultBrowserOpening').setValue(this.selectedAwsSsoConfiguration.browserOpening);
  }

  save() {
    if(this.form.valid) {
      const portalUrl = this.form.get('portalUrl').value;
      const region = this.form.get('awsRegion').value;
      const browserOpening = this.form.get('defaultBrowserOpening').value;

      console.log(portalUrl, region, browserOpening);

      if(this.modifying === 1) {
        // Save
        this.workspaceService.addAwsSsoIntegration(
          portalUrl,
          region,
          browserOpening
        );
      } else if(this.modifying === 2 && this.selectedAwsSsoConfiguration.portalUrl !== '') {
        // Edit
        this.workspaceService.updateAwsSsoIntegration(
          this.selectedAwsSsoConfiguration.id,
          region,
          portalUrl,
          browserOpening
        );
      }

      this.setValues();
      this.openAddModal(0, this.selectedAwsSsoConfiguration);
    } else {
      this.appService.toast('Form is not valid', ToastLevel.warn, 'Form validation');
    }
  }

  delete(awsSsoConfiguration: AwsSsoIntegration) {
    // Ask for deletion
    this.appService.confirmDialog(`Deleting this configuration will also logout from its sessions: do you wannt to proceed?`, async (res) => {
      if (res !== Constants.confirmClosed) {
        this.loggingService.logger(`Removing sessions with attached aws sso config id: ${awsSsoConfiguration.id}`, LoggerLevel.info, this);
        this.logout(awsSsoConfiguration.id);
        this.workspaceService.deleteAwsSsoIntegration(awsSsoConfiguration.id);
      }
    });
  }
}

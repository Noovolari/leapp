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
import {AwsSsoIntegrationService} from '../../services/aws-sso-integration.service';

@Component({
  selector: 'app-aws-sso',
  templateUrl: './integration.component.html',
  styleUrls: ['./integration.component.scss']
})
export class IntegrationComponent implements OnInit, BrowserWindowClosing {

  eConstants = Constants;
  regions = [];
  selectedAwsSsoConfiguration: AwsSsoIntegration;
  loadingInBrowser = false;
  loadingInApp = false;
  chooseIntegration = false;

  public awsSsoConfigurations: AwsSsoIntegration[];
  public modifying: number;

  public form = new FormGroup({
    alias: new FormControl('', [Validators.required]),
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
    private loggingService: LoggingService
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
    await AwsSsoIntegrationService.getInstance().logout(this.selectedAwsSsoConfiguration.id);

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
        const ssoRoleSessions: SsoRoleSession[] = await AwsSsoIntegrationService.getInstance().provisionSessions(this.selectedAwsSsoConfiguration.id);
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

  async gotoWebForm(integrationId: string) {
    // TODO: check if we need to put this method in IntegrationService singleton - sync method
    this.awsSsoRoleService.interrupt();
    await this.forceSync(integrationId);
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
      alias: '',
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

  gotoForm(modifying, currentAwsSsoConfiguration) {
    // Change graphical values to show the form
    this.chooseIntegration = false;
    this.modifying = modifying;
    this.selectedAwsSsoConfiguration = currentAwsSsoConfiguration;

    this.form.get('alias').setValue(this.selectedAwsSsoConfiguration.alias);
    this.form.get('portalUrl').setValue(this.selectedAwsSsoConfiguration.portalUrl);
    this.form.get('awsRegion').setValue(this.selectedAwsSsoConfiguration.region);
    this.form.get('defaultBrowserOpening').setValue(this.selectedAwsSsoConfiguration.browserOpening);
  }

  save() {
    if(this.form.valid) {
      const alias = this.form.get('alias').value;
      const portalUrl = this.form.get('portalUrl').value;
      const region = this.form.get('awsRegion').value;
      const browserOpening = this.form.get('defaultBrowserOpening').value;

      console.log(portalUrl, region, browserOpening);

      if(this.modifying === 1) {
        // Save
        this.workspaceService.addAwsSsoIntegration(
          portalUrl,
          alias,
          region,
          browserOpening
        );
      } else if(this.modifying === 2 && this.selectedAwsSsoConfiguration.portalUrl !== '') {
        // Edit
        this.workspaceService.updateAwsSsoIntegration(
          this.selectedAwsSsoConfiguration.id,
          alias,
          region,
          portalUrl,
          browserOpening
        );
      }

      this.setValues();
      this.gotoForm(0, this.selectedAwsSsoConfiguration);
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

  isOnline(awsSsoConfiguration: AwsSsoIntegration) {
    return awsSsoConfiguration.accessTokenExpiration !== null &&
           awsSsoConfiguration.accessTokenExpiration !== undefined &&
           awsSsoConfiguration.accessTokenExpiration !== '';
  }

  remainingHours(awsSsoConfiguration: AwsSsoIntegration) {
    const diff =((new Date(awsSsoConfiguration.accessTokenExpiration).getTime() - new Date().getTime()) / 1000) / 3600;
    const hours =  Math.abs(Math.round(diff));
    return hours + 'hours';
  }
}

import {Component, OnDestroy, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren} from '@angular/core';
import {Constants} from '../../models/constants';
import {AwsSsoIntegration} from '../../models/aws-sso-integration';
import {globalFilteredSessions} from '../command-bar/command-bar.component';
import {WorkspaceService} from '../../services/workspace.service';
import {AwsSsoRoleSession} from '../../models/aws-sso-role-session';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AwsSsoIntegrationService} from '../../services/aws-sso-integration.service';
import {AwsSsoRoleService, SsoRoleSession} from '../../services/session/aws/methods/aws-sso-role.service';
import {AppService, LoggerLevel, ToastLevel} from '../../services/app.service';
import {Router} from '@angular/router';
import {AwsSsoOidcService} from '../../services/aws-sso-oidc.service';
import {LoggingService} from '../../services/logging.service';
import {formatDistance, isPast} from 'date-fns';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {BehaviorSubject} from 'rxjs';
import {MatMenuTrigger} from '@angular/material/menu';
import {sidebarHighlight} from "../side-bar/side-bar.component";

export interface SelectedIntegration {
  id: string;
  selected: boolean;
}

export const integrationsFilter = new BehaviorSubject<AwsSsoIntegration[]>([]);
export const openIntegrationEvent = new BehaviorSubject<boolean>(false);
export const syncAllEvent = new BehaviorSubject<boolean>(false);
export const integrationHighlight = new BehaviorSubject<number>(-1);

@Component({
  selector: 'app-integration-bar',
  templateUrl: './integration-bar.component.html',
  styleUrls: ['./integration-bar.component.scss']
})
export class IntegrationBarComponent implements OnInit, OnDestroy {

  @ViewChildren(MatMenuTrigger)
  triggers: QueryList<MatMenuTrigger>;

  @ViewChild('ssoModalTemplate', { static: false })
  ssoModalTemplate: TemplateRef<any>;

  eConstants = Constants;
  regions = [];
  selectedAwsSsoConfiguration: AwsSsoIntegration;
  loadingInBrowser = false;
  loadingInApp = false;
  chooseIntegration = false;
  awsSsoConfigurations: AwsSsoIntegration[];
  modifying: number;
  subscription;
  subscription2;
  subscription3;

  form = new FormGroup({
    alias: new FormControl('', [Validators.required]),
    portalUrl: new FormControl('', [Validators.required, Validators.pattern('https?://.+')]),
    awsRegion: new FormControl('', [Validators.required]),
    defaultBrowserOpening: new FormControl('', [Validators.required])
  });

  logoutLoadings: any;
  selectedIntegrations: SelectedIntegration[];
  modalRef: BsModalRef;
  menuX: number;
  menuY: number;

  constructor(private appService: AppService,
              private bsModalService: BsModalService,
              private awsSsoRoleService: AwsSsoRoleService,
              private router: Router,
              private workspaceService: WorkspaceService,
              private awsSsoOidcService: AwsSsoOidcService,
              private loggingService: LoggingService) { }

  ngOnInit(): void {
    this.subscription = integrationsFilter.subscribe(_ => {
      this.setValues();
      this.selectedIntegrations = this.awsSsoConfigurations.map(awsIntegration => ({ id: awsIntegration.id, selected: false }));
    });
    integrationsFilter.next(this.workspaceService.listAwsSsoIntegrations());

    this.subscription2 = openIntegrationEvent.subscribe(value => {
      if(value) {
        this.gotoForm(1, this.selectedAwsSsoConfiguration);
      }
    });

    this.subscription3 = syncAllEvent.subscribe(async value => {
      if(value) {
        for(let i = 0; i < this.awsSsoConfigurations.length; i++) {
          const integration = this.awsSsoConfigurations[i];
          if(this.isOnline(integration)) {
             await this.forceSync(integration.id);
          }
        }
        this.appService.toast('Integrations synchronized.', ToastLevel.info, '');
      }
    });

    integrationHighlight.subscribe(value => {
      //set highlighted row for integration
      this.selectedIntegrations.forEach(i => i.selected = false);
    });
    integrationHighlight.next(-1);

    this.awsSsoOidcService.listeners.push(this);
    this.loadingInBrowser = false;
    this.loadingInApp = false;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subscription2.unsubscribe();
    this.subscription3.unsubscribe();
  }

  selectedSsoConfigurationCheck(awsSsoConfiguration: AwsSsoIntegration) {
    const index = this.selectedIntegrations.findIndex(s => s.id === awsSsoConfiguration.id);
    return this.selectedIntegrations[index].selected ? 'selected-integration' : '';
  }

  applyContextMenu(index: number, awsSsoConfiguration: AwsSsoIntegration, event) {
    event.preventDefault();
    event.stopPropagation();

    this.appService.closeAllMenuTriggers();

    this.selectedIntegrations.forEach(s => s.selected = false);

    const selectedIndex = this.selectedIntegrations.findIndex(s => s.id === awsSsoConfiguration.id);
    this.selectedIntegrations[selectedIndex].selected = true;

    setTimeout(() => {
      this.menuY = event.layerY - 10;
      this.menuX = event.layerX - 10;

      this.triggers.get(index).openMenu();
      this.appService.setMenuTrigger(this.triggers.get(index));
    }, 100);
  }

  applySegmentFilter(awsSsoConfiguration: AwsSsoIntegration, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.selectedIntegrations.forEach(s => s.selected = false);

    sidebarHighlight.next({showAll: false, showPinned: false});

    const selectedIndex = this.selectedIntegrations.findIndex(s => s.id === awsSsoConfiguration.id);
    this.selectedIntegrations[selectedIndex].selected = true;

    globalFilteredSessions.next(this.workspaceService.sessions.filter(s => (s as AwsSsoRoleSession).awsSsoConfigurationId === awsSsoConfiguration.id));
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
        if(this.loadingInBrowser && !this.isOnline(this.selectedAwsSsoConfiguration)) {
          this.modalRef = this.bsModalService.show(this.ssoModalTemplate, { class: 'sso-modal'});
        }

        const ssoRoleSessions: SsoRoleSession[] = await AwsSsoIntegrationService.getInstance().provisionSessions(this.selectedAwsSsoConfiguration.id);
        ssoRoleSessions.forEach(ssoRoleSession => {
          ssoRoleSession.awsSsoConfigurationId = configurationId;
          this.awsSsoRoleService.create(ssoRoleSession, ssoRoleSession.profileId);
        });

        if(this.modalRef) {
          this.modalRef.hide();
        }

        this.loadingInBrowser = false;
        this.loadingInApp = false;
      } catch (err) {
        await this.logout(configurationId);
        this.loggingService.toast(`Error during SSO Login. Invalid SSO URL`, ToastLevel.error);
        this.modalRef.hide();
        //throw err;
      }
    }
  }

  async gotoWebForm(integrationId: string) {
    // TODO: check if we need to put this method in IntegrationService singleton - sync method
    this.awsSsoRoleService.interrupt();
    this.modalRef.hide();
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
    this.modalRef.hide();
  }

  catchClosingBrowserWindow(): void {
    this.loadingInBrowser = false;
    this.loadingInApp = false;
    this.modalRef.hide();
  }

  gotoForm(modifying, currentAwsSsoConfiguration) {
    // Change graphical values to show the form
    this.chooseIntegration = false;
    this.modifying = modifying;
    this.selectedAwsSsoConfiguration = currentAwsSsoConfiguration;

    if(modifying === 1) {
      this.selectedAwsSsoConfiguration = {
        id: 'new AWS Single Sign-On',
        alias: '',
        region: this.regions[0].region,
        portalUrl: '',
        browserOpening: Constants.inApp,
        accessTokenExpiration: undefined
      };
    }

    this.form.get('alias').setValue(this.selectedAwsSsoConfiguration.alias);
    this.form.get('portalUrl').setValue(this.selectedAwsSsoConfiguration.portalUrl);
    this.form.get('awsRegion').setValue(this.selectedAwsSsoConfiguration.region);
    this.form.get('defaultBrowserOpening').setValue(this.selectedAwsSsoConfiguration.browserOpening);

    this.modalRef = this.bsModalService.show(this.ssoModalTemplate, { class: 'sso-modal'});
  }

  save() {
    if(this.form.valid) {
      const alias = this.form.get('alias').value;
      const portalUrl = this.form.get('portalUrl').value;
      const region = this.form.get('awsRegion').value;
      const browserOpening = this.form.get('defaultBrowserOpening').value;

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
      integrationsFilter.next(this.workspaceService.listAwsSsoIntegrations());
      this.modalRef.hide();
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
        this.modifying = 0;
      }
    }, 'Delete Configuration', 'Cancel');
  }

  isOnline(awsSsoConfiguration: AwsSsoIntegration) {
    return (awsSsoConfiguration.accessTokenExpiration !== null &&
        awsSsoConfiguration.accessTokenExpiration !== undefined &&
        awsSsoConfiguration.accessTokenExpiration !== '') &&
      !isPast(new Date(awsSsoConfiguration.accessTokenExpiration));
  }

  remainingHours(awsSsoConfiguration: AwsSsoIntegration) {
    return formatDistance(
      new Date(awsSsoConfiguration.accessTokenExpiration),
      new Date(),
      { addSuffix: true }
    );
  }

  formValid() {
    return this.form.get('alias').valid &&
      this.form.get('portalUrl').valid &&
      this.form.get('awsRegion').value !== null;
  }
}

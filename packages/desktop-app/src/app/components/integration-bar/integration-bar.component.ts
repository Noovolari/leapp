import { Component, Input, NgZone, OnDestroy, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren } from "@angular/core";
import { globalFilterGroup } from "../command-bar/command-bar.component";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { BehaviorSubject } from "rxjs";
import { MatLegacyMenuTrigger } from "@angular/material/legacy-menu";
import { AwsSsoIntegration } from "@noovolari/leapp-core/models/aws/aws-sso-integration";
import { constants } from "@noovolari/leapp-core/models/constants";
import { AppService } from "../../services/app.service";
import { BehaviouralSubjectService } from "@noovolari/leapp-core/services/behavioural-subject-service";
import { AwsSsoRoleService } from "@noovolari/leapp-core/services/session/aws/aws-sso-role-service";
import { AppProviderService } from "../../services/app-provider.service";
import { AwsSsoOidcService } from "@noovolari/leapp-core/services/aws-sso-oidc.service";
import { LoggedEntry, LoggedException, LogLevel, LogService } from "@noovolari/leapp-core/services/log-service";
import { MessageToasterService, ToastLevel } from "../../services/message-toaster.service";
import { WindowService } from "../../services/window.service";
import { sidebarHighlight } from "../side-bar/side-bar.component";
import { SegmentService } from "@noovolari/leapp-core/services/segment-service";
import { OptionsService } from "../../services/options.service";
import { Integration } from "@noovolari/leapp-core/models/integration";
import { IntegrationType } from "@noovolari/leapp-core/models/integration-type";
import { AzureIntegration } from "@noovolari/leapp-core/models/azure/azure-integration";
import { IntegrationParams } from "@noovolari/leapp-core/models/integration-params";
import { AnalyticsService } from "../../services/analytics.service";

export interface SelectedIntegration {
  id: string;
  selected: boolean;
}

export const openIntegrationEvent = new BehaviorSubject<boolean | string>(false);
export const syncAllEvent = new BehaviorSubject<boolean>(false);
export const integrationHighlight = new BehaviorSubject<number>(-1);

@Component({
  selector: "app-integration-bar",
  templateUrl: "./integration-bar.component.html",
  styleUrls: ["./integration-bar.component.scss"],
})
export class IntegrationBarComponent implements OnInit, OnDestroy {
  @ViewChildren(MatLegacyMenuTrigger)
  triggers: QueryList<MatLegacyMenuTrigger>;

  @ViewChild("ssoModalTemplate", { static: false })
  ssoModalTemplate: TemplateRef<any>;

  @Input()
  isTeamWorkspace: boolean;

  eConstants = constants;
  regions = [];
  selectedConfiguration: any;
  loadingInBrowser = false;
  loadingInApp = false;
  chooseIntegration = false;
  awsSsoConfigurations: AwsSsoIntegration[];
  azureConfigurations: AzureIntegration[];
  modifying: number;
  subscription;
  subscription2;
  subscription3;

  eIntegrationType = IntegrationType;

  integrations = [
    { label: "AWS Single Sign-On", value: IntegrationType.awsSso },
    { label: "Azure", value: IntegrationType.azure },
  ];
  selectedIntegration: string;

  form = new FormGroup({
    alias: new FormControl("", [Validators.required]),
    portalUrl: new FormControl("", [Validators.required, Validators.pattern("https?://.+")]),
    awsRegion: new FormControl("", [Validators.required]),
    defaultBrowserOpening: new FormControl("", [Validators.required]),
    integrationType: new FormControl("", [Validators.required]),
    tenantId: new FormControl("", [Validators.required]),
  });

  logoutLoadings: any;
  selectedIntegrations: SelectedIntegration[];
  modalRef: BsModalRef;
  menuX: number;
  menuY: number;

  submitting = false;

  public behaviouralSubjectService: BehaviouralSubjectService;
  private awsSsoRoleService: AwsSsoRoleService;
  private awsSsoOidcService: AwsSsoOidcService;
  private loggingService: LogService;
  private segmentService: SegmentService;

  constructor(
    public optionsService: OptionsService,
    public appService: AppService,
    private bsModalService: BsModalService,
    private router: Router,
    private windowService: WindowService,
    private messageToasterService: MessageToasterService,
    public appProviderService: AppProviderService,
    private ngZone: NgZone,
    private analyticsService: AnalyticsService
  ) {
    this.awsSsoRoleService = this.appProviderService.awsSsoRoleService;
    this.behaviouralSubjectService = this.appProviderService.behaviouralSubjectService;
    this.awsSsoOidcService = this.appProviderService.awsSsoOidcService;
    this.loggingService = this.appProviderService.logService;
    this.segmentService = this.appProviderService.segmentService;
  }

  ngOnInit(): void {
    this.setValues();
    this.selectedIntegration = this.integrations[0].value; // default on AWS

    this.subscription = this.behaviouralSubjectService.integrations$.subscribe(() => {
      this.refreshLists();
      this.selectedIntegrations = [
        ...this.awsSsoConfigurations.map((integration) => ({
          id: integration.id,
          selected: false,
        })),
        ...this.azureConfigurations.map((integration) => ({
          id: integration.id,
          selected: false,
        })),
      ];
    });

    this.behaviouralSubjectService.setIntegrations(this.appProviderService.integrationFactory.getIntegrations());

    this.subscription2 = openIntegrationEvent.subscribe((value) => {
      if (value) {
        this.gotoForm(1, this.selectedConfiguration, IntegrationType.azure);
      }
    });

    this.subscription3 = syncAllEvent.subscribe(async (value) => {
      if (value) {
        for (let i = 0; i < this.awsSsoConfigurations.length; i++) {
          const integration = this.awsSsoConfigurations[i];
          await this.forceSync(integration.id);
        }
        for (let i = 0; i < this.azureConfigurations.length; i++) {
          const integration = this.azureConfigurations[i];
          await this.forceSync(integration.id);
        }
        this.messageToasterService.toast("Integrations synchronized.", ToastLevel.info, "");
      }
    });

    integrationHighlight.subscribe(() => {
      //set highlighted row for integration
      this.selectedIntegrations.forEach((i) => (i.selected = false));
    });
    integrationHighlight.next(-1);

    this.awsSsoOidcService.listeners.push(this);
    this.loadingInBrowser = false;
    this.loadingInApp = false;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.subscription2.unsubscribe();
    this.subscription3.unsubscribe();
  }

  selectedSsoConfigurationCheck(configuration: Integration): string {
    const index = this.selectedIntegrations.findIndex((s) => s.id === configuration.id);
    return this.selectedIntegrations[index].selected ? "selected-integration" : "";
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  applyContextMenu(index: number, configuration: Integration, event: any): void {
    event.preventDefault();
    event.stopPropagation();

    this.appService.closeAllMenuTriggers();

    this.selectedIntegrations.forEach((s) => (s.selected = false));

    const selectedIndex = this.selectedIntegrations.findIndex((s) => s.id === configuration.id);
    this.selectedIntegrations[selectedIndex].selected = true;

    setTimeout(() => {
      this.menuY = event.layerY - 10;
      this.menuX = event.layerX - 10;

      this.triggers.get(index).openMenu();
      this.appService.setMenuTrigger(this.triggers.get(index));
    }, 100);
  }

  applySegmentFilter(configuration: Integration, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.selectedIntegrations.forEach((s) => (s.selected = false));

    sidebarHighlight.next({ showAll: false, showPinned: false });

    const selectedIndex = this.selectedIntegrations.findIndex((s) => s.id === configuration.id);
    this.selectedIntegrations[selectedIndex].selected = true;
    this.behaviouralSubjectService.unselectSessions();

    const currentFilterGroup = globalFilterGroup.value;
    currentFilterGroup.pinnedFilter = false;
    currentFilterGroup.integrationFilter = [{ name: configuration.id, value: true }];
    globalFilterGroup.next(currentFilterGroup);
  }

  async logout(integrationId: string): Promise<void> {
    this.logoutLoadings[integrationId] = true;
    await this.appProviderService.integrationFactory.logout(integrationId);
    this.loadingInBrowser = false;
    this.loadingInApp = false;
    this.setValues();

    await this.analyticsService.captureEvent("Integration Logout", {
      integrationId,
      logoutAt: new Date().toISOString(),
    });
  }

  async forceSync(integrationId: string): Promise<void> {
    const integration = this.appProviderService.integrationFactory.getIntegrationById(integrationId);
    if (integration.type === IntegrationType.awsSso) {
      await this.forceSyncAwsSso(integrationId);
    } else {
      await this.forceSyncAzure(integrationId);
    }
  }

  async forceSyncAwsSso(integrationId: string): Promise<void> {
    this.selectedConfiguration = this.appProviderService.awsSsoIntegrationService.getIntegration(integrationId);
    if (!this.selectedConfiguration || this.loadingInApp) {
      return;
    }
    this.loadingInBrowser = this.selectedConfiguration.browserOpening === constants.inBrowser.toString();
    this.loadingInApp = this.selectedConfiguration.browserOpening === constants.inApp.toString();

    try {
      if (this.loadingInBrowser && !this.selectedConfiguration.isOnline) {
        this.modalRef = this.bsModalService.show(this.ssoModalTemplate, { class: "sso-modal" });
      }
      await this.appProviderService.awsSsoIntegrationService.syncSessions(integrationId, () => {
        this.analyticsService.captureEvent("Integration Login", { integrationId, integrationType: "AWS SSO", startedAt: new Date().toISOString() });
        if (this.modalRef) {
          this.modalRef.hide();
        }
      });
    } catch (err) {
      this.awsSsoOidcService.interrupt();
      await this.logout(integrationId);
      const errorMessage = `Error during SSO Login: ${err.toString()}`;
      this.loggingService.log(new LoggedException(errorMessage, this, LogLevel.error));
      this.messageToasterService.toast(errorMessage, ToastLevel.error);
    } finally {
      if (this.modalRef) {
        this.modalRef.hide();
      }
      this.loadingInBrowser = false;
      this.loadingInApp = false;
    }
  }

  async forceSyncAzure(integrationId: string): Promise<void> {
    const integration = this.appProviderService.azureIntegrationService.getIntegration(integrationId);
    if (!integration || this.loadingInApp) {
      return;
    }
    await this.appProviderService.azureIntegrationService.syncSessions(integrationId);
    const userLoggedIn = this.appProviderService.teamService.signedInUserState.getValue();
    if (userLoggedIn) {
      await this.analyticsService.captureEvent("Integration Login", { integrationId, integrationType: "Azure", startedAt: new Date().toISOString() });
    }
  }

  async gotoWebForm(integrationId: string): Promise<void> {
    this.awsSsoOidcService.interrupt();
    this.modalRef.hide();
    await this.forceSync(integrationId);
  }

  refreshLists(): void {
    this.regions = this.appProviderService.awsCoreService.getRegions();
    this.awsSsoConfigurations = this.appProviderService.awsSsoIntegrationService.getIntegrations();
    this.azureConfigurations = this.appProviderService.azureIntegrationService.getIntegrations();
  }

  setValues(): void {
    this.modifying = 0;
    this.refreshLists();

    this.logoutLoadings = {};
    this.awsSsoConfigurations.forEach((sc) => {
      this.logoutLoadings[sc.id] = false;
    });
    this.azureConfigurations.forEach((sc) => {
      this.logoutLoadings[sc.id] = false;
    });

    this.selectedConfiguration = {
      id: "new integration",
      alias: "",
      region: this.regions[0].region,
      portalUrl: "",
      browserOpening: constants.inApp,
      accessTokenExpiration: undefined,
      tenantId: "",
    };
  }

  closeLoadingScreen(): void {
    this.awsSsoOidcService.interrupt();
    this.loadingInBrowser = false;
    this.loadingInApp = false;
    this.modalRef?.hide();
  }

  catchClosingBrowserWindow(): void {
    this.loadingInBrowser = false;
    this.loadingInApp = false;
    this.modalRef?.hide();
  }

  gotoForm(modifying: number, integration: Integration, overrideType?: IntegrationType): void {
    if (this.isTeamWorkspace) {
      return;
    }

    // Change graphical values to show the form
    this.chooseIntegration = false;
    this.modifying = modifying;
    this.selectedConfiguration = integration;
    if (modifying === 1) {
      this.selectedConfiguration = {
        id: "new integration",
        alias: "",
        region: this.regions[0].region,
        portalUrl: "",
        browserOpening: constants.inApp,
        accessTokenExpiration: undefined,
        tenantId: "",
      };
    }

    if (overrideType) {
      this.selectedIntegration = overrideType;
    } else {
      this.selectedIntegration = integration.type || IntegrationType.awsSso;
    }

    this.form.get("alias").setValue(this.selectedConfiguration.alias);
    this.form.get("portalUrl").setValue(this.selectedConfiguration.portalUrl);
    this.form.get("awsRegion").setValue(this.selectedConfiguration.region);
    this.form.get("defaultBrowserOpening").setValue(this.selectedConfiguration.browserOpening);
    this.form.get("tenantId").setValue(this.selectedConfiguration.tenantId);

    this.modalRef = this.bsModalService.show(this.ssoModalTemplate, { class: "sso-modal" });
  }

  async save(): Promise<void> {
    this.submitting = true;
    try {
      if (this.formValid()) {
        const alias = this.form.get("alias").value?.trim();
        const portalUrl = this.form.get("portalUrl").value?.trim();
        const region = this.form.get("awsRegion").value;
        const browserOpening = this.form.get("defaultBrowserOpening").value;
        const tenantId = this.form.get("tenantId").value;

        let integrationParams: IntegrationParams;
        if (this.modifying > 0) {
          integrationParams =
            this.selectedIntegration === IntegrationType.awsSso
              ? ({ alias, browserOpening, portalUrl, region } as IntegrationParams)
              : ({ alias, tenantId } as IntegrationParams);
        }

        if (this.modifying === 1) {
          await this.appProviderService.integrationFactory.create(this.selectedIntegration as any, integrationParams);

          try {
            await this.appProviderService.teamService.pushToRemote();
          } catch (error) {
            this.appProviderService.teamService.setSyncState("failed");
            throw error;
          }

          this.messageToasterService.toast(`Integration: ${integrationParams.alias}, created.`, ToastLevel.success, "");
        } else if (this.modifying === 2) {
          await this.appProviderService.integrationFactory.update(this.selectedConfiguration.id, integrationParams);

          try {
            await this.appProviderService.teamService.pushToRemote();
          } catch (error) {
            this.appProviderService.teamService.setSyncState("failed");
            throw error;
          }

          this.messageToasterService.toast(`Integration: ${integrationParams.alias}, edited.`, ToastLevel.success, "");
        }

        this.ngZone.run(() => {
          this.setValues();
          this.behaviouralSubjectService.setIntegrations(this.appProviderService.integrationFactory.getIntegrations());
        });
        this.modalRef.hide();
      } else {
        this.messageToasterService.toast("Form is not valid", ToastLevel.warn, "Form validation");
      }
    } catch (error) {
      this.messageToasterService.toast(error.message, ToastLevel.error);
    } finally {
      this.submitting = false;
    }
  }

  delete(integration: Integration): void {
    // Ask for deletion
    // eslint-disable-next-line max-len
    this.windowService.confirmDialog(
      `Deleting this configuration will also logout from its sessions: do you want to proceed?`,
      async (res) => {
        try {
          if (res !== constants.confirmClosed) {
            // eslint-disable-next-line max-len
            this.loggingService.log(new LoggedEntry(`Removing sessions with attached integration id: ${integration.id}`, this, LogLevel.info));
            await this.logout(integration.id);
            await this.appProviderService.integrationFactory.delete(integration.id);

            try {
              await this.appProviderService.teamService.pushToRemote();
            } catch (error) {
              this.appProviderService.teamService.setSyncState("failed");
              throw error;
            }

            this.messageToasterService.toast(`Integration: ${integration.alias}, deleted.`, ToastLevel.success, "");
            this.setValues();
            this.behaviouralSubjectService.setIntegrations(this.appProviderService.integrationFactory.getIntegrations());
          }
        } catch (error) {
          this.messageToasterService.toast(error.message, ToastLevel.error);
        }
      },
      "Delete Configuration",
      "Cancel"
    );
  }

  remainingHours(integration: Integration): string {
    return this.appProviderService.integrationFactory.getRemainingHours(integration);
  }

  formValid(): boolean {
    if (this.selectedIntegration !== IntegrationType.azure) {
      return this.form.get("alias").valid && this.form.get("portalUrl").valid && this.form.get("awsRegion").value !== null;
    } else {
      return this.form.get("alias").valid && this.form.get("tenantId").valid;
    }
  }

  getIntegrationLabel(): string {
    return this.integrations.find((i) => i.value === this.selectedIntegration).label;
  }

  get defaultLocation(): string {
    return this.appProviderService.repository.getDefaultLocation();
  }
}

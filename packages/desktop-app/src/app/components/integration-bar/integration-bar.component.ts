import { Component, NgZone, OnDestroy, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren } from "@angular/core";
import { globalFilteredSessions } from "../command-bar/command-bar.component";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { BehaviorSubject } from "rxjs";
import { MatMenuTrigger } from "@angular/material/menu";
import { AwsSsoIntegration } from "@noovolari/leapp-core/models/aws/aws-sso-integration";
import { constants } from "@noovolari/leapp-core/models/constants";
import { AppService } from "../../services/app.service";
import { BehaviouralSubjectService } from "@noovolari/leapp-core/services/behavioural-subject-service";
import { AwsSsoRoleService } from "@noovolari/leapp-core/services/session/aws/aws-sso-role-service";
import { AppProviderService } from "../../services/app-provider.service";
import { AwsSsoOidcService } from "@noovolari/leapp-core/services/aws-sso-oidc.service";
import { LoggedEntry, LoggedException, LogLevel, LogService } from "@noovolari/leapp-core/services/log-service";
import { MessageToasterService, ToastLevel } from "../../services/message-toaster.service";
import { AwsSsoRoleSession } from "@noovolari/leapp-core/models/aws/aws-sso-role-session";
import { WindowService } from "../../services/window.service";
import { sidebarHighlight } from "../side-bar/side-bar.component";
import { SegmentService } from "@noovolari/leapp-core/services/segment-service";
import { OptionsService } from "../../services/options.service";
import { Integration } from "@noovolari/leapp-core/models/integration";
import { IntegrationType } from "@noovolari/leapp-core/models/integration-type";
import { AzureSession } from "@noovolari/leapp-core/models/azure/azure-session";
import { AzureIntegration } from "@noovolari/leapp-core/models/azure/azure-integration";

export interface SelectedIntegration {
  id: string;
  selected: boolean;
}

export const openIntegrationEvent = new BehaviorSubject<boolean>(false);
export const syncAllEvent = new BehaviorSubject<boolean>(false);
export const integrationHighlight = new BehaviorSubject<number>(-1);

@Component({
  selector: "app-integration-bar",
  templateUrl: "./integration-bar.component.html",
  styleUrls: ["./integration-bar.component.scss"],
})
export class IntegrationBarComponent implements OnInit, OnDestroy {
  @ViewChildren(MatMenuTrigger)
  triggers: QueryList<MatMenuTrigger>;

  @ViewChild("ssoModalTemplate", { static: false })
  ssoModalTemplate: TemplateRef<any>;

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

  isOnlineArray = {};

  private awsSsoRoleService: AwsSsoRoleService;
  private behaviouralSubjectService: BehaviouralSubjectService;
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
    public leappCoreService: AppProviderService,
    private ngZone: NgZone
  ) {
    this.awsSsoRoleService = this.leappCoreService.awsSsoRoleService;
    this.behaviouralSubjectService = this.leappCoreService.behaviouralSubjectService;
    this.awsSsoOidcService = this.leappCoreService.awsSsoOidcService;
    this.loggingService = this.leappCoreService.logService;
    this.segmentService = this.leappCoreService.segmentService;
  }

  ngOnInit(): void {
    this.subscription = this.behaviouralSubjectService.integrations$.subscribe(() => {
      this.setValues();
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
      this.selectedIntegration = this.integrations[0].value; // default on AWS
    });
    this.behaviouralSubjectService.setIntegrations([
      ...this.leappCoreService.awsSsoIntegrationService.getIntegrations(),
      ...this.leappCoreService.repository.listAzureIntegrations(),
    ]);

    this.subscription2 = openIntegrationEvent.subscribe((value) => {
      if (value) {
        this.gotoForm(1, this.selectedConfiguration);
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
    document.querySelector(".sessions").classList.remove("option-bar-opened");
    globalFilteredSessions.next(
      this.behaviouralSubjectService.sessions.filter(
        (s) => (s as AwsSsoRoleSession).awsSsoConfigurationId === configuration.id || (s as AzureSession).azureIntegrationId === configuration.id
      )
    );
  }

  async logout(configurationId: string): Promise<void> {
    this.logoutLoadings[configurationId] = true;
    if (this.leappCoreService.awsSsoIntegrationService.getIntegration(configurationId)) {
      this.selectedConfiguration = this.leappCoreService.awsSsoIntegrationService.getIntegration(configurationId);
      this.leappCoreService.awsSsoIntegrationService.logout(this.selectedConfiguration.id);
    } else {
      this.selectedConfiguration = this.leappCoreService.repository.getAzureIntegration(configurationId);
      // TODO: logout azure
    }

    this.loadingInBrowser = false;
    this.loadingInApp = false;
    this.setValues();
  }

  async forceSync(integrationId: string): Promise<void> {
    if (this.leappCoreService.awsSsoIntegrationService.getIntegration(integrationId)) {
      this.selectedConfiguration = this.leappCoreService.awsSsoIntegrationService.getIntegration(integrationId);
    } else {
      this.selectedConfiguration = this.leappCoreService.repository.getAzureIntegration(integrationId);
    }

    if (this.selectedConfiguration && !this.loadingInApp) {
      this.loadingInBrowser = this.selectedConfiguration.browserOpening === constants.inBrowser.toString();
      this.loadingInApp = this.selectedConfiguration.browserOpening === constants.inApp.toString();

      try {
        if (this.loadingInBrowser && !this.isOnline(this.selectedConfiguration)) {
          this.modalRef = this.bsModalService.show(this.ssoModalTemplate, { class: "sso-modal" });
        }

        if (this.selectedConfiguration.type !== IntegrationType.azure.toString()) {
          await this.leappCoreService.awsSsoIntegrationService.syncSessions(integrationId);
        } else {
          // TODO: azure sync
        }
      } catch (err) {
        if (this.selectedConfiguration.type !== IntegrationType.azure.toString()) {
          this.awsSsoOidcService.interrupt();
        }
        await this.logout(integrationId);
        this.loggingService.log(new LoggedException(`Error during SSO Login: ${err.toString()}`, this, LogLevel.error));
        this.messageToasterService.toast(`Error during SSO Login: ${err.toString()}`, ToastLevel.error);
      } finally {
        if (this.modalRef) {
          this.modalRef.hide();
        }
        this.loadingInBrowser = false;
        this.loadingInApp = false;
      }
    }
  }

  async gotoWebForm(integrationId: string): Promise<void> {
    this.awsSsoOidcService.interrupt();
    this.modalRef.hide();
    await this.forceSync(integrationId);
  }

  setValues(): void {
    this.modifying = 0;
    this.regions = this.leappCoreService.awsCoreService.getRegions();
    this.awsSsoConfigurations = this.leappCoreService.awsSsoIntegrationService.getIntegrations();
    this.azureConfigurations = this.leappCoreService.repository.listAzureIntegrations();
    this.logoutLoadings = {};
    this.isOnlineArray = {};
    this.awsSsoConfigurations.forEach(async (sc) => {
      this.logoutLoadings[sc.id] = false;
      // this.isOnlineArray[sc.id] = await this.isOnline(sc);
    });
    this.azureConfigurations.forEach(async (sc) => {
      this.logoutLoadings[sc.id] = false;
      // this.isOnlineArray[sc.id] = await this.isOnline(sc);
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

  gotoForm(modifying: number, integration: Integration): void {
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

    this.selectedIntegration = integration.type || IntegrationType.awsSso;

    this.form.get("alias").setValue(this.selectedConfiguration.alias);
    this.form.get("portalUrl").setValue(this.selectedConfiguration.portalUrl);
    this.form.get("awsRegion").setValue(this.selectedConfiguration.region);
    this.form.get("defaultBrowserOpening").setValue(this.selectedConfiguration.browserOpening);
    this.form.get("tenantId").setValue(this.selectedConfiguration.tenantId);

    this.modalRef = this.bsModalService.show(this.ssoModalTemplate, { class: "sso-modal" });
  }

  save(): void {
    if (this.formValid()) {
      const type = this.form.get("integrationType").value;
      const alias = this.form.get("alias").value.trim();
      const portalUrl = this.form.get("portalUrl").value.trim();
      const region = this.form.get("awsRegion").value;
      const browserOpening = this.form.get("defaultBrowserOpening").value;
      const tenantId = this.form.get("tenantId").value;

      console.log(type);

      if (this.modifying === 1) {
        // Save
        if (type !== IntegrationType.azure.toString()) {
          this.leappCoreService.awsSsoIntegrationService.createIntegration({ alias, browserOpening, portalUrl, region });
        } else {
          this.leappCoreService.repository.addAzureIntegration(alias, tenantId);
        }
      } else if (this.modifying === 2 && this.selectedConfiguration.portalUrl !== "") {
        // Edit
        // eslint-disable-next-line max-len
        if (type !== IntegrationType.azure.toString()) {
          this.leappCoreService.awsSsoIntegrationService.updateAwsSsoIntegration(this.selectedConfiguration.id, {
            alias,
            region,
            portalUrl,
            browserOpening,
          });
        } else {
          this.leappCoreService.repository.updateAzureIntegration(this.selectedConfiguration.id, alias, tenantId);
        }
      }

      this.ngZone.run(() => {
        this.setValues();
        this.behaviouralSubjectService.setIntegrations([
          ...this.leappCoreService.awsSsoIntegrationService.getIntegrations(),
          ...this.leappCoreService.repository.listAzureIntegrations(),
        ]);
      });
      this.modalRef.hide();
    } else {
      this.messageToasterService.toast("Form is not valid", ToastLevel.warn, "Form validation");
    }
  }

  delete(integration: Integration): void {
    // Ask for deletion
    // eslint-disable-next-line max-len
    this.windowService.confirmDialog(
      `Deleting this configuration will also logout from its sessions: do you want to proceed?`,
      async (res) => {
        if (res !== constants.confirmClosed) {
          // eslint-disable-next-line max-len
          this.loggingService.log(new LoggedEntry(`Removing sessions with attached config id: ${integration.id}`, this, LogLevel.info));
          await this.logout(integration.id);
          if (integration.type !== IntegrationType.azure.toString()) {
            this.leappCoreService.awsSsoIntegrationService.deleteIntegration(integration.id);
          } else {
            this.leappCoreService.repository.deleteAzureIntegration(integration.id);
          }
          this.modifying = 0;
        }
      },
      "Delete Configuration",
      "Cancel"
    );
  }

  remainingHours(integration: Integration): string {
    if (integration.type !== IntegrationType.azure) {
      return this.leappCoreService.awsSsoIntegrationService.remainingHours(integration as AwsSsoIntegration);
    } else {
      // Todo: add method for azure remaining time if necessary
      return "8hrs";
    }
  }

  formValid(): boolean {
    if (this.selectedIntegration !== IntegrationType.azure) {
      return this.form.get("alias").valid && this.form.get("portalUrl").valid && this.form.get("awsRegion").value !== null;
    } else {
      return this.form.get("alias").valid && this.form.get("tenantId").valid;
    }
  }

  allIntegrations() {
    return this.behaviouralSubjectService.integrations$.value;
  }

  private async isOnline(integration: Integration): Promise<boolean> {
    if (integration.type !== IntegrationType.azure) {
      return await this.leappCoreService.awsSsoIntegrationService.isOnline(integration as AwsSsoIntegration);
    } else {
      return true;
    }
  }
}

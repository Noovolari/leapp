import { Component, NgZone, OnDestroy, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren } from "@angular/core";
import { globalFilteredSessions } from "../command-bar/command-bar.component";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { BehaviorSubject } from "rxjs";
import { MatMenuTrigger } from "@angular/material/menu";
import { AwsSsoIntegration } from "@noovolari/leapp-core/models/aws-sso-integration";
import { constants } from "@noovolari/leapp-core/models/constants";
import { AppService } from "../../services/app.service";
import { BehaviouralSubjectService } from "@noovolari/leapp-core/services/behavioural-subject-service";
import { AwsSsoRoleService } from "@noovolari/leapp-core/services/session/aws/aws-sso-role-service";
import { AppProviderService } from "../../services/app-provider.service";
import { AwsSsoOidcService } from "@noovolari/leapp-core/services/aws-sso-oidc.service";
import { LoggerLevel, LoggingService } from "@noovolari/leapp-core/services/logging-service";
import { MessageToasterService, ToastLevel } from "../../services/message-toaster.service";
import { AwsSsoRoleSession } from "@noovolari/leapp-core/models/aws-sso-role-session";
import { WindowService } from "../../services/window.service";
import { sidebarHighlight } from "../side-bar/side-bar.component";
import { SegmentService } from "@noovolari/leapp-core/services/segment-service";
import { OptionsService } from "../../services/options.service";

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
    alias: new FormControl("", [Validators.required]),
    portalUrl: new FormControl("", [Validators.required, Validators.pattern("https?://.+")]),
    awsRegion: new FormControl("", [Validators.required]),
    defaultBrowserOpening: new FormControl("", [Validators.required]),
  });

  logoutLoadings: any;
  selectedIntegrations: SelectedIntegration[];
  modalRef: BsModalRef;
  menuX: number;
  menuY: number;

  private awsSsoRoleService: AwsSsoRoleService;
  private behaviouralSubjectService: BehaviouralSubjectService;
  private awsSsoOidcService: AwsSsoOidcService;
  private loggingService: LoggingService;
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
    this.loggingService = this.leappCoreService.loggingService;
    this.segmentService = this.leappCoreService.segmentService;
  }

  ngOnInit(): void {
    this.subscription = this.behaviouralSubjectService.integrations$.subscribe(() => {
      this.setValues();
      this.selectedIntegrations = this.awsSsoConfigurations.map((awsIntegration) => ({
        id: awsIntegration.id,
        selected: false,
      }));
    });
    this.behaviouralSubjectService.setIntegrations(this.leappCoreService.awsSsoIntegrationService.getIntegrations());

    this.subscription2 = openIntegrationEvent.subscribe((value) => {
      if (value) {
        this.gotoForm(1, this.selectedAwsSsoConfiguration);
      }
    });

    this.subscription3 = syncAllEvent.subscribe(async (value) => {
      if (value) {
        for (let i = 0; i < this.awsSsoConfigurations.length; i++) {
          const integration = this.awsSsoConfigurations[i];
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

  selectedSsoConfigurationCheck(awsSsoConfiguration: AwsSsoIntegration): string {
    const index = this.selectedIntegrations.findIndex((s) => s.id === awsSsoConfiguration.id);
    return this.selectedIntegrations[index].selected ? "selected-integration" : "";
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  applyContextMenu(index: number, awsSsoConfiguration: AwsSsoIntegration, event: any): void {
    event.preventDefault();
    event.stopPropagation();

    this.appService.closeAllMenuTriggers();

    this.selectedIntegrations.forEach((s) => (s.selected = false));

    const selectedIndex = this.selectedIntegrations.findIndex((s) => s.id === awsSsoConfiguration.id);
    this.selectedIntegrations[selectedIndex].selected = true;

    setTimeout(() => {
      this.menuY = event.layerY - 10;
      this.menuX = event.layerX - 10;

      this.triggers.get(index).openMenu();
      this.appService.setMenuTrigger(this.triggers.get(index));
    }, 100);
  }

  applySegmentFilter(awsSsoConfiguration: AwsSsoIntegration, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.selectedIntegrations.forEach((s) => (s.selected = false));

    sidebarHighlight.next({ showAll: false, showPinned: false });

    const selectedIndex = this.selectedIntegrations.findIndex((s) => s.id === awsSsoConfiguration.id);
    this.selectedIntegrations[selectedIndex].selected = true;
    document.querySelector(".sessions").classList.remove("option-bar-opened");
    globalFilteredSessions.next(
      this.behaviouralSubjectService.sessions.filter((s) => (s as AwsSsoRoleSession).awsSsoConfigurationId === awsSsoConfiguration.id)
    );
  }

  async logout(configurationId: string): Promise<void> {
    this.logoutLoadings[configurationId] = true;
    this.selectedAwsSsoConfiguration = this.leappCoreService.awsSsoIntegrationService.getIntegration(configurationId);
    this.leappCoreService.awsSsoIntegrationService.logout(this.selectedAwsSsoConfiguration.id);

    this.loadingInBrowser = false;
    this.loadingInApp = false;
    this.setValues();
  }

  async forceSync(integrationId: string): Promise<void> {
    this.selectedAwsSsoConfiguration = this.leappCoreService.awsSsoIntegrationService.getIntegration(integrationId);

    if (this.selectedAwsSsoConfiguration && !this.loadingInApp) {
      this.loadingInBrowser = this.selectedAwsSsoConfiguration.browserOpening === constants.inBrowser.toString();
      this.loadingInApp = this.selectedAwsSsoConfiguration.browserOpening === constants.inApp.toString();

      try {
        if (this.loadingInBrowser && !this.isOnline(this.selectedAwsSsoConfiguration)) {
          this.modalRef = this.bsModalService.show(this.ssoModalTemplate, { class: "sso-modal" });
        }

        await this.leappCoreService.awsSsoIntegrationService.syncSessions(integrationId);
      } catch (err) {
        this.awsSsoOidcService.interrupt();
        await this.logout(integrationId);
        this.loggingService.logger(`Error during SSO Login: ${err.toString()}`, LoggerLevel.error);
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
    this.logoutLoadings = {};
    this.awsSsoConfigurations.forEach((sc) => {
      this.logoutLoadings[sc.id] = false;
    });

    this.selectedAwsSsoConfiguration = {
      id: "new AWS Single Sign-On",
      alias: "",
      region: this.regions[0].region,
      portalUrl: "",
      browserOpening: constants.inApp,
      accessTokenExpiration: undefined,
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

  gotoForm(modifying: number, awsSsoIntegration: AwsSsoIntegration): void {
    // Change graphical values to show the form
    this.chooseIntegration = false;
    this.modifying = modifying;
    this.selectedAwsSsoConfiguration = awsSsoIntegration;

    if (modifying === 1) {
      this.selectedAwsSsoConfiguration = {
        id: "new AWS Single Sign-On",
        alias: "",
        region: this.regions[0].region,
        portalUrl: "",
        browserOpening: constants.inApp,
        accessTokenExpiration: undefined,
      };
    }

    this.form.get("alias").setValue(this.selectedAwsSsoConfiguration.alias);
    this.form.get("portalUrl").setValue(this.selectedAwsSsoConfiguration.portalUrl);
    this.form.get("awsRegion").setValue(this.selectedAwsSsoConfiguration.region);
    this.form.get("defaultBrowserOpening").setValue(this.selectedAwsSsoConfiguration.browserOpening);

    this.modalRef = this.bsModalService.show(this.ssoModalTemplate, { class: "sso-modal" });
  }

  save(): void {
    if (this.form.valid) {
      const alias = this.form.get("alias").value.trim();
      const portalUrl = this.form.get("portalUrl").value.trim();
      const region = this.form.get("awsRegion").value;
      const browserOpening = this.form.get("defaultBrowserOpening").value;

      if (this.modifying === 1) {
        // Save
        this.leappCoreService.awsSsoIntegrationService.createIntegration({ alias, browserOpening, portalUrl, region });
      } else if (this.modifying === 2 && this.selectedAwsSsoConfiguration.portalUrl !== "") {
        // Edit
        // eslint-disable-next-line max-len
        this.leappCoreService.awsSsoIntegrationService.updateAwsSsoIntegration(this.selectedAwsSsoConfiguration.id, {
          alias,
          region,
          portalUrl,
          browserOpening,
        });
      }
      this.ngZone.run(() => {
        this.setValues();
        this.behaviouralSubjectService.setIntegrations(this.leappCoreService.awsSsoIntegrationService.getIntegrations());
      });
      this.modalRef.hide();
    } else {
      this.messageToasterService.toast("Form is not valid", ToastLevel.warn, "Form validation");
    }
  }

  delete(awsSsoIntegration: AwsSsoIntegration): void {
    // Ask for deletion
    // eslint-disable-next-line max-len
    this.windowService.confirmDialog(
      `Deleting this configuration will also logout from its sessions: do you want to proceed?`,
      async (res) => {
        if (res !== constants.confirmClosed) {
          // eslint-disable-next-line max-len
          this.loggingService.logger(`Removing sessions with attached aws sso config id: ${awsSsoIntegration.id}`, LoggerLevel.info, this);
          await this.logout(awsSsoIntegration.id);
          this.leappCoreService.awsSsoIntegrationService.deleteIntegration(awsSsoIntegration.id);
          this.modifying = 0;
        }
      },
      "Delete Configuration",
      "Cancel"
    );
  }

  isOnline(awsSsoConfiguration: AwsSsoIntegration): boolean {
    return this.leappCoreService.awsSsoIntegrationService.isOnline(awsSsoConfiguration);
  }

  remainingHours(awsSsoConfiguration: AwsSsoIntegration): string {
    return this.leappCoreService.awsSsoIntegrationService.remainingHours(awsSsoConfiguration);
  }

  formValid(): boolean {
    return this.form.get("alias").valid && this.form.get("portalUrl").valid && this.form.get("awsRegion").value !== null;
  }
}

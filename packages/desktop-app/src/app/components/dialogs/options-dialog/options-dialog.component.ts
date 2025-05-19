import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { AppService } from "../../../services/app.service";
import { Router } from "@angular/router";
import { MatTabGroup } from "@angular/material/tabs";
import { constants } from "@noovolari/leapp-core/models/constants";
import { LoggedEntry, LogLevel } from "@noovolari/leapp-core/services/log-service";
import { MessageToasterService, ToastLevel } from "../../../services/message-toaster.service";
import { WindowService } from "../../../services/window.service";
import { AppProviderService } from "../../../services/app-provider.service";
import { BsModalService } from "ngx-bootstrap/modal";
import { CredentialProcessDialogComponent } from "../credential-process-dialog/credential-process-dialog.component";
import { OptionsService } from "../../../services/options.service";
import { AwsIamRoleFederatedSession } from "@noovolari/leapp-core/models/aws/aws-iam-role-federated-session";
import { SessionService } from "@noovolari/leapp-core/services/session/session-service";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { OperatingSystem } from "@noovolari/leapp-core/models/operating-system";
import { AppNativeService } from "../../../services/app-native.service";
import { PluginContainer } from "@noovolari/leapp-core/plugin-sdk/plugin-manager-service";
import { BillingPeriod, LeappProPreCheckoutDialogComponent } from "../leapp-pro-pre-checkout-dialog/leapp-pro-pre-checkout-dialog.component";
import { BehaviorSubject, Subscription } from "rxjs";
import { colorThemeSubject } from "../../check-icon-svg/check-icon-svg.component";

export enum LeappPlanStatus {
  free = "free",
  proPending = "proPending",
  proEnabled = "proEnabled",
  enterprise = "enterprise",
}

export const globalLeappProPlanStatus = new BehaviorSubject<LeappPlanStatus>(LeappPlanStatus.free);

@Component({
  selector: "app-options-dialog",
  templateUrl: "./options-dialog.component.html",
  styleUrls: ["./options-dialog.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class OptionsDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input()
  selectedIndex;

  @ViewChild("tabs", { static: false })
  tabGroup: MatTabGroup;

  eConstants = constants;
  eOperatingSystem = OperatingSystem;
  eBillingPeriod = BillingPeriod;

  awsProfileValue: { id: string; name: string };
  idpUrlValue;
  editingIdpUrl: boolean;
  editingAwsProfile: boolean;

  showProxyAuthentication = false;
  proxyProtocol = "https"; // Default
  proxyUrl;
  proxyPort = "8080"; // Default
  proxyUsername;
  proxyPassword;

  locations: { location: string }[];
  regions: { region: string }[];
  selectedLocation: string;
  selectedRegion: string;
  selectedRequirePassword: number;
  selectedTouchIdEnabled: boolean;
  selectedBrowserOpening = constants.inApp.toString();
  selectedTerminal;

  colorTheme: string;
  selectedColorTheme: string;

  pluginList: PluginContainer[];
  fetchingPlugins: boolean;

  selectedSsmRegionBehaviour: string;
  selectedPeriod: BillingPeriod = BillingPeriod.yearly;

  form = new FormGroup({
    idpUrl: new FormControl(""),
    awsProfile: new FormControl(""),
    proxyUrl: new FormControl(""),
    proxyProtocol: new FormControl(""),
    proxyPort: new FormControl(""),
    proxyUsername: new FormControl(""),
    proxyPassword: new FormControl(""),
    showAuthCheckbox: new FormControl(""),
    regionsSelect: new FormControl(""),
    locationsSelect: new FormControl(""),
    defaultBrowserOpening: new FormControl(""),
    terminalSelect: new FormControl(""),
    colorThemeSelect: new FormControl(""),
    credentialMethodSelect: new FormControl(""),
    sessionDuration: new FormControl(""),
    pluginDeepLink: new FormControl(""),
    ssmRegionBehaviourSelect: new FormControl(""),
    requirePasswordSelect: new FormControl(""),
    touchIdEnableSelect: new FormControl(""),
  });

  selectedCredentialMethod: string;
  webConsoleSessionDuration: number;

  extensionEnabled: boolean;

  eEnabledLeappPlanStatus = LeappPlanStatus;
  leappStatusSubscription: Subscription;
  leappPlanStatus;

  exporting: boolean;
  isUserSignedIn: boolean;
  signedInUserStateSubscription: Subscription;

  /* Simple profile page: shows the Idp Url and the workspace json */
  private sessionService: SessionService;

  constructor(
    public appProviderService: AppProviderService,
    public appService: AppService,
    private optionsService: OptionsService,
    private appNativeService: AppNativeService,
    private windowService: WindowService,
    private toasterService: MessageToasterService,
    private modalService: BsModalService,
    private router: Router
  ) {
    this.selectedTerminal = this.optionsService.macOsTerminal || constants.macOsTerminal;

    this.colorTheme = this.optionsService.colorTheme || constants.colorTheme;
    this.selectedColorTheme = this.colorTheme;

    this.selectedCredentialMethod = this.optionsService.credentialMethod || constants.credentialFile;

    this.selectedSsmRegionBehaviour = this.optionsService.ssmRegionBehaviour || constants.ssmRegionNo;

    this.selectedRequirePassword = this.optionsService.requirePassword || constants.requirePasswordEveryTwoWeeks.value;

    this.selectedTouchIdEnabled = this.optionsService.touchIdEnabled ?? constants.touchIdEnabled;

    this.extensionEnabled = this.optionsService.extensionEnabled || false;

    this.exporting = false;

    this.isUserSignedIn = false;
  }

  ngOnDestroy(): void {
    this.leappStatusSubscription?.unsubscribe();
    this.signedInUserStateSubscription?.unsubscribe();
  }

  async ngOnInit(): Promise<void> {
    this.fetchingPlugins = false;
    this.idpUrlValue = "";
    this.proxyProtocol = this.optionsService.proxyConfiguration.proxyProtocol;
    this.proxyUrl = this.optionsService.proxyConfiguration.proxyUrl;
    this.proxyPort = this.optionsService.proxyConfiguration.proxyPort;
    this.proxyUsername = this.optionsService.proxyConfiguration.username || "";
    this.proxyPassword = this.optionsService.proxyConfiguration.password || "";
    this.webConsoleSessionDuration = this.optionsService.samlRoleSessionDuration || constants.samlRoleSessionDuration;

    this.form.controls["idpUrl"].setValue(this.idpUrlValue);
    this.form.controls["proxyUrl"].setValue(this.proxyUrl);
    this.form.controls["proxyProtocol"].setValue(this.proxyProtocol);
    this.form.controls["proxyPort"].setValue(this.proxyPort);
    this.form.controls["proxyUsername"].setValue(this.proxyUsername);
    this.form.controls["proxyPassword"].setValue(this.proxyPassword);
    this.form.controls["sessionDuration"].setValue(`${this.webConsoleSessionDuration}`);

    const isProxyUrl = this.optionsService.proxyConfiguration.proxyUrl && this.optionsService.proxyConfiguration.proxyUrl !== "undefined";
    this.proxyUrl = isProxyUrl ? this.optionsService.proxyConfiguration.proxyUrl : "";

    if (this.proxyUsername || this.proxyPassword) {
      this.showProxyAuthentication = true;
    }

    this.regions = this.appProviderService.awsCoreService.getRegions();
    this.locations = this.appProviderService.azureCoreService.getLocations();
    this.selectedRegion = this.optionsService.defaultRegion || constants.defaultRegion;
    this.selectedLocation = this.optionsService.defaultLocation || constants.defaultLocation;

    this.appService.validateAllFormFields(this.form);

    this.pluginList = this.appProviderService.pluginManagerService.pluginContainers;

    this.selectedSsmRegionBehaviour = this.optionsService.ssmRegionBehaviour || constants.ssmRegionNo;

    this.leappStatusSubscription = globalLeappProPlanStatus.subscribe((value) => (this.leappPlanStatus = value));

    try {
      const plan = await this.appProviderService.keychainService.getSecret("Leapp", "leapp-enabled-plan");
      if (plan) {
        globalLeappProPlanStatus.next(plan as unknown as LeappPlanStatus);
      } else {
        globalLeappProPlanStatus.next(LeappPlanStatus.free);
      }
    } catch (err) {
      globalLeappProPlanStatus.next(LeappPlanStatus.free);
    }

    const selectedWorkspace = this.appProviderService.teamService.workspacesState.getValue().find((workspaceState) => workspaceState.selected);
    this.isUserSignedIn = selectedWorkspace.name !== constants.localWorkspaceName;
  }

  ngAfterViewInit(): void {
    if (this.selectedIndex) {
      this.tabGroup.selectedIndex = this.selectedIndex;
    }
  }

  setColorTheme(theme: string): void {
    this.optionsService.colorTheme = theme;
    this.colorTheme = this.optionsService.colorTheme;
    this.selectedColorTheme = this.colorTheme;
    if (this.colorTheme === constants.darkTheme) {
      colorThemeSubject.next(true);
      document.querySelector("body").classList.add("dark-theme");
    } else if (this.colorTheme === constants.lightTheme) {
      colorThemeSubject.next(false);
      document.querySelector("body").classList.remove("dark-theme");
    } else if (this.colorTheme === constants.systemDefaultTheme) {
      colorThemeSubject.next(true);
      document.querySelector("body").classList.toggle("dark-theme", this.appService.isDarkMode());
    }
  }

  /**
   * Save the idp-url again
   */
  async saveOptions(): Promise<void> {
    if (this.form.valid) {
      this.optionsService.updateProxyConfiguration({
        proxyUrl: this.form.controls["proxyUrl"].value,
        proxyProtocol: this.form.controls["proxyProtocol"].value,
        proxyPort: this.form.controls["proxyPort"].value,
        username: this.form.controls["proxyUsername"].value,
        password: this.form.controls["proxyPassword"].value,
      });

      this.optionsService.defaultRegion = this.selectedRegion;
      this.optionsService.defaultLocation = this.selectedLocation;
      this.optionsService.macOsTerminal = this.selectedTerminal;
      this.optionsService.samlRoleSessionDuration = parseInt(this.form.controls["sessionDuration"].value, 10);

      const previousRequirePassword = this.optionsService.requirePassword;
      if (previousRequirePassword !== this.selectedRequirePassword) {
        const keychainItem = await this.appProviderService.keychainService.getSecret(constants.appName, constants.touchIdKeychainItemName);
        if (keychainItem) {
          const updatedRequirePassword = JSON.parse(keychainItem);
          updatedRequirePassword.nextExpiration = new Date().setDate(new Date().getDate() + this.selectedRequirePassword);
          await this.appProviderService.keychainService.saveSecret(
            constants.appName,
            constants.touchIdKeychainItemName,
            JSON.stringify(updatedRequirePassword)
          );
        }
      }

      this.optionsService.requirePassword = this.selectedRequirePassword;
      this.optionsService.touchIdEnabled = (this.form.controls["touchIdEnableSelect"].value as any) === true;

      this.optionsService.ssmRegionBehaviour = this.selectedSsmRegionBehaviour;

      if (this.checkIfNeedDialogBox()) {
        // eslint-disable-next-line max-len
        this.windowService.confirmDialog(
          "You've set a proxy url: the app must be restarted to update the configuration.",
          (res) => {
            if (res !== constants.confirmClosed) {
              // eslint-disable-next-line max-len
              this.appProviderService.logService.log(
                new LoggedEntry("User have set a proxy url: the app must be restarted to update the configuration.", this, LogLevel.info)
              );
              this.appService.restart();
            }
          },
          "Restart",
          "Cancel"
        );
      } else {
        this.appService.closeModal();
        this.appProviderService.logService.log(
          new LoggedEntry("Option saved.", this, LogLevel.info, false, JSON.stringify(this.form.getRawValue(), null, 3))
        );
        this.toasterService.toast("Option saved.", ToastLevel.info, "Options");
      }
    }
  }

  /**
   * Check if we need a dialog box to request restarting the application
   */
  checkIfNeedDialogBox(): boolean {
    return (
      this.form.controls["proxyUrl"].value !== undefined &&
      this.form.controls["proxyUrl"].value !== null &&
      (this.form.controls["proxyUrl"].dirty ||
        this.form.controls["proxyProtocol"].dirty ||
        this.form.controls["proxyPort"].dirty ||
        this.form.controls["proxyUsername"].dirty ||
        this.form.controls["proxyPassword"].dirty)
    );
  }

  /**
   * Return to home screen
   */
  goBack(): void {
    this.router.navigate(["/dashboard"]).then(() => {});
  }

  manageIdpUrl(id: string): void {
    const idpUrl = this.appProviderService.idpUrlService.getIdpUrl(id);
    const validate = this.appProviderService.idpUrlService.validateIdpUrl(this.form.get("idpUrl").value);
    if (validate === true) {
      if (!idpUrl) {
        this.appProviderService.idpUrlService.createIdpUrl(this.form.get("idpUrl").value);
      } else {
        this.appProviderService.idpUrlService.editIdpUrl(id, this.form.get("idpUrl").value);
      }
    }
    this.editingIdpUrl = false;
    this.idpUrlValue = undefined;
    this.form.get("idpUrl").setValue("");
  }

  editIdpUrl(id: string): void {
    const idpUrl = this.appProviderService.idpUrlService.getIdpUrls().filter((u) => u.id === id)[0];
    this.idpUrlValue = idpUrl;
    this.form.get("idpUrl").setValue(idpUrl.url);
    this.editingIdpUrl = true;
  }

  deleteIdpUrl(id: string): void {
    const sessions = this.appProviderService.idpUrlService.getDependantSessions(id);

    // Get only names for display
    let sessionsNames = sessions.map(
      (s) =>
        `<li>
            <div class="removed-sessions">
            <b>${s.sessionName}</b> - <small>${(s as AwsIamRoleFederatedSession).roleArn.split("/")[1]}</small>
            </div>
      </li>`
    );

    if (sessionsNames.length === 0) {
      sessionsNames = ["<li><b>no sessions</b></li>"];
    }

    // Ask for deletion
    // eslint-disable-next-line max-len
    this.windowService.confirmDialog(
      `Deleting this IdP URL will also remove these sessions: <br><ul>${sessionsNames.join("")}</ul>Do you want to proceed?`,
      (res) => {
        if (res !== constants.confirmClosed) {
          this.appProviderService.logService.log(new LoggedEntry(`Removing idp url with id: ${id}`, this, LogLevel.info));

          sessions.forEach((session) => {
            this.appProviderService.sessionManagementService.deleteSession(session.sessionId);
            this.appProviderService.behaviouralSubjectService.setSessions(this.appProviderService.sessionManagementService.getSessions());
          });
          this.appProviderService.idpUrlService.deleteIdpUrl(id);
        }
      },
      "Delete IdP URL",
      "Cancel"
    );
  }

  async manageAwsProfile(id: string | number): Promise<void> {
    const profileIndex = this.appProviderService.namedProfileService.getNamedProfiles().findIndex((p) => p.id === id.toString());

    const validate = this.appProviderService.namedProfileService.validateNewProfileName(this.form.get("awsProfile").value);
    if (validate === true) {
      if (profileIndex === -1) {
        this.appProviderService.namedProfileService.createNamedProfile(this.form.get("awsProfile").value);
      } else {
        this.appProviderService.namedProfileService.editNamedProfile(id.toString(), this.form.get("awsProfile").value);

        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < this.appProviderService.behaviouralSubjectService.sessions.length; i++) {
          const sess = this.appProviderService.behaviouralSubjectService.sessions[i];
          this.sessionService = this.appProviderService.sessionFactory.getSessionService(sess.type);

          if ((sess as any).profileId === id.toString()) {
            if ((sess as any).status === SessionStatus.active) {
              await this.sessionService.stop(sess.sessionId);
              await this.sessionService.start(sess.sessionId);
            }
          }
        }
      }
    } else {
      this.toasterService.toast(validate.toString(), ToastLevel.warn);
    }

    this.editingAwsProfile = false;
    this.awsProfileValue = undefined;
    this.form.get("awsProfile").setValue("");
  }

  editAwsProfile(id: string): void {
    const profile = this.appProviderService.namedProfileService.getNamedProfiles(false).filter((u) => u.id === id)[0];
    this.awsProfileValue = profile;
    this.form.get("awsProfile").setValue(profile.name);
    this.editingAwsProfile = true;
  }

  deleteAwsProfile(id: string): void {
    // With profile
    const sessions = this.appProviderService.sessionManagementService.getSessions().filter((sess) => (sess as any).profileId === id);

    // Get only names for display
    let sessionsNames = sessions.map(
      (s) =>
        `<li><div class="removed-sessions"><b>${s.sessionName}</b> - <small>${
          (s as AwsIamRoleFederatedSession).roleArn ? (s as AwsIamRoleFederatedSession).roleArn.split("/")[1] : ""
        }</small></div></li>`
    );
    if (sessionsNames.length === 0) {
      sessionsNames = ["<li><b>no sessions</b></li>"];
    }

    // Ask for deletion
    // eslint-disable-next-line max-len
    this.windowService.confirmDialog(
      `Deleting this profile will set default to these sessions: <br><ul>${sessionsNames.join("")}</ul>Do you want to proceed?`,
      async (res) => {
        if (res !== constants.confirmClosed) {
          this.appProviderService.logService.log(new LoggedEntry(`Reverting to default profile with id: ${id}`, this, LogLevel.info));

          // Reverting all sessions to default profile
          // eslint-disable-next-line @typescript-eslint/prefer-for-of
          for (let i = 0; i < sessions.length; i++) {
            this.sessionService = this.appProviderService.sessionFactory.getSessionService(sessions[i].type);

            let wasActive = false;
            if ((sessions[i] as any).status === SessionStatus.active) {
              wasActive = true;
              await this.sessionService.stop(sessions[i].sessionId);
            }

            (sessions[i] as any).profileId = this.appProviderService.workspaceService.getDefaultProfileId();
            this.appProviderService.sessionManagementService.updateSession(sessions[i].sessionId, sessions[i]);
            this.appProviderService.behaviouralSubjectService.setSessions(this.appProviderService.sessionManagementService.getSessions());
            if (wasActive) {
              this.sessionService.start(sessions[i].sessionId);
            }
          }

          this.appProviderService.namedProfileService.deleteNamedProfile(id);
        }
      },
      "Delete Profile",
      "Cancel"
    );
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  openBrowser(url: string) {
    this.windowService.openExternalUrl(url);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async showWarningModalForCredentialProcess() {
    const workspace = this.appProviderService.workspaceService.getWorkspace();
    if (this.selectedCredentialMethod === constants.credentialProcess) {
      const confirmText = "I acknowledge it";
      const callback = async (answerString: string) => {
        if (answerString === constants.confirmed.toString()) {
          workspace.credentialMethod = this.selectedCredentialMethod;
          this.appProviderService.workspaceService.persistWorkspace(workspace);
          // Create Config file if missing
          if (!this.appProviderService.fileService.existsSync(this.appProviderService.awsCoreService.awsConfigPath())) {
            this.appProviderService.fileService.writeFileSync(this.appProviderService.awsCoreService.awsConfigPath(), "");
          }
          // When selecting this one we need to clean the credential file and create a backup
          if (this.appProviderService.fileService.existsSync(this.appProviderService.awsCoreService.awsCredentialPath())) {
            this.appProviderService.fileService.writeFileSync(
              this.appProviderService.awsCoreService.awsBkpCredentialPath(),
              this.appProviderService.fileService.readFileSync(this.appProviderService.awsCoreService.awsCredentialPath())
            );
          }
          this.appProviderService.fileService.writeFileSync(this.appProviderService.awsCoreService.awsCredentialPath(), "");
        } else {
          this.selectedCredentialMethod = constants.credentialFile;
        }

        workspace.credentialMethod = this.selectedCredentialMethod;
        this.appProviderService.workspaceService.persistWorkspace(workspace);

        // Now we need to check for started sessions and restart them
        const activeSessions = this.appProviderService.sessionManagementService.getActiveSessions();
        for (let i = 0; i < activeSessions.length; i++) {
          const sessionService = this.appProviderService.sessionFactory.getSessionService(activeSessions[i].type);
          await sessionService.stop(activeSessions[i].sessionId);
          await sessionService.start(activeSessions[i].sessionId);
        }
      };

      this.modalService.show(CredentialProcessDialogComponent, {
        animated: false,
        initialState: {
          callback,
          confirmText,
        },
      });
    } else {
      workspace.credentialMethod = this.selectedCredentialMethod;
      this.appProviderService.workspaceService.persistWorkspace(workspace);
      // backup config file and delete normal one
      if (this.appProviderService.fileService.existsSync(this.appProviderService.awsCoreService.awsConfigPath())) {
        this.appProviderService.fileService.writeFileSync(
          this.appProviderService.awsCoreService.awsBkpConfigPath(),
          this.appProviderService.fileService.readFileSync(this.appProviderService.awsCoreService.awsConfigPath())
        );
        this.appProviderService.fileService.writeFileSync(this.appProviderService.awsCoreService.awsConfigPath(), "");
      }

      // Now we need to check for started sessions and restart them
      const activeSessions = this.appProviderService.sessionManagementService.getActiveSessions();
      for (let i = 0; i < activeSessions.length; i++) {
        const sessionService = this.appProviderService.sessionFactory.getSessionService(activeSessions[i].type);
        await sessionService.stop(activeSessions[i].sessionId);
        await sessionService.start(activeSessions[i].sessionId);
      }
    }
  }

  async installPlugin(): Promise<void> {
    this.fetchingPlugins = true;
    if (this.form.controls.pluginDeepLink.value) {
      try {
        await this.appProviderService.pluginManagerService.installPlugin(this.form.controls.pluginDeepLink.value);
        await this.refreshPluginList();
      } catch (error) {
        this.appProviderService.logService.log(new LoggedEntry(error.message, this, LogLevel.error, true));
      }
    }
    this.fetchingPlugins = false;
  }

  async refreshPluginList(isRefreshingFromAction?: boolean): Promise<void> {
    this.fetchingPlugins = true;
    this.appProviderService.pluginManagerService.verifyAndGeneratePluginFolderIfMissing();
    await this.appProviderService.pluginManagerService.loadFromPluginDir();
    this.pluginList = this.appProviderService.pluginManagerService.pluginContainers;
    if (isRefreshingFromAction) {
      this.appProviderService.logService.log(new LoggedEntry("Plugins refreshed", this, LogLevel.info, true));
    }
    this.fetchingPlugins = false;
  }

  togglePluginActivation(plugin: PluginContainer): void {
    plugin.metadata.active = !plugin.metadata.active;
    const status = this.appProviderService.repository.getPluginStatus(plugin.metadata.uniqueName);
    status.active = plugin.metadata.active;
    this.appProviderService.repository.setPluginStatus(plugin.metadata.uniqueName, status);
  }

  getPluginExtraInfo(plugin: PluginContainer): string {
    return `Author: ${plugin.metadata.author}
    Description: ${plugin.metadata.description}
    Supported Sessions: ${plugin.metadata.supportedSessions.join(",")}`;
  }

  getSupportedOsIcons(plugin: PluginContainer): string {
    const supportedOS = plugin.metadata.supportedOS;
    const icon1 = `<i class="fa fa-apple ${supportedOS.includes(OperatingSystem.mac) ? "" : "bw"}"></i>`;
    const icon2 = `<i class="fa fa-windows ${supportedOS.includes(OperatingSystem.windows) ? "" : "bw"}"></i>`;
    const icon3 = `<i class="fa fa-linux ${supportedOS.includes(OperatingSystem.linux) ? "" : "bw"}"></i>`;
    return `${icon1}&nbsp;${icon2}&nbsp;${icon3}`;
  }

  openPluginFolder(): void {
    this.appProviderService.pluginManagerService.verifyAndGeneratePluginFolderIfMissing();
    this.appNativeService.shell.showItemInFolder(this.appNativeService.path.join(this.appNativeService.os.homedir(), ".Leapp", "plugins"));
  }

  toggleExtension(): void {
    this.extensionEnabled = !this.extensionEnabled;
    this.optionsService.extensionEnabled = this.extensionEnabled;
  }

  openLeappProPreCheckoutDialog(): void {
    this.modalService.show(LeappProPreCheckoutDialogComponent, { animated: false, class: "pre-checkout-modal", backdrop: "static", keyboard: false });
  }

  setBillingPeriod(): void {
    this.selectedPeriod = this.selectedPeriod === BillingPeriod.yearly ? BillingPeriod.monthly : BillingPeriod.yearly;
  }

  async contactSupport(): Promise<void> {
    const email = await this.appProviderService.keychainService.getSecret("Leapp", "leapp-enabled-plan-email");
    this.windowService.openExternalUrl(`mailto:support@noovolari.com?subject=Leapp%20Sign-up%20support%20request%20${email}`);
  }

  contactSales(): void {
    this.windowService.openExternalUrl("https://www.leapp.cloud/solutions/business");
  }

  async exportProWorkspace(): Promise<void> {
    this.exporting = true;
    await this.appProviderService.teamService.exportProWorkspace();
    await new Promise((resolve, _reject) => {
      setTimeout(resolve, 2000);
    });
    this.exporting = false;
  }
}

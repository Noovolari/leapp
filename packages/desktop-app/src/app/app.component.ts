import { Component, OnInit } from "@angular/core";
import { RemoteProceduresServer } from "@noovolari/leapp-core/services/remote-procedures-server";
import { environment } from "../environments/environment";
import { AppService } from "./services/app.service";
import { Router } from "@angular/router";
import { setTheme } from "ngx-bootstrap/utils";
import { AppMfaCodePromptService } from "./services/app-mfa-code-prompt.service";
import { AppAwsAuthenticationService } from "./services/app-aws-authentication.service";
import { UpdaterService } from "./services/updater.service";
import compareVersions from "compare-versions";
import { LoggedEntry, LogLevel, LogService } from "@noovolari/leapp-core/services/log-service";
import { BehaviouralSubjectService } from "@noovolari/leapp-core/services/behavioural-subject-service";
import { TimerService } from "@noovolari/leapp-core/services/timer-service";
import { constants } from "@noovolari/leapp-core/models/constants";
import { FileService } from "@noovolari/leapp-core/services/file-service";
import { AwsCoreService } from "@noovolari/leapp-core/services/aws-core-service";
import { RetroCompatibilityService } from "@noovolari/leapp-core/services/retro-compatibility-service";
import { AppProviderService } from "./services/app-provider.service";
import { SessionFactory } from "@noovolari/leapp-core/services/session-factory";
import { RotationService } from "@noovolari/leapp-core/services/rotation-service";
import { AppVerificationWindowService } from "./services/app-verification-window.service";
import { WindowService } from "./services/window.service";
import { AppNativeService } from "./services/app-native.service";
import { AwsSsoIntegrationService } from "@noovolari/leapp-core/services/integration/aws-sso-integration-service";
import { AwsSsoRoleService } from "@noovolari/leapp-core/services/session/aws/aws-sso-role-service";
import { OptionsService } from "./services/options.service";
import { IntegrationIsOnlineStateRefreshService } from "@noovolari/leapp-core/services/integration/integration-is-online-state-refresh-service";
import { AzureSessionService } from "@noovolari/leapp-core/services/session/azure/azure-session-service";
import { AzureCoreService } from "@noovolari/leapp-core/services/azure-core-service";
import { PluginManagerService } from "@noovolari/leapp-core/plugin-sdk/plugin-manager-service";
import { ExtensionWebsocketService } from "./services/extension-websocket.service";
import { TeamService, Role } from "./services/team-service";
import { AnalyticsService } from "./services/analytics.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  isSyncingWorkspace: boolean;
  fetchingState: string | undefined;

  private fileService: FileService;
  private awsCoreService: AwsCoreService;
  private loggingService: LogService;
  private timerService: TimerService;
  private sessionServiceFactory: SessionFactory;
  private behaviouralSubjectService: BehaviouralSubjectService;
  private retroCompatibilityService: RetroCompatibilityService;
  private rotationService: RotationService;
  private awsSsoIntegrationService: AwsSsoIntegrationService;
  private awsSsoRoleService: AwsSsoRoleService;
  private remoteProceduresServer: RemoteProceduresServer;
  private integrationIsOnlineStateRefreshService: IntegrationIsOnlineStateRefreshService;
  private azureSessionService: AzureSessionService;
  private azureCoreService: AzureCoreService;
  private pluginManagerService: PluginManagerService;
  private teamService: TeamService;

  /* Main app file: launches the Angular framework inside Electron app */
  constructor(
    public appProviderService: AppProviderService,
    public mfaCodePrompter: AppMfaCodePromptService,
    public awsAuthenticationService: AppAwsAuthenticationService,
    public verificationWindowService: AppVerificationWindowService,
    public appService: AppService,
    public router: Router,
    private optionsService: OptionsService,
    private updaterService: UpdaterService,
    private windowService: WindowService,
    private appNativeService: AppNativeService,
    private extensionWebsocketService: ExtensionWebsocketService,
    private analyticsService: AnalyticsService
  ) {
    appProviderService.mfaCodePrompter = mfaCodePrompter;
    appProviderService.awsAuthenticationService = awsAuthenticationService;
    appProviderService.verificationWindowService = verificationWindowService;
    appProviderService.windowService = windowService;

    this.fileService = appProviderService.fileService;
    this.awsCoreService = appProviderService.awsCoreService;
    this.loggingService = appProviderService.logService;
    this.timerService = appProviderService.timerService;
    this.sessionServiceFactory = appProviderService.sessionFactory;
    this.behaviouralSubjectService = appProviderService.behaviouralSubjectService;
    this.retroCompatibilityService = appProviderService.retroCompatibilityService;
    this.rotationService = appProviderService.rotationService;
    this.awsSsoIntegrationService = appProviderService.awsSsoIntegrationService;
    this.awsSsoRoleService = appProviderService.awsSsoRoleService;
    this.remoteProceduresServer = appProviderService.remoteProceduresServer;
    this.integrationIsOnlineStateRefreshService = appProviderService.integrationIsOnlineStateRefreshService;
    this.azureSessionService = appProviderService.azureSessionService;
    this.azureCoreService = appProviderService.azureCoreService;
    this.pluginManagerService = appProviderService.pluginManagerService;
    this.teamService = appProviderService.teamService;

    this.setInitialColorSchema();
    this.setColorSchemaChangeEventListener();
  }

  async ngOnInit(): Promise<void> {
    this.awsSsoRoleService.setAwsIntegrationDelegate(this.awsSsoIntegrationService);

    // We get the right moment to set an hook to app close
    const ipcRenderer = this.appNativeService.ipcRenderer;
    ipcRenderer.on("app-close", () => {
      this.loggingService.log(new LoggedEntry("Preparing for closing instruction...", this, LogLevel.info));
      this.beforeCloseInstructions();
    });

    ipcRenderer.on("select-all", () => {
      if (document.activeElement.tagName === "INPUT" && document.activeElement.attributes.getNamedItem("type").value === "text") {
        (document.activeElement as HTMLInputElement).select();
      }
    });

    // Use ngx bootstrap 4
    setTheme("bs4");

    if (environment.production) {
      // Clear both info and warn message in production
      // mode without removing them from code actually
      console.warn = () => {};
      console.log = () => {};
    }

    // Prevent Dev Tool to show on production mode
    // this.windowService.getCurrentWindow().webContents.openDevTools();
    this.windowService.blockDevToolInProductionMode();

    // Create folders and files if missing
    this.updaterService.createFoldersIfMissing();

    // Before retrieving an actual copy of the workspace we
    // check and in case apply, our retro compatibility service
    await this.retroCompatibilityService.applyWorkspaceMigrations();

    // Check the existence of a pre-Leapp credential file and make a backup
    this.showCredentialBackupMessageIfNeeded();

    // All sessions start stopped when app is launched
    if (this.behaviouralSubjectService.sessions.length > 0) {
      for (let i = 0; i < this.behaviouralSubjectService.sessions.length; i++) {
        const concreteSessionService = this.sessionServiceFactory.getSessionService(this.behaviouralSubjectService.sessions[i].type);
        await concreteSessionService.stop(this.behaviouralSubjectService.sessions[i].sessionId);
      }
    }

    // Start Global Timer
    this.timerService.start(() => this.timerFunction(this.rotationService, this.integrationIsOnlineStateRefreshService));

    // Launch Auto Updater Routines
    this.manageAutoUpdate();

    if (!constants.disablePluginSystem) {
      this.appProviderService.pluginManagerService.verifyAndGeneratePluginFolderIfMissing();
      await this.appProviderService.pluginManagerService.loadFromPluginDir();
      this.loggingService.log(
        new LoggedEntry(`Loaded plugins...\n\n${this.appProviderService.pluginManagerService.pluginContainers}`, this, LogLevel.info)
      );
    }

    let teamMemberEmail;
    let teamMemberFirstName;
    let teamMemberLastName;
    let teamMemberTeamName;

    // Deep link with app closed
    if (this.fileService.existsSync(this.appNativeService.path.join(this.appNativeService.os.homedir(), environment.deeplinkFile))) {
      try {
        const deepLink = this.fileService.readFileSync(this.appNativeService.path.join(this.appNativeService.os.homedir(), environment.deeplinkFile));
        if (this.isOpenLeappDeepLink(deepLink)) {
          const afterQuestionMark = deepLink.split("?")[1];
          const splitByAmpersand = afterQuestionMark.split("&");
          teamMemberEmail = splitByAmpersand[0].split("=")[1];
          teamMemberFirstName = decodeURIComponent(splitByAmpersand[1].split("=")[1]);
          teamMemberLastName = decodeURIComponent(splitByAmpersand[2].split("=")[1]);
          teamMemberTeamName = decodeURIComponent(splitByAmpersand[3].split("=")[1]);
        } else if (!constants.disablePluginSystem) {
          await this.pluginManagerService.installPlugin(deepLink);
          await this.pluginManagerService.loadFromPluginDir();
        }
      } catch (err) {
        this.loggingService.log(new LoggedEntry(`Error in install plugin from file: ${err.toString()}`, this, LogLevel.info));
      } finally {
        this.appNativeService.fs.removeSync(this.appNativeService.path.join(this.appNativeService.os.homedir(), environment.deeplinkFile));
      }
    }

    this.teamService.syncingWorkspaceState.subscribe((isSyncingWorkspace: boolean) => (this.isSyncingWorkspace = isSyncingWorkspace));

    this.behaviouralSubjectService.fetchingIntegrationState$.subscribe((fetchingState: string | undefined) => {
      this.fetchingState = fetchingState;
    });

    // Check the existence of a current-workspace key in the system keychain and
    // load the corresponding workspace
    await this.teamService.setCurrentWorkspace();

    // Go to initial page if no sessions are already created or
    // go to the list page if is your second visit.
    // If there is a pro user registered go to login page instead
    const userRole = this.teamService.signedInUserState.getValue()?.role;
    if (userRole === Role.pro || userRole === Role.user || userRole === Role.manager || teamMemberEmail !== undefined) {
      if (userRole === Role.pro || ((userRole === Role.user || userRole === Role.manager) && teamMemberEmail === undefined)) {
        await this.router.navigate(["/lock"]);
      } else if (
        teamMemberEmail !== undefined &&
        teamMemberFirstName !== undefined &&
        teamMemberLastName !== undefined &&
        teamMemberTeamName !== undefined
      ) {
        await this.router.navigate(["/lock"], { queryParams: { teamMemberEmail, teamMemberFirstName, teamMemberLastName, teamMemberTeamName } });
      }
    } else {
      this.analyticsService.init(this.teamService.signedInUserState.getValue());
      await this.router.navigate(["/dashboard"]);
    }

    // Start the websocket server for the Leapp Browser Extension
    this.extensionWebsocketService.bootstrap();

    (async (): Promise<void> => this.remoteProceduresServer.startServer())();
  }

  closeAllRightClickMenus(): void {
    this.appService.closeAllMenuTriggers();
  }

  private timerFunction(rotationService: RotationService, integrationIsOnlineStateRefreshService: IntegrationIsOnlineStateRefreshService): void {
    rotationService.rotate();
    integrationIsOnlineStateRefreshService.refreshIsOnlineState();
  }

  /**
   * This is an hook on the closing app to remove credential file and force stop using them
   */
  private async beforeCloseInstructions() {
    // Check if we are here
    this.loggingService.log(new LoggedEntry("Closing app with cleaning process...", this, LogLevel.info));

    this.remoteProceduresServer.stopServer();

    // Stop all the sessions
    await this.appProviderService.sessionManagementService.stopAllSessions();

    // Lock team-workspace before exit, to properly save global settings
    await this.teamService.signOut(true);

    // Finally quit
    this.appService.quit();
  }

  /**
   * Show that we created a copy of original credential file if present in the system
   */
  private showCredentialBackupMessageIfNeeded() {
    // TODO: move this logic inside a service
    const oldAwsCredentialsPath = this.fileService.homeDir() + "/" + constants.credentialsDestination;
    const newAwsCredentialsPath = oldAwsCredentialsPath + ".leapp.bkp";
    const check =
      this.behaviouralSubjectService.sessions.length === 0 &&
      this.fileService.existsSync(oldAwsCredentialsPath) &&
      !this.fileService.existsSync(newAwsCredentialsPath);

    this.loggingService.log(new LoggedEntry(`Check existing credential file: ${check}`, this, LogLevel.info));

    if (check) {
      this.fileService.renameSync(oldAwsCredentialsPath, newAwsCredentialsPath);
      this.fileService.writeFileSyncWithOptions(oldAwsCredentialsPath, "", { mode: "600" });
      this.appService.getDialog().showMessageBox({
        type: "info",
        icon: __dirname + "/assets/images/Leapp.png",
        // eslint-disable-next-line max-len
        message: "You had a previous credential file. We made a backup of the old one in the same directory before starting.",
      });
    } else if (!this.fileService.existsSync(this.awsCoreService.awsCredentialPath())) {
      this.fileService.writeFileSyncWithOptions(this.awsCoreService.awsCredentialPath(), "", { mode: "600" });
    }
  }

  /**
   * Launch Updater process
   *
   * @private
   */
  private manageAutoUpdate(): void {
    let savedVersion;

    try {
      savedVersion = this.updaterService.getSavedAppVersion();
    } catch (error) {
      savedVersion = this.updaterService.getCurrentAppVersion();
    }

    try {
      if (compareVersions(savedVersion, this.updaterService.getCurrentAppVersion()) <= 0) {
        // We always need to maintain this order: fresh <= saved <= online
        this.updaterService.updateVersionJson(this.updaterService.getCurrentAppVersion());
      }
    } catch (error) {
      this.updaterService.updateVersionJson(this.updaterService.getCurrentAppVersion());
    }

    const ipc = this.appNativeService.ipcRenderer;
    ipc.on("UPDATE_AVAILABLE", async (_, info) => {
      const releaseNote = await this.updaterService.getReleaseNote();
      this.updaterService.setUpdateInfo(info.version, info.releaseName, info.releaseDate, releaseNote);
      if (this.updaterService.isUpdateNeeded()) {
        this.updaterService.updateDialog();
        this.behaviouralSubjectService.sessions = [...this.behaviouralSubjectService.sessions];
        this.appProviderService.sessionManagementService.updateSessions(this.behaviouralSubjectService.sessions);
      }
    });

    ipc.on("PLUGIN_URL", (_, url) => {
      if (this.isOpenLeappDeepLink(url)) {
        const afterQuestionMark = url.split("?")[1];
        const splitByAmpersand = afterQuestionMark.split("&");
        const teamMemberEmail = splitByAmpersand[0].split("=")[1];
        const teamMemberFirstName = decodeURIComponent(splitByAmpersand[1].split("=")[1]);
        const teamMemberLastName = decodeURIComponent(splitByAmpersand[2].split("=")[1]);
        const teamMemberTeamName = decodeURIComponent(splitByAmpersand[3].split("=")[1]);
        if (teamMemberEmail) {
          this.router.navigate(["/lock"], { queryParams: { teamMemberEmail, teamMemberFirstName, teamMemberLastName, teamMemberTeamName } });
        }
      } else if (!constants.disablePluginSystem) {
        this.pluginManagerService.installPlugin(url);
      }
    });
  }

  private setInitialColorSchema() {
    if (this.appProviderService.workspaceService.workspaceExists()) {
      const colorTheme = this.optionsService.colorTheme || constants.colorTheme;
      this.optionsService.colorTheme = this.optionsService.colorTheme || constants.colorTheme;
      if (colorTheme === constants.darkTheme) {
        document.querySelector("body").classList.add("dark-theme");
      } else if (colorTheme === constants.lightTheme) {
        document.querySelector("body").classList.remove("dark-theme");
      } else if (colorTheme === constants.systemDefaultTheme) {
        if (this.appService.isDarkMode()) {
          document.querySelector("body").classList.add("dark-theme");
        } else {
          document.querySelector("body").classList.remove("dark-theme");
        }
      }
    }
  }

  private setColorSchemaChangeEventListener() {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (this.optionsService.colorTheme === constants.systemDefaultTheme) {
        if (this.appService.isDarkMode()) {
          document.querySelector("body").classList.add("dark-theme");
        } else {
          document.querySelector("body").classList.remove("dark-theme");
        }
      }
    });
  }

  private isOpenLeappDeepLink(deepLinkUrl: string): boolean {
    return deepLinkUrl.indexOf("01255ef8-open-leapp?email=") > -1;
  }
}

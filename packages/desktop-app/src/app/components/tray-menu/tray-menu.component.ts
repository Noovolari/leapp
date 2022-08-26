import { Component, OnDestroy, OnInit } from "@angular/core";
import { AppService } from "../../services/app.service";
import { environment } from "../../../environments/environment";
import { UpdaterService } from "../../services/updater.service";
import { AppProviderService } from "../../services/app-provider.service";
import { BehaviouralSubjectService } from "@noovolari/leapp-core/services/behavioural-subject-service";
import { SessionFactory } from "@noovolari/leapp-core/services/session-factory";
import { Session } from "@noovolari/leapp-core/models/session";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { AwsIamRoleFederatedSession } from "@noovolari/leapp-core/models/aws/aws-iam-role-federated-session";
import { AwsIamRoleChainedSession } from "@noovolari/leapp-core/models/aws/aws-iam-role-chained-session";
import { WindowService } from "../../services/window.service";
import { AwsCoreService } from "@noovolari/leapp-core/services/aws-core-service";
import { AppNativeService } from "../../services/app-native.service";
import { LeappBaseError } from "@noovolari/leapp-core/errors/leapp-base-error";
import { MessageToasterService, ToastLevel } from "../../services/message-toaster.service";
import { LoggedEntry, LoggedException, LogLevel, LogService } from "@noovolari/leapp-core/services/log-service";
import { OperatingSystem } from "@noovolari/leapp-core/models/operating-system";
import { LeappLinkError } from "@noovolari/leapp-core/errors/leapp-link-error";

@Component({
  selector: "app-tray-menu",
  templateUrl: "./tray-menu.component.html",
  styleUrls: ["./tray-menu.component.scss"],
})
export class TrayMenuComponent implements OnInit, OnDestroy {
  // Used to define the only tray we want as active especially in linux context
  private currentTray;
  private subscribed;

  private awsCoreService: AwsCoreService;
  private loggingService: LogService;
  private sessionServiceFactory: SessionFactory;
  private behaviouralSubjectService: BehaviouralSubjectService;

  private awsCliVersion: string;
  private awsSsmPluginVersion: string;
  private issueBody: string;

  private voices = [];
  private sessions = [];
  private moreSessions = [];

  constructor(
    private appService: AppService,
    private electronService: AppNativeService,
    private updaterService: UpdaterService,
    private windowService: WindowService,
    private messageToasterService: MessageToasterService,
    private appProviderService: AppProviderService
  ) {
    this.awsCoreService = appProviderService.awsCoreService;
    this.loggingService = appProviderService.logService;
    this.sessionServiceFactory = appProviderService.sessionFactory;
    this.behaviouralSubjectService = appProviderService.behaviouralSubjectService;
  }

  async ngOnInit(): Promise<void> {
    this.subscribed = this.behaviouralSubjectService.sessions$.subscribe(() => {
      this.generateMenu();
    });
    this.getMetadata();
    await this.generateMenu();
  }

  getProfileId(session: Session): string {
    if (session.type !== SessionType.azure) {
      return (session as any).profileId;
    } else {
      return undefined;
    }
  }

  async generateMenu(): Promise<void> {
    const sessionSubmenuThreshold = 10;
    this.voices = [];
    this.sessions = [];
    this.moreSessions = [];

    const allSessions = this.appProviderService.sessionManagementService.getSessions();
    const visibleMenuSessions = allSessions.filter((_, index) => index < sessionSubmenuThreshold);
    visibleMenuSessions.forEach((session: Session) => this.sessions.push(this.createSessionVoice(session)));

    if (allSessions.length > sessionSubmenuThreshold) {
      const moreMenuSessions = allSessions.filter((_, index) => index >= sessionSubmenuThreshold);
      moreMenuSessions.forEach((session: Session) => this.moreSessions.push(this.createSessionVoice(session)));
    }

    const extraInfo = [
      { type: "separator" },
      {
        label: "Show",
        type: "normal",
        click: () => {
          this.windowService.getCurrentWindow().show();
        },
      },
      {
        label: "About",
        type: "normal",
        click: () => {
          this.appService.about();
        },
      },
      { type: "separator" },
      {
        label: "Open Documentation",
        type: "normal",
        click: () => {
          this.windowService.openExternalUrl("https://docs.leapp.cloud/");
        },
      },
      {
        label: "Join Slack Community",
        type: "normal",
        click: () => {
          this.windowService.openExternalUrl("https://join.slack.com/t/noovolari/shared_invite/zt-opn8q98k-HDZfpJ2_2U3RdTnN~u_B~Q");
        },
      },
      {
        label: "Open Issue",
        type: "normal",
        enabled: this.awsSsmPluginVersion && this.awsCliVersion && this.issueBody,
        click: () => {
          this.windowService.openExternalUrl(`https://github.com/noovolari/leapp/issues/new?labels=bug&body=${encodeURIComponent(this.issueBody)}`);
        },
      },
      { type: "separator" },
      {
        label: "Quit",
        type: "normal",
        click: () => {
          this.cleanBeforeExit().then(() => {});
        },
      },
    ];
    // Remove unused voices from contextual menu
    const template = [
      {
        label: "Leapp",
        submenu: [
          { label: "About", role: "about" },
          { type: "separator" },
          { label: "Hide Leapp", accelerator: "CmdOrCtrl+H", role: "hide" },
          { label: "Hide Others", accelerator: "Alt+CmdOrCtrl+H", role: "hideOthers" },
          { label: "Close Window", accelerator: "CmdOrCtrl+W", role: "close" },
          { type: "separator" },
          { label: "Quit", role: "quit" },
        ],
      },
      {
        label: "Edit",
        submenu: [
          { label: "Copy", role: "copy" },
          { label: "Paste", role: "paste" },
        ],
      },
    ];
    if (!environment.production) {
      template[0].submenu.push({ label: "Open DevTool", role: "toggledevtools" });
    }
    this.appService.getMenu().setApplicationMenu(this.appService.getMenu().buildFromTemplate(template));
    // check for dark mode
    let normalIcon = "LeappTemplate";
    if (this.appService.detectOs() === OperatingSystem.linux) {
      normalIcon = "LeappMini";
    }
    if (!this.currentTray) {
      this.currentTray = new this.electronService.tray(__dirname + `/assets/images/${normalIcon}.png`);
      if (this.appService.detectOs() !== OperatingSystem.windows && this.appService.detectOs() !== OperatingSystem.linux) {
        this.appService.getApp().dock.setBadge("");
      }
    }
    if (this.updaterService.getSavedVersionComparison() && this.updaterService.isReady()) {
      this.voices.push({ type: "separator" });
      this.voices.push({ label: "Check for Updates...", type: "normal", click: () => this.updaterService.updateDialog() });
      this.appService.getApp().dock.setBadge("·");
    }

    this.voices = this.voices.concat([
      ...this.sessions,
      ...(this.moreSessions.length > 0 ? [{ type: "separator" }, { label: "More Sessions...", submenu: this.moreSessions }] : []),
      ...extraInfo,
    ]);

    const contextMenu = this.appService.getMenu().buildFromTemplate(this.voices);
    if (this.appService.detectOs() !== OperatingSystem.windows && this.appService.detectOs() !== OperatingSystem.linux) {
      this.currentTray.setToolTip("Leapp");
    }
    this.currentTray.setContextMenu(contextMenu);
  }

  /**
   * Remove session and credential file before exiting program
   */
  async cleanBeforeExit(): Promise<void> {
    // Check if we are here
    this.loggingService.log(new LoggedEntry("Closing app with cleaning process...", this, LogLevel.info));
    // We need the Try/Catch as we have the possibility to call the method without sessions
    try {
      // Stop the sessions...
      const activeSessions = this.appProviderService.sessionManagementService.getActiveAndPendingSessions();
      activeSessions.forEach((sess) => {
        const factorizedService = this.sessionServiceFactory.getSessionService(sess.type);
        factorizedService.stop(sess.sessionId);
      });
      // Clean the config file
      this.awsCoreService.cleanCredentialFile();
    } catch (err) {
      this.loggingService.log(new LoggedEntry("No sessions to stop, skipping...", this, LogLevel.error, false, err.stack));
    }
    // Finally quit
    this.appService.quit();
  }

  ngOnDestroy(): void {
    this.subscribed.unsubscribe();
  }

  private getMetadata() {
    const printError = (error) => {
      this.loggingService.log(new LoggedException(error.toString(), this, LogLevel.error, false, error.stack));
      if ((error as LeappBaseError).severity === LogLevel.error) {
        if ((error as LeappLinkError).link === undefined || (error as LeappLinkError).link === null) {
          this.messageToasterService.toast(error.toString(), ToastLevel.error, "");
        } else {
          this.messageToasterService.toast(error.toString(), ToastLevel.error, "", (error as LeappLinkError).link);
        }
      }
    };

    this.getAwsCliVersion()
      .then(() => {
        this.getSessionManagerPluginVersion()
          .then(() => {
            this.setIssueBody();
          })
          .catch((error) => {
            printError(error);
          });
      })
      .catch((error) => {
        printError(error);
      });
  }

  private async getAwsCliVersion(): Promise<void> {
    if (!this.awsCliVersion) {
      try {
        this.awsCliVersion = await this.appProviderService.executeService.execute("aws --version");
      } catch (_) {
        throw new LeappLinkError(
          "https://docs.leapp.cloud/latest/troubleshooting/faq/",
          this,
          "An error occurred getting AWS CLI version. Please check if it is installed and <span class='link'>add a symlink</span> following the documentation."
        );
      }
    }
  }

  private async getSessionManagerPluginVersion(): Promise<void> {
    if (!this.awsSsmPluginVersion) {
      try {
        const sessionManagerPluginVersion = await this.appProviderService.executeService.execute("session-manager-plugin --version");
        this.awsSsmPluginVersion = sessionManagerPluginVersion.replace(/(\r\n|\n|\r)/gm, "");
      } catch (error) {
        throw new LeappLinkError(
          "https://docs.leapp.cloud/latest/built-in-features/aws-ec2-connect/",
          this,
          "An error occurred getting AWS Session Manager Plugin version. <span class='link'>Click here to follow the instructions on the docs</span> and solve the issue."
        );
      }
    }
  }

  private setIssueBody(): void {
    this.issueBody = `### Description:
> Please include a detailed description of the issue (and an image or screen recording, if applicable)


### Details:
| Leapp Version | ${this.electronService.app.getVersion()} |
| --- | --- |
| SsmPluginVersion | ${this.awsSsmPluginVersion} |
| Platform | ${process.platform} |
| Awscli | ${this.awsCliVersion}
`;
  }

  private createSessionVoice(session: Session) {
    let icon = "";
    let label = "";
    const profile = this.appProviderService.namedProfileService.getNamedProfiles().filter((p) => p.id === this.getProfileId(session))[0];
    const iconValue = profile && profile.name === "default" ? "home" : "user";
    switch (session.type) {
      case SessionType.awsIamUser:
        // eslint-disable-next-line max-len
        icon =
          session.status === SessionStatus.active
            ? __dirname + `/assets/images/${iconValue}-online.png`
            : __dirname + `/assets/images/${iconValue}-offline.png`;
        label = "  " + session.sessionName + " - " + "iam user";
        break;
      case SessionType.awsIamRoleFederated:
      case SessionType.awsSsoRole:
        // eslint-disable-next-line max-len
        icon =
          session.status === SessionStatus.active
            ? __dirname + `/assets/images/${iconValue}-online.png`
            : __dirname + `/assets/images/${iconValue}-offline.png`;
        label = "  " + session.sessionName + " - " + (session as AwsIamRoleFederatedSession).roleArn.split("/")[1];
        break;
      case SessionType.awsIamRoleChained:
        // eslint-disable-next-line max-len
        icon =
          session.status === SessionStatus.active
            ? __dirname + `/assets/images/${iconValue}-online.png`
            : __dirname + `/assets/images/${iconValue}-offline.png`;
        label = "  " + session.sessionName + " - " + (session as AwsIamRoleChainedSession).roleArn.split("/")[1];
        break;
      case SessionType.azure:
        // eslint-disable-next-line max-len
        icon =
          session.status === SessionStatus.active
            ? __dirname + `/assets/images/icon-online-azure.png`
            : __dirname + `/assets/images/icon-offline.png`;
        label = "  " + session.sessionName;
    }
    return {
      label,
      type: "normal",
      icon,
      click: async () => {
        const factorizedSessionService = this.sessionServiceFactory.getSessionService(session.type);
        if (session.status !== SessionStatus.active) {
          await factorizedSessionService.start(session.sessionId);
        } else {
          await factorizedSessionService.stop(session.sessionId);
        }
      },
    };
  }
}

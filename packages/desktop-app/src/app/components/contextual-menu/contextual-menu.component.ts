import { Component, OnInit, ViewChild } from "@angular/core";
import { Session } from "@noovolari/leapp-core/models/session";
import { AppService } from "../../services/app.service";
import { MatMenuTrigger } from "@angular/material/menu";
import { AppProviderService } from "../../services/app-provider.service";
import { SessionSelectionState } from "@noovolari/leapp-core/models/session-selection-state";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { constants } from "@noovolari/leapp-core/models/constants";
import { OptionsService } from "../../services/options.service";
import { AwsCredentialsPlugin } from "@noovolari/leapp-core/plugin-sdk/aws-credentials-plugin";
import { AwsIamRoleFederatedSession } from "@noovolari/leapp-core/models/aws/aws-iam-role-federated-session";
import { AwsIamUserService } from "@noovolari/leapp-core/services/session/aws/aws-iam-user-service";
import { MessageToasterService, ToastLevel } from "../../services/message-toaster.service";
import { LoggedEntry, LoggedException, LogLevel } from "@noovolari/leapp-core/services/log-service";
import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";
import { CreateDialogComponent } from "../dialogs/create-dialog/create-dialog.component";
import { BsModalService } from "ngx-bootstrap/modal";

@Component({
  selector: "app-contextual-menu",
  templateUrl: "./contextual-menu.component.html",
  styleUrls: ["./contextual-menu.component.scss"],
})
export class ContextualMenuComponent implements OnInit {
  @ViewChild(MatMenuTrigger)
  public trigger: MatMenuTrigger;

  public eConstants = constants;
  public eSessionStatus = SessionStatus;
  public eSessionType = SessionType;
  public selectedSession: Session;
  public menuX: number;
  public menuY: number;

  constructor(
    public appService: AppService,
    public optionsService: OptionsService,
    public appProviderService: AppProviderService,
    private messageToasterService: MessageToasterService,
    private modalService: BsModalService
  ) {}

  ngOnInit(): void {
    this.appProviderService.behaviouralSubjectService.sessionSelections$.subscribe((sessionSelections: SessionSelectionState[]) => {
      if (sessionSelections.length === 0) {
        return;
      }

      this.appService.closeAllMenuTriggers();
      this.selectedSession = this.appProviderService.repository.getSessionById(sessionSelections[0].sessionId);
      this.menuY = sessionSelections[0].menuY;
      this.menuX = sessionSelections[0].menuX;

      if (sessionSelections[0].isContextualMenuOpen) {
        setTimeout(() => {
          this.trigger.openMenu();
          this.appService.setMenuTrigger(this.trigger);
        }, 100);
      }
    });
  }

  get selectedSessionService() {
    return this.appProviderService.sessionFactory.getSessionService(this.selectedSession.type);
  }

  startSession() {}

  stopSession() {}

  logoutFromFederatedSession(): void {
    this.appProviderService.awsAuthenticationService.logoutFromFederatedSession(this.selectedSession, () => {
      this.logSessionData(this.selectedSession, `Stopped Session`);
      this.appProviderService.behaviouralSubjectService.unselectSessions();
    });
  }

  createAChainedSessionFromSelectedOne(): void {
    const aliasConstructed = `ChainedFrom${this.selectedSession.sessionName}`;
    const regionConstructed = this.selectedSession.region;
    const assumerSessionIdConstructed = this.selectedSession.sessionId;
    const assumerSessionNameConstructed = this.selectedSession.sessionName;
    const sessionName = this.selectedSession.sessionName.replace(/ /g, "-");
    const assumerSessionTagConstructed = `chained-from-${sessionName}`;

    const initialState = {
      shortcutAlias: aliasConstructed,
      shortcutRegion: regionConstructed,
      shortcutSessionId: assumerSessionIdConstructed,
      shortcutSessionName: assumerSessionNameConstructed,
      shortcutSessionTag: assumerSessionTagConstructed,
      shortcut: true,
    };

    this.modalService.show(CreateDialogComponent, {
      animated: false,
      class: "create-modal",
      backdrop: "static",
      keyboard: false,
      initialState,
    });
  }

  ssmModalOpen(_$event: MouseEvent) {}

  openAwsWebConsole(_$event: MouseEvent) {}

  editSession(_$event: MouseEvent) {}

  pinSession(_$event: MouseEvent) {}

  unpinSession(_$event: MouseEvent) {}

  deleteSession(_$event: MouseEvent) {}

  changeRegionModalOpen(_$event: MouseEvent) {}

  changeProfileModalOpen(_$event: MouseEvent) {}

  async copyCredentials(type: number, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.appProviderService.behaviouralSubjectService.unselectSessions();

    try {
      if (this.appProviderService.workspaceService.workspaceExists()) {
        const roleArn = (this.selectedSession as AwsIamRoleFederatedSession).roleArn;
        const texts = {
          // eslint-disable-next-line max-len
          1: roleArn ? `${roleArn.split("/")[0].substring(13, 25)}` : "",
          2: roleArn ? `${roleArn}` : "",
        };

        let text = texts[type];

        // Special conditions for IAM Users
        if (this.selectedSession.type === SessionType.awsIamUser) {
          // Get Account from Caller Identity
          text = await (this.selectedSessionService as AwsIamUserService).getAccountNumberFromCallerIdentity(this.selectedSession);
        }

        this.appService.copyToClipboard(text);
        this.messageToasterService.toast("Your information has been successfully copied!", ToastLevel.success, "Information copied!");
      }
    } catch (err) {
      this.messageToasterService.toast(err, ToastLevel.warn);
      this.appProviderService.logService.log(new LoggedException(err, this, LogLevel.error, true, err.stack));
    }
  }

  async copyAwsWebConsoleUrl(event: MouseEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.appProviderService.behaviouralSubjectService.unselectSessions();

    try {
      const credentials = await (this.selectedSessionService as AwsSessionService).generateCredentials(this.selectedSession.sessionId);
      const sessionRegion = this.selectedSession.region;
      const loginURL = await this.appProviderService.webConsoleService.getWebConsoleUrl(credentials, sessionRegion);

      this.appService.copyToClipboard(loginURL);
      this.messageToasterService.toast("Your information has been successfully copied!", ToastLevel.success, "Information copied!");
    } catch (err) {
      this.messageToasterService.toast(err, ToastLevel.warn);
      this.appProviderService.logService.log(new LoggedException(err, this, LogLevel.error, true, err.stack));
    }
  }

  async applyPluginAction(plugin: AwsCredentialsPlugin): Promise<void> {
    await plugin.run(this.selectedSession);
    /*if (plugin.templateStructure.output) {
      if (plugin.templateStructure.output.type === TemplateOutputObject.message) {
        this.appProviderService.logService.log(new LoggedEntry(plugin[plugin.templateStructure.output.data](), this, LogLevel.info, true));
      }
    }*/
  }

  private logSessionData(session: Session, message: string): void {
    this.appProviderService.logService.log(
      new LoggedEntry(
        message,
        this,
        LogLevel.info,
        false,
        JSON.stringify({ timestamp: new Date().toISOString(), id: session.sessionId, account: session.sessionName, type: session.type }, null, 3)
      )
    );
  }
}

import { Injectable } from "@angular/core";
import { AppProviderService } from "./app-provider.service";
import { SessionFactory } from "@noovolari/leapp-core/services/session-factory";
import { Session } from "@noovolari/leapp-core/models/session";
import { LoggedEntry, LoggedException, LogLevel, LogService } from "@noovolari/leapp-core/services/log-service";
import { BehaviouralSubjectService } from "@noovolari/leapp-core/services/behavioural-subject-service";
import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";
import { ChangeRegionDialogComponent } from "../components/dialogs/change-region-dialog/change-region-dialog.component";
import { BsModalService } from "ngx-bootstrap/modal";
import { ChangeNamedProfileDialogComponent } from "../components/dialogs/change-named-profile-dialog/change-named-profile-dialog.component";
import { SsmModalDialogComponent } from "../components/dialogs/ssm-modal-dialog/ssm-modal-dialog.component";
import { EditDialogComponent } from "../components/dialogs/edit-dialog/edit-dialog.component";
import { constants } from "@noovolari/leapp-core/models/constants";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { WindowService } from "./window.service";
import { OptionsService } from "./options.service";
import { AppService } from "./app.service";
import { MessageToasterService, ToastLevel } from "./message-toaster.service";
import { CreateDialogComponent } from "../components/dialogs/create-dialog/create-dialog.component";
import { AwsIamRoleFederatedSession } from "@noovolari/leapp-core/models/aws/aws-iam-role-federated-session";
import { AwsIamUserService } from "@noovolari/leapp-core/services/session/aws/aws-iam-user-service";
import { AwsCredentialsPlugin } from "@noovolari/leapp-core/plugin-sdk/aws-credentials-plugin";

@Injectable({
  providedIn: "root",
})
export class SelectedSessionActionsService {
  private sessionFactory: SessionFactory;
  private logService: LogService;
  private behaviouralSubjectService: BehaviouralSubjectService;

  constructor(
    private appProviderService: AppProviderService,
    private modalService: BsModalService,
    private windowService: WindowService,
    private optionService: OptionsService,
    private appService: AppService,
    private messageToasterService: MessageToasterService
  ) {
    this.sessionFactory = this.appProviderService.sessionFactory;
    this.logService = this.appProviderService.logService;
    this.behaviouralSubjectService = this.appProviderService.behaviouralSubjectService;
  }

  getSelectedSessionService(session: Session) {
    return this.sessionFactory.getSessionService(session.type);
  }

  async startSession(session: Session): Promise<void> {
    this.behaviouralSubjectService.unselectSessions();
    this.logSessionData(session, "Starting Session");
    await this.getSelectedSessionService(session).start(session.sessionId);
    document.querySelector(".table thead tr").scrollIntoView();
  }

  async stopSession(session: Session): Promise<void> {
    this.behaviouralSubjectService.unselectSessions();
    this.logSessionData(session, `Stopped Session`);
    await this.getSelectedSessionService(session).stop(session.sessionId);
  }

  async openAwsWebConsole(session: Session): Promise<void> {
    this.behaviouralSubjectService.unselectSessions();
    const credentials = await (this.getSelectedSessionService(session) as AwsSessionService).generateCredentials(session.sessionId);
    const sessionRegion = session.region;
    await this.appProviderService.webConsoleService.openWebConsole(credentials, sessionRegion);
  }

  async changeRegionModalOpen(session: Session): Promise<void> {
    this.behaviouralSubjectService.unselectSessions();
    this.modalService.show(ChangeRegionDialogComponent, {
      animated: false,
      class: "ssm-modal",
      initialState: { session },
    });
  }

  async changeProfileModalOpen(session: Session): Promise<void> {
    this.behaviouralSubjectService.unselectSessions();
    this.modalService.show(ChangeNamedProfileDialogComponent, {
      animated: false,
      class: "ssm-modal",
      initialState: { session },
    });
  }

  async ssmModalOpen(session: Session): Promise<void> {
    this.behaviouralSubjectService.unselectSessions();
    this.modalService.show(SsmModalDialogComponent, {
      animated: false,
      class: "edit-modal",
      initialState: { session },
    });
  }

  async editCurrentSession(session: Session): Promise<void> {
    this.behaviouralSubjectService.unselectSessions();
    this.modalService.show(EditDialogComponent, {
      animated: false,
      class: "edit-modal",
      initialState: { selectedSessionId: session.sessionId },
    });
  }

  async deleteSession(session: Session): Promise<void> {
    this.behaviouralSubjectService.unselectSessions();
    const dialogMessage = this.generateDeleteDialogMessage(session);
    this.windowService.confirmDialog(
      dialogMessage,
      (status) => {
        if (status === constants.confirmed) {
          this.logSessionData(session, "Session Deleted");
          this.getSelectedSessionService(session)
            .delete(session.sessionId)
            .then(() => {});
        }
      },
      "Delete Session",
      "Cancel"
    );
  }

  async pinSession(session: Session): Promise<void> {
    this.optionService.pinSession(session);
    this.behaviouralSubjectService.unselectSessions();
  }

  async unpinSession(session: Session): Promise<void> {
    this.optionService.unpinSession(session);
    this.behaviouralSubjectService.unselectSessions();
  }

  isPinned(selectedSession: Session): boolean {
    return this.optionService.pinned.indexOf(selectedSession.sessionId) !== -1;
  }

  copyProfile(profileName: string): void {
    this.behaviouralSubjectService.unselectSessions();
    this.appService.copyToClipboard(profileName);
    this.messageToasterService.toast("Profile name copied!", ToastLevel.success, "Information copied!");
  }

  logoutFromFederatedSession(session: Session): void {
    this.behaviouralSubjectService.unselectSessions();
    this.appProviderService.awsAuthenticationService.logoutFromFederatedSession(session, () => {
      this.logSessionData(session, `Stopped Session`);
    });
  }

  createAChainedSessionFromSelectedOne(session: Session): void {
    this.behaviouralSubjectService.unselectSessions();
    const aliasConstructed = `ChainedFrom${session.sessionName}`;
    const regionConstructed = session.region;
    const assumerSessionIdConstructed = session.sessionId;
    const assumerSessionNameConstructed = session.sessionName;
    const sessionName = session.sessionName.replace(/ /g, "-");
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

  async copyCredentials(session: Session, type: number): Promise<void> {
    this.appProviderService.behaviouralSubjectService.unselectSessions();

    try {
      if (this.appProviderService.workspaceService.workspaceExists()) {
        const roleArn = (session as AwsIamRoleFederatedSession).roleArn;
        const texts = {
          // eslint-disable-next-line max-len
          1: roleArn ? `${roleArn.split("/")[0].substring(13, 25)}` : "",
          2: roleArn ? `${roleArn}` : "",
        };

        let text = texts[type];

        // Special conditions for IAM Users
        if (session.type === SessionType.awsIamUser) {
          // Get Account from Caller Identity
          text = await (this.getSelectedSessionService(session) as AwsIamUserService).getAccountNumberFromCallerIdentity(session);
        }

        this.appService.copyToClipboard(text);
        this.messageToasterService.toast("Your information has been successfully copied!", ToastLevel.success, "Information copied!");
      }
    } catch (err) {
      this.messageToasterService.toast(err, ToastLevel.warn);
      this.appProviderService.logService.log(new LoggedException(err, this, LogLevel.error, true, err.stack));
    }
  }

  async copyAwsWebConsoleUrl(session: Session): Promise<void> {
    this.appProviderService.behaviouralSubjectService.unselectSessions();

    try {
      const credentials = await (this.getSelectedSessionService(session) as AwsSessionService).generateCredentials(session.sessionId);
      const sessionRegion = session.region;
      const loginURL = await this.appProviderService.webConsoleService.getWebConsoleUrl(credentials, sessionRegion);

      this.appService.copyToClipboard(loginURL);
      this.messageToasterService.toast("Your information has been successfully copied!", ToastLevel.success, "Information copied!");
    } catch (err) {
      this.messageToasterService.toast(err, ToastLevel.warn);
      this.appProviderService.logService.log(new LoggedException(err, this, LogLevel.error, true, err.stack));
    }
  }

  async applyPluginAction(session: Session, plugin: AwsCredentialsPlugin): Promise<void> {
    this.behaviouralSubjectService.unselectSessions();
    await plugin.run(session);
  }

  private generateDeleteDialogMessage(session: Session): string {
    let dependentSessions = [];
    if (session.type !== SessionType.azure) {
      dependentSessions = this.getSelectedSessionService(session).getDependantSessions(session.sessionId);
    }

    let dependendSessionsHtml = "";
    dependentSessions.forEach((sess) => {
      dependendSessionsHtml += `<li><div class="removed-sessions"><b>${sess.sessionName}</b></div></li>`;
    });
    if (dependendSessionsHtml !== "") {
      return (
        "This session has dependent sessions: <br><ul>" +
        dependendSessionsHtml +
        "</ul><br>Removing the session will also remove the dependent sessions associated with it. Do you want to proceed?"
      );
    } else {
      return `Do you really want to delete the session '${session.sessionName}'?`;
    }
  }

  private logSessionData(session: Session, message: string): void {
    this.logService.log(
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

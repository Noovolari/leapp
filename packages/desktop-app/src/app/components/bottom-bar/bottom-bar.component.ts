import { Component, Input, OnInit } from "@angular/core";
import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";
import { ChangeRegionDialogComponent } from "../dialogs/change-region-dialog/change-region-dialog.component";
import { ChangeNamedProfileDialogComponent } from "../dialogs/change-named-profile-dialog/change-named-profile-dialog.component";
import { SsmModalDialogComponent } from "../dialogs/ssm-modal-dialog/ssm-modal-dialog.component";
import { EditDialogComponent } from "../dialogs/edit-dialog/edit-dialog.component";
import { constants } from "@noovolari/leapp-core/models/constants";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { Session } from "@noovolari/leapp-core/models/session";
import { LoggedEntry, LogLevel, LogService } from "@noovolari/leapp-core/services/log-service";
import { AppProviderService } from "../../services/app-provider.service";
import { SessionFactory } from "@noovolari/leapp-core/services/session-factory";
import { BsModalService } from "ngx-bootstrap/modal";
import { BehaviouralSubjectService } from "@noovolari/leapp-core/services/behavioural-subject-service";
import { OptionsService } from "../../services/options.service";
import { WindowService } from "../../services/window.service";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";

@Component({
  selector: "app-bottom-bar",
  templateUrl: "./bottom-bar.component.html",
  styleUrls: ["./bottom-bar.component.scss"],
})
export class BottomBarComponent implements OnInit {
  @Input()
  selectedSession: Session;

  public eCompactMode: boolean;
  public eSessionType = SessionType;
  public eSessionStatus = SessionStatus;

  private sessionFactory: SessionFactory;
  private behaviouralSubjectService: BehaviouralSubjectService;
  private logService: LogService;

  constructor(
    private appProviderService: AppProviderService,
    private modalService: BsModalService,
    private windowService: WindowService,
    public optionService: OptionsService
  ) {
    this.sessionFactory = this.appProviderService.sessionFactory;
    this.behaviouralSubjectService = this.appProviderService.behaviouralSubjectService;
    this.logService = this.appProviderService.logService;
  }

  ngOnInit(): void {}

  get selectedSessionService() {
    return this.sessionFactory.getSessionService(this.selectedSession.type);
  }

  async startSession(): Promise<void> {
    this.logSessionData(this.selectedSession, "Starting Session");
    await this.selectedSessionService.start(this.selectedSession.sessionId);
    this.behaviouralSubjectService.unselectSessions();
  }

  async stopSession(): Promise<void> {
    this.logSessionData(this.selectedSession, `Stopped Session`);
    await this.selectedSessionService.stop(this.selectedSession.sessionId);
    this.behaviouralSubjectService.unselectSessions();
  }

  async openAwsWebConsole(): Promise<void> {
    const credentials = await (this.selectedSessionService as AwsSessionService).generateCredentials(this.selectedSession.sessionId);
    const sessionRegion = this.selectedSession.region;
    await this.appProviderService.webConsoleService.openWebConsole(credentials, sessionRegion);
  }

  async changeRegionModalOpen(): Promise<void> {
    this.modalService.show(ChangeRegionDialogComponent, {
      animated: false,
      class: "ssm-modal",
      initialState: { session: this.selectedSession },
    });
  }

  async changeProfileModalOpen(): Promise<void> {
    this.modalService.show(ChangeNamedProfileDialogComponent, {
      animated: false,
      class: "ssm-modal",
      initialState: { session: this.selectedSession },
    });
  }

  async ssmModalOpen(): Promise<void> {
    this.modalService.show(SsmModalDialogComponent, {
      animated: false,
      class: "edit-modal",
      initialState: { session: this.selectedSession },
    });
  }

  async editCurrentSession(): Promise<void> {
    this.modalService.show(EditDialogComponent, {
      animated: false,
      class: "edit-modal",
      initialState: { selectedSessionId: this.selectedSession.sessionId },
    });
  }

  async pinSession(): Promise<void> {
    this.optionService.pinSession(this.selectedSession);
  }

  async unpinSession(): Promise<void> {
    this.optionService.unpinSession(this.selectedSession);
  }

  async deleteSession(): Promise<void> {
    const dialogMessage = this.generateDeleteDialogMessage();
    this.windowService.confirmDialog(
      dialogMessage,
      (status) => {
        if (status === constants.confirmed) {
          this.logSessionData(this.selectedSession, "Session Deleted");
          this.selectedSessionService.delete(this.selectedSession.sessionId).then(() => {});
          this.behaviouralSubjectService.unselectSessions();
        }
      },
      "Delete Session",
      "Cancel"
    );
  }

  private generateDeleteDialogMessage(): string {
    const session = this.selectedSession;
    let dependentSessions = [];
    if (session.type !== SessionType.azure) {
      dependentSessions = this.selectedSessionService.getDependantSessions(session.sessionId);
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

import { Component, Input, OnInit } from "@angular/core";
import { AppService } from "../../../services/app.service";
import { Router } from "@angular/router";
import { IGlobalColumns } from "../../command-bar/command-bar.component";
import { Session } from "@noovolari/leapp-core/models/session";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { AppProviderService } from "../../../services/app-provider.service";
import { LoggedEntry, LogLevel, LogService } from "@noovolari/leapp-core/services/log-service";
import { SessionFactory } from "@noovolari/leapp-core/services/session-factory";
import { AppSsmService } from "../../../services/app-ssm.service";
import { BehaviouralSubjectService } from "@noovolari/leapp-core/services/behavioural-subject-service";
import { SessionService } from "@noovolari/leapp-core/services/session/session-service";
import { constants } from "@noovolari/leapp-core/models/constants";
import { WindowService } from "../../../services/window.service";
import { MessageToasterService, ToastLevel } from "../../../services/message-toaster.service";
import { AppNativeService } from "../../../services/app-native.service";
import { OptionsService } from "../../../services/options.service";

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: "tr[app-session-card]",
  templateUrl: "./session-card.component.html",
  styleUrls: ["./session-card.component.scss"],
})
export class SessionCardComponent implements OnInit {
  @Input()
  session!: Session;

  @Input()
  compactMode!: boolean;

  @Input()
  globalColumns: IGlobalColumns;

  @Input()
  isSelected: boolean;

  eSessionType = SessionType;
  eSessionStatus = SessionStatus;
  eConstants = constants;

  private loggingService: LogService;
  private sessionFactory: SessionFactory;
  private behaviouralSubjectService: BehaviouralSubjectService;
  private sessionService: SessionService;

  constructor(
    public appService: AppService,
    private router: Router,
    private ssmService: AppSsmService,
    private windowService: WindowService,
    private electronService: AppNativeService,
    private messageToasterService: MessageToasterService,
    public appProviderService: AppProviderService,
    public optionService: OptionsService
  ) {
    this.behaviouralSubjectService = this.appProviderService.behaviouralSubjectService;
    this.loggingService = this.appProviderService.logService;
    this.sessionFactory = this.appProviderService.sessionFactory;
  }

  ngOnInit(): void {
    // Retrieve the singleton service for the concrete implementation of SessionService
    this.sessionService = this.sessionFactory.getSessionService(this.session.type);
  }

  /**
   * Used to call for start or stop depending on sessions status
   */
  switchCredentials(): void {
    if (this.session.status === SessionStatus.active) {
      this.stopSession();
    } else {
      this.startSession();
    }
  }

  openOptionBar(session: Session): void {
    this.behaviouralSubjectService.selectSession(session.sessionId);
  }

  /**
   * Start the selected sessions
   */
  startSession(): void {
    this.sessionService.start(this.session.sessionId).then(() => {
      this.clearOptionIds();
    });
    this.logSessionData(this.session, `Starting Session`);
    this.behaviouralSubjectService.unselectSessions();
    document.querySelector(".table thead tr").scrollIntoView();
  }

  /**
   * Stop sessions
   */
  stopSession(): void {
    this.sessionService.stop(this.session.sessionId).then(() => {
      this.clearOptionIds();
      this.logSessionData(this.session, `Stopped Session`);
      this.behaviouralSubjectService.unselectSessions();
    });
  }

  getSessionTypeIcon(type: SessionType): string {
    return type === SessionType.azure ? "azure" : "aws";
  }

  getSessionProviderClass(type: SessionType): string {
    switch (type) {
      case SessionType.azure:
        return "blue";
      case SessionType.awsIamUser:
        return "orange";
      case SessionType.awsSsoRole:
        return "red";
      case SessionType.awsIamRoleFederated:
        return "green";
      case SessionType.awsIamRoleChained:
        return "purple";
    }
  }

  getSessionProviderLabel(type: SessionType): string {
    switch (type) {
      case SessionType.azure:
        return "Azure";
      case SessionType.awsIamUser:
        return "IAM User";
      case SessionType.awsSsoRole:
        return "AWS Single Sign-On";
      case SessionType.awsIamRoleFederated:
        return "IAM Role Federated";
      case SessionType.awsIamRoleChained:
        return "IAM Role Chained";
    }
  }

  getProfileId(session: Session): string {
    if (session.type !== SessionType.azure) {
      return (session as any).profileId;
    } else {
      return undefined;
    }
  }

  getProfileName(profileId: string): string {
    let profileName = constants.defaultAwsProfileName;
    try {
      profileName = this.appProviderService.namedProfileService.getProfileName(profileId);
    } catch (e) {}
    return profileName;
  }

  copyProfile(profileName: string): void {
    this.appService.copyToClipboard(profileName);
    this.messageToasterService.toast("Profile name copied!", ToastLevel.success, "Information copied!");
    this.behaviouralSubjectService.unselectSessions();
  }

  clearOptionIds(): void {
    this.behaviouralSubjectService.unselectSessions();
  }

  openContextMenu(event: any, session: Session): void {
    this.behaviouralSubjectService.openContextualMenu(session.sessionId, event.layerX - 10, event.layerY - 10);
  }

  private logSessionData(session: Session, message: string): void {
    this.loggingService.log(
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

import { Component, Input, OnInit } from "@angular/core";
import { AppService } from "../../../services/app.service";
import { IGlobalColumns } from "../../command-bar/command-bar.component";
import { Session } from "@noovolari/leapp-core/models/session";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { AppProviderService } from "../../../services/app-provider.service";
import { BehaviouralSubjectService } from "@noovolari/leapp-core/services/behavioural-subject-service";
import { SessionService } from "@noovolari/leapp-core/services/session/session-service";
import { constants } from "@noovolari/leapp-core/models/constants";
import { OptionsService } from "../../../services/options.service";
import { SelectedSessionActionsService } from "../../../services/selected-session-actions.service";
import { ExtensionWebsocketService } from "../../../services/extension-websocket.service";

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
  globalColumnsCount: string;

  @Input()
  isSelected: boolean;

  eSessionType = SessionType;
  eSessionStatus = SessionStatus;
  eConstants = constants;

  private behaviouralSubjectService: BehaviouralSubjectService;
  private sessionService: SessionService;

  constructor(
    public appService: AppService,
    public appProviderService: AppProviderService,
    public optionService: OptionsService,
    private selectedSessionActionService: SelectedSessionActionsService,
    private extensionWebSocketService: ExtensionWebsocketService
  ) {
    this.behaviouralSubjectService = this.appProviderService.behaviouralSubjectService;
  }

  ngOnInit(): void {
    // Retrieve the singleton service for the concrete implementation of SessionService
    this.sessionService = this.selectedSessionActionService.getSelectedSessionService(this.session);
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

  async openOptionBar(event: any, session: Session): Promise<void> {
    this.behaviouralSubjectService.selectSession(session.sessionId);
    if (event.metaKey || event.ctrlKey) {
      if (this.optionService.extensionEnabled) {
        await this.extensionWebSocketService.openWebConsoleWithExtension(session);
      } else {
        await this.selectedSessionActionService.openAwsWebConsole(session);
      }
    }
  }

  /**
   * Start the selected sessions
   */
  async startSession(): Promise<void> {
    await this.selectedSessionActionService.startSession(this.session);
  }

  /**
   * Stop sessions
   */
  async stopSession(): Promise<void> {
    await this.selectedSessionActionService.stopSession(this.session);
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

  get profileName(): string {
    const profileId = this.session.type !== SessionType.azure ? (this.session as any).profileId : undefined;
    let profileName = constants.defaultAwsProfileName;
    try {
      profileName = this.appProviderService.namedProfileService.getProfileName(profileId);
    } catch (e) {}
    return profileName;
  }

  copyProfile(profileName: string): void {
    this.selectedSessionActionService.copyProfile(profileName);
  }

  openContextMenu(event: any, session: Session): void {
    event.preventDefault();
    event.stopPropagation();
    const menuX = event.pageX;
    const menuY = event.pageY;
    this.behaviouralSubjectService.openContextualMenu(session.sessionId, menuX - 10, menuY - 10);
  }
}

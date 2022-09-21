import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AppService } from "../../services/app.service";
import { HttpClient } from "@angular/common/http";
import { BsModalService } from "ngx-bootstrap/modal";
import {
  compactMode,
  globalColumns,
  globalFilteredSessions,
  globalFilterGroup,
  globalHasFilter,
  IGlobalColumns,
} from "../command-bar/command-bar.component";
import { ColumnDialogComponent } from "../dialogs/column-dialog/column-dialog.component";
import { BehaviorSubject } from "rxjs";
import { SessionCardComponent } from "./session-card/session-card.component";
import { Session } from "@noovolari/leapp-core/models/session";
import { GlobalFilters } from "@noovolari/leapp-core/models/segment";
import { BehaviouralSubjectService } from "@noovolari/leapp-core/services/behavioural-subject-service";
import { AppProviderService } from "../../services/app-provider.service";
import { AwsCoreService } from "@noovolari/leapp-core/services/aws-core-service";
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { AwsIamRoleFederatedSession } from "@noovolari/leapp-core/models/aws/aws-iam-role-federated-session";
import { AzureSession } from "@noovolari/leapp-core/models/azure/azure-session";
import { AwsSsoRoleSession } from "@noovolari/leapp-core/models/aws/aws-sso-role-session";
import { AwsIamRoleChainedSession } from "@noovolari/leapp-core/models/aws/aws-iam-role-chained-session";
import { SessionSelectionState } from "@noovolari/leapp-core/models/session-selection-state";
import { SessionFactory } from "@noovolari/leapp-core/services/session-factory";
import { LoggedEntry, LogLevel, LogService } from "@noovolari/leapp-core/services/log-service";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { OptionsService } from "../../services/options.service";
import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";
import { EditDialogComponent } from "../dialogs/edit-dialog/edit-dialog.component";
import { ChangeRegionDialogComponent } from "../dialogs/change-region-dialog/change-region-dialog.component";
import { ChangeNamedProfileDialogComponent } from "../dialogs/change-named-profile-dialog/change-named-profile-dialog.component";

export const optionBarIds = {}; // TODO: remove
export const globalOrderingFilter = new BehaviorSubject<Session[]>([]);

export interface ArrowSettings {
  activeArrow: boolean;
  orderStyle: boolean;
}

@Component({
  selector: "app-session",
  templateUrl: "./sessions.component.html",
  styleUrls: ["./sessions.component.scss"],
})
export class SessionsComponent implements OnInit, OnDestroy {
  @ViewChild(SessionCardComponent) sessionCard;

  eGlobalFilterExtended: boolean;
  eGlobalFilteredSessions: Session[];
  eCompactMode: boolean;
  eGlobalFilterGroup: GlobalFilters;
  eGlobalColumns: IGlobalColumns;
  eSessionType = SessionType;
  eSessionStatus = SessionStatus;
  eOptionIds = optionBarIds;

  // Data for the select
  modalAccounts = [];
  currentSelectedColor;
  currentSelectedAccountNumber;

  // Ssm instances
  ssmloading = true;
  ssmRegions = [];

  showOnly = "ALL";

  // For column ordering
  columnSettings: ArrowSettings[];

  selectedSession?: Session;

  private subscriptions = [];
  private awsCoreService: AwsCoreService;

  private behaviouralSubjectService: BehaviouralSubjectService;
  private sessionFactory: SessionFactory;
  private logService: LogService;

  constructor(
    private ref: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private httpClient: HttpClient,
    private modalService: BsModalService,
    private appService: AppService,
    private appProviderService: AppProviderService,
    public optionService: OptionsService
  ) {
    this.behaviouralSubjectService = this.appProviderService.behaviouralSubjectService;
    this.awsCoreService = this.appProviderService.awsCoreService;
    this.sessionFactory = appProviderService.sessionFactory;
    this.logService = appProviderService.logService;

    this.columnSettings = Array.from(Array(5)).map((): ArrowSettings => ({ activeArrow: false, orderStyle: false }));
    const subscription = globalHasFilter.subscribe((value) => {
      this.eGlobalFilterExtended = value;
    });
    const subscription2 = globalFilteredSessions.subscribe((value) => {
      this.eGlobalFilteredSessions = value;
    });
    const subscription3 = compactMode.subscribe((value) => {
      this.eCompactMode = value;
    });
    const subscription4 = globalFilterGroup.subscribe((value) => {
      this.eGlobalFilterGroup = value;
    });
    const subscription5 = globalColumns.subscribe((value) => {
      this.eGlobalColumns = value;
    });
    const subscription6 = this.behaviouralSubjectService.sessionSelections$.subscribe((sessionSelections: SessionSelectionState[]) => {
      if (sessionSelections.length > 0) {
        this.selectedSession = this.eGlobalFilteredSessions.find((session) => session.sessionId === sessionSelections[0].sessionId);
      } else {
        this.selectedSession = undefined;
      }
    });

    this.subscriptions.push(subscription, subscription2, subscription3, subscription4, subscription5, subscription6);
    globalOrderingFilter.next(JSON.parse(JSON.stringify(this.behaviouralSubjectService.sessions)));
  }

  ngOnInit(): void {
    // Set regions for ssm
    this.ssmRegions = this.awsCoreService.getRegions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  openFilterColumn(): void {
    this.modalService.show(ColumnDialogComponent, {
      initialState: { eGlobalColumns: this.eGlobalColumns },
      animated: false,
      class: "column-modal",
    });
  }

  setVisibility(name: string): void {
    if (this.showOnly === name) {
      this.showOnly = "ALL";
    } else {
      this.showOnly = name;
    }
  }

  orderSessionsByName(orderStyle: boolean): void {
    this.resetArrowsExcept(0);
    if (!orderStyle) {
      this.columnSettings[0].activeArrow = true;
      globalOrderingFilter.next(JSON.parse(JSON.stringify(this.eGlobalFilteredSessions.sort((a, b) => a.sessionName.localeCompare(b.sessionName)))));
      this.columnSettings[0].orderStyle = !this.columnSettings[0].orderStyle;
    } else if (this.columnSettings[0].activeArrow) {
      globalOrderingFilter.next(JSON.parse(JSON.stringify(this.eGlobalFilteredSessions.sort((a, b) => b.sessionName.localeCompare(a.sessionName)))));
      this.columnSettings[0].activeArrow = false;
    } else {
      this.columnSettings[0].orderStyle = !this.columnSettings[0].orderStyle;
      this.orderSessionsByStartTime();
    }
  }

  orderSessionsByRole(orderStyle: boolean): void {
    this.resetArrowsExcept(1);
    if (!orderStyle) {
      this.columnSettings[1].activeArrow = true;
      globalOrderingFilter.next(
        JSON.parse(
          JSON.stringify(
            this.eGlobalFilteredSessions.sort((a, b) => {
              if (this.getRole(a) === "") {
                return 1;
              }
              if (this.getRole(b) === "") {
                return -1;
              }
              if (this.getRole(a) === this.getRole(b)) {
                return 0;
              }
              return this.getRole(a) < this.getRole(b) ? -1 : 1;
            })
          )
        )
      );
      this.columnSettings[1].orderStyle = !this.columnSettings[1].orderStyle;
    } else if (this.columnSettings[1].activeArrow) {
      globalOrderingFilter.next(
        JSON.parse(
          JSON.stringify(
            this.eGlobalFilteredSessions.sort((a, b) => {
              if (this.getRole(a) === "") {
                return -1;
              }
              if (this.getRole(b) === "") {
                return 1;
              }
              if (this.getRole(a) === this.getRole(b)) {
                return 0;
              }
              return this.getRole(b) < this.getRole(a) ? -1 : 1;
            })
          )
        )
      );
      this.columnSettings[1].activeArrow = false;
    } else {
      this.columnSettings[1].orderStyle = !this.columnSettings[1].orderStyle;
      this.orderSessionsByStartTime();
    }
  }

  orderSessionsByType(orderStyle: boolean): void {
    this.resetArrowsExcept(2);
    if (!orderStyle) {
      this.columnSettings[2].activeArrow = true;
      globalOrderingFilter.next(JSON.parse(JSON.stringify(this.eGlobalFilteredSessions.sort((a, b) => a.type.localeCompare(b.type)))));
      this.columnSettings[2].orderStyle = !this.columnSettings[2].orderStyle;
    } else if (this.columnSettings[2].activeArrow) {
      globalOrderingFilter.next(JSON.parse(JSON.stringify(this.eGlobalFilteredSessions.sort((a, b) => b.type.localeCompare(a.type)))));
      this.columnSettings[2].activeArrow = false;
    } else {
      this.columnSettings[2].orderStyle = !this.columnSettings[2].orderStyle;
      this.orderSessionsByStartTime();
    }
  }

  orderSessionsByNamedProfile(orderStyle: boolean): void {
    if (!orderStyle) {
      this.columnSettings[3].activeArrow = true;
      globalOrderingFilter.next(
        JSON.parse(
          JSON.stringify(
            this.eGlobalFilteredSessions.sort((a, b) =>
              this.sessionCard
                .getProfileName(this.sessionCard.getProfileId(a))
                .localeCompare(this.sessionCard.getProfileName(this.sessionCard.getProfileId(b)))
            )
          )
        )
      );
      this.columnSettings[3].orderStyle = !this.columnSettings[3].orderStyle;
    } else if (this.columnSettings[3].activeArrow) {
      globalOrderingFilter.next(
        JSON.parse(
          JSON.stringify(
            this.eGlobalFilteredSessions.sort((a, b) =>
              this.sessionCard
                .getProfileName(this.sessionCard.getProfileId(b))
                .localeCompare(this.sessionCard.getProfileName(this.sessionCard.getProfileId(a)))
            )
          )
        )
      );
      this.columnSettings[3].activeArrow = false;
    } else {
      this.columnSettings[3].orderStyle = !this.columnSettings[3].orderStyle;
      this.orderSessionsByStartTime();
    }
  }

  orderSessionsByNamedRegion(orderStyle: boolean): void {
    this.resetArrowsExcept(4);
    if (!orderStyle) {
      this.columnSettings[4].activeArrow = true;
      globalOrderingFilter.next(JSON.parse(JSON.stringify(this.eGlobalFilteredSessions.sort((a, b) => a.region.localeCompare(b.region)))));
      this.columnSettings[4].orderStyle = !this.columnSettings[4].orderStyle;
    } else if (this.columnSettings[4].activeArrow) {
      globalOrderingFilter.next(JSON.parse(JSON.stringify(this.eGlobalFilteredSessions.sort((a, b) => b.region.localeCompare(a.region)))));
      this.columnSettings[4].activeArrow = false;
    } else {
      this.columnSettings[4].orderStyle = !this.columnSettings[4].orderStyle;
      this.orderSessionsByStartTime();
    }
  }

  orderSessionsByStartTime(): void {
    globalOrderingFilter.next(
      JSON.parse(
        JSON.stringify(
          this.eGlobalFilteredSessions.sort((a, b) => {
            if (a.startDateTime === undefined) {
              return "z".localeCompare(b.startDateTime);
            } else if (b.startDateTime === undefined) {
              return a.startDateTime.localeCompare("z");
            } else if (!a.startDateTime && !b.startDateTime) {
              return "z".localeCompare("z");
            } else {
              return a.startDateTime.localeCompare(b.startDateTime);
            }
          })
        )
      )
    );
  }

  getRole(s: Session): string {
    switch (s.type) {
      case SessionType.awsIamRoleFederated:
        return (s as AwsIamRoleFederatedSession).roleArn.split("role/")[1];
      case SessionType.azure:
        return (s as AzureSession).subscriptionId;
      case SessionType.awsIamUser:
        return "";
      case SessionType.awsSsoRole:
        const splittedRoleArn = (s as AwsSsoRoleSession).roleArn.split("/");
        splittedRoleArn.splice(0, 1);
        return splittedRoleArn.join("/");
      case SessionType.awsIamRoleChained:
        return (s as AwsIamRoleChainedSession).roleArn.split("role/")[1];
      default:
        return "";
    }
  }

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

  async ssmModalOpen(): Promise<void> {}

  async editCurrentSession(): Promise<void> {
    this.modalService.show(EditDialogComponent, {
      animated: false,
      class: "edit-modal",
      initialState: { selectedSessionId: this.selectedSession.sessionId },
    });
  }

  async pinSession(): Promise<void> {}

  async unpinSession(): Promise<void> {}

  async deleteSession(): Promise<void> {}

  private resetArrowsExcept(c): void {
    this.columnSettings.forEach((column, index) => {
      if (index !== c) {
        column.orderStyle = false;
        column.activeArrow = false;
      }
    });
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

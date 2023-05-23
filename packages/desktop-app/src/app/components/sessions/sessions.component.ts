import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
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
import { SessionType } from "@noovolari/leapp-core/models/session-type";
import { AwsIamRoleFederatedSession } from "@noovolari/leapp-core/models/aws/aws-iam-role-federated-session";
import { AzureSession } from "@noovolari/leapp-core/models/azure/azure-session";
import { AwsSsoRoleSession } from "@noovolari/leapp-core/models/aws/aws-sso-role-session";
import { AwsIamRoleChainedSession } from "@noovolari/leapp-core/models/aws/aws-iam-role-chained-session";
import { SessionSelectionState } from "@noovolari/leapp-core/models/session-selection-state";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { OptionsService } from "../../services/options.service";
import { AwsIamUserSession } from "@noovolari/leapp-core/models/aws/aws-iam-user-session";
import { FilteringPipe } from "./pipes/filtering.pipe";

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
  eGlobalColumnsCount: number;
  eSessionType = SessionType;
  eSessionStatus = SessionStatus;
  columnCount = 0;

  showOnly = "ALL";

  // For column ordering
  columnSettings: ArrowSettings[];

  selectedSession?: Session;

  private subscriptions = [];
  private sessionFiltering;

  private behaviouralSubjectService: BehaviouralSubjectService;

  constructor(private modalService: BsModalService, private appProviderService: AppProviderService, public optionService: OptionsService) {
    this.sessionFiltering = new FilteringPipe();
    this.behaviouralSubjectService = this.appProviderService.behaviouralSubjectService;
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
      this.columnCount = 0;
      this.eGlobalColumns = value;
      for (const [_, objValue] of Object.entries(this.eGlobalColumns)) {
        if (objValue === true) {
          this.columnCount++;
        }
      }
      this.eGlobalColumnsCount = this.columnCount;
    });
    const subscription6 = this.behaviouralSubjectService.sessionSelections$.subscribe((sessionSelections: SessionSelectionState[]) => {
      const sessionsCssClasses = document.querySelector(".sessions")?.classList;
      if (sessionSelections.length > 0) {
        this.selectedSession = this.eGlobalFilteredSessions.find((session) => session.sessionId === sessionSelections[0].sessionId);
        sessionsCssClasses?.add("option-bar-opened");
      } else {
        this.selectedSession = undefined;
        sessionsCssClasses?.remove("option-bar-opened");
      }
    });

    this.subscriptions.push(subscription, subscription2, subscription3, subscription4, subscription5, subscription6);
    globalOrderingFilter.next(JSON.parse(JSON.stringify(this.behaviouralSubjectService.sessions)));
  }

  get orderedSessions(): Session[] {
    return [
      ...this.sessionFiltering.transform(this.eGlobalFilteredSessions, true),
      ...this.sessionFiltering.transform(this.eGlobalFilteredSessions, false),
    ];
  }

  ngOnInit(): void {
    this.myUndefinedFunction();
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

  // TODO: verify this sorting!
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
        JSON.parse(JSON.stringify(this.eGlobalFilteredSessions.sort((a, b) => this.getProfileName(a).localeCompare(this.getProfileName(b)))))
      );
      this.columnSettings[3].orderStyle = !this.columnSettings[3].orderStyle;
    } else if (this.columnSettings[3].activeArrow) {
      globalOrderingFilter.next(
        JSON.parse(JSON.stringify(this.eGlobalFilteredSessions.sort((a, b) => this.getProfileName(b).localeCompare(this.getProfileName(a)))))
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

  private getProfileName(session: Session): string {
    try {
      return this.appProviderService.namedProfileService.getProfileName((session as AwsIamUserSession).profileId);
    } catch (e) {}
    return "";
  }

  private resetArrowsExcept(c): void {
    this.columnSettings.forEach((column, index) => {
      if (index !== c) {
        column.orderStyle = false;
        column.activeArrow = false;
      }
    });
  }

  private myUndefinedFunction() {
    throw new Error("Error from undefined test function");
  }
}

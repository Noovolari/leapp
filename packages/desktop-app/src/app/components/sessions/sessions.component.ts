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
import { Session } from "@hesketh-racing/leapp-core/models/session";
import { GlobalFilters } from "@hesketh-racing/leapp-core/models/segment";
import { BehaviouralSubjectService } from "@hesketh-racing/leapp-core/services/behavioural-subject-service";
import { AppProviderService } from "../../services/app-provider.service";
import { AwsCoreService } from "@hesketh-racing/leapp-core/services/aws-core-service";
import { SessionType } from "@hesketh-racing/leapp-core/models/session-type";
import { AwsIamRoleFederatedSession } from "@hesketh-racing/leapp-core/models/aws/aws-iam-role-federated-session";
import { AzureSession } from "@hesketh-racing/leapp-core/models/azure/azure-session";
import { AwsSsoRoleSession } from "@hesketh-racing/leapp-core/models/aws/aws-sso-role-session";
import { AwsIamRoleChainedSession } from "@hesketh-racing/leapp-core/models/aws/aws-iam-role-chained-session";

export const optionBarIds = {};
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

  private subscriptions = [];
  private awsCoreService: AwsCoreService;

  private behaviouralSubjectService: BehaviouralSubjectService;

  constructor(
    private ref: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private httpClient: HttpClient,
    private modalService: BsModalService,
    private appService: AppService,
    private leappCoreService: AppProviderService
  ) {
    this.behaviouralSubjectService = this.leappCoreService.behaviouralSubjectService;
    this.awsCoreService = this.leappCoreService.awsCoreService;

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

    this.subscriptions.push(subscription);
    this.subscriptions.push(subscription2);
    this.subscriptions.push(subscription3);
    this.subscriptions.push(subscription4);
    this.subscriptions.push(subscription5);

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

  private resetArrowsExcept(c): void {
    this.columnSettings.forEach((column, index) => {
      if (index !== c) {
        column.orderStyle = false;
        column.activeArrow = false;
      }
    });
  }
}

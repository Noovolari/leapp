import { Component, OnDestroy, OnInit } from "@angular/core";
import { AppService } from "../../../services/app.service";
import { AppProviderService } from "../../../services/app-provider.service";
import { BehaviouralSubjectService } from "@noovolari/leapp-core/services/behavioural-subject-service";
import { LoggedEntry, LogLevel } from "@noovolari/leapp-core/services/log-service";
import { LoginWorkspaceDialogComponent } from "../login-team-dialog/login-workspace-dialog.component";
import { BsModalService } from "ngx-bootstrap/modal";
import { globalFilteredSessions, globalHasFilter, globalResetFilter } from "../../command-bar/command-bar.component";
import { sidebarHighlight } from "../../side-bar/side-bar.component";
import { WorkspaceState } from "../../../services/team-service";
import { globalLeappProPlanStatus, LeappPlanStatus } from "../options-dialog/options-dialog.component";
import { AnalyticsService } from "../../../services/analytics.service";

@Component({
  selector: "app-manage-team-workspaces-dialog",
  templateUrl: "./manage-team-workspaces-dialog.component.html",
  styleUrls: ["./manage-team-workspaces-dialog.component.scss"],
})
export class ManageTeamWorkspacesDialogComponent implements OnInit, OnDestroy {
  workspacesState: WorkspaceState[];

  private behaviouralSubjectService: BehaviouralSubjectService;
  private unsubscribe: () => void;

  get isWorkspaceLocked(): boolean {
    return !!this.workspacesState.find((state) => state.locked);
  }

  constructor(
    private appProviderService: AppProviderService,
    public appService: AppService,
    private bsModalService: BsModalService,
    private readonly analyticsService: AnalyticsService
  ) {
    this.behaviouralSubjectService = appProviderService.behaviouralSubjectService;
  }

  ngOnInit(): void {
    const workspaceStateSubscription = this.appProviderService.teamService.workspacesState.subscribe(
      (workspacesState: WorkspaceState[]) => (this.workspacesState = workspacesState)
    );
    this.unsubscribe = () => {
      workspaceStateSubscription.unsubscribe();
    };
  }

  ngOnDestroy(): void {
    this.unsubscribe();
  }

  closeModal(): void {
    this.appService.closeModal();
  }

  async syncWorkspace(): Promise<void> {
    try {
      this.closeModal();
      await this.switchToRemoteWorkspace();
    } catch (error) {
      this.appProviderService.logService.log(new LoggedEntry(error.message, this, LogLevel.error, true));
    }
  }

  async signOutFromWorkspace(): Promise<void> {
    try {
      await this.appProviderService.teamService.signOut();
      this.appService.closeAllMenuTriggers();
      globalLeappProPlanStatus.next(LeappPlanStatus.free);
      await this.appProviderService.keychainService.saveSecret("Leapp", "leapp-enabled-plan", LeappPlanStatus.free);
      this.analyticsService.captureEvent("Sign Out", undefined, false, true);
    } catch (error) {
      this.appProviderService.logService.log(new LoggedEntry(error.message, this, LogLevel.error, true));
    }
  }

  async switchToRemoteWorkspace(): Promise<void> {
    if (this.isWorkspaceLocked) {
      await this.loginToWorkspace();
    } else {
      await this.appProviderService.teamService.pullFromRemote();
      this.resetFilters();
    }
  }

  async loginToWorkspace(): Promise<void> {
    this.bsModalService.show(LoginWorkspaceDialogComponent, {
      animated: false,
      class: "create-modal",
      backdrop: "static",
      keyboard: false,
    });
  }

  resetFilters(): void {
    document.querySelector(".sessions").classList.remove("filtered");
    sidebarHighlight.next({ showAll: true, showPinned: false, selectedSegment: -1 });
    globalFilteredSessions.next(this.behaviouralSubjectService.sessions);
    globalHasFilter.next(false);
    globalResetFilter.next(true);
  }
}

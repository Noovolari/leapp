import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import {
  globalFilteredSessions,
  globalFilterGroup,
  globalHasFilter,
  globalResetFilter,
  globalSegmentFilter,
} from "../command-bar/command-bar.component";
import { BehaviorSubject } from "rxjs";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { ConfirmationDialogComponent } from "../dialogs/confirmation-dialog/confirmation-dialog.component";
import Segment from "@noovolari/leapp-core/models/segment";
import Folder from "@noovolari/leapp-core/models/folder";
import { BehaviouralSubjectService } from "@noovolari/leapp-core/services/behavioural-subject-service";
import { AppProviderService } from "../../services/app-provider.service";
import { constants } from "@noovolari/leapp-core/models/constants";
import { integrationHighlight } from "../integration-bar/integration-bar.component";
import { MatMenuTrigger } from "@angular/material/menu";
import { AppService } from "../../services/app.service";
import { OptionsDialogComponent } from "../dialogs/options-dialog/options-dialog.component";
import { LoginWorkspaceDialogComponent } from "../dialogs/login-team-dialog/login-workspace-dialog.component";
import { ManageTeamWorkspacesDialogComponent } from "../dialogs/manage-team-workspaces-dialog/manage-team-workspaces-dialog.component";
import { WorkspaceState } from "../../services/team-service";

export interface SelectedSegment {
  name: string;
  selected: boolean;
}

export interface HighlightSettings {
  showAll: boolean;
  showPinned: boolean;
  selectedSegment?: number;
}

export const segmentFilter = new BehaviorSubject<Segment[]>([]);
export const sidebarHighlight = new BehaviorSubject<HighlightSettings>({ showAll: false, showPinned: true, selectedSegment: -1 });

@Component({
  selector: "app-side-bar",
  templateUrl: "./side-bar.component.html",
  styleUrls: ["./side-bar.component.scss"],
})
export class SideBarComponent implements OnInit, OnDestroy {
  @ViewChild("workspaceSelectionTrigger")
  workspaceSelectionTrigger: MatMenuTrigger;

  folders: Folder[];
  segments: Segment[];
  selectedS: SelectedSegment[];
  subscription;
  showAll: boolean;
  showPinned: boolean;
  modalRef: BsModalRef;
  workspacesState: WorkspaceState[];
  isLeappTeamStubbed: boolean;

  private behaviouralSubjectService: BehaviouralSubjectService;
  private userSubscription;
  private workspaceNameSubscription;

  constructor(private bsModalService: BsModalService, private appProviderService: AppProviderService, private appService: AppService) {
    this.behaviouralSubjectService = appProviderService.behaviouralSubjectService;
    this.showAll = true;
    this.showPinned = false;
  }

  get isLocalWorkspaceSelected(): boolean {
    return !!this.workspacesState.find((state) => state.type === "local" && state.selected);
  }

  get doesRemoteWorkspaceExist(): boolean {
    return !!this.workspacesState.find((state) => state.type !== "local");
  }

  get canLockWorkspace(): boolean {
    return !!this.workspacesState.find((state) => state.type === "team" && !state.locked);
  }

  get selectedWorkspace(): WorkspaceState {
    return this.workspacesState.find((state) => state.selected);
  }

  ngOnInit(): void {
    this.subscription = segmentFilter.subscribe((segments) => {
      this.segments = segments;
      this.selectedS = this.segments.map((segment) => ({ name: segment.name, selected: false }));
    });
    segmentFilter.next(this.appProviderService.segmentService.list());

    sidebarHighlight.subscribe((value) => {
      this.highlightSelectedRow(value.showAll, value.showPinned, value.selectedSegment);
    });
    sidebarHighlight.next({ showAll: true, showPinned: false, selectedSegment: -1 });

    this.workspaceNameSubscription = this.appProviderService.teamService.workspacesState.subscribe((workspacesState: WorkspaceState[]) => {
      this.workspacesState = workspacesState;
    });
    this.isLeappTeamStubbed = this.appProviderService.teamService.isLeappTeamStubbed;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.workspaceNameSubscription.unsubscribe();
    this.userSubscription.unsubscribe();
  }

  resetFilters(): void {
    document.querySelector(".sessions").classList.remove("filtered");
    sidebarHighlight.next({ showAll: true, showPinned: false, selectedSegment: -1 });
    globalFilteredSessions.next(this.behaviouralSubjectService.sessions);
    globalHasFilter.next(false);
    globalResetFilter.next(true);
  }

  showOnlyPinned(): void {
    sidebarHighlight.next({ showAll: false, showPinned: true, selectedSegment: -1 });
    const globalFilters = globalFilterGroup.value;
    globalFilters.integrationFilter = [];
    globalFilters.pinnedFilter = true;
    globalFilterGroup.next(globalFilters);
  }

  applySegmentFilter(segment: Segment, event: any): void {
    event.preventDefault();
    event.stopPropagation();

    const selectedIndex = this.selectedS.findIndex((s) => s.name === segment.name);
    this.selectedS[selectedIndex].selected = true;
    this.behaviouralSubjectService.unselectSessions();
    sidebarHighlight.next({ showAll: false, showPinned: false, selectedSegment: selectedIndex });
    globalSegmentFilter.next(JSON.parse(JSON.stringify(segment)));
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  deleteSegment(segment: Segment, event: any): void {
    event.preventDefault();
    event.stopPropagation();

    this.appProviderService.segmentService.removeSegment(segment);
    this.segments = JSON.parse(JSON.stringify(this.appProviderService.segmentService.list()));
  }

  selectedSegmentCheck(segment: Segment): string {
    const index = this.selectedS.findIndex((s) => s.name === segment.name);
    return this.selectedS[index].selected ? "selected-segment" : "";
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  showConfirmationDialog(segment: Segment, event: any): void {
    const message = `Are you sure you want to delete the segment "${segment.name}"?`;
    const confirmText = "Delete";
    const callback = (answerString: string) => {
      if (answerString === constants.confirmed.toString()) {
        this.deleteSegment(segment, event);
      }
    };
    this.modalRef = this.bsModalService.show(ConfirmationDialogComponent, {
      animated: false,
      initialState: {
        message,
        callback,
        confirmText,
      },
    });
  }

  highlightSelectedRow(showAll: boolean, showPinned: boolean, selectedSegmentIndex?: number): void {
    this.showAll = showAll;
    this.showPinned = showPinned;
    this.selectedS.forEach((s) => (s.selected = false));
    if (selectedSegmentIndex >= 0) {
      this.selectedS[selectedSegmentIndex].selected = true;
    }
    integrationHighlight.next(-1);
  }

  setTrigger(event: any): void {
    event.preventDefault();
    event.stopPropagation();
    setTimeout(() => {
      this.workspaceSelectionTrigger.openMenu();
      this.appService.setMenuTrigger(this.workspaceSelectionTrigger);
    }, 100);
  }

  showOptionDialog(): void {
    this.bsModalService.show(OptionsDialogComponent, { animated: false, class: "option-modal" });
  }

  async loginToRemoteWorkspace(): Promise<void> {
    if (this.isLeappTeamStubbed) return;
    this.bsModalService.show(LoginWorkspaceDialogComponent, {
      animated: false,
      class: "create-modal",
      backdrop: "static",
      keyboard: false,
    });
  }

  async logoutFromRemoteWorkspace(lock: boolean = false): Promise<void> {
    if (!this.canLockWorkspace || this.isLeappTeamStubbed) return;
    await this.appProviderService.teamService.signOut(lock);
  }

  async switchToWorkspace(workspace: WorkspaceState) {
    if (workspace.type === "local") {
      if (this.isLocalWorkspaceSelected) return;
      await this.appProviderService.teamService.switchToLocalWorkspace();
      this.resetFilters();
    } else if (workspace.locked) {
      await this.loginToRemoteWorkspace();
    } else {
      if (!this.isLocalWorkspaceSelected) return;
      await this.appProviderService.sessionManagementService.stopAllSessions();
      await this.appProviderService.teamService.syncSecrets();
      this.resetFilters();
    }
  }

  showManageWorkspacesDialog(): void {
    if (this.isLeappTeamStubbed) return;
    this.bsModalService.show(ManageTeamWorkspacesDialogComponent, {
      animated: false,
      class: "create-modal",
      backdrop: "static",
      keyboard: false,
    });
  }

  openWorkspaceDocumentation(): void {
    this.appProviderService.windowService.openExternalUrl("https://docs.leapp.cloud/latest/workspaces/");
  }
}

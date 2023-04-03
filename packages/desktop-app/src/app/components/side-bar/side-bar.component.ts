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
import { User } from "leapp-team-core/user/user";
import { MatMenuTrigger } from "@angular/material/menu";
import { AppService } from "../../services/app.service";

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
  workspaceName: string;
  teamUser: User;

  private behaviouralSubjectService: BehaviouralSubjectService;
  private userSubscription;

  constructor(private bsModalService: BsModalService, private leappCoreService: AppProviderService, private appService: AppService) {
    this.behaviouralSubjectService = leappCoreService.behaviouralSubjectService;
    this.showAll = true;
    this.showPinned = false;
    this.workspaceName = this.leappCoreService.workspaceFileNameService.getWorkspaceName();
    this.teamUser = null;
  }

  ngOnInit(): void {
    this.subscription = segmentFilter.subscribe((segments) => {
      this.segments = segments;
      this.selectedS = this.segments.map((segment) => ({ name: segment.name, selected: false }));
    });
    segmentFilter.next(this.leappCoreService.segmentService.list());

    sidebarHighlight.subscribe((value) => {
      this.highlightSelectedRow(value.showAll, value.showPinned, value.selectedSegment);
    });
    sidebarHighlight.next({ showAll: true, showPinned: false, selectedSegment: -1 });

    this.leappCoreService.workspaceFileNameService.workspaceFileNameBehaviouralSubject.subscribe(() => {
      this.workspaceName = this.leappCoreService.workspaceFileNameService.getWorkspaceName();
    });
    this.userSubscription = this.leappCoreService.teamService.signedInUserState.subscribe((user: User) => (this.teamUser = user));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
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

    this.leappCoreService.segmentService.removeSegment(segment);
    this.segments = JSON.parse(JSON.stringify(this.leappCoreService.segmentService.list()));
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

  async switchWorkspace(selectedWorkspace?: string): Promise<void> {
    if (selectedWorkspace === "local") {
      this.leappCoreService.teamService.switchToLocal();
    } else {
      this.leappCoreService.teamService.syncSecrets(this.leappCoreService.teamService.signedInUser$.getValue());
    }
  }
}

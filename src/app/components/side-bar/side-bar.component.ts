import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {WorkspaceService} from '../../services/workspace.service';
import Folder from '../../models/folder';
import Segment from '../../models/Segment';
import {
  globalFilteredSessions,
  globalHasFilter,
  globalResetFilter, globalSegmentFilter
} from '../command-bar/command-bar.component';
import {Session} from '../../models/session';
import {BehaviorSubject, Observable} from 'rxjs';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {ConfirmationDialogComponent} from '../dialogs/confirmation-dialog/confirmation-dialog.component';
import {Constants} from '../../models/constants';
import {IntegrationBarComponent, integrationHighlight} from "../integration-bar/integration-bar.component";

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
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss']
})
export class SideBarComponent implements OnInit, OnDestroy {

  folders: Folder[];
  segments: Segment[];
  selectedS: SelectedSegment[];
  subscription;
  showAll: boolean;
  showPinned: boolean;
  modalRef: BsModalRef;

  constructor(private workspaceService: WorkspaceService, private bsModalService: BsModalService) {
  }

  ngOnInit(): void {
    this.subscription = segmentFilter.subscribe(segments => {
      this.segments = segments;
      this.selectedS = this.segments.map(segment => ({ name: segment.name, selected: false }));
    });
    segmentFilter.next(this.workspaceService.getSegments());

    sidebarHighlight.subscribe(value => {
       this.highlightSelectedRow(value.showAll, value.showPinned, value.selectedSegment);
     })
    sidebarHighlight.next({showAll: true, showPinned: false, selectedSegment: -1});
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  resetFilters() {
    document.querySelector('.sessions').classList.remove('filtered');
    sidebarHighlight.next({showAll: true, showPinned: false, selectedSegment: -1});
    globalFilteredSessions.next(this.workspaceService.sessions);
    globalHasFilter.next(false);
    globalResetFilter.next(true);
  }

  showOnlyPinned() {
    sidebarHighlight.next({showAll: false, showPinned: true, selectedSegment: -1});
    globalFilteredSessions.next(this.workspaceService.sessions.filter((s: Session) => this.workspaceService.getWorkspace().pinned.indexOf(s.sessionId) !== -1));
  }

  applySegmentFilter(segment: Segment, event) {
    event.preventDefault();
    event.stopPropagation();

    const selectedIndex = this.selectedS.findIndex(s => s.name === segment.name);
    document.querySelector('.sessions').classList.remove('option-bar-opened');
    sidebarHighlight.next({showAll: false, showPinned: false, selectedSegment: selectedIndex});
    globalSegmentFilter.next(JSON.parse(JSON.stringify(segment)));
  }

  deleteSegment(segment: Segment, event) {
    event.preventDefault();
    event.stopPropagation();
    this.workspaceService.removeSegment(segment);
    this.segments = JSON.parse(JSON.stringify(this.workspaceService.getSegments()));
  }

  selectedSegmentCheck(segment: Segment) {
    const index = this.selectedS.findIndex(s => s.name === segment.name);
    return this.selectedS[index].selected ? 'selected-segment' : '';
  }

  showConfirmationDialog(segment: Segment, event) {
    const message = `Are you sure you want to delete the segment "${segment.name}"?`;
    const confirmText = 'Delete';
    const callback = (answerString: string) => {
      if(answerString === Constants.confirmed.toString()) {
        this.deleteSegment(segment, event);
      }
    };
    this.modalRef = this.bsModalService.show(ConfirmationDialogComponent, {
      animated: false,
      initialState: {
        message,
        callback,
        confirmText
      }
    });
  }

  highlightSelectedRow(showAll: boolean, showPinned: boolean, selectedSegmentIndex?: number) {
    this.showAll = showAll;
    this.showPinned = showPinned;
    this.selectedS.forEach(s => s.selected = false);
    if(selectedSegmentIndex >= 0) {
      this.selectedS[selectedSegmentIndex].selected = true;
    }
    integrationHighlight.next(-1);
  }
}

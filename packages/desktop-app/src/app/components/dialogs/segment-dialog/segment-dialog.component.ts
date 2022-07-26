import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { AppService } from "../../../services/app.service";
import { FormControl, FormGroup } from "@angular/forms";
import { globalFilterGroup } from "../../command-bar/command-bar.component";
import { NgSelectComponent } from "@ng-select/ng-select";
import { segmentFilter } from "../../side-bar/side-bar.component";
import Segment from "@noovolari/leapp-core/models/segment";
import { AppProviderService } from "../../../services/app-provider.service";

@Component({
  selector: "app-segment-dialog",
  templateUrl: "./segment-dialog.component.html",
  styleUrls: ["./segment-dialog.component.scss"],
})
export class SegmentDialogComponent implements OnInit, OnDestroy {
  @ViewChild("ngSelectComponent")
  ngSelectComponent: NgSelectComponent;

  form = new FormGroup({
    segmentName: new FormControl(""),
  });

  selectedSegment;
  segments: Segment[];

  currentFilterGroup;
  temporaryName;

  private subscription;

  constructor(private appService: AppService, private appProviderService: AppProviderService) {
    this.temporaryName = "";
    this.segments = [...this.appProviderService.segmentService.list()];
    this.subscription = globalFilterGroup.subscribe((value) => (this.currentFilterGroup = Object.assign({}, value)));
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  addNewSegment(): void {
    const newSegment = { name: this.temporaryName, filterGroup: Object.assign({}, this.currentFilterGroup) };

    this.segments.push(newSegment);
    this.segments = [...this.segments];
  }

  saveSegment(): void {
    const segments = [...this.appProviderService.segmentService.list()];
    const index = segments.findIndex((s) => s.name === this.selectedSegment);
    if (index === -1) {
      segments.push({ name: this.selectedSegment, filterGroup: this.currentFilterGroup });
    } else {
      segments[index].filterGroup = this.currentFilterGroup;
    }
    this.appProviderService.segmentService.setSegments(segments);
    segmentFilter.next(this.appProviderService.segmentService.list());
    this.appService.closeModal();
  }

  closeModal(): void {
    this.appService.closeModal();
  }

  checkNewSegment(): boolean {
    return this.temporaryName !== "" && this.segments.filter((s) => s.name.indexOf(this.temporaryName) > -1).length === 0;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  setTemporaryName($event: any): void {
    this.temporaryName = $event.target.value;
  }

  formValid(): boolean {
    return this.form.get("segmentName").valid;
  }

  setByEnter(): void {
    if (this.checkNewSegment()) {
      this.addNewSegment();
    }
  }
}

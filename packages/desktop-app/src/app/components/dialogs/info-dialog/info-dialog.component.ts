import { Component, Input, OnInit } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";

@Component({
  selector: "app-info-dialog",
  templateUrl: "./info-dialog.component.html",
  styleUrls: ["./info-dialog.component.scss"],
})
export class InfoDialogComponent implements OnInit {
  @Input()
  title: string;

  @Input()
  releaseNotes: string;

  constructor(private bsModalRef: BsModalRef) {}

  ngOnInit(): void {}

  close(): void {
    this.bsModalRef.hide();
  }
}

import { Component, Input, OnInit, ViewEncapsulation } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { constants } from "@hesketh-racing/leapp-core/models/constants";

@Component({
  selector: "app-update-dialog",
  templateUrl: "./update-dialog.component.html",
  styleUrls: ["./update-dialog.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class UpdateDialogComponent implements OnInit {
  @Input()
  version: string;
  @Input()
  releaseDate: string;
  @Input()
  releaseNotes: string;
  @Input()
  callback: any;

  /* Just a restyled modal to show a confirmation for delete actions */
  constructor(private bsModalRef: BsModalRef) {}

  ngOnInit(): void {}

  close(): void {
    this.remindMeLater();
  }

  remindMeLater(): void {
    if (this.callback) {
      this.callback(constants.confirmClosedAndIgnoreUpdate);
    }
    this.bsModalRef.hide();
  }

  goToDownloadPage(): void {
    if (this.callback) {
      this.callback(constants.confirmCloseAndDownloadUpdate);
    }
    this.bsModalRef.hide();
  }
}

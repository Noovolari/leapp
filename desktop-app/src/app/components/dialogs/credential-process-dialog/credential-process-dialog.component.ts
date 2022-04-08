import { Component, Input, OnInit } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { constants } from "@noovolari/leapp-core/models/constants";
import { WindowService } from "../../../services/window.service";

@Component({
  selector: "app-credential-process-dialog",
  templateUrl: "./credential-process-dialog.component.html",
  styleUrls: ["./credential-process-dialog.component.scss"],
})
export class CredentialProcessDialogComponent implements OnInit {
  @Input()
  callback: any;

  @Input()
  confirmText: string;

  @Input()
  cancelText: string;

  /* Just a restyled modal to show a confirmation for delete actions */
  constructor(private bsModalRef: BsModalRef, private windowService: WindowService) {}

  ngOnInit(): void {}

  /**
   * Launch a callback on yes (which is the actual action), then close
   */
  confirm(): void {
    if (this.callback) {
      this.bsModalRef.hide();
      this.callback(constants.confirmed);
    }
  }

  close(): void {
    if (this.callback) {
      this.bsModalRef.hide();
      this.callback(constants.confirmClosed);
    }
  }

  openDoc(): void {
    this.windowService.openExternalUrl("https://docs.leapp.cloud/latest/cli/");
  }
}

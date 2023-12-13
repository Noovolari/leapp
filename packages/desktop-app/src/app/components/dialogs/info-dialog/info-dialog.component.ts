import { Component, Input, OnInit } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { WindowService } from "../../../services/window.service";

@Component({
  selector: "app-info-dialog",
  templateUrl: "./info-dialog.component.html",
  styleUrls: ["./info-dialog.component.scss"],
})
export class InfoDialogComponent implements OnInit {
  @Input()
  title: string;

  @Input()
  description: string;

  @Input()
  link?: string;

  @Input()
  buttonName?: string;

  constructor(private readonly bsModalRef: BsModalRef, private readonly windowService: WindowService) {}

  ngOnInit(): void {}

  closeAndOpenLink(): void {
    if (this.link) {
      this.windowService.openExternalUrl(this.link);
    }
    this.close();
  }

  manageLinkEvents(event: any): void {
    if (event?.target?.localName === "a" && event?.target?.href) {
      this.windowService.openExternalUrl(event.target.href);
    }
  }

  close(): void {
    this.bsModalRef.hide();
  }
}

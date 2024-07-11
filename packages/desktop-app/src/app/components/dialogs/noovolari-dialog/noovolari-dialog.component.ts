import { Component, Input, OnInit } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { WindowService } from "../../../services/window.service";
import { OptionsService } from "../../../services/options.service";
import { constants } from "@noovolari/leapp-core/models/constants";

@Component({
  selector: "app-noovolari-dialog",
  templateUrl: "./noovolari-dialog.component.html",
  styleUrls: ["./noovolari-dialog.component.scss"],
})
export class NoovolariDialogComponent implements OnInit {
  @Input()
  title: string;

  @Input()
  description: string;

  @Input()
  link?: string;

  @Input()
  buttonName?: string;

  eConstants = constants;

  constructor(public optionsService: OptionsService, private readonly bsModalRef: BsModalRef, private readonly windowService: WindowService) {}

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

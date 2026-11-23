import { Component, Input, ChangeDetectionStrategy, ViewEncapsulation } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { constants } from "@noovolari/leapp-core/models/constants";

// The update dialog. The notes arrive already rendered by UpdaterService (Markdown without
// raw HTML) and still go through Angular's sanitiser ([innerHTML]). No view encapsulation, as in 0.26.1: the styles
// reach the rendered notes.
@Component({
  selector: "app-update-dialog",
  templateUrl: "./update-dialog.component.html",
  styleUrls: ["./update-dialog.component.scss"],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class UpdateDialogComponent {
  @Input()
  version: string;
  @Input()
  releaseDate: string;
  @Input()
  releaseNotes: string;
  @Input()
  callback: (event: string) => void;

  constructor(private readonly bsModalRef: BsModalRef) {}

  close(): void {
    this.remindMeLater();
  }

  remindMeLater(): void {
    this.answer(constants.confirmClosedAndIgnoreUpdate);
  }

  goToDownloadPage(): void {
    this.answer(constants.confirmCloseAndDownloadUpdate);
  }

  private answer(event: string): void {
    if (this.callback) {
      this.callback(event);
    }
    this.bsModalRef.hide();
  }
}

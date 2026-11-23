import { Injectable } from "@angular/core";
import { BsModalService } from "ngx-bootstrap/modal";
import { InputDialogComponent } from "../components/dialogs/input-dialog/input-dialog.component";
import { AppNativeService } from "./app-native.service";
import { IMfaCodePrompter } from "@noovolari/leapp-core/interfaces/i-mfa-code-prompter";
import { escapeHtml } from "./escape-html";

@Injectable({
  providedIn: "root",
})
export class AppMfaCodePromptService implements IMfaCodePrompter {
  private _keepUnderlyingModals;

  constructor(private modalService: BsModalService, private electronService: AppNativeService) {
    this._keepUnderlyingModals = false;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  promptForMFACode(sessionName: string, callback: any): void {
    // the dialog renders HTML, the OS notification plain text
    const message = `please insert MFA code from your app or device for ${sessionName}`;
    this.inputDialog(
      "MFA Code insert",
      "Insert MFA Code",
      message,
      callback,
      `please insert MFA code from your app or device for ${escapeHtml(sessionName)}`
    );
  }

  set keepUnderlyingModal(keep: boolean) {
    this._keepUnderlyingModals = keep;
  }

  /**
   * Input dialog popup!
   *
   * @param title - the title of the popup
   * @param placeholder - placeholder for the input
   * @param message - the message to show, as plain text (OS notification)
   * @param callback - the callback for the ok button to launch
   * @param html - the same message as HTML for the dialog, with names escaped
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  private inputDialog(title: string, placeholder: string, message: string, callback: any, html = message) {
    if (!this._keepUnderlyingModals) {
      for (let i = 1; i <= this.modalService.getModalsCount(); i++) {
        this.modalService.hide(i);
      }
    }

    this.electronService.currentWindow.show();
    this.newNotification("MFA Token needed", message);
    this.modalService.show(InputDialogComponent, {
      backdrop: "static",
      animated: false,
      class: "confirm-modal",
      initialState: { title, placeholder, message: html, callback },
    });
  }

  private newNotification(title: string, message: string): void {
    new this.electronService.notification({ title, body: message, icon: __dirname + `/assets/images/Leapp.png` }).show();
  }
}

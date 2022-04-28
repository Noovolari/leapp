import { Injectable } from "@angular/core";
import { AppNativeService } from "./app-native.service";
import { environment } from "../../environments/environment";
import { ConfirmationDialogComponent } from "../components/dialogs/confirmation-dialog/confirmation-dialog.component";
import { BsModalService } from "ngx-bootstrap/modal";
import { IOpenExternalUrlService } from "@noovolari/leapp-core/interfaces/i-open-external-url-service";
import { AppProviderService } from "./app-provider.service";
import { LoggedEntry, LogLevel } from "@noovolari/leapp-core/services/log-service";

@Injectable({
  providedIn: "root",
})
export class WindowService implements IOpenExternalUrlService {
  private currentWindow: any;
  private windowOs = "win32";

  constructor(private modalService: BsModalService, private electronService: AppNativeService, private appProviderService: AppProviderService) {}

  /**
   * Create a new browser window
   *
   * @param url - the url to point to launch the window with the protocol, it can also be a file://
   * @param show - boolean to make the window visible or not
   * @param title - the window title
   * @param x - position x
   * @param y - position y
   * @returns return a new browser window
   */
  newWindow(url: string, show: boolean, title?: string, x?: number, y?: number): any {
    const opts = {
      width: 514,
      height: 550,
      resizable: true,
      show,
      title,
      webPreferences: {
        devTools: !environment.production,
        worldSafeExecuteJavaScript: true,
        partition: `persist:Leapp-${btoa(url)}`,
      },
    };

    if (x && y) {
      Object.assign(opts, {
        x: x + 50,
        y: y + 50,
      });
    }

    if (this.currentWindow) {
      try {
        this.currentWindow.close();
      } catch (e) {}
      this.currentWindow = null;
    }
    this.currentWindow = new this.electronService.browserWindow(opts);
    if (this.electronService.os.platform() === this.windowOs) {
      this.electronService.menu.setApplicationMenu(null);
    }
    this.currentWindow.setMenuBarVisibility(false); // Hide Window Menu to make it compliant with MacOSX
    this.currentWindow.removeMenu(); // Remove Window Menu inside App, to make it compliant with Linux
    this.currentWindow.setMenu(null);
    return this.currentWindow;
  }

  getCurrentWindow(): any {
    return this.electronService.currentWindow;
  }

  /**
   * Confirmation dialog popup!
   *
   * @param message - the message to show
   * @param callback - the callback for the ok button to launch
   * @param confirmText
   * @param cancelText
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  confirmDialog(message: string, callback: any, confirmText?: string, cancelText?: string) {
    for (let i = 1; i <= this.modalService.getModalsCount(); i++) {
      this.modalService.hide(i);
    }

    this.getCurrentWindow().show();
    return this.modalService.show(ConfirmationDialogComponent, {
      animated: false,
      class: "confirm-modal",
      initialState: { message, callback, confirmText, cancelText },
    });
  }

  /**
   * With this one you can open an url in an external browser
   *
   * @param url - url to open
   */
  openExternalUrl(url: string): void {
    this.electronService.shell.openExternal(url);
  }

  blockDevToolInProductionMode(): void {
    this.getCurrentWindow().webContents.on("devtools-opened", () => {
      if (environment.production) {
        this.appProviderService.logService.log(new LoggedEntry("Closing Web tools in production mode", this, LogLevel.info));
        this.getCurrentWindow().webContents.closeDevTools();
      }
    });
  }
}

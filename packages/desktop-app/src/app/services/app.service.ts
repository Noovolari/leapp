import { EventEmitter, Injectable } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { AppNativeService } from "./app-native.service";
import { AppProviderService } from "./app-provider.service";
import { MatMenuTrigger } from "@angular/material/menu";
import { WindowService } from "./window.service";
import { BsModalService } from "ngx-bootstrap/modal";
import { LogService, LoggedEntry, LogLevel } from "@noovolari/leapp-core/services/log-service";
import { OperatingSystem, osMap } from "@noovolari/leapp-core/models/operating-system";
import { constants } from "@noovolari/leapp-core/models/constants";

@Injectable({
  providedIn: "root",
})
export class AppService {
  profileOpen: EventEmitter<boolean> = new EventEmitter<boolean>();

  /* Is used to detect if application is in compact or full mode */
  private triggers: MatMenuTrigger[];

  /* This service is defined to provide different app wide methods as utilities */
  private logService: LogService;

  constructor(
    private appNativeService: AppNativeService,
    private windowService: WindowService,
    private modalService: BsModalService,
    private appProviderService: AppProviderService
  ) {
    this.triggers = [];

    this.logService = appProviderService.logService;

    // Global Configure logger
    if (this.appNativeService.log) {
      const logPaths = {
        [OperatingSystem.mac]: `${this.appNativeService.process.env.HOME}/Library/Logs/Leapp/log.electronService.log`,
        [OperatingSystem.linux]: `${this.appNativeService.process.env.HOME}/.config/Leapp/logs/log.electronService.log`,
        [OperatingSystem.windows]: `${this.appNativeService.process.env.USERPROFILE}\\AppData\\Roaming\\Leapp\\log.electronService.log`,
      };

      this.appNativeService.log.transports.console.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{processType}] {text}";
      this.appNativeService.log.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] [{processType}] {text}";
      this.appNativeService.log.transports.file.resolvePath = () => logPaths[this.detectOs()];
    }
  }

  // TODO: get directly from AppNativeService
  /**
   * Return the app object from node
   */
  getApp(): any {
    return this.appNativeService.app;
  }

  // TODO: get directly from AppNativeService
  getMenu(): any {
    return this.appNativeService.menu;
  }

  isDarkMode(): boolean {
    return this.appNativeService.nativeTheme.shouldUseDarkColors;
  }

  /**
   * Return the dialog native object
   */
  getDialog(): any {
    return this.appNativeService.dialog;
  }

  /**
   * Return the type of OS in human-readable form
   */
  detectOs(): OperatingSystem {
    const os = this.appNativeService.os.platform();
    return osMap[os];
  }

  /**
   * Quit the app
   */
  quit(): void {
    this.appNativeService.app.exit(0);
  }

  /**
   * Restart the app
   */
  restart(): void {
    this.appNativeService.app.relaunch();
    this.appNativeService.app.exit(0);
  }

  async logout(): Promise<void> {
    try {
      // Clear all extra data
      const getAppPath = this.appNativeService.path.join(this.appNativeService.app.getPath("appData"), constants.appName);
      this.appNativeService.rimraf.sync(getAppPath + "/Partitions/leapp*");

      // Cleaning Library Electron Cache
      await this.appNativeService.session.defaultSession.clearStorageData();

      // Clean localStorage
      localStorage.clear();

      this.logService.log(new LoggedEntry("Cache and configuration file cleaned.", this, LogLevel.success, true));

      // Restart
      setTimeout(() => {
        this.restart();
      }, 2000);
    } catch (err) {
      this.logService.log(new LoggedEntry("Leapp has an error re-creating your configuration file and cache.", this, LogLevel.error, true));
    }
  }

  /**
   * Return the semantic version object for version checks and operation
   *
   * @returns the semver object
   */
  semVer(): any {
    return this.appNativeService.semver;
  }

  /**
   * Copy the selected text to clipboard
   *
   * @param text - the element to copy to clipboard
   */
  copyToClipboard(text: string): void {
    const selBox = document.createElement("textarea");
    selBox.style.position = "fixed";
    selBox.style.left = "0";
    selBox.style.top = "0";
    selBox.style.opacity = "0";
    selBox.value = text;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand("copy");
    document.body.removeChild(selBox);
  }

  /**
   * Useful to validate all form field at once if needed
   *
   * @param formGroup - the form formGroup
   */
  validateAllFormFields(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }

  /**
   * To use EC2 services with the client you need to change the
   * request header because the origin for electron app is of type file
   */
  setFilteringForEc2Calls(): void {
    // Modify the user agent for all requests to the following urls.
    const filter = { urls: ["https://*.amazonaws.com/"] };
    this.appNativeService.session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
      details.requestHeaders["Origin"] = "http://localhost:4200";
      callback({ cancel: false, requestHeaders: details.requestHeaders });
    });
  }

  /**
   * Create a new invisible browser window
   *
   * @param url - the url to point to launch the window with the protocol, it can also be a file://
   * @returns return a new browser window
   */
  newInvisibleWindow(url: string): void {
    const win = new this.appNativeService.browserWindow({ width: 1, height: 1, show: false });
    win.loadURL(url);
    return win;
  }

  /**
   * Standard parsing of a json JWT token without library
   *
   * @param token - a string token
   * @returns the json object decoded
   */
  parseJwt(token: string): any {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  }

  closeModal(): void {
    (this.modalService as any).loaders.forEach((loader) => loader.instance.hide());
  }

  about(): void {
    const version = this.getApp().getVersion();
    const coreVersion = this.appProviderService.logService.getCoreVersion();
    this.windowService.getCurrentWindow().show();
    this.getDialog().showMessageBox({
      icon: __dirname + `/assets/images/Leapp.png`,
      message: `Leapp\n` + `Version ${version} (Core: ${coreVersion})\n` + "© 2022 Noovolari",
      buttons: ["Ok"],
    });
  }

  setMenuTrigger(trigger: MatMenuTrigger): void {
    this.triggers.push(trigger);
  }

  closeAllMenuTriggers(): void {
    this.triggers.forEach((t) => {
      t.closeMenu();
    });
    this.triggers = [];
  }
}

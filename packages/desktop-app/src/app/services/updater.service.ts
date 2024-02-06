import { Injectable } from "@angular/core";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { UpdateDialogComponent } from "../components/dialogs/update-dialog/update-dialog.component";
import compareVersions from "compare-versions";
import { HttpClient } from "@angular/common/http";
import md from "markdown-it";
import { AppNativeService } from "./app-native.service";
import { constants } from "@noovolari/leapp-core/models/constants";
import { BehaviouralSubjectService } from "@noovolari/leapp-core/services/behavioural-subject-service";
import { AppProviderService } from "./app-provider.service";
import { WindowService } from "./window.service";

@Injectable({
  providedIn: "root",
})
export class UpdaterService {
  version: string;
  releaseName: string;
  releaseDate: string;
  releaseNotes: string;
  bsModalRef: BsModalRef;
  markdown: any;

  private behaviouralSubjectService: BehaviouralSubjectService;

  constructor(
    private bsModalService: BsModalService,
    private httpClient: HttpClient,
    private electronService: AppNativeService,
    private windowService: WindowService,
    private leappCoreService: AppProviderService
  ) {
    this.markdown = md();
    this.behaviouralSubjectService = leappCoreService.behaviouralSubjectService;
  }

  isUpdateNeeded(): boolean {
    let currentSavedVersion;
    try {
      currentSavedVersion = this.getSavedAppVersion();
    } catch (_) {
      currentSavedVersion = this.version;
    }
    const updateVersion = this.version;
    return compareVersions(updateVersion, currentSavedVersion) > 0;
  }

  getCurrentAppVersion(): string {
    return this.electronService.app.getVersion();
  }

  getSavedAppVersion(): string {
    return this.electronService.fs.readFileSync(this.electronService.os.homedir() + `/.Leapp/.latest.json`).toString();
  }

  setUpdateInfo(version: string, releaseName: string, releaseDate: string, releaseNotes: string): void {
    this.version = version;
    this.releaseName = releaseName;
    this.releaseDate = releaseDate;
    this.releaseNotes = releaseNotes;

    this.behaviouralSubjectService.sessions = [...this.behaviouralSubjectService.sessions];
    this.leappCoreService.sessionManagementService.updateSessions(this.behaviouralSubjectService.sessions);
  }

  updateDialog(): void {
    if (!this.bsModalRef) {
      for (let i = 1; i <= this.bsModalService.getModalsCount(); i++) {
        this.bsModalService.hide(i);
      }

      const callback = (event) => {
        if (event === constants.confirmClosedAndIgnoreUpdate) {
          this.updateVersionJson(this.version);

          this.behaviouralSubjectService.sessions = [...this.behaviouralSubjectService.sessions];
          this.leappCoreService.sessionManagementService.updateSessions(this.behaviouralSubjectService.sessions);
        } else if (event === constants.confirmCloseAndDownloadUpdate) {
          // this.windowService.openExternalUrl(`${constants.latestUrl}`);
          const ipc = this.electronService.ipcRenderer;
          ipc.invoke("make-update", {});
        }
        this.bsModalRef = undefined;
      };

      this.windowService.getCurrentWindow().show();
      this.bsModalRef = this.bsModalService.show(UpdateDialogComponent, {
        backdrop: "static",
        animated: false,
        class: "confirm-modal",
        initialState: { version: this.version, releaseDate: this.releaseDate, releaseNotes: this.releaseNotes, callback },
      });
    }
  }

  updateVersionJson(version: string): void {
    this.electronService.fs.writeFileSync(this.electronService.os.homedir() + "/.Leapp/.latest.json", version);
  }

  async getReleaseNote(): Promise<string> {
    return new Promise((resolve) => {
      this.httpClient.get("https://asset.noovolari.com/CHANGELOG.md", { responseType: "text" }).subscribe(
        (data) => {
          resolve(this.markdown.render(data));
        },
        (error) => {
          console.log("error", error);
          resolve("");
        }
      );
    });
  }

  isReady(): boolean {
    return this.version !== undefined;
  }

  createFoldersIfMissing(): void {
    try {
      if (!this.electronService.fs.existsSync(this.electronService.os.homedir() + "/.Leapp/")) {
        this.electronService.fs.mkdirSync(this.electronService.os.homedir() + "/.Leapp/");
      }
      if (!this.electronService.fs.existsSync(this.electronService.os.homedir() + "/.aws/")) {
        this.electronService.fs.mkdirSync(this.electronService.os.homedir() + "/.aws/");
      }
    } catch (_) {}
  }
}

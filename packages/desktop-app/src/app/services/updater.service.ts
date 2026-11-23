import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { firstValueFrom } from "rxjs";
import MarkdownIt from "markdown-it";
import * as semver from "semver";
import { constants } from "@noovolari/leapp-core/models/constants";
import { UpdateDialogComponent } from "../components/dialogs/update-dialog/update-dialog.component";
import { AppNativeService } from "./app-native.service";
import { AppProviderService } from "./app-provider.service";
import { WindowService } from "./window.service";

export interface UpdateInfo {
  version: string;
  releaseName?: string;
  releaseDate: string;
}

export const releaseNotesUrl = "https://asset.noovolari.com/CHANGELOG.md";

/**
 * The update check of the renderer. The main process sends UPDATE_AVAILABLE; this service
 * compares the offered version with the one the user last acknowledged (`.latest.json` in the flavor's folder), opens
 * the update dialog, and feeds the bell dot, the tray entry and "What's new". Release notes are Markdown rendered
 * Without raw HTML (AC27): this renderer has Node access.
 */
@Injectable({
  providedIn: "root",
})
export class UpdaterService {
  version: string;
  releaseName: string;
  releaseDate: string;
  releaseNotes: string;

  private bsModalRef: BsModalRef;
  // The acknowledged version, kept in memory: the bell dot asks on every change detection
  private acknowledged: string;
  private readonly markdown = new MarkdownIt({ html: false, linkify: false });

  constructor(
    private readonly bsModalService: BsModalService,
    private readonly httpClient: HttpClient,
    private readonly appNativeService: AppNativeService,
    private readonly windowService: WindowService,
    private readonly appProviderService: AppProviderService
  ) {}

  /** At startup: keeps `.latest.json` at least at the running version (fresh ≤ saved ≤ offered), then listens. */
  start(): void {
    this.reconcileSavedVersion();
    this.appNativeService.ipcRenderer.on("UPDATE_AVAILABLE", (_, info: UpdateInfo) => {
      this.handleUpdateAvailable(info).catch(() => {});
    });
  }

  async handleUpdateAvailable(info: UpdateInfo): Promise<void> {
    const notes = this.getReleaseNotes();
    this.setUpdateInfo(info.version, info.releaseName, info.releaseDate, await notes);
    if (this.isUpdateNeeded()) {
      this.updateDialog();
    }
  }

  isReady(): boolean {
    return this.version !== undefined;
  }

  isUpdateNeeded(): boolean {
    if (!this.isReady()) {
      return false;
    }
    if (this.acknowledged === undefined) {
      this.acknowledged = this.savedVersion() ?? this.appNativeService.app.getVersion();
    }
    return this.isGreater(this.version, this.acknowledged);
  }

  async getReleaseNotes(): Promise<string> {
    try {
      const markdown = await firstValueFrom(this.httpClient.get(releaseNotesUrl, { responseType: "text" }));
      return this.markdown.render(markdown);
    } catch (_) {
      return "";
    }
  }

  updateDialog(): void {
    if (this.bsModalRef) {
      return;
    }
    const callback = (event: string) => {
      if (event === constants.confirmClosedAndIgnoreUpdate) {
        this.writeSavedVersion(this.version);
        this.refreshIndicators();
      } else if (event === constants.confirmCloseAndDownloadUpdate) {
        this.windowService.openExternalUrl(constants.latestUrl);
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

  private setUpdateInfo(version: string, releaseName: string, releaseDate: string, releaseNotes: string): void {
    this.version = version;
    this.releaseName = releaseName;
    this.releaseDate = releaseDate;
    this.releaseNotes = releaseNotes;
    this.refreshIndicators();
  }

  /** The tray menu rebuilds on every sessions$ emission: re-emitting the same sessions shows or hides its entry. */
  private refreshIndicators(): void {
    const behaviouralSubjectService = this.appProviderService.behaviouralSubjectService;
    behaviouralSubjectService.sessions = [...behaviouralSubjectService.sessions];
    this.appProviderService.sessionManagementService.updateSessions(behaviouralSubjectService.sessions);
  }

  private reconcileSavedVersion(): void {
    const current = this.appNativeService.app.getVersion();
    const saved = this.savedVersion();
    if (saved === undefined || !this.isGreater(saved, current)) {
      this.writeSavedVersion(current);
    } else {
      this.acknowledged = saved;
    }
  }

  private isGreater(left: string, right: string): boolean {
    return semver.valid(left) !== null && semver.valid(right) !== null && semver.gt(left, right);
  }

  private get latestFile(): string {
    return `${this.appNativeService.os.homedir()}/${constants.leappDir}/.latest.json`;
  }

  /** The acknowledged version, or undefined when the file is missing, unreadable or not a version. */
  private savedVersion(): string | undefined {
    try {
      const version = this.appNativeService.fs.readFileSync(this.latestFile).toString().trim();
      return semver.valid(version) ? version : undefined;
    } catch (_) {
      return undefined;
    }
  }

  private writeSavedVersion(version: string): void {
    this.acknowledged = version;
    try {
      const dir = `${this.appNativeService.os.homedir()}/${constants.leappDir}`;
      if (!this.appNativeService.fs.existsSync(dir)) {
        this.appNativeService.fs.mkdirSync(dir);
      }
      this.appNativeService.fs.writeFileSync(this.latestFile, version);
    } catch (_) {}
  }
}

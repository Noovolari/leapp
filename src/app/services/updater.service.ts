import {Injectable} from '@angular/core';
import {NativeService} from './native-service';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {AppService} from './app.service';
import {Constants} from '../models/constants';
import {environment} from '../../environments/environment';
import {UpdateDialogComponent} from '../components/shared/update-dialog/update-dialog.component';
import compareVersions from 'compare-versions';
import {WorkspaceService} from './workspace.service';


@Injectable({
  providedIn: 'root'
})
export class UpdaterService extends NativeService {

  version: string;
  releaseName: string;
  releaseDate: string;
  releaseNotes: string;
  bsModalRef: BsModalRef;

  constructor(
    private appService: AppService,
    private workspaceService: WorkspaceService,
    private bsModalService: BsModalService
  ) {
    super();
  }

  isUpdateNeeded(): boolean {
    const currentSavedVersion = this.getSavedAppVersion();
    const updateVersion = this.version;
    return compareVersions(updateVersion, currentSavedVersion) > 0;
  }

  getCurrentAppVersion(): string {
    return this.app.getVersion();
  }

  getSavedAppVersion(): string {
    return this.fs.readFileSync(this.os.homedir() + `/.Leapp/.latest.json`).toString();
  }

  getSavedVersionComparison(): boolean {
    return compareVersions(this.getSavedAppVersion(), this.getCurrentAppVersion()) > 0;
  }

  setUpdateInfo(version: string, releaseName: string, releaseDate: string, releaseNotes: string): void {
    this.version = version;
    this.releaseName = releaseName;
    this.releaseDate = releaseDate;
    this.releaseNotes = releaseNotes;

    this.workspaceService.sessions = [...this.workspaceService.sessions];
  }

  updateDialog(): void {
    const callback = (event) => {
      if (event === Constants.confirmClosedAndIgnoreUpdate) {
        this.updateVersionJson(this.version);
        this.workspaceService.sessions = [...this.workspaceService.sessions];
      } else if (event === Constants.confirmCloseAndDownloadUpdate) {
        this.appService.openExternalUrl(`${environment.latestUrl}`);
      }
      this.bsModalRef = undefined;
    };

    if (!this.bsModalRef) {
      for (let i = 1; i <= this.bsModalService.getModalsCount(); i++) {
        this.bsModalService.hide(i);
      }

      this.bsModalRef = this.bsModalService.show(UpdateDialogComponent, {
        backdrop: 'static',
        animated: false,
        class: 'confirm-modal',
        initialState: { version: this.version, releaseDate: this.releaseDate, releaseNotes: this.releaseNotes, callback}
      });
    }
  }

  updateVersionJson(version: string): void {
    this.fs.writeFileSync(this.os.homedir() + '/.Leapp/.latest.json', version);
  }
}

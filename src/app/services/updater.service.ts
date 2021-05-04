import { Injectable } from '@angular/core';
import compareVersions from 'compare-versions';
import {NativeService} from '../services-system/native-service';
import {AppService} from '../services-system/app.service';
import {constants} from '../core/enums/constants';
import {environment} from '../../environments/environment';
import {UpdateDialogComponent} from '../shared/update-dialog/update-dialog.component';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';

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

    this.appService.redrawList.emit();
  }

  updateDialog(): void {
    const callback = (event) => {
      if (event === constants.CONFIRM_CLOSED_AND_IGNORE_UPDATE) {
        this.updateVersionJson(this.version);
        this.appService.redrawList.emit();
      } else if (event === constants.CONFIRM_CLOSED_AND_DOWNLOAD_UPDATE) {
        this.appService.openExternalUrl(`${environment.latestUrl}${this.releaseName}`);
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

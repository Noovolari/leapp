import {Injectable} from '@angular/core';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {AppService} from './app.service';
import {Constants} from '../models/constants';
import {environment} from '../../environments/environment';
import {UpdateDialogComponent} from '../components/dialogs/update-dialog/update-dialog.component';
import compareVersions from 'compare-versions';
import {WorkspaceService} from './workspace.service';
import {HttpClient} from '@angular/common/http';
import md from 'markdown-it';
import {ElectronService} from './electron.service';

@Injectable({
  providedIn: 'root'
})
export class UpdaterService {

  version: string;
  releaseName: string;
  releaseDate: string;
  releaseNotes: string;
  bsModalRef: BsModalRef;
  markdown: any;

  constructor(
    private appService: AppService,
    private workspaceService: WorkspaceService,
    private bsModalService: BsModalService,
    private httpClient: HttpClient,
    private electronService: ElectronService
  ) {
    this.markdown = md();
  }

  isUpdateNeeded(): boolean {
    const currentSavedVersion = this.getSavedAppVersion();
    const updateVersion = this.version;
    return compareVersions(updateVersion, currentSavedVersion) > 0;
  }

  getCurrentAppVersion(): string {
    return this.electronService.app.getVersion();
  }

  getSavedAppVersion(): string {
    if(this.appService.detectOs() !== Constants.windows) {
      return this.electronService.fs.readFileSync(this.electronService.os.homedir() + `/.Leapp/.latest.json`).toString();
    } else {
      return this.electronService.fs.readFileSync(this.electronService.os.homedir() + `\\.Leapp\\.latest.json`).toString();
    }
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
    if (!this.bsModalRef) {
      for (let i = 1; i <= this.bsModalService.getModalsCount(); i++) {
        this.bsModalService.hide(i);
      }

      const callback = (event) => {
        if (event === Constants.confirmClosedAndIgnoreUpdate) {
          this.updateVersionJson(this.version);
          this.workspaceService.sessions = [...this.workspaceService.sessions];
        } else if (event === Constants.confirmCloseAndDownloadUpdate) {
          this.appService.openExternalUrl(`${environment.latestUrl}`);
        }
        this.bsModalRef = undefined;
      };

      this.appService.getCurrentWindow().show();
      this.bsModalRef = this.bsModalService.show(UpdateDialogComponent, {
        backdrop: 'static',
        animated: false,
        class: 'confirm-modal',
        initialState: { version: this.version, releaseDate: this.releaseDate, releaseNotes: this.releaseNotes, callback}
      });

    }
  }

  updateVersionJson(version: string): void {
    if(this.appService.detectOs() !== Constants.windows) {
      this.electronService.fs.writeFileSync(this.electronService.os.homedir() + '/.Leapp/.latest.json', version);
    } else {
      this.electronService.fs.writeFileSync(this.electronService.os.homedir() + '\\.Leapp\\.latest.json', version);
    }
  }

  async getReleaseNote(): Promise<string> {
    return new Promise( (resolve, _) => {
        this.httpClient.get('https://asset.noovolari.com/CHANGELOG.md', { responseType: 'text' }).subscribe(data => {
          resolve(this.markdown.render(data));
        }, error => {
          console.log('error', error);
          resolve('');
        });
    });
  }

  isReady() {
    return (this.version !== undefined);
  }

  createFoldersIfMissing() {
    try {
      if(!this.electronService.fs.existsSync(this.electronService.os.homedir() + '/.Leapp/')) {
        this.electronService.fs.mkdirSync(this.electronService.os.homedir() + '/.Leapp/');
      }
      if(!this.electronService.fs.existsSync(this.electronService.os.homedir() + '/.aws/')) {
        this.electronService.fs.mkdirSync(this.electronService.os.homedir() + '/.aws/');
      }
    } catch(_) {}
  }
}

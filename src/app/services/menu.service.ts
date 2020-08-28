import {EventEmitter, Injectable} from '@angular/core';
import {WorkspaceService} from './workspace.service';
import {NativeService} from '../services-system/native-service';
import {ConfigurationService} from '../services-system/configuration.service';
import {FileService} from '../services-system/file.service';
import {AppService, LoggerLevel, ToastLevel} from '../services-system/app.service';
import {environment} from '../../environments/environment';
import {SessionService} from './session.service';
import {CredentialsService} from './credentials.service';

@Injectable({
  providedIn: 'root'
})
export class MenuService extends NativeService {

  // Used to define the only tray we want as active expecially in linux context
  currentTray;

  constructor(
    private workspaceService: WorkspaceService,
    private configurationService: ConfigurationService,
    private credentialService: CredentialsService,
    private fileService: FileService,
    private sessionService: SessionService,
    private appService: AppService) {

    super();
  }

  generateMenu() {
    const version = this.appService.getApp().getVersion();
    const awsCredentialsPath = this.os.homedir() + '/' + environment.credentialsDestination;
    const contextMenu = this.Menu.buildFromTemplate([

      { label: 'Show', type: 'normal', click: (menuItem, browserWindow, event) => { this.currentWindow.show(); } },
      { label: 'About', type: 'normal', click: (menuItem, browserWindow, event) => { this.currentWindow.show(); this.dialog.showMessageBox({ icon: __dirname + `/assets/images/Leapp.png`, message: `Noovolari Leapp.\n` + `Version ${version} (${version})\n` + 'Copyright 2019 noovolari srl.', buttons: ['Ok'] }); } },
      { type: 'separator' },
      { label: 'Quit', type: 'normal', click: (menuItem, browserWindow, event) => { this.cleanBeforeExit(); } },
    ]);

    this.currentTray = new this.Tray(__dirname + `/assets/images/LeappMini.png`);
    this.currentTray.setToolTip('Leapp');
    this.currentTray.setContextMenu(contextMenu);
  }

  /**
   * Remove session and credential file before exiting program
   */
  cleanBeforeExit() {
    // Check if we are here
    this.appService.logger('Closing app...', LoggerLevel.INFO);

    // We need the Try/Catch as we have a the possibility to call the method without sessions
    try {
      // Stop the session...
      this.sessionService.stopSession();
      // Stop credentials to be used
      this.credentialService.refreshCredentialsEmit.emit();
      // Clean the config file
      this.appService.cleanCredentialFile();
    } catch (err) {
      this.appService.logger('No sessions to stop, skipping...', LoggerLevel.INFO);
    }

    // Finally quit
    this.appService.quit();
  }
}

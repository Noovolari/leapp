import {EventEmitter, Injectable} from '@angular/core';
import {WorkspaceService} from './workspace.service';
import {NativeService} from '../services-system/native-service';
import {ConfigurationService} from '../services-system/configuration.service';
import {FileService} from '../services-system/file.service';
import {AppService, LoggerLevel} from '../services-system/app.service';
import {SessionService} from './session.service';
import {CredentialsService} from './credentials.service';
import {Session} from '../models/session';
import {AccountType} from '../models/AccountType';
import {AwsPlainAccount} from '../models/aws-plain-account';
import {AwsAccount} from '../models/aws-account';

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

    this.appService.redrawList.subscribe(res => {
      this.generateMenu();
    });
  }

  generateMenu() {
    if (this.currentTray) {
      this.currentTray.destroy();
    }

    const version = this.appService.getApp().getVersion();

    let voices = [];
    this.sessionService.listSessions().slice(0, 5).forEach((session: Session) => {
      let icon = '';
      let label = '';
      switch (session.account.type) {
        case AccountType.AWS_PLAIN_USER:
          icon = session.active ? __dirname + `/assets/images/icon-online-aws.png` : __dirname + `/assets/images/icon-offline.png`;
          label = '  ' + session.account.accountName + ' - ' + (session.account as AwsPlainAccount).user;
          break;
        case AccountType.AWS:
        case AccountType.AWS_TRUSTER:
          icon = session.active ? __dirname + `/assets/images/icon-online-aws.png` : __dirname + `/assets/images/icon-offline.png`;
          label = '  ' + session.account.accountName + ' - ' + (session.account as AwsAccount).role.name;
          break;

        case AccountType.AZURE:
          icon = session.active ? __dirname + `/assets/images/icon-online-azure.png` : __dirname + `/assets/images/icon-offline.png`;
          label = '  ' + session.account.accountName;
      }
      voices.push(
        { label,
          type: 'normal',
          icon,
          click: (menuItem, browserWindow, event) => {
            if (!session.active) {
              this.sessionService.startSession(session);
              this.credentialService.refreshCredentialsEmit.emit(session.account.type);

            } else {
              this.credentialService.refreshCredentialsEmit.emit(session.account.type);
              this.sessionService.stopSession(session);
            }
            this.appService.redrawList.emit(true);
            this.currentTray.destroy();
            this.generateMenu();

        } },
      );
    });

    const extraInfo = [
      { type: 'separator' },
      { label: 'Show', type: 'normal', click: (menuItem, browserWindow, event) => { this.currentWindow.show(); } },
      { label: 'About', type: 'normal', click: (menuItem, browserWindow, event) => { this.currentWindow.show(); this.dialog.showMessageBox({ icon: __dirname + `/assets/images/Leapp.png`, message: `Noovolari Leapp.\n` + `Version ${version} (${version})\n` + 'Copyright 2019 noovolari srl.', buttons: ['Ok'] }); } },
      { type: 'separator' },
      { label: 'Quit', type: 'normal', click: (menuItem, browserWindow, event) => { this.cleanBeforeExit(); } },
    ];

    voices = voices.concat(extraInfo);
    const contextMenu = this.Menu.buildFromTemplate(voices);

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
      this.sessionService.stopAllSession();
      // Stop credentials to be used
      this.credentialService.refreshCredentialsEmit.emit(null);
      // Clean the config file
      this.appService.cleanCredentialFile();
    } catch (err) {
      this.appService.logger('No sessions to stop, skipping...', LoggerLevel.INFO);
    }

    // Finally quit
    this.appService.quit();
  }
}

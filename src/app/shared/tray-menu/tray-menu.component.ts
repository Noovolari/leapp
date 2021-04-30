import {Component, OnInit} from '@angular/core';
import {WorkspaceService} from '../../services/workspace.service';
import {ConfigurationService} from '../../services/configuration.service';
import {FileService} from '../../services/file.service';
import {SessionService} from '../../services/session.service';
import {AppService, LoggerLevel} from '../../services/app.service';
import {Session} from '../../models/session';
import {AccountType} from '../../models/AccountType';
import {AwsAccount} from '../../models/aws-account';

@Component({
  selector: 'app-tray-menu',
  templateUrl: './tray-menu.component.html',
  styleUrls: ['./tray-menu.component.scss']
})
export class TrayMenuComponent implements OnInit {

  // Used to define the only tray we want as active expecially in linux context
  currentTray;

  constructor(private workspaceService: WorkspaceService,
              private configurationService: ConfigurationService,
              private fileService: FileService,
              private sessionService: SessionService,
              private appService: AppService) {}

  ngOnInit() {
    this.appService.redrawList.subscribe(() => {
      this.generateMenu();
    });
    this.generateMenu();
  }

  generateMenu() {
    const version = this.appService.getApp().getVersion();

    let voices = [];
    const maxSessionsToShow = 10;
    const activeSessions = []; // this.sessionService.list().filter(s => s.active);
    // @ts-ignore
    const allSessions = activeSessions.concat(this.sessionService.alterOrderByTime(this.sessionService.list().filter(s => !s.active)).slice(0, maxSessionsToShow - activeSessions.length));
    allSessions.forEach((session: Session) => {

      let icon = '';
      let label = '';
      const profile = this.workspaceService.get().profiles.filter(p => p.id === session.profileId)[0];
      const iconValue = (profile && profile.name === 'default') ? 'home' : 'user';

      switch (session.account.type) {
        case AccountType.AWS_PLAIN_USER:
          icon = (session.active) ? __dirname + `/assets/images/${iconValue}-online.png` : __dirname + `/assets/images/${iconValue}-offline.png`;
          label = '  ' + session.account.accountName + ' - ' + 'plain';
          break;
        case AccountType.AWS:
        case AccountType.AWS_TRUSTER:
        case AccountType.AWS_SSO:
          icon = (session.active && !session.loading) ? __dirname + `/assets/images/${iconValue}-online.png` : __dirname + `/assets/images/${iconValue}-offline.png`;
          label = '  ' + session.account.accountName + ' - ' + (session.account as AwsAccount).role.name;
          break;

        case AccountType.AZURE:
          icon = (session.active) ? __dirname + `/assets/images/icon-online-azure.png` : __dirname + `/assets/images/icon-offline.png`;
          label = '  ' + session.account.accountName;
      }
      voices.push(
        { label,
          type: 'normal',
          icon,
          click: () => {
            if (!session.active) {
              this.sessionService.start(session.sessionId);
              // TODO: refresh session credential
            } else {
              // this.sessionService.stop(session.sessionId);
              // TODO: refresh session credential
            }
            this.appService.redrawList.emit(true);
            this.generateMenu();
          } },
      );
    });

    const extraInfo = [
      { type: 'separator' },
      { label: 'Show', type: 'normal', click: () => { this.appService.getCurrentWindow().show(); } },
      { label: 'About', type: 'normal', click: () => { this.appService.getCurrentWindow().show(); this.appService.getDialog().showMessageBox({ icon: __dirname + `/assets/images/Leapp.png`, message: `Leapp.\n` + `Version ${version} (${version})\n` + 'Copyright 2019 beSharp srl.', buttons: ['Ok'] }); } },
      { type: 'separator' },
      { label: 'Quit', type: 'normal', click: () => { this.cleanBeforeExit(); } },
    ];

    voices = voices.concat(extraInfo);
    const contextMenu = this.appService.getMenu().buildFromTemplate(voices);

    if (!this.currentTray) {
      this.currentTray = new (this.appService.getTray())(__dirname + `/assets/images/LeappMini.png`);
    }

    this.currentTray.setToolTip('Leapp');
    this.currentTray.setContextMenu(contextMenu);
  }

  /**
   * Remove session and credential file before exiting program
   */
  cleanBeforeExit() {
    // Check if we are here
    this.appService.logger('Closing app with cleaning process...', LoggerLevel.INFO, this);

    // We need the Try/Catch as we have a the possibility to call the method without sessions
    try {
      // Stop the session...
      // this.sessionService.stopAllSession();
      // Stop credentials to be used
      // this.credentialService.refreshCredentials();
      // Clean the config file
      this.appService.cleanCredentialFile();
    } catch (err) {
      this.appService.logger('No sessions to stop, skipping...', LoggerLevel.ERROR, this, err.stack);
    }

    // Finally quit
    this.appService.quit();
  }

}

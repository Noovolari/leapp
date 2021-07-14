import {Component, OnDestroy, OnInit} from '@angular/core';
import {WorkspaceService} from '../../../services/workspace.service';
import {FileService} from '../../../services/file.service';
import {AppService, LoggerLevel} from '../../../services/app.service';
import {Session} from '../../../models/session';
import {SessionType} from '../../../models/session-type';
import {environment} from '../../../../environments/environment';
import {SessionStatus} from '../../../models/session-status';
import {AwsIamRoleChainedSession} from '../../../models/aws-iam-role-chained-session';
import {LeappNotAwsAccountError} from '../../../errors/leapp-not-aws-account-error';
import {AwsIamRoleFederatedSession} from '../../../models/aws-iam-role-federated-session';
import {UpdaterService} from '../../../services/updater.service';
import {SessionService} from '../../../services/session.service';
import {SessionFactoryService} from '../../../services/session-factory.service';
import {normalizeSourceMaps} from "@angular-devkit/build-angular/src/utils";

@Component({
  selector: 'app-tray-menu',
  templateUrl: './tray-menu.component.html',
  styleUrls: ['./tray-menu.component.scss']
})
export class TrayMenuComponent implements OnInit, OnDestroy {

  // Used to define the only tray we want as active especially in linux context
  currentTray;
  subscribed;

  constructor(private workspaceService: WorkspaceService,
              private fileService: FileService,
              private sessionService: SessionService,
              private updaterService: UpdaterService,
              private sessionProviderService: SessionFactoryService,
              private appService: AppService) {
  }

  ngOnInit() {
    this.subscribed = this.workspaceService.sessions$.subscribe(() => {
      this.generateMenu();
    });
    this.generateMenu();
  }

  getProfileId(session: Session): string {
    if(session.type !== SessionType.azure) {
      return (session as any).profileId;
    } else {
      return undefined;
    }
  }

  generateMenu() {
    const version = this.appService.getApp().getVersion();

    let voices = [];
    const actives = this.sessionService.listActive();
    const allSessions = actives.concat(this.sessionService.list().filter(session => session.status === SessionStatus.inactive).filter((_, index) => index < (10 - actives.length)));
    allSessions.forEach((session: Session) => {
      let icon = '';
      let label = '';
      const profile = this.workspaceService.get().profiles.filter(p => p.id === this.getProfileId(session))[0];
      const iconValue = (profile && profile.name === 'default') ? 'home' : 'user';

      switch (session.type) {
        case SessionType.awsIamUser:
          icon = session.status === SessionStatus.active ? __dirname + `/assets/images/${iconValue}-online.png` : __dirname + `/assets/images/${iconValue}-offline.png`;
          label = '  ' + session.sessionName + ' - ' + 'iam user';
          break;
        case SessionType.awsIamRoleFederated:
        case SessionType.awsSsoRole:
          icon = session.status === SessionStatus.active ? __dirname + `/assets/images/${iconValue}-online.png` : __dirname + `/assets/images/${iconValue}-offline.png`;
          label = '  ' + session.sessionName + ' - ' + (session as AwsIamRoleFederatedSession).roleArn.split('/')[1];
          break;
        case SessionType.awsIamRoleChained:
          icon = session.status === SessionStatus.active ? __dirname + `/assets/images/${iconValue}-online.png` : __dirname + `/assets/images/${iconValue}-offline.png`;
          label = '  ' + session.sessionName + ' - ' + (session as AwsIamRoleChainedSession).roleArn.split('/')[1];
          break;
        case SessionType.azure:
          icon = session.status === SessionStatus.active ? __dirname + `/assets/images/icon-online-azure.png` : __dirname + `/assets/images/icon-offline.png`;
          label = '  ' + session.sessionName;
      }
      voices.push(
        {
          label,
          type: 'normal',
          icon,
          click: async () => {
            const factorizedSessionService = this.sessionProviderService.getService(session.type);

            if (session.status !== SessionStatus.active) {
              await factorizedSessionService.start(session.sessionId);
            } else {
              await factorizedSessionService.stop(session.sessionId);
            }
          }
        },
      );
    });

    const extraInfo = [
      {type: 'separator'},
      {
        label: 'Show', type: 'normal', click: () => {
          this.appService.getCurrentWindow().show();
        }
      },
      {
        label: 'About', type: 'normal', click: () => {
          this.appService.getCurrentWindow().show();
          this.appService.getDialog().showMessageBox({icon: __dirname + `/assets/images/Leapp.png`, message: `Leapp.\n` + `Version ${version} (${version})\n` + '© 2020 Noovolari', buttons: ['Ok']});
        }
      },
      {type: 'separator'},
      {
        label: 'Quit', type: 'normal', click: () => {
          this.cleanBeforeExit();
        }
      },
    ];

    // Remove unused voices from contextual menu
    const template = [
      {
        label: 'Leapp',
        submenu: [
          {label: 'About', role: 'about'},
          {label: 'Quit', role: 'quit'}
        ]
      },
      {
        label: 'Edit',
        submenu: [
          {label: 'Copy', role: 'copy'},
          {label: 'Paste', role: 'paste'}
        ]
      }
    ];
    if (!environment.production) {
      template[0].submenu.push({label: 'Open DevTool', role: 'toggledevtools'});
    }
    this.appService.getMenu().setApplicationMenu(this.appService.getMenu().buildFromTemplate(template));

    // check for dark mode
    let normalIcon = 'LeappMini';
    let updateIcon = 'LeappMini2';
    if (this.appService.isDarkMode()) {
      normalIcon = 'LeappMini3';
      updateIcon = 'Leappmini4';
    }

    if (!this.currentTray) {
      this.currentTray = new (this.appService.getTray())(__dirname + `/assets/images/${normalIcon}.png`);
    }

    if (this.updaterService.getSavedVersionComparison() && this.updaterService.isReady()) {
      voices.push({ type: 'separator' });
      voices.push({ label: 'Check for Updates...', type: 'normal', click: () => this.updaterService.updateDialog() });
      this.currentTray.setImage(__dirname + `/assets/images/${updateIcon}.png`);
    }

    voices = voices.concat(extraInfo);
    const contextMenu = this.appService.getMenu().buildFromTemplate(voices);

    this.currentTray.setToolTip('Leapp');
    this.currentTray.setContextMenu(contextMenu);
  }

  /**
   * Remove session and credential file before exiting program
   */
  async cleanBeforeExit() {
    // Check if we are here
    this.appService.logger('Closing app with cleaning process...', LoggerLevel.info, this);

    // We need the Try/Catch as we have a the possibility to call the method without sessions
    try {
      // Stop the sessions...
      const activeSessions = this.sessionService.listActive();
      activeSessions.forEach(sess => {
        const factorizedService = this.sessionProviderService.getService(sess.type);
        factorizedService.stop(sess.sessionId);
      });

      // Clean the config file
      this.appService.cleanCredentialFile();
    } catch (err) {
      this.appService.logger('No sessions to stop, skipping...', LoggerLevel.error, this, err.stack);
    }

    // Finally quit
    this.appService.quit();
  }

  ngOnDestroy(): void {
    this.subscribed.unsubscribe();
  }

}

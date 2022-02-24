import {Component, OnDestroy, OnInit} from '@angular/core';
import {WorkspaceService} from '../../services/workspace.service';
import {AppService, LoggerLevel} from '../../services/app.service';
import {environment} from '../../../environments/environment';
import {UpdaterService} from '../../services/updater.service';
import {Session} from '../../models/session';
import {SessionType} from '../../models/session-type';
import {SessionStatus} from '../../models/session-status';
import {AwsIamRoleFederatedSession} from '../../models/aws-iam-role-federated-session';
import {AwsIamRoleChainedSession} from '../../models/aws-iam-role-chained-session';
import {SessionFactoryService} from '../../services/session-factory.service';
import {LoggingService} from '../../services/logging.service';
import {Constants} from '../../models/constants';

@Component({
  selector: 'app-tray-menu',
  templateUrl: './tray-menu.component.html',
  styleUrls: ['./tray-menu.component.scss']
})
export class TrayMenuComponent implements OnInit, OnDestroy {
  // Used to define the only tray we want as active especially in linux context
  private currentTray;
  private subscribed;

  constructor(
    private workspaceService: WorkspaceService,
    private updaterService: UpdaterService,
    private appService: AppService,
    private sessionFactoryService: SessionFactoryService,
    private loggingService: LoggingService
  ) {}

  ngOnInit() {
    this.subscribed = this.workspaceService.sessions$.subscribe(() => {
      this.generateMenu();
    });
    this.generateMenu();
  }

  getProfileId(session: Session): string {
    if (session.type !== SessionType.azure) {
      return (session as any).profileId;
    } else {
      return undefined;
    }
  }

  generateMenu() {
    const version = this.appService.getApp().getVersion();
    let voices = [];
    const actives = this.workspaceService.sessions.filter(s => s.status === SessionStatus.active || s.status === SessionStatus.pending);
    const allSessions = actives.concat(this.workspaceService.sessions.filter(session => session.status === SessionStatus.inactive).filter((_, index) => index < (10 - actives.length)));

    allSessions.forEach((session: Session) => {
      let icon = '';
      let label = '';
      const profile = this.workspaceService.getProfiles().filter(p => p.id === this.getProfileId(session))[0];
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
            const factorizedSessionService = this.sessionFactoryService.getService(session.type);
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
          this.appService.about();
        }
      },
      {type: 'separator'},
      {
        label: 'Quit', type: 'normal', click: () => {
          this.cleanBeforeExit().then(_ => {
          });
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
    let normalIcon = 'LeappTemplate';
    if (this.appService.detectOs() === Constants.linux) {
      normalIcon = 'LeappMini';
    }
    if (!this.currentTray) {
      this.currentTray = new (this.appService.getTray())(__dirname + `/assets/images/${normalIcon}.png`);
      if(this.appService.detectOs() !== Constants.windows && this.appService.detectOs() !== Constants.linux) {
        this.appService.getApp().dock.setBadge('');
      }
    }
    if (this.updaterService.getSavedVersionComparison() && this.updaterService.isReady()) {
      voices.push({type: 'separator'});
      voices.push({label: 'Check for Updates...', type: 'normal', click: () => this.updaterService.updateDialog()});
      if(this.appService.detectOs() !== Constants.windows && this.appService.detectOs() !== Constants.linux) {
        this.appService.getApp().dock.setBadge('·');
      }
    }
    voices = voices.concat(extraInfo);
    const contextMenu = this.appService.getMenu().buildFromTemplate(voices);
    if(this.appService.detectOs() !== Constants.windows && this.appService.detectOs() !== Constants.linux) {
      this.currentTray.setToolTip('Leapp');
    }
    this.currentTray.setContextMenu(contextMenu);
  }
  /**
   * Remove session and credential file before exiting program
   */
  async cleanBeforeExit() {
    // Check if we are here
    this.loggingService.logger('Closing app with cleaning process...', LoggerLevel.info, this);
    // We need the Try/Catch as we have a the possibility to call the method without sessions
    try {
      // Stop the sessions...
      const activeSessions = this.workspaceService.sessions.filter(s => s.status === SessionStatus.active || s.status === SessionStatus.pending);
      activeSessions.forEach(sess => {
        const factorizedService = this.sessionFactoryService.getService(sess.type);
        factorizedService.stop(sess.sessionId);
      });
      // Clean the config file
      this.appService.cleanCredentialFile();
    } catch (err) {
      this.loggingService.logger('No sessions to stop, skipping...', LoggerLevel.error, this, err.stack);
    }
    // Finally quit
    this.appService.quit();
  }
  ngOnDestroy(): void {
    this.subscribed.unsubscribe();
  }
}

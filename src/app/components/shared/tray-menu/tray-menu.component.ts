import {Component, OnInit} from '@angular/core';
import {WorkspaceService} from '../../../services/workspace.service';
import {FileService} from '../../../services/file.service';
import {AppService, LoggerLevel} from '../../../services/app.service';
import {Session} from '../../../models/session';
import {SessionType} from '../../../models/session-type';
import {environment} from '../../../../environments/environment';
import {SessionStatus} from '../../../models/session-status';
import {AwsTrusterSession} from '../../../models/aws-truster-session';
import {LeappNotAwsAccountError} from '../../../errors/leapp-not-aws-account-error';
import {AwsFederatedSession} from '../../../models/aws-federated-session';
import {SessionService} from '../../../services/session.service';

@Component({
  selector: 'app-tray-menu',
  templateUrl: './tray-menu.component.html',
  styleUrls: ['./tray-menu.component.scss']
})
export class TrayMenuComponent implements OnInit {

  // Used to define the only tray we want as active especially in linux context
  currentTray;

  constructor(private workspaceService: WorkspaceService,
              private fileService: FileService,
              private sessionService: SessionService,
              private appService: AppService) {
  }

  ngOnInit() {
    this.workspaceService.sessions$.subscribe(() => {
      this.generateMenu();
    });
    this.generateMenu();
  }

  getProfileId(session: Session): string {
    if(session.type !== SessionType.azure) {
      return (session as any).profileId;
    } else {
      throw new LeappNotAwsAccountError(this, 'cannot retrieve profile id of an account that is not an AWS one');
    }
  }

  generateMenu() {
    const version = this.appService.getApp().getVersion();

    let voices = [];
    const allSessions = this.sessionService.list().filter((value, index) => index < 10);
    allSessions.forEach((session: Session) => {
      let icon = '';
      let label = '';
      const profile = this.workspaceService.get().profiles.filter(p => p.id === this.getProfileId(session))[0];
      const iconValue = (profile && profile.name === 'default') ? 'home' : 'user';

      switch (session.type) {
        case SessionType.awsPlain:
          icon = session.status === SessionStatus.active ? __dirname + `/assets/images/${iconValue}-online.png` : __dirname + `/assets/images/${iconValue}-offline.png`;
          label = '  ' + session.sessionName + ' - ' + 'plain';
          break;
        case SessionType.awsFederated:
        case SessionType.awsSso:
          icon = session.status === SessionStatus.active ? __dirname + `/assets/images/${iconValue}-online.png` : __dirname + `/assets/images/${iconValue}-offline.png`;
          label = '  ' + session.sessionName + ' - ' + (session as AwsFederatedSession).roleArn.split('/')[1];
          break;
        case SessionType.awsTruster:
          icon = session.status === SessionStatus.active ? __dirname + `/assets/images/${iconValue}-online.png` : __dirname + `/assets/images/${iconValue}-offline.png`;
          label = '  ' + session.sessionName + ' - ' + (session as AwsTrusterSession).roleArn.split('/')[1];
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
            if (session.status !== SessionStatus.active) {
              await this.sessionService.start(session.sessionId);
            } else {
              await this.sessionService.stop(session.sessionId);
            }
            this.generateMenu();
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
          this.appService.getDialog().showMessageBox({icon: __dirname + `/assets/images/Leapp.png`, message: `Leapp.\n` + `Version ${version} (${version})\n` + 'Copyright 2019 beSharp srl.', buttons: ['Ok']});
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
  async cleanBeforeExit() {
    // Check if we are here
    this.appService.logger('Closing app with cleaning process...', LoggerLevel.info, this);

    // We need the Try/Catch as we have a the possibility to call the method without sessions
    try {
      // Stop the sessions...
      const sessions = this.sessionService.listActive();
      sessions.forEach(session => {
        this.sessionService.stop(session.sessionId);
      });
      // Clean the config file
      this.appService.cleanCredentialFile();
    } catch (err) {
      this.appService.logger('No sessions to stop, skipping...', LoggerLevel.error, this, err.stack);
    }

    // Finally quit
    this.appService.quit();
  }
}

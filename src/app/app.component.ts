import {Component, OnInit} from '@angular/core';
import {environment} from '../environments/environment';
import {FileService} from './services/file.service';
import {AppService, LoggerLevel} from './services/app.service';
import {Router} from '@angular/router';
import {WorkspaceService} from './services/workspace.service';
import {SessionService} from './services/session.service';
import {Workspace} from './models/workspace';
import {setTheme} from 'ngx-bootstrap/utils';
import {TimerService} from './services/timer.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  /* Main app file: launches the Angular framework inside Electron app */
  constructor(
    private app: AppService,
    private sessionService: SessionService,
    private workspaceService: WorkspaceService,
    private fileService: FileService,
    private router: Router,
    private timerService: TimerService
  ) {
  }

  ngOnInit() {
    // We get the right moment to set an hook to app close
    const ipc = this.app.getIpcRenderer();
    ipc.on('app-close', () => {
      this.app.logger('Preparing for closing instruction...', LoggerLevel.INFO, this);
      this.beforeCloseInstructions();
    });

    // Use ngx bootstrap 4
    setTheme('bs4');

    if (environment.production) {
      // Clear both info and warn message in production
      // mode without removing them from code actually
      console.warn = () => {};
      console.log = () => {};
    }

    // Prevent Dev Tool to show on production mode
    this.app.blockDevToolInProductionMode();

    // Create or Get the workspace
    this.workspaceService.create();
    const workspace = this.workspaceService.get();

    // Check the existence of a pre-Leapp credential file and make a backup
    this.showCredentialBackupMessageIfNeeded(workspace);

    // All sessions start stopped when app is launched
    if (workspace.sessions.length > 0) {
      workspace.sessions.forEach(sess => this.sessionService.stop(sess.sessionId));
    }

    // Start Global Timer (1s)
    this.timerService.start(this.sessionService.checkExpiring.bind(this.sessionService));

    // Go to initial page if no sessions are already created or
    // go to the list page if is your second visit
    if (workspace.sessions.length > 0) {
      this.router.navigate(['/session-selected']);
    } else {
      this.router.navigate(['/start']);
    }
  }

  /**
   * This is an hook on the closing app to remove credential file and force stop using them
   */
  private beforeCloseInstructions() {
    // Check if we are here
    this.app.logger('Closing app with cleaning process...', LoggerLevel.INFO, this);

    // We need the Try/Catch as we have a the possibility to call the method without sessions
    try {
      // Clean the config file
      this.app.cleanCredentialFile();
    } catch (err) {
      this.app.logger('No sessions to stop, skipping...', LoggerLevel.ERROR, this, err.stack);
    }

    // Finally quit
    this.app.quit();
  }

  /**
   * Show that we created a copy of original credential file if present in the system
   */
  private showCredentialBackupMessageIfNeeded(workspace: Workspace) {

    const oldAwsCredentialsPath = this.app.getOS().homedir() + '/' + environment.credentialsDestination;
    const newAwsCredentialsPath = oldAwsCredentialsPath + '.leapp.bkp';
    const check = workspace.sessions.length === 0 && this.app.getFs().existsSync(oldAwsCredentialsPath);

    this.app.logger(`Check existing credential file: ${check}`, LoggerLevel.INFO, this);

    if (check) {
      this.app.getFs().renameSync(oldAwsCredentialsPath, newAwsCredentialsPath);
      this.app.getDialog().showMessageBox({
        type: 'info',
        icon: __dirname + '/assets/images/Leapp.png',
        message: 'You had a previous credential file. We made a backup of the old one in the same directory before starting.'
      });
    }
  }
}

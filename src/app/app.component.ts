import {Component, OnInit} from '@angular/core';
import {registerLocaleData} from '@angular/common';
import localeEn from '@angular/common/locales/en';
import {TranslateService} from '@ngx-translate/core';
import {environment} from '../environments/environment';
import {ConfigurationService} from './services-system/configuration.service';
import {FileService} from './services-system/file.service';
import {AppService, LoggerLevel} from './services-system/app.service';
import {Router} from '@angular/router';
import {setTheme} from 'ngx-bootstrap';
import {CredentialsService} from './services/credentials.service';
import {WorkspaceService} from './services/workspace.service';
import {SessionService} from './services/session.service';
import {MenuService} from './services/menu.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  /* Main app file: launches the Angular framework inside Electron app */
  constructor(
    private translateService: TranslateService,
    private router: Router,
    private configurationService: ConfigurationService,
    private fileService: FileService,
    private app: AppService,
    private credentialsService: CredentialsService,
    private menuService: MenuService
  ) {}

  ngOnInit() {

    // Initial starting point for DEBUG
    this.router.navigate(['/wizard', 'start-screen']);
    // Use ngx bootstrap 4
    setTheme('bs4');
    // Register locale languages and set the default one: we currently use only en
    this.translateService.setDefaultLang('en');
    registerLocaleData(localeEn, 'en');

    if (environment.production) {
      // Clear both info and warn message in production mode without removing them from code actually
      console.warn = () => {};
      console.log = () => {};
    }

    // If we have credentials copy them from workspace file to the .aws credential file
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    if (workspace.awsCredentials) {
      this.fileService.iniWriteSync(this.fileService.homeDir() + '/.aws/credentials', workspace.awsCredentials);
      this.app.logger('workspace set correctly at app start', LoggerLevel.INFO);
    }

    // Prevent Dev Tool to show on production mode
    this.app.currentBrowserWindow().webContents.on('devtools-opened', () => {
      if (environment.production) {
        this.app.currentBrowserWindow().webContents.closeDevTools();
      }
    });

    // We get the right moment to set an hook to app close
    const ipc = this.app.getIpcRenderer();
    ipc.on('app-close', () => {
      this.beforeCloseInstructions();
    });

    // We start the current session if there is one
    this.activateSession();
  }

  /**
   * Activate the current session by launching an emit signal to the refresh credential service
   */
  activateSession() {
    console.log('activating session...');
    this.credentialsService.refreshCredentialsEmit.emit();
  }

  /**
   * This is an hook on the closing app to remove credential file and force stop using them
   */
  beforeCloseInstructions() {
    this.menuService.cleanBeforeExit();
  }
}


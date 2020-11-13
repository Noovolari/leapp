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
import {MenuService} from './services/menu.service';
import {WorkspaceService} from './services/workspace.service';

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
    if (workspace) {
      // Set it as default
      this.configurationService.setDefaultWorkspaceSync(workspace.name);
    }

    // Fix for retro-compatibility with old workspace configuration
    this.verifyWorkspace();

    // Prevent Dev Tool to show on production mode
    this.app.currentBrowserWindow().webContents.on('devtools-opened', () => {
      if (environment.production) {
        this.app.logger('Closing Web tools in production mode', LoggerLevel.INFO, this);
        this.app.currentBrowserWindow().webContents.closeDevTools();
      }
    });

    // We get the right moment to set an hook to app close
    const ipc = this.app.getIpcRenderer();
    ipc.on('app-close', () => {
      this.app.logger('Preparing for closing instruction...', LoggerLevel.INFO, this);
      this.beforeCloseInstructions();
    });

    // Initial starting point for DEBUG
    this.router.navigate(['/start']);
  }

  /**
   * This is an hook on the closing app to remove credential file and force stop using them
   */
  private beforeCloseInstructions() {
    this.menuService.cleanBeforeExit();
  }

  /**
   * Fix for having old proxy to new configuration
   */
  private verifyWorkspace() {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    if (workspace !== undefined && workspace !== null) {
      const hasNewConf = workspace.proxyConfiguration !== undefined;
      if (!hasNewConf) {
        const proxyUrl = workspace.proxyUrl ? workspace.proxyUrl : '';
        workspace.proxyConfiguration = { proxyPort: '8080', proxyProtocol: 'https', proxyUrl, username: '', password: '' };
        this.configurationService.updateWorkspaceSync(workspace);
      }
    }
  }
}

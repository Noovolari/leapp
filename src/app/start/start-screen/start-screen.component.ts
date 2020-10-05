import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {ExecuteServiceService} from '../../services-system/execute-service.service';
import {AppService, LoggerLevel, ToastLevel} from '../../services-system/app.service';
import {Router} from '@angular/router';
import {ConfigurationService} from '../../services-system/configuration.service';
import {AntiMemLeak} from '../../core/anti-mem-leak';
import {MenuService} from '../../services/menu.service';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-wizard-page',
  templateUrl: './start-screen.component.html',
  styleUrls: ['./start-screen.component.scss']
})
export class StartScreenComponent extends AntiMemLeak implements OnInit, AfterViewInit {

  @Input() versionLabel = '...';

  enabled = false;
  cliError = false;
  loading = false;
  workspace;

  /**
   * Dependencies Page is used to check if we already have the correct configuratrion and send you to the session page or to the setup managing otherwise
   */
  constructor(
    private router: Router,
    private exec: ExecuteServiceService,
    private appService: AppService,
    private configurationService: ConfigurationService,
    private menuService: MenuService
  ) {
    super();
    // Use the default workspace and set it as a class global
    this.workspace = this.configurationService.getDefaultWorkspaceSync();
  }

  ngOnInit() {}

  ngAfterViewInit() {
    // Check to verify the workspace object is well-formed
    // for the current version of Leapp otherwise alert the user
    const result = this.verifyWorkspaceIsWellformed();

    // Show a message informing the user if we needed to make a backup of the credential file
    this.showCredentialBackupMessageIfNeeded();

    if (result) {
      // Generate the contextual menu
      this.menuService.generateMenu();
      // If configuration is not needed go to session list
      if (this.isAlreadyConfigured()) {
        // We already have at least one default account to start, let's go to session page
        this.router.navigate(['/sessions', 'session-selected']);
      }
    }
  }

  /**
   * Verify the workspace is wellformed
   */
  verifyWorkspaceIsWellformed() {
    console.log('workspace:', JSON.stringify(this.workspace));
    let result = true;
    if (
      JSON.stringify(this.workspace) !== '{}' &&
      (this.workspace.sessions === undefined ||
       this.workspace.azureProfile === undefined ||
       this.workspace.azureConfig === undefined)
    ) {
      this.appService.toast('The Leapp Workspace file is either outdated or corrupt. Please contact us opening an issue online.', ToastLevel.ERROR, 'Workspace file outdated or corrupted');
      result =  false;
    }
    return result;
  }

  /**
   * Is the app already configured or not?
   */
  isAlreadyConfigured() {
    return this.workspace && this.workspace.sessions && this.workspace.sessions.length > 0;
  }

  // MVP: we use this to just check if aws cli is installed in order to proceed to
  // step 3: when going off MVP return to correct method above
  resolveDependencies() {
    // Check to verify the workspace object is well-formed
    // for the current version of Leapp otherwise alert the user
    const result = this.verifyWorkspaceIsWellformed();
    if (result) {
      // Prepare variables to start doing things
      this.loading = true;
      this.enabled = true;
      // Valid Licence already go on as always

      if (this.isAlreadyConfigured()) {
        // Stop the loader
        this.loading = false;
        // We already have at least one default account to start, let's go to session page
        this.router.navigate(['/sessions', 'session-selected']);
      } else {
        // We need to setup at least on e Principal Account and Role (aka Federated one)
        // But we also check for the new liteClient variable: if true we go to the setup,
        // otherwise we go directly to the session download as we need the list
        // Stop the loader
        this.loading = false;
        this.router.navigate(['/managing', 'create-account'], { queryParams: { firstTime: true }});
      }
    }
  }

  openDocumentation() {
    this.appService.openExternalUrl('https://github.com/Noovolari/leapp/blob/master/README.md');
  }

  showCredentialBackupMessageIfNeeded() {
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    const awsCredentialsPath = this.appService.getOS().homedir() + '/' + environment.credentialsDestination + '.leapp.bkp';

    if (JSON.stringify(workspace) === '{}' && this.appService.getFs().existsSync(awsCredentialsPath)) {
      this.appService.getDialog().showMessageBox({
        type: 'info',
        icon: __dirname + '/assets/images/Leapp.png',
        message: 'You had a previous credential file. We made a backup of the old one in the same directory before starting.'
      });
    }
  }
}

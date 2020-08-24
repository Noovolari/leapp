import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {ExecuteServiceService} from '../../services-system/execute-service.service';
import {AppService} from '../../services-system/app.service';
import {Router} from '@angular/router';
import {ConfigurationService} from '../../services-system/configuration.service';
import {WorkspaceService} from '../../services/workspace.service';
import {AntiMemLeak} from '../../core/anti-mem-leak';

@Component({
  selector: 'app-wizard-page',
  templateUrl: './start-screen.component.html',
  styleUrls: ['./start-screen.component.scss']
})
export class StartScreenComponent extends AntiMemLeak implements OnInit, AfterViewInit {

  private OS: string;

  @Input() versionLabel = '...';

  enabled = false;
  showCLiError = false;
  genericError = false;
  licenceError = false;
  cliError = false;

  loading = true;
  licenceErrorMessage;

  /**
   * Dependencies Page is used to check if we already have the correct configuratrion and send you to the session page or to the setup wizard otherwise
   */
  constructor(
    private router: Router,
    private exec: ExecuteServiceService,
    public app: AppService,
    private configurationService: ConfigurationService,
    private workspaceService: WorkspaceService,
  ) {
    super();

    this.OS = this.app.detectOs();
    this.app.enablePowerMonitorFeature();
  }

  ngOnInit() {
    this.resolveDirectly();
  }

  ngAfterViewInit() {
    this.app.generateMenu();
  }

  resolveDirectly() {
    this.enabled = true;
    this.loading = false;
    this.resolveDependenciesMvp();
  }

  // MVP: we use this to just check if aws cli is installed in order to proceed to
  // step 3: when going off MVP return to correct method above
  resolveDependenciesMvp() {
    this.loading = true;

    // Valid Licence already go on as always
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    if (workspace.accountRoleMapping &&
        workspace.accountRoleMapping.accounts &&
        workspace.accountRoleMapping.accounts.length > 0) {
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
      this.router.navigate(['/wizard', 'setup-federation-url']);
    }
  }

}

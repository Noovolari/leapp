import {Component, OnInit, Renderer2} from '@angular/core';
import {AppService, LoggerLevel, ToastLevel} from '../../services-system/app.service';
import {ConfigurationService} from '../../services-system/configuration.service';
import {Router} from '@angular/router';
import {AntiMemLeak} from '../../core/anti-mem-leak';
import {HttpClient} from '@angular/common/http';
import {ExecuteServiceService} from '../../services-system/execute-service.service';
import {ProxyService} from '../../services/proxy.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-profile-sidebar',
  templateUrl: './profile-sidebar.component.html',
  styleUrls: ['./profile-sidebar.component.scss']
})
export class ProfileSidebarComponent extends AntiMemLeak implements OnInit {

  profileOpen = false;
  test: any;

  /* Profile Sidebar with links */
  private execSubscription: Subscription;

  constructor(
    private appService: AppService,
    private configurationService: ConfigurationService,
    private router: Router,
    private httpClient: HttpClient,
    private executeService: ExecuteServiceService,
    private proxyService: ProxyService,
    private renderer: Renderer2
  ) { super(); }

  /**
   * Init the profile sidebar using the event emitter status listener
   */
  ngOnInit() {
    const sub = this.appService.profileOpen.subscribe(res => {
      this.profileOpen = res;
      this.profileOpen ? this.renderer.addClass(document.body, 'moved') : this.renderer.removeClass(document.body, 'moved');
    });
    this.subs.add(sub);
  }

  /**
   * logout from Leapp
   */
  logout() {
    // Data clean
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    this.configurationService.newConfigurationFileSync();
    this.appService.logger('Cleaning Azure config files...', LoggerLevel.INFO, this);

    // Azure clean
    workspace.azureProfile = null;
    workspace.azureConfig = null;
    this.configurationService.updateWorkspaceSync(workspace);

    if (this.execSubscription) { this.execSubscription.unsubscribe(); }
    this.execSubscription = this.executeService.execute('az account clear 2>&1').subscribe(res => {}, err => {});
  }


  closeProfile() {
    this.profileOpen = false;
    this.appService.profileOpen.emit(false);
    this.appService.logger(`Profile open emitting: ${this.profileOpen}`, LoggerLevel.INFO, this);
    this.renderer.removeClass(document.body, 'moved');
  }

  goToProfile() {
    this.closeProfile();
    this.router.navigate(['/profile']);
  }

  goToHome() {
    this.closeProfile();
    this.router.navigate(['/sessions', 'session-selected']);
  }

  goToIntegrations() {
    this.closeProfile();
    this.router.navigate(['/integrations', 'list']);
  }

  goToIdentityProvider() {
    this.closeProfile();
    this.router.navigate(['/integrations', 'aws-sso']);
  }
}

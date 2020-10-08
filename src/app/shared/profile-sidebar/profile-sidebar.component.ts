import {Component, OnInit} from '@angular/core';
import {AppService, LoggerLevel} from '../../services-system/app.service';
import {ConfigurationService} from '../../services-system/configuration.service';
import {Router} from '@angular/router';
import {AntiMemLeak} from '../../core/anti-mem-leak';
import {HttpClient} from '@angular/common/http';
import {ExecuteServiceService} from '../../services-system/execute-service.service';
import {throwError} from 'rxjs';

@Component({
  selector: 'app-profile-sidebar',
  templateUrl: './profile-sidebar.component.html',
  styleUrls: ['./profile-sidebar.component.scss']
})
export class ProfileSidebarComponent extends AntiMemLeak implements OnInit {

  profileOpen = false;
  test: any;

  /* Profile Sidebar with links */
  constructor(
    private appService: AppService,
    private configurationService: ConfigurationService,
    private router: Router,
    private httpClient: HttpClient,
    private executeService: ExecuteServiceService
  ) { super(); }

  /**
   * Init the profile sidebar using the event emitter status listener
   */
  ngOnInit() {
    const sub = this.appService.profileOpen.subscribe(res => {
      this.profileOpen = res;
    });
    this.subs.add(sub);
  }

  /**
   * logout from Leapp
   */
  logout() {
    console.log('BEGIN logout');

    // Google clean
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    let proxyUrl;

    const options = this.configurationService.url.parse('https://mail.google.com/mail/u/0/?logout&hl=en');

    if (workspace) {
      proxyUrl = workspace.proxyUrl;
    }

    if (proxyUrl !== undefined && proxyUrl !== null && proxyUrl !== '') {
      console.log('proxyUrl DEFINED');
      console.log('proxyUrl: ', proxyUrl);
      const agent = new this.configurationService.httpsProxyAgent('http://' + proxyUrl + ':3128');
      options.agent = agent;
    }

    console.log('IN logout - BEFORE CALL');
    this.configurationService.https.get(options, (res) => {
      console.log('res: ', res);
      this.configurationService.newConfigurationFileSync();
      console.log('END logout');
    }).on('error', (err) => {
      console.log('error: ', err);
    }).end();

    // Azure Clean
    workspace.azureProfile = null;
    workspace.azureConfig = null;
    this.configurationService.updateWorkspaceSync(workspace);
    this.executeService.execute('az account clear 2>&1').subscribe(res => {}, err => {});
  }

  /**
   * Go to Account Management
   */
  gotToAccountManagement() {
    this.closeProfile();
    this.router.navigate(['/sessions', 'list-accounts']);
  }

  closeProfile() {
    this.profileOpen = false;
    this.appService.profileOpen.emit(false);
  }

  goToProfile() {
    this.closeProfile();
    this.router.navigate(['/profile']);
  }
}

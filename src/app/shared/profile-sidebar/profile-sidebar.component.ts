import {Component, OnInit} from '@angular/core';
import {AppService, LoggerLevel} from '../../services-system/app.service';
import {ConfigurationService} from '../../services-system/configuration.service';
import {Router} from '@angular/router';
import {AntiMemLeak} from '../../core/anti-mem-leak';
import {HttpClient} from '@angular/common/http';
import {ExecuteServiceService} from '../../services-system/execute-service.service';
import {PROXY_CONFIG} from "../../../../proxy.conf";
import {catchError} from "rxjs/operators";
import {of, throwError} from "rxjs";

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
    // Google clean
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    let proxyUrl;

    if (workspace) {
      proxyUrl = workspace.proxyUrl;
    }

    /* if (proxyUrl !== undefined && proxyUrl !== null && proxyUrl !== '') {
      PROXY_CONFIG[0]['bypass'] = false;
      PROXY_CONFIG[0]['target'] = proxyUrl;
    } else {
      PROXY_CONFIG[0]['bypass'] = true;
      PROXY_CONFIG[0]['target'] = '';
    } */

    console.log('logout');
    this.httpClient.get<any>('https://mail.google.com/mail/u/0/?logout&hl=en').subscribe((res) => {
      console.log('res: ', res);
    }, (err) => {
      console.log('error: ', err);

      if (err.status === 500 || err.error.text === undefined) {
        return throwError('There was a problem with your connection. Please retry.');
      } else {
        if (err.error.text.indexOf('net::ERR_NETWORK_CHANGED') > -1 ||
          err.error.text.indexOf('net::ERR_NAME_NOT_RESOLVED') > -1 ||
          err.error.text.indexOf('net::ERR_INTERNET_DISCONNECTED') > -1 ||
          err.error.text.indexOf('net::ERR_NETWORK_IO_SUSPENDED') > -1) {
          this.appService.toast('There was a problem with your connection. Please retry.', LoggerLevel.ERROR);
        } else {
          this.configurationService.newConfigurationFileSync();
        }
      }
    });

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

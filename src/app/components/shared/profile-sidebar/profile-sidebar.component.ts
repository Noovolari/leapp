import {Component, OnInit, Renderer2} from '@angular/core';
import {AppService, LoggerLevel} from '../../../services/app.service';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {ExecuteService} from '../../../services/execute.service';
import {ProxyService} from '../../../services/proxy.service';
import {WorkspaceService} from '../../../services/workspace.service';
<<<<<<< HEAD
=======
import {LoggingService} from '../../../services/logging.service';
>>>>>>> electron-update

@Component({
  selector: 'app-profile-sidebar',
  templateUrl: './profile-sidebar.component.html',
  styleUrls: ['./profile-sidebar.component.scss']
})
export class ProfileSidebarComponent implements OnInit {

  profileOpen = false;
  test: any;
  version;

  constructor(
    private appService: AppService,
    private router: Router,
    private httpClient: HttpClient,
    private executeService: ExecuteService,
    private proxyService: ProxyService,
    private workspaceService: WorkspaceService,
<<<<<<< HEAD
=======
    private loggingService: LoggingService,
>>>>>>> electron-update
    private renderer: Renderer2
  ) {}

  /**
   * Init the profile sidebar using the event emitter status listener
   */
  ngOnInit() {
    this.version = this.appService.getApp().getVersion();
<<<<<<< HEAD
    
=======

>>>>>>> electron-update
    this.appService.profileOpen.subscribe(res => {
      this.profileOpen = res;
      if (this.profileOpen) {
        this.renderer.addClass(document.body, 'moved');
      } else {
        this.renderer.removeClass(document.body, 'moved');
      }
    });
  }

  /**
   * logout from Leapp
   */
  async logout() {
    await this.appService.logout();
  }

  closeProfile() {
    this.profileOpen = false;
    this.appService.profileOpen.emit(false);
<<<<<<< HEAD
    this.appService.logger(`Profile open emitting: ${this.profileOpen}`, LoggerLevel.info, this);
=======
    this.loggingService.logger(`Profile open emitting: ${this.profileOpen}`, LoggerLevel.info, this);
>>>>>>> electron-update
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

  goToIdentityProvider() {
    this.closeProfile();
    this.router.navigate(['/', 'aws-sso']);
  }
}

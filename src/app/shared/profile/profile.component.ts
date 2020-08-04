import {Component, Input, OnInit} from '@angular/core';
import {FileService} from '../../services-system/file.service';
import {ConfigurationService} from '../../services-system/configuration.service';
import {Configuration} from '../../models/configuration';
import {AppService} from '../../services-system/app.service';
import {NavigationEnd, Router} from '@angular/router';
import {WorkspaceService} from '../../services/workspace.service';
import {switchMap, tap} from 'rxjs/internal/operators';
import {AntiMemLeak} from '../../core/anti-mem-leak';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent extends AntiMemLeak implements OnInit {

  @Input() havePortrait = false;
  @Input() portrait = '';
  @Input() workspaceName = '';
  @Input() emailData = '';

  private isInsideSessionList = false;
  private url = '';
  private federationUrl;
  private profileIsOpen = false;

  /* The header that we shows on the app */
  constructor(
    private fileService: FileService,
    private configurationService: ConfigurationService,
    private appService: AppService,
    private workspaceService: WorkspaceService,
    private router: Router
  ) { super(); }

  ngOnInit() {

    let sub = this.router.events.pipe(
      // Wait the navigation end event and collect information
      tap((event: NavigationEnd) => {
        this.url = this.router.url;
        this.isInsideSessionList = (this.url.indexOf('session-chooser') === -1 && this.url.indexOf('session-selected') === -1);
        this.federationUrl = this.configurationService.getConfigurationFileSync().federationUrl;
      }),
      // Get the configuration file
      switchMap(() => this.configurationService.getConfigurationFile()),
      tap((configuration: any) => {
        // Get the avatar if we have one
        const config: Configuration = configuration;
        if (config.avatar && config.avatar !== '') {
          this.portrait = config.avatar;
          this.havePortrait = true;
        }
      }),
      // If there is an avatar: set the avatar
      switchMap( () => this.appService.avatarSelected),
      tap( (data: any) => {
        this.portrait = data.portrait;
        this.havePortrait = data.havePortrait;
      })
    ).subscribe();
    this.subs.add(sub);

    // Send the info about the email
    sub = this.workspaceService.emailEmit.pipe(tap((email: string) => this.emailData = email)).subscribe();
    this.subs.add(sub);
    // Set the toggle about profile open or not
    sub = this.appService.profileOpen.pipe(tap( (profileOpen: boolean) => this.profileIsOpen = profileOpen)).subscribe();
    this.subs.add(sub);
  }

  // When we toggle profile we emit is opening status
  toggleProfile() {
    this.profileIsOpen = !this.profileIsOpen; // Toggle status
    this.appService.profileOpen.emit(this.profileIsOpen); // Emit event for screen
  }
}

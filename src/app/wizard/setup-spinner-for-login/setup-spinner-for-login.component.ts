import {Component, NgZone, OnInit} from '@angular/core';
import {IdpResponseType, WorkspaceService} from '../../services/workspace.service';
import {ConfigurationService} from '../../services-system/configuration.service';
import {Router} from '@angular/router';
import {AppService, ToastLevel} from '../../services-system/app.service';
import {environment} from '../../../environments/environment';
import {AntiMemLeak} from '../../core/anti-mem-leak';

@Component({
  selector: 'app-setup-spinner-for-login',
  templateUrl: './setup-spinner-for-login.component.html',
  styleUrls: ['./setup-spinner-for-login.component.scss']
})
export class SetupSpinnerForLoginComponent extends AntiMemLeak implements OnInit {

  liteClient = environment.liteClient;

  constructor(
    private appService: AppService,
    private workspaceService: WorkspaceService,
    private configurationService: ConfigurationService,
    private router: Router,
    private ngZone: NgZone
  ) { super(); }

  // Here we launch a routine to force first login to the User Idp,
  // this way we can set its cookies and proceed to do silent login
  // for the rest of His token validity.
  ngOnInit() {
    // Now we get the default configuration to obtain the previously saved idp url
    const configuration = this.configurationService.getConfigurationFileSync();
    // Set our response type
    const responseType = IdpResponseType.SAML;

    // When the token is received save it and go to the setup page for the first account
    const sub = this.workspaceService.googleEmit.subscribe((googleToken) => this.ngZone.run(() => this.createNewWorkspace(googleToken, configuration.federationUrl, responseType)));

    // Call the service for working on the first login event to the user idp
    // We add the helper for account choosing just to be sure to give the possibility to call the correct user
    this.workspaceService.getIdpTokenInSetup(configuration.federationUrl, responseType);
  }

  /**
   * When the data from Google is received, generate a new workspace or check errors, etc.
   */
  createNewWorkspace(googleToken, federationUrl, responseType) {
    const name = this.liteClient ? 'default' : localStorage.getItem('workspace');
    const result = this.workspaceService.createNewWorkspace(googleToken, federationUrl, name, responseType);
    if (result) {
      // Go to first account page
      if (this.liteClient) {

        this.router.navigate(['/wizard', 'welcome-first-account']);
      } else {

        // Retrieve the entire configuration using the google token we have generated just before
        this.workspaceService.getConfiguration().subscribe(res => {

          this.router.navigate(['/sessions', 'session-selected']);
        }, err => {
          // Error: return to dependencies page
          this.appService.toast('Error retrieving remote configuration, please retry', ToastLevel.WARN, 'Remote Configuration Retrieval Error');
          this.router.navigate(['/wizard', 'dependencies']);
        });
      }
    } else {
      // Error: return to dependencies page
      this.router.navigate(['/wizard', 'dependencies']);
    }

  }
}

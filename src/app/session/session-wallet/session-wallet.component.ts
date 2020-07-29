import {Component, Input, OnInit} from '@angular/core';
import {ConfigurationService} from '../../services-system/configuration.service';
import {Workspace} from '../../models/workspace';
import {AppService} from '../../services-system/app.service';

@Component({
  selector: 'app-session-wallet',
  templateUrl: './session-wallet.component.html',
  styleUrls: ['./session-wallet.component.scss']
})
export class SessionWalletComponent implements OnInit {

  name = '';
  email = '';

  constructor(
    private appService: AppService,
    private configurationService: ConfigurationService
  ) { }

  ngOnInit() {
    const workspaceData: Workspace = this.configurationService.getDefaultWorkspaceSync();
    if (workspaceData.name && workspaceData.name !== '') {
      this.name = workspaceData.name;
      this.email = localStorage.getItem('hook_email') || 'not logged in yet';
    }
  }

  /**
   * Simple method to go to noovolari website
   * @param - url - noovolari suite url
   */
  goToWebsite(url) {
    this.appService.openExternalUrl(url);
  }
}

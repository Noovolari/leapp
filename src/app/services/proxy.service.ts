import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {AppService} from '../services-system/app.service';
import {WorkspaceService} from './workspace.service';

@Injectable({
  providedIn: 'root'
})
export class ProxyService {

  constructor(private appService: AppService, private workspaceService: WorkspaceService) {}

  configureBrowserWindow(browserWindow: any): void {
    const workspace = this.workspaceService.get();

    let proxyUrl;
    let proxyPort;
    let proxyProtocol;

    if (workspace.proxyConfiguration) {
      proxyUrl = workspace.proxyConfiguration.proxyUrl;
      proxyPort = workspace.proxyConfiguration.proxyPort;
      proxyProtocol = workspace.proxyConfiguration.proxyProtocol;
    }

    if (proxyUrl !== undefined && proxyUrl !== null && proxyUrl !== '') {
      const rules = `http=${proxyProtocol}://${proxyUrl}:${proxyPort};https=${proxyProtocol}://${proxyUrl}:${proxyPort}`;
      browserWindow.webContents.session.setProxy({
        proxyRules: rules
      });
    }
  }

  getHttpClientOptions(url: string): object {
    const options = this.appService.url.parse(url);
    const workspace = this.workspaceService.get();

    let proxyUrl;
    let proxyPort;
    let proxyProtocol;
    let proxyUsername;
    let proxyPassword;

    if (workspace && workspace.proxyConfiguration) {
      proxyUrl = workspace.proxyConfiguration.proxyUrl;
      proxyProtocol = workspace.proxyConfiguration.proxyProtocol;
      proxyPort = workspace.proxyConfiguration.proxyPort;
      proxyUsername = workspace.proxyConfiguration.username;
      proxyPassword = workspace.proxyConfiguration.password;
    }

    if (proxyUrl !== undefined && proxyUrl !== null && proxyUrl !== '') {
      let rule = `${proxyProtocol}://${proxyUrl}:${proxyPort}`;
      if (proxyUsername !== undefined && proxyUsername !== null && proxyUrl !== '' &&
        proxyPassword !== undefined && proxyPassword !== null && proxyPassword !== '') {
        rule = `${proxyProtocol}://${proxyUsername}:${proxyPassword}@${proxyUrl}:${proxyPort}`;
      }

      const httpsProxyAgent = this.appService.getHttpsProxyAgent();
      options.agent = new httpsProxyAgent(rule);
      options.timeout = environment.timeout;
    }

    return options;
  }

  get(url: string, resCallback: (res: any) => any, errCallback: (err: any) => any): void {
    const options = this.getHttpClientOptions(url);
    this.appService.getFollowRedirects().https.get(options, (res) => resCallback(res)).on('error', (err) => errCallback(err)).end();
  }
}

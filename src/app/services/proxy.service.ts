import {AppService} from '../services-system/app.service';
import {Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {ConfigurationService} from '../services-system/configuration.service';

@Injectable({
  providedIn: 'root'
})
export class ProxyService extends NativeService {

  constructor(
    private appService: AppService,
    private configurationService: ConfigurationService
  ) {
    super();
  }

  configureBrowserWindow(browserWindow: any): void {
    const workspace = this.configurationService.getDefaultWorkspaceSync();

    let proxyUrl;
    let proxyPort;
    let proxyProtocol;

    if (workspace) {
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
    const options = this.configurationService.url.parse(url);
    const workspace = this.configurationService.getDefaultWorkspaceSync();

    let proxyUrl;
    let proxyPort;
    let proxyProtocol;
    let proxyUsername;
    let proxyPassword;

    if (workspace) {
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

      const agent = new this.httpsProxyAgent(rule);
      options.agent = agent;
    }

    return options;
  }

  get(url: string, resCallback: (res: any) => any, errCallback: (err: any) => any): void {
    const options = this.getHttpClientOptions(url);
    this.https.get(options, (res) => resCallback(res)).on('error', (err) => errCallback(err)).end();
  }
}

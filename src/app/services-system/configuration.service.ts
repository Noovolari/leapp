import {Injectable} from '@angular/core';
import {FileService} from './file.service';
import {NativeService} from './native-service';
import {environment} from '../../environments/environment';
import {AppService, LoggerLevel, ToastLevel} from './app.service';
import {Configuration} from '../models/configuration';
import {ExecuteServiceService} from './execute-service.service';
import {WorkspaceService} from '../services/workspace.service';


@Injectable({
  providedIn: 'root'
})
export class ConfigurationService extends NativeService {
  private processSubscription3: any;

  constructor(private fileService: FileService,
              private appService: AppService,
              private executeService: ExecuteServiceService,
              private workspaceService: WorkspaceService) {
    super();
  }


  // ============================================================ //
  // ==================== CONFIGURATION FILE ==================== //
  // ============================================================ //

  /**
   * Verify if the configuration file exists
   */
  public existsConfigurationFile() {
    return this.fs.exists(environment.lockFileDestination);
  }

  /**
   * Update the configuration file synchronously
   * @param config - the configuration object
   */
  public updateConfigurationFileSync(config: Configuration) {
    return this.fileService.writeFileSync(this.os.homedir() + '/' + environment.lockFileDestination, this.fileService.encryptText(JSON.stringify(config, null, 2)));
  }

  /**
   * Get the Azure Profile
   */
  public getAzureProfileSync() {
    return this.fileService.readFileSync(this.os.homedir() + '/' + environment.azureProfile);
  }

  /**
   * Update the access token file synchronously
   * @param azureProfile - the configuration object
   */
  public updateAzureProfileFileSync(azureProfile) {
    return this.fileService.writeFileSync(this.os.homedir() + '/' + environment.azureProfile, azureProfile);
  }


  public getAzureConfigSync() {
    return this.fileService.readFileSync(this.os.homedir() + '/' + environment.azureAccessTokens);
  }

  /**
   * Update the access token file synchronously
   * @param azureConfig - the configuration object
   */
  public updateAzureAccessTokenFileSync(azureConfig) {
    return this.fileService.writeFileSync(this.os.homedir() + '/' + environment.azureAccessTokens, azureConfig);
  }

  public isAzureConfigPresent() {
    return this.fileService.exists(this.os.homedir() + '/' + environment.azureAccessTokens);
  }

  /**
   * Clean the data in the program
   */
  public cleanData() {
    try {
      // Cleaning Library Electron Cache
      // Get app directory
      const getAppPath = this.path.join(this.app.getPath('appData'), `Leapp`);
      this.rimraf.sync(getAppPath);

      // Clean localStorage
      localStorage.clear();
    } catch (err) {
      this.appService.logger(`Leapp has an error cleaning your data.`, LoggerLevel.ERROR, this, err.stack);
    }
  }

  /**
   * Create a new configuration file synchronously
   */
  public async logout() {
    try {

      // Clear all extra data
      const getAppPath = this.path.join(this.app.getPath('appData'), environment.appName);
      this.rimraf.sync(getAppPath + '/Partitions/leapp*');

      // Cleaning Library Electron Cache
      await this.session.defaultSession.clearStorageData();

      // Clean localStorage
      localStorage.clear();

      this.appService.toast('Cache and configuration file cleaned.', ToastLevel.SUCCESS, 'Cleaning configuration file');

      // Restart
      setTimeout(() => {
        this.appService.restart();
      }, 2000);

    } catch (err) {
      this.appService.logger(`Leapp has an error re-creating your configuration file and cache.`, LoggerLevel.ERROR, this, err.stack);
      this.appService.toast(`Leapp has an error re-creating your configuration file and cache.`, ToastLevel.ERROR, 'Cleaning configuration file');
    }
  }

  public getNameFromProfileId(id: string): string {
    const workspace = this.workspaceService.get();
    const session = workspace.profiles.filter(p => p.id === id)[0];
    return session ? session.name : '';
  }

  public cleanAzureCrendentialFile() {
    /*const workspace = this.workspaceService.get();
    if (workspace && this.isAzureConfigPresent()) {
      workspace.azureProfile = this.getAzureProfileSync();
      workspace.azureConfig = this.getAzureConfigSync();
      if (workspace.azureConfig === '[]') {
        // Anomalous condition revert to normal az login procedure
        workspace.azureProfile = null;
        workspace.azureConfig = null;
      }

      this.workspaceService.updateSessions(workspace);
    }
    if (this.processSubscription3) { this.processSubscription3.unsubscribe(); }
    this.processSubscription3 = this.executeService.execute('az account clear 2>&1').pipe(
      switchMap(() => this.executeService.execute('az configure --defaults location=\'\' 2>&1'))
    ).subscribe(() => {}, () => {});*/
  }

  public sanitizeIdpUrlsAndNamedProfiles() {
    /*const workspace = this.getDefaultWorkspaceSync();

    const idpUrls = workspace.idpUrl;
    const profiles = workspace.profiles;

    const sanitizedIdpUrls = [];
    const sanitizedProfiles = [];

    if (idpUrls && profiles) {
      idpUrls.forEach((idpUrl) => {
        if (idpUrl !== null && idpUrl !== undefined) {
          sanitizedIdpUrls.push(idpUrl);
        }
      });

      profiles.forEach((profile) => {
        if (profile !== null && profile !== undefined) {
          sanitizedProfiles.push(profile);
        }
      });

      workspace.idpUrl = sanitizedIdpUrls;
      workspace.profiles = sanitizedProfiles;

      this.updateWorkspaceSync(workspace);
    }*/
  }
}

import {Injectable} from '@angular/core';
import {FileService} from './file.service';
import {NativeService} from './native-service';
import {environment} from '../../environments/environment';
import {AppService, LoggerLevel, ToastLevel} from './app.service';
import {Configuration} from '../models/configuration';
import {ExecuteService} from './execute.service';
import {WorkspaceService} from './workspace.service';


@Injectable({
  providedIn: 'root'
})
export class ConfigurationService extends NativeService {
  private processSubscription3: any;

  constructor(private fileService: FileService,
              private appService: AppService,
              private executeService: ExecuteService,
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
   *
   * @param config - the configuration object
   */
  public updateConfigurationFileSync(config: Configuration) {
    return this.fileService.writeFileSync(this.os.homedir() + '/' + environment.lockFileDestination, this.fileService.encryptText(JSON.stringify(config, null, 2)));
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
      this.appService.logger(`Leapp has an error cleaning your data.`, LoggerLevel.error, this, err.stack);
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

      this.appService.toast('Cache and configuration file cleaned.', ToastLevel.success, 'Cleaning configuration file');

      // Restart
      setTimeout(() => {
        this.appService.restart();
      }, 2000);

    } catch (err) {
      this.appService.logger(`Leapp has an error re-creating your configuration file and cache.`, LoggerLevel.error, this, err.stack);
      this.appService.toast(`Leapp has an error re-creating your configuration file and cache.`, ToastLevel.error, 'Cleaning configuration file');
    }
  }

}

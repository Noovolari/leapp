import {EventEmitter, Injectable} from '@angular/core';
import {FileService} from './file.service';
import {NativeService} from './native-service';
import {environment} from '../../environments/environment';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {AppService, LoggerLevel, ToastLevel} from './app.service';
import {Workspace} from '../models/workspace';
import {Configuration} from '../models/configuration';
import {_} from '../core/translation-marker';
import {Session} from '../models/session';


@Injectable({
  providedIn: 'root'
})
export class ConfigurationService extends NativeService {

  constructor(private fileService: FileService, private appService: AppService) {
    super();
  }

  public changeDefaultWorkspace: EventEmitter<string> = new EventEmitter();

  // ============================================================ //
  // ======================== WORKSPACES ======================== //
  // ============================================================ //

  // TODO Why here there are all the function on workspace and in workspaceService there is the create new Workspace?

  /**
   * Check if a workspace exists
   * @param workspaceName - the name of the workspace to search
   * @returns a {boolean}
   */
  public workspaceExists(workspaceName: string): boolean {
    const config = this.getConfigurationFileSync();
    return this.getFilteredWorkspace(config, workspaceName) !== null;
  }

  /**
   * Update a workspace or add it and retry if not in the configuration file.
   * It also update the credential file if the workspace is the default one.
   * @param workspace - {Workspace} object to update
   */
  public updateWorkspaceSync(workspace: Workspace) {
    const configuration = this.getConfigurationFileSync();
    configuration.workspaces[0] = workspace;
    // Everything ok so far so we can update the configuration file with the updated workspace
    this.updateConfigurationFileSync(configuration);
  }

  /**
   * Add a workspace to the configuration workspace array,
   * if the workspace exists it replaces it with the new version
   * @param workspace the {Workspace} to add
   */
  public addWorkspaceSync(workspace: Workspace) {

    // Remove the old version if exists go on otherwise
    if (this.workspaceExists(workspace.name)) {
      this.appService.logger(`Workspace - ${workspace.name} - already exists, updating configuration`, LoggerLevel.WARN, this);
      this.removeWorkspaceSync(workspace.name);
    } else {
      this.appService.logger(`Adding Workspace - ${workspace.name} - to configuration`, LoggerLevel.INFO, this);
    }

    // Set the configuration with the updated value
    const configuration = this.getConfigurationFileSync();
    // TODO: we need more than one workspace?
    configuration.workspaces = configuration.workspaces ? configuration.workspaces : [];
    configuration.workspaces.push(workspace);
    this.updateConfigurationFileSync(configuration);
  }

  /**
   * Set the default workspace in the configuration file
   * @param workspaceName - the workspace to set as default one
   */
  public setDefaultWorkspaceSync(workspaceName: string) {
    const conf = this.getConfigurationFileSync();
    conf.defaultWorkspace = workspaceName;
    try {
      this.updateConfigurationFileSync(conf);
      this.changeDefaultWorkspace.emit(workspaceName);
    } catch (error) {
      this.appService.logger(`Proble setting default workspace: ${workspaceName}.`, LoggerLevel.ERROR, this, error.stack);
      throw error;
    }
  }

  /**
   * Get Default Workspace
   * @returns the default {Workspace}
   */
  // TODO: WHY IT SHOULD RETURN A EMPTY HASH??
  public getDefaultWorkspaceSync(): Workspace | any {
    const config = this.getConfigurationFileSync();
    if (config.defaultWorkspace) {
      return this.getFilteredWorkspace(config, config.defaultWorkspace);
    }
    return {};
  }


  /**
   * Get a specific Workspace
   * @param name - the workspace to search
   * @returns the selected {Workspace}
   */
  public getWorkspaceSync(name: string): Workspace {
    const config  = this.getConfigurationFileSync();
    return this.getFilteredWorkspace(config, name);
  }

  /**
   * Remove a workspace
   * @param name - the workspace to remove
   */
  public removeWorkspaceSync(name: string) {
    if (this.workspaceExists(name)) {
      const config  = this.getConfigurationFileSync();
      const copy = config.workspaces;
      config.workspaces = copy.reduce((p, workspace) => (workspace.name !== name && p.push(workspace), p), []);
      config.defaultWorkspace = (name === config.defaultWorkspace) ? undefined : config.defaultWorkspace;
      this.updateConfigurationFileSync(config);
    }
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
   * Get the configuration file
   */
  public getConfigurationFile(): Observable<Configuration> {
    return this.fileService.readFile(this.os.homedir() + '/' + environment.lockFileDestination).pipe(map(result => JSON.parse(this.fileService.decryptText(result))));
  }

  /**
   * Get the configuration file synchronously
   */
  public getConfigurationFileSync(): Configuration {
    return JSON.parse(this.fileService.decryptText(this.fileService.readFileSync(this.os.homedir() + '/' + environment.lockFileDestination)));
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
  public async newConfigurationFileSync() {
    try {

      // Clear all extra data
      const getAppPath = this.path.join(this.app.getPath('appData'), environment.appName);
      this.rimraf.sync(getAppPath + '/Partitions/leapp*');

      // Cleaning Library Electron Cache
      await this.session.defaultSession.clearStorageData();

      // Clean localStorage
      localStorage.clear();

      this.appService.toast(_('Cache and configuration file cleaned.'), ToastLevel.SUCCESS, _('Cleaning configuration file'));

      // Restart
      setTimeout(() => {
        this.appService.restart();
      }, 2000);

    } catch (err) {
      this.appService.logger(`Leapp has an error re-creating your configuration file and cache.`, LoggerLevel.ERROR, this, err.stack);
      this.appService.toast(_(`Leapp has an error re-creating your configuration file and cache.`), ToastLevel.ERROR, _('Cleaning configuration file'));
    }
  }

  public disableLoadingWhenReady(workspace: Workspace, session: Session) {
    workspace.sessions.forEach(sess => {
      if (sess.id === session.id) {
        sess.loading = false;
      }
    });
    this.updateWorkspaceSync(workspace);
    this.appService.redrawList.emit();
  }

  // ============================================================ //
  // ====================== PRIVATE METHODS ===================== //
  // ============================================================ //

  /**
   * Get a filtered Workspace
   * @param config - the configuration file called .Leapp-lock
   * @param name - the workspace to search
   * @returns the {Workspace} or null if nothing is found
   */
  private getFilteredWorkspace(config: Configuration, name: string): Workspace {
    if (config) {
      // Get the workspace array that are filtered by name
      const workspacesFiltered = config.workspaces.filter(workspace => workspace.name === name);
      if (workspacesFiltered.length > 0) {
        return workspacesFiltered[0];
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

}

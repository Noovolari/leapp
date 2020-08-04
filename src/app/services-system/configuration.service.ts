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

    // Check if the workspace is in the array
    const index = configuration.workspaces.findIndex((elem) => elem.name === workspace.name);
    if (index !== -1) {
      // If the workspace is found change it
      configuration.workspaces[index] = workspace;

      // If this workspace is also the default one we need to re-write the credential file default profile
      if (configuration.defaultWorkspace === workspace.name) {
        try {
          if (workspace.awsCredentials !== null && workspace.awsCredentials !== undefined) {
            this.fileService.iniWriteSync(this.appService.awsCredentialPath(), workspace.awsCredentials);
          }
        } catch (error) {
          throw error;
        }

        // Everything ok so far so we can update the configuration file with the updated workspace
        this.updateConfigurationFileSync(configuration);
      }
    } else {
      // Add it: is a new one for some reason, then relaunch the command
      configuration.workspaces.push(workspace);
      this.updateWorkspaceSync(workspace);
    }
  }

  /**
   * Add a workspace to the configuration workspace array,
   * if the workspace exists it replaces it with the new version
   * @param workspace the {Workspace} to add
   */
  public addWorkspaceSync(workspace: Workspace) {

    // Remove the old version if exists go on otherwise
    if (this.workspaceExists(workspace.name)) {
      this.appService.logger(`Workspace - ${workspace.name} - already exists, updating configuration`, LoggerLevel.WARN);
      this.removeWorkspaceSync(workspace.name);
    } else {
      this.appService.logger(`Adding Workspace - ${workspace.name} - to configuration`, LoggerLevel.INFO);
    }

    // Set the configuration with the updated value
    const configuration = this.getConfigurationFileSync();
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
      throw error;
    }
  }

  /**
   * Get Default Workspace
   * @returns the default {Workspace}
   */
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
   * Clean the data in the program
   */
  public cleanData() {
    try {
      // Cleaning Library Electron Cache
      // Get app directory
      // on OSX it's /Users/Yourname/Library/Application Support/AppName
      const getAppPath = this.path.join(this.app.getPath('appData'), `Leapp`);
      this.rimraf.sync(getAppPath);

      // Clean localStorage
      localStorage.clear();
    } catch (err) {}
  }

  /**
   * Create a new configuration file synchronously
   */
  public newConfigurationFileSync() {
    try {
      // Cleaning Library Electron Cache
      // Get app directory
      // on OSX it's /Users/Yourname/Library/Application Support/AppName
      const getAppPath = this.path.join(this.app.getPath('appData'), `Leapp`);
      this.rimraf.sync(getAppPath);

      // Clean localStorage
      localStorage.clear();

      this.appService.toast(_('Cache and configuration file cleaned.'), ToastLevel.SUCCESS, _('Cleaning configuration file'));

      // Restart
      setTimeout(() => {
        this.appService.restart();
      }, 2000);

    } catch (err) {
      this.appService.toast(_(`Leapp has an error re-creating your configuration file and cache.`), ToastLevel.ERROR, _('Cleaning configuration file'));
    }
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

import { FileService } from "./file-service";
import { INativeService } from "../interfaces/i-native-service";
import { LoggedEntry, LogLevel, LogService } from "./log-service";
import { Workspace } from "../models/workspace";
import { constants } from "../models/constants";
import { deserialize, serialize } from "class-transformer";
import { IntegrationType } from "../models/integration-type";

export class WorkspaceConsistencyService {
  private _workspaceFileName: string;

  constructor(private fileService: FileService, private nativeService: INativeService, private logService: LogService) {}

  private get fileLockPath(): string {
    return this.nativeService.os.homedir() + "/" + constants.lockFileDestination;
  }

  private get fileLockBackupPath(): string {
    return this.nativeService.os.homedir() + "/" + constants.lockFileBackupPath;
  }

  get workspaceFileName(): string {
    return this._workspaceFileName;
  }

  set workspaceFileName(value: string) {
    this._workspaceFileName = value;
  }

  getWorkspace(): Workspace {
    try {
      const workspace = this.loadWorkspace();
      this.checkConsistency(workspace);
      if (this.workspaceFileName === constants.lockFileDestination) {
        this.saveBackup(workspace);
      }
      return workspace;
    } catch (error) {
      this.logService.log(new LoggedEntry(error.message, this, LogLevel.error, false, error.stack));
      const path = this.nativeService.os.homedir() + "/" + this.workspaceFileName;
      if (this.workspaceFileName === constants.lockFileDestination && this.fileService.existsSync(path)) {
        try {
          return this.restoreBackup();
        } catch (restoreError) {
          this.logService.log(new LoggedEntry(restoreError.message, this, LogLevel.error, false, restoreError.stack));
          return this.cleanWorkspace();
        }
      } else {
        return this.cleanWorkspace();
      }
    }
  }

  createNewWorkspace(): Workspace {
    const workspace = new Workspace();
    workspace.setNewWorkspaceVersion();
    return workspace;
  }

  private checkConsistency(workspace: Workspace) {
    const sessionIds = new Set(workspace.sessions.map((session) => session.sessionId));
    if (sessionIds.size !== workspace.sessions.length) {
      throw new Error("Sessions with duplicated ids");
    }
    const awsSsoIntegrationIds = new Set(workspace.awsSsoIntegrations.map((integration) => integration.id));
    if (awsSsoIntegrationIds.size !== workspace.awsSsoIntegrations.length) {
      throw new Error("AWS SSO integrations with duplicated ids");
    }
    const azureIntegrationIds = new Set(workspace.azureIntegrations.map((integration) => integration.id));
    if (azureIntegrationIds.size !== workspace.azureIntegrations.length) {
      throw new Error("Azure integrations with duplicated ids");
    }
    const awsProfileIds = new Set(workspace.profiles.map((profile) => profile.id));
    if (awsProfileIds.size !== workspace.profiles.length) {
      throw new Error("AWS named profiles with duplicated ids");
    }
    const idpUrlIds = new Set(workspace.idpUrls.map((idpUrl) => idpUrl.id));
    if (idpUrlIds.size !== workspace.idpUrls.length) {
      throw new Error("AWS IdP URLs with duplicated ids");
    }

    for (const session of workspace.sessions as any[]) {
      if (session.profileId && !awsProfileIds.has(session.profileId)) {
        throw new Error(`Session ${session.sessionName} has an invalid profileId`);
      }
      if (session.idpUrlId && !idpUrlIds.has(session.idpUrlId)) {
        throw new Error(`Session ${session.sessionName} has an invalid idpUrlId`);
      }
      if (session.awsSsoConfigurationId && !awsSsoIntegrationIds.has(session.awsSsoConfigurationId)) {
        throw new Error(`Session ${session.sessionName} has an invalid awsSsoConfigurationId`);
      }
      if (session.azureIntegrationId && !azureIntegrationIds.has(session.azureIntegrationId)) {
        throw new Error(`Session ${session.sessionName} has an invalid azureIntegrationId`);
      }
      if (session.parentSessionId && !sessionIds.has(session.parentSessionId)) {
        throw new Error(`Session ${session.sessionName} has an invalid parentSessionId`);
      }
    }

    for (let i = 0; i < workspace.awsSsoIntegrations.length; i++) {
      if (!workspace.awsSsoIntegrations[i].type) {
        workspace.awsSsoIntegrations[i].type = IntegrationType.awsSso;
      }
    }

    this.save(workspace);
  }

  private saveBackup(workspace: Workspace) {
    this.fileService.writeFileSync(this.fileLockBackupPath, this.fileService.encryptText(serialize(workspace)));
  }

  private save(workspace: Workspace) {
    const path = `${this.fileService.homeDir()}/${this.workspaceFileName}`;
    this.fileService.writeFileSync(path, this.fileService.encryptText(serialize(workspace)));
  }

  private loadWorkspace(): Workspace {
    const path = this.fileService.homeDir() + "/" + this.workspaceFileName;
    const workspaceJSON = this.fileService.decryptText(this.fileService.readFileSync(path));
    return deserialize(Workspace, workspaceJSON);
  }

  private restoreBackup(): Workspace {
    const backupWorkspaceContents = this.fileService.readFileSync(this.fileLockBackupPath);
    this.fileService.writeFileSync(this.fileLockPath, backupWorkspaceContents);
    const workspace = deserialize(Workspace, this.fileService.decryptText(backupWorkspaceContents));
    this.checkConsistency(workspace);
    this.logService.log(new LoggedEntry("Leapp-lock.json was corrupted and has been restored from the latest backup.", this, LogLevel.error, true));
    return workspace;
  }

  private cleanWorkspace(): Workspace {
    const newWorkspace = this.createNewWorkspace();
    const encryptedWorkspace = this.fileService.encryptText(serialize(newWorkspace));
    const path = this.fileService.homeDir() + "/" + this.workspaceFileName;
    this.fileService.writeFileSync(path, encryptedWorkspace);
    if (this.workspaceFileName === constants.lockFileDestination) {
      this.fileService.writeFileSync(this.fileLockBackupPath, encryptedWorkspace);
    }
    this.logService.log(
      new LoggedEntry("Leapp failed to restore the latest Leapp-lock.json backup. Leapp-lock.json was reinitialized.", this, LogLevel.error, true)
    );
    return newWorkspace;
  }
}

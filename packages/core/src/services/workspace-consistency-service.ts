import { FileService } from "./file-service";
import { INativeService } from "../interfaces/i-native-service";
import { LoggedEntry, LogLevel, LogService } from "./log-service";
import { Workspace } from "../models/workspace";
import { constants } from "../models/constants";
import { deserialize, serialize } from "class-transformer";

export class WorkspaceConsistencyService {
  constructor(private fileService: FileService, private nativeService: INativeService, private logService: LogService) {}

  get fileLockPath(): string {
    return this.nativeService.os.homedir() + "/" + constants.lockFileDestination;
  }

  get fileLockBackupPath(): string {
    return this.nativeService.os.homedir() + "/" + constants.lockFileBackupPath;
  }

  getWorkspace(): Workspace {
    try {
      const workspace = this.loadWorkspace();
      this.checkConsistency(workspace);
      this.saveBackup(workspace);
      return workspace;
    } catch (error) {
      this.logService.log(new LoggedEntry(error.message, this, LogLevel.error, false, error.stack));
      if (this.fileService.existsSync(this.fileLockBackupPath)) {
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

  private checkConsistency(_: Workspace) {}

  private saveBackup(workspace: Workspace) {
    this.fileService.writeFileSync(this.fileLockBackupPath, this.fileService.encryptText(serialize(workspace)));
  }

  private loadWorkspace(): Workspace {
    const workspaceJSON = this.fileService.decryptText(this.fileService.readFileSync(this.fileLockPath));
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
    this.fileService.writeFileSync(this.fileLockPath, encryptedWorkspace);
    this.fileService.writeFileSync(this.fileLockBackupPath, encryptedWorkspace);
    this.logService.log(
      new LoggedEntry("Leapp failed to restore the latest Leapp-lock.json backup. Leapp-lock.json was reinitialized.", this, LogLevel.error, true)
    );
    return newWorkspace;
  }
}

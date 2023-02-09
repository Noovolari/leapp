import { Repository } from "./repository";
import { Workspace } from "../models/workspace";
import { FileService } from "./file-service";
import { constants } from "../models/constants";
import { INativeService } from "../interfaces/i-native-service";

export class WorkspaceService {
  constructor(private repository: Repository, private fileService: FileService, private nativeService: INativeService) {}

  getWorkspace(): Workspace {
    return this.repository.getWorkspace();
  }

  persistWorkspace(workspace: Workspace): void {
    this.repository.persistWorkspace(workspace);
  }

  workspaceExists(): boolean {
    return this.getWorkspace() !== undefined && this.getWorkspace() !== null;
  }

  getDefaultProfileId(): string {
    return this.repository.getDefaultProfileId();
  }

  createWorkspace(): void {
    this.repository.createWorkspace();
  }

  removeWorkspace(): void {
    if (this.fileService.existsSync(this.nativeService.os.homedir() + "/" + constants.lockFileDestination)) {
      this.fileService.removeFileSync(this.nativeService.os.homedir() + "/" + constants.lockFileDestination);
    }
  }

  reloadWorkspace(): void {
    this.repository.reloadWorkspace();
  }
}

import { Repository } from "./repository";
import { Workspace } from "../models/workspace";
import { WorkspaceFileNameService } from "./workspace-file-name-service";

export class WorkspaceService {
  constructor(private repository: Repository, private workspaceFileNameService: WorkspaceFileNameService) {}

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
    this.repository.removeWorkspace();
  }

  reloadWorkspace(): void {
    this.repository.reloadWorkspace();
  }

  setWorkspaceFileName(value: string): void {
    this.workspaceFileNameService.workspaceFileName = value;
  }

  getWorkspaceFileName(): string {
    return this.workspaceFileNameService.workspaceFileName;
  }
}

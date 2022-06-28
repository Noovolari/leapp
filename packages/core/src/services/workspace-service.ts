import { Repository } from "./repository";
import { Workspace } from "../models/workspace";

export class WorkspaceService {
  constructor(private repository: Repository) {}

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
}

import { Repository } from "./repository";
import { Workspace } from "../models/workspace";
import { GlobalSettings } from "../interfaces/i-global-settings";

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
    this.repository.workspaceFileName = value;
  }

  getWorkspaceFileName(): string {
    return this.repository.workspaceFileName;
  }

  extractGlobalSettings(): GlobalSettings {
    return this.repository.globalSettings;
  }

  applyGlobalSettings(globalSettings: GlobalSettings, localSessionIds?: string[], remoteSessionIds?: string[]): void {
    if (localSessionIds && remoteSessionIds) {
      const localPinned = globalSettings.pinned.filter((sessionId) => localSessionIds.includes(sessionId));
      const remotePinned = globalSettings.pinned.filter((sessionId) => !localSessionIds.includes(sessionId));
      const purgedPinned = remotePinned.filter((remoteSessionId) => remoteSessionIds.includes(remoteSessionId));
      globalSettings.pinned = [...localPinned, ...purgedPinned];
    }
    console.log(globalSettings.pinned);
    this.repository.globalSettings = globalSettings;
  }
}

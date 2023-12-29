import { Repository } from "./repository";
import { Workspace } from "../models/workspace";
import { GlobalSettings } from "../interfaces/i-global-settings";
import { Session } from "../models/session";

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

  extractGlobalSettings(userId?: string, teamId?: string, localSessions?: Session[]): GlobalSettings {
    const globalSettings = this.repository.globalSettings;
    if (userId && teamId && localSessions) {
      // Remote workspace -> Local workspace
      const namedProfiles = this.repository.getProfiles();
      const remoteWorkspaceSettings = {};
      for (const localSession of localSessions) {
        if ((localSession as any).profileId !== undefined) {
          remoteWorkspaceSettings[localSession.sessionId] = {
            profileName: namedProfiles.find((profile) => profile.id === (localSession as any).profileId).name,
            region: localSession.region,
          };
        }
        globalSettings.remoteWorkspacesSettingsMap[`${teamId}-${userId}`] = remoteWorkspaceSettings;
      }
    }
    return globalSettings;
  }

  applyGlobalSettings(globalSettings: GlobalSettings, localSessions: Session[], remoteSessionIds?: string[]): void {
    if (remoteSessionIds) {
      // Local workspace -> Remote workspace
      const localSessionIds = localSessions.map((session: any) => session.sessionId);
      const localPinned = globalSettings.pinned.filter((sessionId) => localSessionIds.includes(sessionId));
      const remotePinned = globalSettings.pinned.filter((sessionId) => !localSessionIds.includes(sessionId));
      const purgedPinned = remotePinned.filter((remoteSessionId) => remoteSessionIds.includes(remoteSessionId));
      globalSettings.pinned = [...localPinned, ...purgedPinned];
    }
    this.repository.globalSettings = globalSettings;
  }
}

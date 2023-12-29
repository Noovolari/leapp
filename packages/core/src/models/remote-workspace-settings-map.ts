interface RemoteSessionSettings {
  region: string;
  profileName: string;
}

interface RemoteWorkspaceSettings {
  [sessionId: string]: RemoteSessionSettings;
}

export interface RemoteWorkspacesSettingsMap {
  [teamId: string]: RemoteWorkspaceSettings;
}

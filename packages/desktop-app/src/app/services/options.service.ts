import { Injectable } from "@angular/core";
import Folder from "@noovolari/leapp-core/models/folder";
import { AppProviderService } from "./app-provider.service";
import { WorkspaceService } from "@noovolari/leapp-core/services/workspace-service";
import { Session } from "@noovolari/leapp-core/models/session";

@Injectable({ providedIn: "root" })
export class OptionsService {
  workspaceService: WorkspaceService;

  constructor(private appProviderService: AppProviderService) {
    this.workspaceService = this.appProviderService.workspaceService;
  }

  get macOsTerminal(): string {
    return this.workspaceService.getWorkspace().macOsTerminal;
  }

  set macOsTerminal(value: string) {
    const workspace = this.workspaceService.getWorkspace();
    workspace.macOsTerminal = value;
    this.workspaceService.persistWorkspace(workspace);
  }

  get proxyConfiguration(): { proxyProtocol: string; proxyUrl?: string; proxyPort: string; username?: string; password?: string } {
    const workspace = this.workspaceService.getWorkspace();
    return workspace.proxyConfiguration;
  }

  updateProxyConfiguration(value: { proxyProtocol: string; proxyUrl?: string; proxyPort: string; username?: string; password?: string }) {
    const workspace = this.workspaceService.getWorkspace();
    workspace.proxyConfiguration = value;
    this.workspaceService.persistWorkspace(workspace);
  }

  get defaultRegion(): string {
    const workspace = this.workspaceService.getWorkspace();
    return workspace.defaultRegion;
  }

  set defaultRegion(value: string) {
    const workspace = this.workspaceService.getWorkspace();
    workspace.defaultRegion = value;
    this.workspaceService.persistWorkspace(workspace);
  }

  get defaultLocation(): string {
    const workspace = this.workspaceService.getWorkspace();
    return workspace.defaultLocation;
  }

  set defaultLocation(value: string) {
    const workspace = this.workspaceService.getWorkspace();
    workspace.defaultLocation = value;
    this.workspaceService.persistWorkspace(workspace);
  }

  get pinned(): string[] {
    const workspace = this.workspaceService.getWorkspace();
    return workspace.pinned;
  }

  set pinned(pinned: string[]) {
    const workspace = this.workspaceService.getWorkspace();
    workspace.pinned = pinned;
    this.workspaceService.persistWorkspace(workspace);
  }

  get folders(): Folder[] {
    const workspace = this.workspaceService.getWorkspace();
    return workspace.folders;
  }

  set folders(folders: Folder[]) {
    const workspace = this.workspaceService.getWorkspace();
    workspace.folders = folders;
    this.workspaceService.persistWorkspace(workspace);
  }

  get colorTheme(): string {
    const workspace = this.workspaceService.getWorkspace();
    return workspace.colorTheme;
  }

  set colorTheme(value: string) {
    const workspace = this.workspaceService.getWorkspace();
    workspace.colorTheme = value;
    this.workspaceService.persistWorkspace(workspace);
  }

  get credentialMethod(): string {
    const workspace = this.workspaceService.getWorkspace();
    return workspace.credentialMethod;
  }

  set credentialMethod(credentialMethod: string) {
    const workspace = this.workspaceService.getWorkspace();
    workspace.credentialMethod = credentialMethod;
    this.workspaceService.persistWorkspace(workspace);
  }

  pinSession(session: Session): void {
    const workspace = this.workspaceService.getWorkspace();
    if (workspace.pinned.indexOf(session.sessionId) === -1) {
      workspace.pinned.push(session.sessionId);
      this.workspaceService.persistWorkspace(workspace);
    }
  }

  unpinSession(session: Session): void {
    const workspace = this.workspaceService.getWorkspace();
    const index = workspace.pinned.indexOf(session.sessionId);
    if (index > -1) {
      workspace.pinned.splice(index, 1);
      this.workspaceService.persistWorkspace(workspace);
    }
  }
}

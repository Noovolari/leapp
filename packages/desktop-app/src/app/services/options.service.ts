import { Injectable } from "@angular/core";
import { Workspace } from "@noovolari/leapp-core/models/workspace";
import { Repository } from "@noovolari/leapp-core/services/repository";
import Folder from "@noovolari/leapp-core/models/folder";
import { AppProviderService } from "./app-provider.service";

@Injectable({ providedIn: "root" })
export class OptionsService {
  _workspace: Workspace;
  repository: Repository;

  constructor(private appProviderService: AppProviderService) {
    this.repository = this.appProviderService.repository;
  }

  get macOsTerminal(): string {
    this._workspace = this.repository.getWorkspace();
    return this._workspace.macOsTerminal;
  }

  set macOsTerminal(value: string) {
    this._workspace = this.repository.getWorkspace();
    this._workspace.macOsTerminal = value;
    this.repository.persistWorkspace(this._workspace);
  }

  get proxyConfiguration(): { proxyProtocol: string; proxyUrl?: string; proxyPort: string; username?: string; password?: string } {
    this._workspace = this.repository.getWorkspace();
    return this._workspace.proxyConfiguration;
  }

  updateProxyConfiguration(value: { proxyProtocol: string; proxyUrl?: string; proxyPort: string; username?: string; password?: string }) {
    this._workspace = this.repository.getWorkspace();
    this._workspace.proxyConfiguration = value;
    this.repository.persistWorkspace(this._workspace);
  }

  get defaultRegion(): string {
    this._workspace = this.repository.getWorkspace();
    return this._workspace.defaultRegion;
  }

  set defaultRegion(value: string) {
    this._workspace = this.repository.getWorkspace();
    this._workspace.defaultRegion = value;
    this.repository.persistWorkspace(this._workspace);
  }

  get defaultLocation(): string {
    this._workspace = this.repository.getWorkspace();
    return this._workspace.defaultLocation;
  }

  set defaultLocation(value: string) {
    this._workspace = this.repository.getWorkspace();
    this._workspace.defaultLocation = value;
    this.repository.persistWorkspace(this._workspace);
  }

  get pinned(): string[] {
    this._workspace = this.repository.getWorkspace();
    return this._workspace.pinned;
  }

  set pinned(pinned: string[]) {
    this._workspace = this.repository.getWorkspace();
    this._workspace.pinned = pinned;
    this.repository.persistWorkspace(this._workspace);
  }

  get folders(): Folder[] {
    this._workspace = this.repository.getWorkspace();
    return this._workspace.folders;
  }

  set folders(folders: Folder[]) {
    this._workspace = this.repository.getWorkspace();
    this._workspace.folders = folders;
    this.repository.persistWorkspace(this._workspace);
  }

  get colorTheme(): string {
    this._workspace = this.repository.getWorkspace();
    return this._workspace.colorTheme;
  }

  set colorTheme(value: string) {
    this._workspace = this.repository.getWorkspace();
    this._workspace.colorTheme = value;
    this.repository.persistWorkspace(this._workspace);
  }

  get credentialMethod(): string {
    this._workspace = this.repository.getWorkspace();
    return this._workspace.credentialMethod;
  }

  set credentialMethod(credentialMethod: string) {
    this._workspace = this.repository.getWorkspace();
    this._workspace.credentialMethod = credentialMethod;
    this.repository.persistWorkspace(this._workspace);
  }
}

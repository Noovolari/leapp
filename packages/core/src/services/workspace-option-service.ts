import { Repository } from "./repository";
import { IdpUrl } from "../models/idp-url";
import { AwsNamedProfile } from "../models/aws-named-profile";
import { Session } from "../models/session";
import { AwsSsoIntegration } from "../models/aws-sso-integration";
import Folder from "../models/folder";
import Segment from "../models/segment";
import { Workspace } from "../models/workspace";

export class WorkspaceOptionService {
  _workspace: Workspace;

  constructor(private repository: Repository) {}

  addIpUrl(idpUrl: IdpUrl): void {
    this._workspace = this.repository.getWorkspace();
    this._workspace.idpUrls.push(idpUrl);
    this.repository.persistWorkspace(this._workspace);
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

  get idpUrls(): IdpUrl[] {
    this._workspace = this.repository.getWorkspace();
    return this._workspace.idpUrls;
  }

  set idpUrls(value: IdpUrl[]) {
    this._workspace = this.repository.getWorkspace();
    this._workspace.idpUrls = value;
    this.repository.persistWorkspace(this._workspace);
  }

  get profiles(): AwsNamedProfile[] {
    this._workspace = this.repository.getWorkspace();
    return this._workspace.profiles;
  }

  set profiles(value: AwsNamedProfile[]) {
    this._workspace = this.repository.getWorkspace();
    this._workspace.profiles = value;
    this.repository.persistWorkspace(this._workspace);
  }

  get sessions(): Session[] {
    this._workspace = this.repository.getWorkspace();
    return this._workspace.sessions;
  }

  set sessions(value: Session[]) {
    this._workspace = this.repository.getWorkspace();
    this._workspace.sessions = value;
    this.repository.persistWorkspace(this._workspace);
  }

  get proxyConfiguration(): { proxyProtocol: string; proxyUrl?: string; proxyPort: string; username?: string; password?: string } {
    this._workspace = this.repository.getWorkspace();
    return this._workspace.proxyConfiguration;
  }

  set proxyConfiguration(value: { proxyProtocol: string; proxyUrl?: string; proxyPort: string; username?: string; password?: string }) {
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

  get awsSsoIntegrations(): AwsSsoIntegration[] {
    this._workspace = this.repository.getWorkspace();
    return this._workspace.awsSsoIntegrations;
  }

  set awsSsoIntegrations(value: AwsSsoIntegration[]) {
    this._workspace = this.repository.getWorkspace();
    this._workspace.awsSsoIntegrations = value;
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

  get segments(): Segment[] {
    this._workspace = this.repository.getWorkspace();
    return this._workspace.segments;
  }

  set segments(segments: Segment[]) {
    this._workspace = this.repository.getWorkspace();
    this._workspace.segments = segments;
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

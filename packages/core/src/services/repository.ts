import { serialize } from "class-transformer";
import { INativeService } from "../interfaces/i-native-service";
import { AwsIamRoleChainedSession } from "../models/aws/aws-iam-role-chained-session";
import { AwsNamedProfile } from "../models/aws/aws-named-profile";
import { AwsSsoIntegration } from "../models/aws/aws-sso-integration";
import { constants } from "../models/constants";
import Segment from "../models/segment";
import { Session } from "../models/session";
import { SessionStatus } from "../models/session-status";
import { SessionType } from "../models/session-type";
import { Workspace } from "../models/workspace";
import { FileService } from "./file-service";
import { IdpUrl } from "../models/idp-url";
import * as uuid from "uuid";
import Folder from "../models/folder";
import { LoggedException, LogLevel } from "./log-service";
import { AzureIntegration } from "../models/azure/azure-integration";
import PluginStatus from "../models/plugin-status";
import { WorkspaceConsistencyService } from "./workspace-consistency-service";
import { LeappNotification } from "../models/notification";
import { GlobalSettings } from "../interfaces/i-global-settings";

export class Repository {
  // Private singleton workspace
  private _workspace: Workspace;
  private _workspaceFileName: string;

  constructor(
    private nativeService: INativeService,
    private fileService: FileService,
    private workspaceConsistencyService: WorkspaceConsistencyService
  ) {
    this.workspaceFileName = constants.lockFileDestination;
    this.createWorkspace();
  }

  // WORKSPACE

  get workspace(): Workspace {
    return this.getWorkspace();
  }

  set workspace(value: Workspace) {
    this._workspace = value;
  }

  get workspaceFileName(): string {
    return this._workspaceFileName;
  }

  set workspaceFileName(value: string) {
    this._workspaceFileName = value;
    this.workspaceConsistencyService.workspaceFileName = value;
  }

  reloadWorkspace(): void {
    this._workspace = this.workspaceConsistencyService.getWorkspace();
  }

  getWorkspace(): Workspace {
    if (!this._workspace) {
      this.reloadWorkspace();
    }
    return this._workspace;
  }

  createWorkspace(): void {
    if (!this.fileService.existsSync(this.nativeService.os.homedir() + "/" + this.workspaceFileName)) {
      this.fileService.newDir(this.nativeService.os.homedir() + "/.Leapp", { recursive: true });
      this._workspace = this.workspaceConsistencyService.createNewWorkspace();
      this.persistWorkspace(this._workspace);
    }
  }

  removeWorkspace(): void {
    if (this.fileService.existsSync(this.nativeService.os.homedir() + "/" + this.workspaceFileName)) {
      this.fileService.removeFileSync(this.nativeService.os.homedir() + "/" + this.workspaceFileName);
    }
  }

  persistWorkspace(workspace: Workspace): void {
    const path = this.nativeService.os.homedir() + "/" + this.workspaceFileName;
    this.fileService.writeFileSync(path, this.fileService.encryptText(serialize(workspace)));
  }

  // SESSIONS

  getSessions(): Session[] {
    const workspace = this.getWorkspace();
    return workspace.sessions;
  }

  getSessionById(sessionId: string): Session {
    const workspace = this.getWorkspace();
    const session = workspace.sessions.find((sess) => sess.sessionId === sessionId);
    if (session === undefined) {
      throw new LoggedException(`session with id ${sessionId} not found.`, this, LogLevel.warn);
    }
    return session;
  }

  addSession(session: Session): void {
    const workspace = this.getWorkspace();

    workspace.sessions = [...workspace.sessions, session];

    this.persistWorkspace(workspace);
  }

  updateSession(sessionId: string, session: Session): void {
    const sessions: Session[] = this.getSessions();
    for (let i = 0; i < sessions.length; i++) {
      if (sessions[i].sessionId === sessionId) {
        (sessions[i] as any) = session;
      }
    }
    this.updateSessions(sessions);
  }

  updateSessions(sessions: Session[]): void {
    const workspace = this.getWorkspace();
    workspace.sessions = sessions;
    this.persistWorkspace(workspace);
  }

  deleteSession(sessionId: string): void {
    const workspace = this.getWorkspace();
    const index = workspace.sessions.findIndex((sess) => sess.sessionId === sessionId);
    if (index > -1) {
      workspace.sessions.splice(index, 1);
      this.persistWorkspace(workspace);
    }
  }

  listPending(): Session[] {
    return this.getSessionsOrDefault().filter((session) => session.status === SessionStatus.pending);
  }

  listActive(): Session[] {
    return this.getSessionsOrDefault().filter((session) => session.status === SessionStatus.active);
  }

  listActiveAndPending(): Session[] {
    return this.getSessionsOrDefault().filter((s) => s.status === SessionStatus.active || s.status === SessionStatus.pending);
  }

  listAwsSsoRoles(): Session[] {
    return this.getSessionsOrDefault().filter((session) => session.type === SessionType.awsSsoRole);
  }

  listAssumable(): Session[] {
    return this.getSessionsOrDefault().filter((session) => session.type !== SessionType.azure);
  }

  listIamRoleChained(parentSession?: Session): Session[] {
    let childSession = this.getSessionsOrDefault().filter((session) => session.type === SessionType.awsIamRoleChained);
    if (parentSession) {
      childSession = childSession.filter((session) => (session as AwsIamRoleChainedSession).parentSessionId === parentSession.sessionId);
    }
    return childSession;
  }

  createPluginStatus(pluginId: string): void {
    this._workspace.pluginsStatus.push({ id: pluginId, active: true });
  }

  getPluginStatus(pluginId: string): PluginStatus {
    return this._workspace.pluginsStatus.find((pluginStatus) => pluginStatus.id === pluginId);
  }

  setPluginStatus(pluginId: string, newStatus: PluginStatus): void {
    this._workspace.pluginsStatus = this._workspace.pluginsStatus.map((pluginStatus) => (pluginStatus.id === pluginId ? newStatus : pluginStatus));
  }

  // REGION AND LOCATION

  getDefaultRegion(): string {
    return this.getWorkspace().defaultRegion;
  }

  getDefaultLocation(): string {
    return this.getWorkspace().defaultLocation;
  }

  updateDefaultRegion(defaultRegion: string): void {
    const workspace = this.getWorkspace();
    workspace.defaultRegion = defaultRegion;
    this.persistWorkspace(workspace);
  }

  updateDefaultLocation(defaultLocation: string): void {
    const workspace = this.getWorkspace();
    workspace.defaultLocation = defaultLocation;
    this.persistWorkspace(workspace);
  }

  // IDP URLS

  getIdpUrl(idpUrlId: string): string | null {
    const workspace = this.getWorkspace();
    const idpUrlFiltered = workspace.idpUrls.find((url) => url.id === idpUrlId);
    return idpUrlFiltered ? idpUrlFiltered.url : null;
  }

  getIdpUrls(): IdpUrl[] {
    return this.getWorkspace().idpUrls;
  }

  addIdpUrl(idpUrl: IdpUrl): void {
    const workspace = this.getWorkspace();
    workspace.addIpUrl(idpUrl);
    this.persistWorkspace(workspace);
  }

  updateIdpUrl(id: string, url: string): void {
    const workspace = this.getWorkspace();
    const index = workspace.idpUrls.findIndex((u) => u.id === id);
    if (index > -1) {
      workspace.idpUrls[index].url = url;
      this.persistWorkspace(workspace);
    }
  }

  removeIdpUrl(id: string): void {
    const workspace = this.getWorkspace();
    const index = workspace.idpUrls.findIndex((u) => u.id === id);

    workspace.idpUrls.splice(index, 1);

    this.persistWorkspace(workspace);
  }

  getProfiles(): AwsNamedProfile[] {
    return this.getWorkspace().profiles;
  }

  getProfileName(profileId: string): string {
    const profileFiltered = this.getWorkspace().profiles.find((profile) => profile.id === profileId);
    if (profileFiltered === undefined) {
      throw new LoggedException(`named profile with id ${profileId} not found.`, this, LogLevel.warn);
    }
    return profileFiltered.name;
  }

  doesProfileExist(profileId: string): boolean {
    return this.getWorkspace().profiles.find((profile) => profile.id === profileId) !== undefined;
  }

  getDefaultProfileId(): string {
    const workspace = this.getWorkspace();
    const profileFiltered = workspace.profiles.find((profile) => profile.name === constants.defaultAwsProfileName);
    if (profileFiltered === undefined) {
      throw new LoggedException("no default named profile found.", this, LogLevel.warn);
    }
    return profileFiltered.id;
  }

  addProfile(profile: AwsNamedProfile): void {
    const workspace = this.getWorkspace();
    workspace.profiles.push(profile);
    this.persistWorkspace(workspace);
  }

  updateProfile(profileId: string, newName: string): void {
    const workspace = this.getWorkspace();
    const profileIndex = workspace.profiles.findIndex((p) => p.id === profileId);
    if (profileIndex > -1) {
      workspace.profiles[profileIndex].name = newName;
      this.persistWorkspace(workspace);
    }
  }

  removeProfile(profileId: string): void {
    const workspace = this.getWorkspace();
    const profileIndex = workspace.profiles.findIndex((p) => p.id === profileId);
    workspace.profiles.splice(profileIndex, 1);

    this.persistWorkspace(workspace);
  }

  // AWS SSO INTEGRATION

  listAwsSsoIntegrations(): AwsSsoIntegration[] {
    const workspace = this.getWorkspace();
    return workspace.awsSsoIntegrations;
  }

  getAwsSsoIntegration(id: string | number): AwsSsoIntegration {
    return this.getWorkspace().awsSsoIntegrations.filter((ssoConfig) => ssoConfig.id === id)[0];
  }

  getAwsSsoIntegrationSessions(id: string | number): Session[] {
    return this.workspace.sessions.filter((sess) => (sess as any).awsSsoConfigurationId === id);
  }

  addAwsSsoIntegration(portalUrl: string, alias: string, region: string, browserOpening: string): void {
    const workspace = this.getWorkspace();
    workspace.awsSsoIntegrations.push(new AwsSsoIntegration(uuid.v4(), alias, portalUrl, region, browserOpening, undefined));
    this.persistWorkspace(workspace);
  }

  updateAwsSsoIntegration(
    id: string,
    alias: string,
    region: string,
    portalUrl: string,
    browserOpening: string,
    isOnline: boolean,
    expirationTime?: string
  ): void {
    const workspace = this.getWorkspace();
    const index = workspace.awsSsoIntegrations.findIndex((sso) => sso.id === id);
    if (index > -1) {
      workspace.awsSsoIntegrations[index].alias = alias;
      workspace.awsSsoIntegrations[index].region = region;
      workspace.awsSsoIntegrations[index].portalUrl = portalUrl;
      workspace.awsSsoIntegrations[index].browserOpening = browserOpening;
      workspace.awsSsoIntegrations[index].isOnline = isOnline;
      if (expirationTime) {
        workspace.awsSsoIntegrations[index].accessTokenExpiration = expirationTime;
      }
      this.persistWorkspace(workspace);
    }
  }

  unsetAwsSsoIntegrationExpiration(id: string): void {
    const workspace = this.getWorkspace();
    const index = workspace.awsSsoIntegrations.findIndex((sso) => sso.id === id);
    if (index > -1) {
      workspace.awsSsoIntegrations[index].accessTokenExpiration = undefined;
      this.persistWorkspace(workspace);
    }
  }

  deleteAwsSsoIntegration(id: string): void {
    const workspace = this.getWorkspace();
    const index = workspace.awsSsoIntegrations.findIndex((awsSsoIntegration) => awsSsoIntegration.id === id);
    if (index > -1) {
      workspace.awsSsoIntegrations.splice(index, 1);
      this.persistWorkspace(workspace);
    }
  }

  addAzureIntegration(alias: string, tenantId: string, region: string): void {
    const workspace = this.getWorkspace();
    workspace.azureIntegrations.push(new AzureIntegration(uuid.v4(), alias, tenantId, region));
    this.persistWorkspace(workspace);
  }

  updateAzureIntegration(id: string, alias: string, tenantId: string, region: string, isOnline: boolean, tokenExpiration?: string): void {
    const workspace = this.getWorkspace();
    const index = workspace.azureIntegrations.findIndex((integration) => integration.id === id);
    if (index > -1) {
      workspace.azureIntegrations[index].alias = alias;
      workspace.azureIntegrations[index].tenantId = tenantId;
      workspace.azureIntegrations[index].isOnline = isOnline;
      workspace.azureIntegrations[index].region = region;
      workspace.azureIntegrations[index].tokenExpiration = tokenExpiration;
      this.persistWorkspace(workspace);
    }
  }

  deleteAzureIntegration(id: string): void {
    const workspace = this.getWorkspace();
    const index = workspace.azureIntegrations.findIndex((azureIntegration) => azureIntegration.id === id);
    if (index > -1) {
      workspace.azureIntegrations.splice(index, 1);
      this.persistWorkspace(workspace);
    }
  }

  getAzureIntegration(id: string | number): AzureIntegration {
    return this.getWorkspace().azureIntegrations.filter((azureIntegration) => azureIntegration.id === id)[0];
  }

  listAzureIntegrations(): AzureIntegration[] {
    const workspace = this.getWorkspace();
    return workspace.azureIntegrations;
  }

  // PROXY CONFIGURATION

  getProxyConfiguration(): any {
    return this.getWorkspace().proxyConfiguration;
  }

  updateProxyConfiguration(proxyConfiguration: {
    proxyProtocol: string;
    proxyUrl?: string;
    proxyPort: string;
    username?: string;
    password?: string;
  }): void {
    const workspace = this.getWorkspace();
    workspace.proxyConfiguration = proxyConfiguration;
    this.persistWorkspace(workspace);
  }

  // SEGMENTS

  getSegments(): Segment[] {
    const workspace = this.getWorkspace();
    return workspace.segments;
  }

  getSegment(segmentName: string): Segment {
    const workspace = this.getWorkspace();
    return workspace.segments.find((s) => s.name === segmentName);
  }

  setSegments(segments: Segment[]): void {
    const workspace = this.getWorkspace();
    workspace.segments = segments;
    this.persistWorkspace(workspace);
  }

  removeSegment(segment: Segment): void {
    const workspace = this.getWorkspace();
    const index = workspace.segments.findIndex((s) => s.name === segment.name);
    if (index > -1) {
      workspace.segments.splice(index, 1);
      this.persistWorkspace(workspace);
    }
  }

  // FOLDERS

  getFolders(): Folder[] {
    const workspace = this.getWorkspace();
    return workspace.folders;
  }

  setFolders(folders: Folder[]): void {
    const workspace = this.getWorkspace();
    workspace.folders = folders;
    this.persistWorkspace(workspace);
  }

  // MACOS TERMINAL

  updateMacOsTerminal(macOsTerminal: string): void {
    const workspace = this.getWorkspace();
    workspace.macOsTerminal = macOsTerminal;
    this.persistWorkspace(workspace);
  }

  updateColorTheme(colorTheme: string): void {
    const workspace = this.getWorkspace();
    workspace.colorTheme = colorTheme;
    this.persistWorkspace(workspace);
  }

  getColorTheme(): string {
    const workspace = this.getWorkspace();
    return workspace.colorTheme;
  }

  writeFile(data: string): void {
    this.nativeService.fs.writeFileSync(__dirname + "/register-client-response", JSON.stringify(data));
  }

  get globalSettings(): GlobalSettings {
    const workspace = this.getWorkspace();
    return {
      colorTheme: workspace.colorTheme,
      credentialMethod: workspace.credentialMethod,
      defaultLocation: workspace.defaultLocation,
      defaultRegion: workspace.defaultRegion,
      extensionEnabled: workspace.extensionEnabled,
      macOsTerminal: workspace.macOsTerminal,
      pluginsStatus: workspace.pluginsStatus,
      samlRoleSessionDuration: workspace.samlRoleSessionDuration,
      pinned: workspace.pinned,
      segments: workspace.segments,
      ssmRegionBehaviour: workspace.ssmRegionBehaviour,
      notifications: workspace.notifications,
      requirePassword: workspace.requirePassword,
      touchIdEnabled: workspace.touchIdEnabled,
      remoteWorkspacesSettingsMap: workspace.remoteWorkspacesSettingsMap,
    };
  }

  set globalSettings(globalSettingsInput: GlobalSettings) {
    const workspace = this.getWorkspace();
    workspace.colorTheme = globalSettingsInput.colorTheme;
    workspace.credentialMethod = globalSettingsInput.credentialMethod;
    workspace.defaultLocation = globalSettingsInput.defaultLocation;
    workspace.defaultRegion = globalSettingsInput.defaultRegion;
    workspace.extensionEnabled = globalSettingsInput.extensionEnabled;
    workspace.macOsTerminal = globalSettingsInput.macOsTerminal;
    workspace.pluginsStatus = globalSettingsInput.pluginsStatus;
    workspace.samlRoleSessionDuration = globalSettingsInput.samlRoleSessionDuration;
    workspace.pinned = globalSettingsInput.pinned;
    workspace.segments = globalSettingsInput.segments;
    workspace.ssmRegionBehaviour = globalSettingsInput.ssmRegionBehaviour;
    workspace.notifications = globalSettingsInput.notifications;
    workspace.requirePassword = globalSettingsInput.requirePassword;
    workspace.touchIdEnabled = globalSettingsInput.touchIdEnabled;
    workspace.remoteWorkspacesSettingsMap = globalSettingsInput.remoteWorkspacesSettingsMap;
    this.persistWorkspace(workspace);
  }

  // NOTIFICATIONS

  /**
   * Get Notifications
   * Get all the notifications that the user has received
   *
   * @return LeappNotification[] - the notification array
   */
  getNotifications(): LeappNotification[] {
    const workspace = this.getWorkspace();
    return workspace.notifications;
  }

  /**
   * Set Notifications
   * Set the array of new notifications , it can be used to re-update the current array, i.e. after a read message
   *
   * @param notifications - the notification array
   */
  setNotifications(notifications: LeappNotification[]): void {
    const workspace = this.getWorkspace();
    workspace.notifications = notifications;
    this.persistWorkspace(workspace);
  }

  // PRIVATE

  private getSessionsOrDefault(): Session[] {
    const workspace = this.getWorkspace();
    if (workspace.sessions) return workspace.sessions;
    else return [];
  }
}

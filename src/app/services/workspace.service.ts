import {Injectable} from '@angular/core';
import {FileService} from './file.service';
import {AppService} from './app.service';
import {Session} from '../models/session';
import {Workspace} from '../models/workspace';
import {environment} from '../../environments/environment';
import {deserialize, serialize} from 'class-transformer';
import {BehaviorSubject, Observable} from 'rxjs';
import * as uuid from 'uuid';
import {AwsSsoIntegration} from '../models/aws-sso-integration';
import {AwsSsoRoleSession} from '../models/aws-sso-role-session';

@Injectable({
  providedIn: 'root'
})

export class WorkspaceService {

  // Expose the observable$ part of the _sessions subject (read only stream)
  readonly sessions$: Observable<Session[]>;

  // - We set the initial state in BehaviorSubject's constructor
  // - Nobody outside the Store should have access to the BehaviorSubject
  //   because it has the write rights
  // - Writing to state should be handled by specialized Store methods
  // - Create one BehaviorSubject per store entity, for example if you have
  //   create a new BehaviorSubject for it, as well as the observable$, and getters/setters
  private readonly _sessions;

  // Private singleton workspace
  private _workspace: Workspace;

  constructor(
    private appService: AppService,
    private fileService: FileService
  ) {

    this._sessions = new BehaviorSubject<Session[]>([]);
    this.sessions$ = this._sessions.asObservable();

    this.createWorkspace();
    // TODO: check if it is possible to call directly this._sessions.next(this.getPersistedSessions())
    this.sessions = this.getPersistedSessions();
  }

  get workspace(): Workspace {
    return this._workspace;
  }

  set workspace(value: Workspace) {
    this._workspace = value;
  }

  // the getter will return the last value emitted in _sessions subject
  get sessions(): Session[] {
    return this._sessions.getValue();
  }

  // assigning a value to this.sessions will push it onto the observable
  // and down to all of its subscribers (ex: this.sessions = [])
  set sessions(sessions: Session[]) {
    this.persistSessions(sessions);
    this._sessions.next(sessions);
  }

  createWorkspace(): void {
    if (!this.fileService.exists(this.appService.getOS().homedir() + '/' + environment.lockFileDestination)) {
      this.fileService.newDir(this.appService.getOS().homedir() + '/.Leapp', { recursive: true});
      this._workspace = new Workspace();
      this.persistWorkspace(this._workspace);
    }
  }

  persistWorkspace(workspace: Workspace) {
    const path = this.appService.getOS().homedir() + '/' + environment.lockFileDestination;
    this.fileService.writeFileSync(path, this.fileService.encryptText(serialize(workspace)));
  }

  getWorkspace(): Workspace {
    if(!this._workspace) {
      const workspaceJSON = this.fileService.decryptText(this.fileService.readFileSync(this.appService.getOS().homedir() + '/' + environment.lockFileDestination));
      this._workspace = deserialize(Workspace, workspaceJSON);
      return this._workspace;
    }
    return this._workspace;
  }

  addSession(session: Session) {
    // we assign a new copy of session by adding a new session to it
    this.sessions = [
      ...this.sessions,
      session
    ];
  }

  removeSession(sessionId: string) {
    this.sessions = this.sessions.filter(session => session.sessionId !== sessionId);
  }

  updateDefaultRegion(defaultRegion: string) {
    const workspace = this.getWorkspace();
    workspace.defaultRegion = defaultRegion;
    this.persistWorkspace(workspace);
  }

  updateDefaultLocation(defaultLocation: string) {
    const workspace = this.getWorkspace();
    workspace.defaultLocation = defaultLocation;
    this.persistWorkspace(workspace);
  }

  addIdpUrl(idpUrl: { id: string; url: string }): void {
    const workspace = this.getWorkspace();
    workspace.idpUrls.push(idpUrl);
    this.persistWorkspace(workspace);
  }

  getIdpUrl(idpUrlId: string): string {
    const workspace = this.getWorkspace();
    const idpUrlFiltered = workspace.idpUrls.find(url => url.id === idpUrlId);
    return idpUrlFiltered ? idpUrlFiltered.url : null;
  }

  updateIdpUrl(id: string, url: string) {
    const workspace = this.getWorkspace();
    const index = workspace.idpUrls.findIndex(u => u.id === id);
    if(index > -1) {
      workspace.idpUrls[index].url = url;
      this.persistWorkspace(workspace);
    }
  }

  removeIdpUrl(id: string) {
    const workspace = this.getWorkspace();
    const index = workspace.idpUrls.findIndex(u => u.id === id);

    workspace.idpUrls.splice(index, 1);

    this.persistWorkspace(workspace);
  }

  addProfile(profile: { id: string; name: string }): void {
    const workspace = this.getWorkspace();
    workspace.profiles.push(profile);
    this.persistWorkspace(workspace);
  }

  getProfileName(profileId): string {
    const workspace = this.getWorkspace();
    const profileFiltered = workspace.profiles.find(profile => profile.id === profileId);
    return profileFiltered ? profileFiltered.name : null;
  }

  getDefaultProfileId(): string {
    const workspace = this.getWorkspace();
    const profileFiltered = workspace.profiles.find(profile => profile.name === 'default');
    return profileFiltered.id;
  }

  updateProfile(id: string, name: string) {
    const workspace = this.getWorkspace();
    const profileIndex = workspace.profiles.findIndex(p => p.id === id);
    if(profileIndex > -1) {
      workspace.profiles[profileIndex].name = name;
      this.persistWorkspace(workspace);
    }
  }

  removeProfile(id: string) {
    const workspace = this.getWorkspace();
    const profileIndex = workspace.profiles.findIndex(p => p.id === id);
    workspace.profiles.splice(profileIndex, 1);

    this.persistWorkspace(workspace);
  }

  addAwsSsoIntegration(portalUrl: string, alias: string, region: string, browserOpening: string) {
    const workspace = this.getWorkspace();
    workspace.awsSsoIntegrations.push({ id: uuid.v4(), alias, portalUrl, region, accessTokenExpiration: undefined, browserOpening });
    this.persistWorkspace(workspace);
  }

  getAwsSsoIntegration(id: string | number): AwsSsoIntegration {
    const workspace = this.getWorkspace();
    return workspace.awsSsoIntegrations.filter(ssoConfig => ssoConfig.id === id)[0];
  }

  getAwsSsoIntegrationSessions(id: string | number): Session[] {
    return this.workspace.sessions.filter((sess) => sess instanceof AwsSsoRoleSession && sess.awsSsoConfigurationId === id);
  }

  listAwsSsoIntegrations() {
    const workspace = this.getWorkspace();
    return workspace.awsSsoIntegrations;
  }

  updateAwsSsoIntegration(id: string, alias: string, region: string, portalUrl: string, browserOpening: string, expirationTime?: string): void {
    const workspace = this.getWorkspace();
    const index = workspace.awsSsoIntegrations.findIndex(sso => sso.id === id);
    if(index > -1) {
      workspace.awsSsoIntegrations[index].alias = alias;
      workspace.awsSsoIntegrations[index].region = region;
      workspace.awsSsoIntegrations[index].portalUrl = portalUrl;
      workspace.awsSsoIntegrations[index].browserOpening = browserOpening;
      if(expirationTime) {
        workspace.awsSsoIntegrations[index].accessTokenExpiration = expirationTime;
      }
      this.persistWorkspace(workspace);
    }
  }

  unsetAwsSsoIntegrationExpiration(id: string): void {
    const workspace = this.getWorkspace();
    const index = workspace.awsSsoIntegrations.findIndex(sso => sso.id === id);
    if(index > -1) {
      workspace.awsSsoIntegrations[index].accessTokenExpiration = undefined;
      this.persistWorkspace(workspace);
    }
  }

  deleteAwsSsoIntegration(id: string): void {
    const workspace = this.getWorkspace();
    const index = workspace.awsSsoIntegrations.findIndex(awsSsoIntegration => awsSsoIntegration.id === id);
    if(index > -1) {
      workspace.awsSsoIntegrations.splice(index, 1);
      this.persistWorkspace(workspace);
    }
  }

  updateProxyConfiguration(proxyConfiguration: { proxyProtocol: string; proxyUrl: string; proxyPort: string; username: string; password: string }) {
    const workspace = this.getWorkspace();
    workspace.proxyConfiguration = proxyConfiguration;
    this.persistWorkspace(workspace);
  }

  private getPersistedSessions(): Session[] {
    const workspace = this.getWorkspace();
    return workspace.sessions;
  }

  private persistSessions(sessions: Session[]): void {
    const workspace = this.getWorkspace();
    workspace.sessions = sessions;
    this.persistWorkspace(workspace);
  }
}

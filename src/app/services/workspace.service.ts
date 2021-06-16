import {Injectable} from '@angular/core';
import {FileService} from './file.service';
import {AppService} from './app.service';
import {Session} from '../models/session';
import {Workspace} from '../models/workspace';
import {environment} from '../../environments/environment';
import {deserialize, serialize} from 'class-transformer';
import {NativeService} from './native-service';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService extends NativeService {

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
  private workspace: Workspace;

  constructor(private appService: AppService, private fileService: FileService) {
    super();

    this._sessions = new BehaviorSubject<Session[]>([]);
    this.sessions$ = this._sessions.asObservable();

    this.create();
    // TODO: check if it is possible to call directly this._sessions.next(this.getPersistedSessions())
    this.sessions = this.getPersistedSessions();
  }

  // the getter will return the last value emitted in _sessions subject
  get sessions(): Session[] {
    return this._sessions.getValue();
  }

  // assigning a value to this.sessions will push it onto the observable
  // and down to all of its subscribers (ex: this.sessions = [])
  set sessions(sessions: Session[]) {
    this.updatePersistedSessions(sessions);
    this._sessions.next(sessions);
  }

  create(): void {
    if (!this.fileService.exists(this.appService.getOS().homedir() + '/' + environment.lockFileDestination)) {
      this.fileService.newDir(this.appService.getOS().homedir() + '/.Leapp', { recursive: true});
      this.workspace = new Workspace();
      this.persist(this.workspace);
    }
  }

  get(): Workspace {
    if(!this.workspace) {
      const workspaceJSON = this.fileService.decryptText(this.fileService.readFileSync(this.appService.getOS().homedir() + '/' + environment.lockFileDestination));
      this.workspace = deserialize(Workspace, workspaceJSON);
      return this.workspace;
    }
    return this.workspace;
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
    const workspace = this.get();
    workspace.defaultRegion = defaultRegion;
    this.persist(workspace);
  }

  updateDefaultLocation(defaultLocation: string) {
    const workspace = this.get();
    workspace.defaultLocation = defaultLocation;
    this.persist(workspace);
  }

  getIdpUrl(idpUrlId: string): string {
    const workspace = this.get();
    const idpUrlFiltered = workspace.idpUrls.find(url => url.id === idpUrlId);
    return idpUrlFiltered ? idpUrlFiltered.url : null;
  }

  addIdpUrl(idpUrl: { id: string; url: string }): void {
    const workspace = this.get();
    workspace.idpUrls.push(idpUrl);
    this.persist(workspace);
  }

  updateIdpUrl(id: string, url: string) {
    const workspace = this.get();
    const index = workspace.idpUrls.findIndex(u => u.id === id);
    if(index > -1) {
      workspace.idpUrls[index].url = url;
      this.persist(workspace);
    }
  }

  removeIdpUrl(id: string) {
    const workspace = this.get();
    const index = workspace.idpUrls.findIndex(u => u.id === id);
    delete workspace.idpUrls[index];
    this.persist(workspace);
  }

  getProfileName(profileId): string {
    const workspace = this.get();
    const profileFiltered = workspace.profiles.find(profile => profile.id === profileId);
    return profileFiltered ? profileFiltered.name : null;
  }

  getDefaultProfileId(): string {
    const workspace = this.get();
    const profileFiltered = workspace.profiles.find(profile => profile.name === 'default');
    return profileFiltered.id;
  }

  addProfile(profile: { id: string; name: string }): void {
    const workspace = this.get();
    workspace.profiles.push(profile);
    this.persist(workspace);
  }

  updateProfile(id: string, name: string) {
    const workspace = this.get();
    const profileIndex = workspace.profiles.findIndex(p => p.id === id);
    if(profileIndex > -1) {
      workspace.profiles[profileIndex].name = name;
      this.persist(workspace);
    }
  }

  removeProfile(id: string) {
    const workspace = this.get();
    const profileIndex = workspace.profiles.findIndex(p => p.id === id);
    delete workspace.profiles[profileIndex];
    this.persist(workspace);
  }

  configureAwsSso(region: string, portalUrl: string, expirationTime: string): void {
    const workspace = this.get();
    workspace.awsSsoConfiguration.region = region;
    workspace.awsSsoConfiguration.portalUrl = portalUrl;
    workspace.awsSsoConfiguration.expirationTime = expirationTime;
    this.persist(workspace);
  }

  removeExpirationTimeFromAwsSsoConfiguration(): void {
    const workspace = this.get();
    workspace.awsSsoConfiguration.expirationTime = undefined;
    this.persist(workspace);
  }

  getAwsSsoConfiguration(): {region: string; portalUrl: string; expirationTime: string} {
    return this.get().awsSsoConfiguration;
  }

  updateProxyConfiguration(proxyConfiguration: { proxyProtocol: string; proxyUrl: string; proxyPort: string; username: string; password: string }) {
    const workspace = this.get();
    workspace.proxyConfiguration = proxyConfiguration;
    this.persist(workspace);
  }

  private persist(workspace: Workspace) {
    this.fileService.writeFileSync(
      this.appService.getOS().homedir() + '/' + environment.lockFileDestination,
      this.fileService.encryptText(serialize(workspace))
    );
  }

  private getPersistedSessions(): Session[] {
    const workspace = this.get();
    return workspace.sessions;
  }

  private updatePersistedSessions(sessions: Session[]): void {
    const workspace = this.get();
    workspace.sessions = sessions;
    this.persist(workspace);
  }
}

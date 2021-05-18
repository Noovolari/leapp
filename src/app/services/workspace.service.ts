import {Injectable} from '@angular/core';
import {FileService} from './file.service';
import {AppService} from './app.service';
import {Session} from '../models/session';
import {Workspace} from '../models/workspace';
import {environment} from '../../environments/environment';
import {deserialize, serialize} from 'class-transformer';
import {NativeService} from './native-service';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService extends NativeService {

  // Expose the observable$ part of the _sessions subject (read only stream)
  readonly sessions$;

  // - We set the initial state in BehaviorSubject's constructor
  // - Nobody outside the Store should have access to the BehaviorSubject
  //   because it has the write rights
  // - Writing to state should be handled by specialized Store methods
  // - Create one BehaviorSubject per store entity, for example if you have
  //   create a new BehaviorSubject for it, as well as the observable$, and getters/setters
  private readonly _sessions;

  constructor(private appService: AppService, private fileService: FileService) {
    super();
    this._sessions = new BehaviorSubject<Session[]>([]);
    this.sessions$ = this._sessions.asObservable();

    this.create();
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

  create(): void {
    if (!this.fileService.exists(this.appService.getOS().homedir() + '/' + environment.lockFileDestination)) {
      this.fileService.newDir(this.appService.getOS().homedir() + '/.Leapp', { recursive: true});
      const workspace = new Workspace();
      this.persist(workspace);
    }
  }

  get(): Workspace {
    const workspaceJSON = this.fileService.decryptText(this.fileService.readFileSync(this.appService.getOS().homedir() + '/' + environment.lockFileDestination));
    return deserialize(Workspace, workspaceJSON);
  }

  getProfileName(profileId): string {
    const workspace = this.get();
    const profileFiltered = workspace.profiles.find(profile => profile.id === profileId);
    return profileFiltered ? profileFiltered.name : null;
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

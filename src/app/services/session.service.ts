import {Injectable} from '@angular/core';
import {NativeService} from './native-service';
import {Account} from '../models/account';
import {Session} from '../models/session';
import {WorkspaceService} from './workspace.service';
import {CredentialsInfo} from '../models/credentials-info';
import {AccountType} from '../models/AccountType';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export abstract class SessionService extends NativeService {

  // - We set the initial state in BehaviorSubject's constructor
  // - Nobody outside the Store should have access to the BehaviorSubject
  //   because it has the write rights
  // - Writing to state should be handled by specialized Store methods
  // - Create one BehaviorSubject per store entity, for example if you have
  //   create a new BehaviorSubject for it, as well as the observable$, and getters/setters

  private readonly _sessions = new BehaviorSubject<Session[]>(this.workspaceService.getPersistedSessions());

  // Expose the observable$ part of the _sessions subject (read only stream)
  readonly sessions$ = this._sessions.asObservable();

  // the getter will return the last value emitted in _sessions subject
  get sessions(): Session[] {
    return this._sessions.getValue();
  }

  // assigning a value to this.sessions will push it onto the observable
  // and down to all of its subscribers (ex: this.sessions = [])
  set sessions(sessions: Session[]) {
    this.workspaceService.updatePersistedSessions(sessions);
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

  /* This service manage the session manipulation as we need top generate credentials and maintain them for a specific duration */
  protected constructor(
    private workspaceService: WorkspaceService
  ) { super(); }


  create(account: Account, profileId: string): void {
    const session = new Session(account, profileId);
    this.addSession(session);
  }

  get(sessionId: string): Session {
    const sessionFiltered = this.sessions.filter(session => session.sessionId === sessionId);
    return sessionFiltered ? sessionFiltered[0] : null;
  }

  list(): Session[] {
    return this.sessions;
  }

  listChildren(): Session[] {
    return this.sessions.filter( (session) => session.account.type === AccountType.AWS_TRUSTER);
  }

  listActive(): Session[] {
    return this.sessions.filter( (session) => session.active);
  }

  delete(sessionId: string): void {

  }

  async start(sessionId: string): Promise<void> {
    try {
      this.sessionLoading(sessionId);
      const credentialsInfo = await this.generateCredentials(sessionId);
      await this.applyCredentials(credentialsInfo);
      this.sessionActivate(sessionId);
    } catch (error) {
      this.sessionError(sessionId, error);
    }
  }

  async stop(sessionId: string): Promise<void> {
    try {
      await this.deApplyCredentials(sessionId);
      this.sessionDeactivated(sessionId);
    } catch (error) {
      this.sessionError(sessionId, error);
    }
  }

  async rotate(sessionId: string): Promise<void> {
    try {
      this.sessionLoading(sessionId);
      const credentialsInfo = await this.generateCredentials(sessionId);
      await this.applyCredentials(credentialsInfo);
      this.sessionRotated(sessionId);
    } catch (error) {
      this.sessionError(sessionId, error);
    }
  }

  checkExpiring(): void {
    const activeSessions = this.listActive();
    activeSessions.forEach(session => {
      if (session.expired()) {
        this.rotate(session.sessionId);
      }
    });
  }

  abstract generateCredentials(sessionId: string): Promise<CredentialsInfo>;
  abstract applyCredentials(credentialsInfo: CredentialsInfo): Promise<void>;
  abstract deApplyCredentials(sessionId: string): Promise<void>;

  private sessionLoading(sessionId: string) {
    const session = this.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      const index = this.sessions.indexOf(session);
      this.sessions[index] = {
        ...session,
        loading: true
      };
      this.sessions = [...this.sessions];
    }
  }

  private sessionActivate(sessionId: string) {
    const session = this.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      const index = this.sessions.indexOf(session);
      this.sessions[index] = {
        ...session,
        loading: false,
        active: true,
        startDateTime: new Date().toISOString()
      };
      this.sessions = [...this.sessions];
    }
  }

  private sessionRotated(sessionId: string) {
    const session = this.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      const index = this.sessions.indexOf(session);
      this.sessions[index] = {
        ...session,
        startDateTime: new Date().toISOString()
      };
      this.sessions = [...this.sessions];
    }
  }

  private sessionError(sessionId: string, error: Error) {
    this.sessionDeactivated(sessionId);
    // TODO: error handling for user
  }

  private sessionDeactivated(sessionId: string) {
    const session = this.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      const index = this.sessions.indexOf(session);
      this.sessions[index] = {
        ...session,
        lastStopDateTime: new Date().toISOString(),
        startDateTime: undefined,
        active: false,
        loading: false
      };
      this.sessions = [...this.sessions];
    }
  }

}

import {Injectable} from '@angular/core';
import {NativeService} from './native-service';
import {Session} from '../models/session';
import {WorkspaceService} from './workspace.service';
import {CredentialsInfo} from '../models/credentials-info';
import {AccountType} from '../models/AccountType';

@Injectable({
  providedIn: 'root'
})
export abstract class SessionService extends NativeService {

  /* This service manage the session manipulation as we need top generate credentials and maintain them for a specific duration */
  protected constructor(protected workspaceService: WorkspaceService) {
    super();
  }

  get(sessionId: string): Session {
    const sessionFiltered = this.list().find(session => session.sessionId === sessionId);
    return sessionFiltered ? sessionFiltered : null;
  }

  list(): Session[] {
    return this.workspaceService.sessions;
  }

  listChildren(): Session[] {
    return (this.list().length > 0) ? this.list().filter( (session) => session.account.type === AccountType.AWS_TRUSTER) : [];
  }

  listActive(): Session[] {
    return (this.list().length > 0) ? this.list().filter( (session) => session.active) : [];
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

  abstract generateCredentials(sessionId: string): Promise<CredentialsInfo>;
  abstract applyCredentials(credentialsInfo: CredentialsInfo): Promise<void>;
  abstract deApplyCredentials(sessionId: string): Promise<void>;

  // TODO: move to model change method signature
  private sessionLoading(sessionId: string) {
    const session = this.workspaceService.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      const index = this.workspaceService.sessions.indexOf(session);
      let currentSession : Session = this.workspaceService.sessions[index];
      currentSession.loading = true;
      this.workspaceService.sessions[index] = currentSession;
      this.workspaceService.sessions = [...this.workspaceService.sessions];
    }
  }

  private sessionActivate(sessionId: string) {
    const index = this.workspaceService.sessions.findIndex(s => s.sessionId === sessionId);
    if (index > -1) {
      let currentSession : Session = this.workspaceService.sessions[index];
      currentSession.loading = false;
      currentSession.active = true;
      currentSession.startDateTime = new Date().toISOString();
      this.workspaceService.sessions[index] = currentSession;
      this.workspaceService.sessions = [...this.workspaceService.sessions];
      console.log(this.workspaceService.sessions);
    }
  }

  private sessionRotated(sessionId: string) {
    const session = this.workspaceService.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      const index = this.workspaceService.sessions.indexOf(session);
      let currentSession : Session = this.workspaceService.sessions[index];
      currentSession.startDateTime = new Date().toISOString();
      currentSession.loading = false;
      this.workspaceService.sessions[index] = currentSession;
      this.workspaceService.sessions = [...this.workspaceService.sessions];
    }
  }

  private sessionError(sessionId: string, error: Error) {
    this.sessionDeactivated(sessionId);
    // TODO: error handling for user
    console.log(error);
  }

  private sessionDeactivated(sessionId: string) {
    const session = this.workspaceService.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      const index = this.workspaceService.sessions.indexOf(session);
      let currentSession : Session = this.workspaceService.sessions[index];
      currentSession.loading = false;
      currentSession.active = false;
      currentSession.startDateTime = undefined;
      currentSession.lastStopDateTime = new Date().toISOString();
      this.workspaceService.sessions[index] = currentSession;
      this.workspaceService.sessions = [...this.workspaceService.sessions];
    }
  }
}

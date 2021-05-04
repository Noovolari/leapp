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
  protected constructor(
    private workspaceService: WorkspaceService
  ) {
    super();

  }



  get(sessionId: string): Session {
    const sessionFiltered = this.list().filter(session => session.sessionId === sessionId);
    return sessionFiltered ? sessionFiltered[0] : null;
  }

  list(): Session[] {
    return this.workspaceService.sessions;
  }

  listChildren(): Session[] {
    return (this.list().length > 0) ? this.list().filter( (session) => session.account.type === AccountType.AWS_TRUSTER) : [];
  }

  public listActive(): Session[] {
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

  // TODO: change signature and name of function
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

  // TODO: move to model change method signature
  private sessionLoading(sessionId: string) {
    const session = this.workspaceService.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      const index = this.workspaceService.sessions.indexOf(session);
      this.workspaceService.sessions[index] = {
        ...session,
        loading: true
      };
      this.workspaceService.sessions = [...this.workspaceService.sessions];
    }
  }

  private sessionActivate(sessionId: string) {
    const session = this.workspaceService.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      const index = this.workspaceService.sessions.indexOf(session);
      this.workspaceService.sessions[index] = {
        ...session,
        loading: false,
        active: true,
        startDateTime: new Date().toISOString()
      };
      this.workspaceService.sessions = [...this.workspaceService.sessions];
    }
  }

  private sessionRotated(sessionId: string) {
    const session = this.workspaceService.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      const index = this.workspaceService.sessions.indexOf(session);
      this.workspaceService.sessions[index] = {
        ...session,
        startDateTime: new Date().toISOString()
      };
      this.workspaceService.sessions = [...this.workspaceService.sessions];
    }
  }

  private sessionError(sessionId: string, error: Error) {
    this.sessionDeactivated(sessionId);
    // TODO: error handling for user
  }

  private sessionDeactivated(sessionId: string) {
    const session = this.workspaceService.sessions.find(s => s.sessionId === sessionId);
    if (session) {
      const index = this.workspaceService.sessions.indexOf(session);
      this.workspaceService.sessions[index] = {
        ...session,
        lastStopDateTime: new Date().toISOString(),
        startDateTime: undefined,
        active: false,
        loading: false
      };
      this.workspaceService.sessions = [...this.workspaceService.sessions];
    }
  }

}

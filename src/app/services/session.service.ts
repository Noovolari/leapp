import {Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {Account} from '../models/account';
import {Session} from '../models/session';
import {WorkspaceService} from './workspace.service';
import {CredentialsInfo} from '../models/credentials-info';
import {AccountType} from '../models/AccountType';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export abstract class SessionService extends NativeService {
  /* This service manage the session manipulation as we need top generate credentials and maintain them for a specific duration */
  protected constructor(
    private workspaceService: WorkspaceService
  ) { super(); }


  create(account: Account, profileId: string): void {
    const session = new Session(account, profileId);
    this.persistSessionInWorkspace(session);
  }

  get(sessionId: string): Session {
    const sessionFiltered = this.list().filter(session => session.sessionId === sessionId);
    return sessionFiltered ? sessionFiltered[0] : null;
  }

  list(): Session[] {
    return this.workspaceService.getSessions();
  }

  listChilds(): Session[] {
    return this.list().filter( (session) => session.account.type === AccountType.AWS_TRUSTER);
  }

  listActive(): Session[] {
    return this.list().filter( (session) => session.active);
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

  }

  async rotate(sessionId: string): Promise<void> {
    try {
      this.sessionLoading(sessionId);
      const credentialsInfo = await this.generateCredentials(sessionId);
      await this.applyCredentials(credentialsInfo);
      this.sessionRotate(sessionId);
    } catch (error) {
      this.sessionError(sessionId, error);
    }
  }

  expired(sessionId: string): boolean {
    const session = this.get(sessionId);

    if (!session.startDateTime) {
      return false;
    }

    const currentTime = new Date().getTime();
    const startTime = new Date(session.startDateTime).getTime();
    return (currentTime - startTime) / 1000 > environment.sessionDuration;
  }

  abstract generateCredentials(sessionId: string): Promise<CredentialsInfo>;
  abstract applyCredentials(credentialsInfo: CredentialsInfo): Promise<void>;
  abstract deApplyCredentials(credentialsInfo: CredentialsInfo): Promise<void>;

  private sessionLoading(sessionId: string) { }

  private sessionActivate(sessionId: string) { }

  private sessionRotate(sessionId: string) { }

  private sessionError(sessionId: string, error: Error) { }

  private persistSessionInWorkspace(session: Session) {
    const sessions = this.workspaceService.getSessions();
    sessions.push(session);
    this.workspaceService.updateSessions(sessions);
  }
}

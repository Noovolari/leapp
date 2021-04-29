import {Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {Account} from '../models/account';
import {Session} from '../models/session';
import {WorkspaceService} from './workspace.service';
import {CredentialsInfo} from '../models/credentials-info';

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

  }

  list(): Session[] {
    return [];
  }

  listChilds(): Session[] {
    return [];
  }

  listActive(): Session[] {
    return this.list().filter( (session) => session.active);
  }

  delete(sessionId: string): void {

  }

  async start(sessionId: string): Promise<void> {
    this.sessionLoading(sessionId);
    const credentialsInfo = this.generateCredentials(sessionId);
    this.applyCredentials(await credentialsInfo).then(value => {
      this.sessionActivate(sessionId);
    }, error => {
      this.sessionError(error);
    });
  }

  async stop(sessionId: string): Promise<void> {

  }

  expired(sessionId: string): boolean {
    this.get(sessionId);
  }

  async rotate(sessionId: string) {
  }

  abstract generateCredentials(sessionId: string): Promise<CredentialsInfo>;
  abstract applyCredentials(credentialsInfo: CredentialsInfo): Promise<void>;
  abstract deApplyCredentials(credentialsInfo: CredentialsInfo): Promise<void>;

  private sessionLoading(sessionId: string) { }

  private sessionActivate(sessionId: string) { }

  private sessionError(error: Error) { }

  private persistSessionInWorkspace(session: Session) {
    const sessions = this.workspaceService.getSessions();
    sessions.push(session);
    this.workspaceService.updateSessions(sessions);
  }



}

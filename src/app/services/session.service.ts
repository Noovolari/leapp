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

  private persistSessionInWorkspace(session: Session) {
    const sessions = this.workspaceService.getSessions();
    sessions.push(session);
    this.workspaceService.updateSessions(sessions);
  }

  create(account: Account, profileId: string): void {
    const session = new Session(account, profileId);
    this.persistSessionInWorkspace(session);
  }

  abstract generateCredentials(sessionId: string): CredentialsInfo;
  abstract applyCredentials(credentialsInfo: CredentialsInfo): Promise<void>;
  abstract deApplyCredentials(credentialsInfo: CredentialsInfo): Promise<void>;

}

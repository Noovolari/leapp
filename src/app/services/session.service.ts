import {Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {Account} from '../models/account';
import {Session} from '../models/session';
import {WorkspaceService} from './workspace.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService extends NativeService {
  /* This service manage the session manipulation as we need top generate credentials and maintain them for a specific duration */
  constructor(
    private workspaceService: WorkspaceService
  ) { super(); }

  create(account: Account, profileId: string): Session {
    const session = new Session(account, profileId);
    const sessions = this.workspaceService.getSessions();

    sessions.push(session);
    this.workspaceService.updateSessions(sessions);

    return session;
  }

  delete(sessionId: string): void {}

  update(sessionId: string, account: Account, startTime: string, lastStopTime: string, active: boolean, loading: boolean): Session {}

  get(sessionId: string): Session {}

  list(): Session[] {}
}

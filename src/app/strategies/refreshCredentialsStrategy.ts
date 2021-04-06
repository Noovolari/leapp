import {Workspace} from '../models/workspace';
import {Session} from '../models/session';
import {concat, Observable, of} from 'rxjs';
import {LoggerLevel, ToastLevel} from '../services-system/app.service';

export abstract class RefreshCredentialsStrategy {
  refreshCredentials(workspace: Workspace): Observable<any> {
    const activeSessions = this.getActiveSessions(workspace);

    // Refresh all active sessions credentials
    if (activeSessions.length > 0) {
      return this.generateCredentials(workspace, activeSessions);
    } else {
      this.cleanCredentials(workspace);
      return of('cleaning credentials...');
    }
  }

  private generateCredentials(workspace: Workspace, activeSessions: Session[]): Observable<any> {
    const sessionObservables = [];

    activeSessions.forEach(sess => {
      sessionObservables.push(this.manageSingleSession(workspace, sess));
    });

    return concat(...sessionObservables);
  }

  protected abstract getActiveSessions(workspace: Workspace): Session[];
  protected abstract cleanCredentials(workspace: Workspace): void;
  protected abstract manageSingleSession(workspace: Workspace, session: Session): Observable<boolean>;
}

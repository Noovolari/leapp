import {Workspace} from './workspace';
import {Session} from './session';

export abstract class Strategy {
  refreshCredentials(workspace: Workspace): void {
    const activeSessions = this.getActiveSessions(workspace);

    // Refresh all active sessions credentials
    if (activeSessions.length > 0) {
        this.generateCredentials(workspace, activeSessions);
    } else {
      this.cleanCredentials(workspace);
    }
  }

  private generateCredentials(workspace: Workspace, activeSessions: Session[]): void {
    activeSessions.forEach(sess => {
      this.manageSingleSession(workspace, sess);
    });
  }

  protected abstract getActiveSessions(workspace: Workspace): Session[];
  protected abstract cleanCredentials(workspace: Workspace): void;
  protected abstract manageSingleSession(workspace: Workspace, session: Session): void;
}

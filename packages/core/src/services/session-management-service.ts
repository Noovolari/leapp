import { Session } from "../models/session";
import { Repository } from "./repository";
import { AwsSsoRoleSession } from "../models/aws/aws-sso-role-session";
import { SessionFactory } from "./session-factory";

export class SessionManagementService {
  constructor(private repository: Repository, private sessionFactory: SessionFactory) {}

  getSessions(): Session[] {
    return this.repository.getSessions();
  }

  getAssumableSessions(): Session[] {
    return this.repository.listAssumable();
  }

  getActiveAndPendingSessions(): Session[] {
    return this.repository.listActiveAndPending();
  }

  getActiveSessions(): Session[] {
    return this.repository.listActive();
  }

  getPendingSessions(): Session[] {
    return this.repository.listPending();
  }

  getSessionById(selectedSessionId: string): Session {
    return this.getSessions().find((s) => s.sessionId === selectedSessionId);
  }

  getIamRoleChained(session: Session): Session[] {
    return this.repository.listIamRoleChained(session);
  }

  getAwsSsoRoles(): AwsSsoRoleSession[] {
    return this.repository.listAwsSsoRoles() as AwsSsoRoleSession[];
  }

  updateSessions(sessions: Session[]): void {
    this.repository.updateSessions(sessions);
  }

  updateSession(id: string, session: Session): void {
    this.repository.updateSession(id, session);
  }

  deleteSession(sessionId: string): void {
    this.repository.deleteSession(sessionId);
  }

  async stopAllSessions(): Promise<void> {
    const activeSessions = this.getActiveAndPendingSessions();
    for (const session of activeSessions) {
      const sessionService = this.sessionFactory.getSessionService(session.type);
      await sessionService.stop(session.sessionId);
    }
  }
}

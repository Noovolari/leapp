import { Session } from "../../models/session";
import { SessionStatus } from "../../models/session-status";
import { Repository } from "../repository";
import { ISessionNotifier } from "../../interfaces/i-session-notifier";
import { CreateSessionRequest } from "./create-session-request";

export abstract class SessionService {
  protected constructor(protected sessionNotifier: ISessionNotifier, protected repository: Repository) {}

  sessionDeactivated(sessionId: string): void {
    const sessions = this.repository.getSessions();
    const index = sessions.findIndex((s) => s.sessionId === sessionId);

    if (index > -1) {
      const currentSession: Session = sessions[index];
      currentSession.status = SessionStatus.inactive;
      currentSession.startDateTime = undefined;

      sessions[index] = currentSession;

      this.repository.updateSessions(sessions);

      if (this.sessionNotifier) {
        this.sessionNotifier?.setSessions([...sessions]);
      }
    }
  }

  protected sessionActivate(sessionId: string): void {
    const sessions = this.repository.getSessions();
    const index = sessions.findIndex((s) => s.sessionId === sessionId);

    if (index > -1) {
      const currentSession: Session = sessions[index];
      currentSession.status = SessionStatus.active;
      currentSession.startDateTime = new Date().toISOString();

      sessions[index] = currentSession;

      this.repository.updateSessions(sessions);

      if (this.sessionNotifier) {
        this.sessionNotifier.setSessions([...sessions]);
      }
    }
  }

  protected sessionLoading(sessionId: string): void {
    const sessions = this.repository.getSessions();
    const index = sessions.findIndex((s) => s.sessionId === sessionId);

    if (index > -1) {
      const currentSession: Session = sessions[index];
      currentSession.status = SessionStatus.pending;

      sessions[index] = currentSession;

      this.repository.updateSessions(sessions);

      if (this.sessionNotifier) {
        this.sessionNotifier.setSessions([...sessions]);
      }
    }
  }

  protected sessionRotated(sessionId: string): void {
    const sessions = this.repository.getSessions();
    const index = sessions.findIndex((s) => s.sessionId === sessionId);

    if (index > -1) {
      const currentSession: Session = sessions[index];
      currentSession.startDateTime = new Date().toISOString();
      currentSession.status = SessionStatus.active;

      sessions[index] = currentSession;

      this.repository.updateSessions(sessions);

      if (this.sessionNotifier) {
        this.sessionNotifier.setSessions([...sessions]);
      }
    }
  }

  protected sessionError(sessionId: string, error: any): void {
    this.sessionDeactivated(sessionId);
    throw error;
  }

  abstract create(sessionRequest: CreateSessionRequest): Promise<void>;

  abstract start(sessionId: string): Promise<void>;

  abstract rotate(sessionId: string): Promise<void>;

  abstract stop(sessionId: string): Promise<void>;

  abstract delete(sessionId: string): Promise<void>;

  abstract getDependantSessions(sessionId: string): Session[];
}

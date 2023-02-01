import { Session } from "../../models/session";
import { SessionStatus } from "../../models/session-status";
import { Repository } from "../repository";
import { IBehaviouralNotifier } from "../../interfaces/i-behavioural-notifier";
import { CreateSessionRequest } from "./create-session-request";

export abstract class SessionService {
  protected constructor(protected sessionNotifier: IBehaviouralNotifier, protected repository: Repository) {}

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

  protected isInactive(sessionId: string): boolean {
    const sessions = this.repository.getSessions();
    const awsSession = sessions.find((session) => session.sessionId === sessionId);
    return awsSession.status === SessionStatus.inactive;
  }

  protected sessionActivated(sessionId: string, sessionTokenExpiration?: string): void {
    const sessions = this.repository.getSessions();
    const index = sessions.findIndex((s) => s.sessionId === sessionId);

    if (index > -1) {
      const currentSession: Session = sessions[index];
      currentSession.startDateTime = new Date().toISOString();
      currentSession.status = SessionStatus.active;
      if (sessionTokenExpiration) {
        currentSession.sessionTokenExpiration = sessionTokenExpiration;
      }
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

  protected sessionError(sessionId: string, error: any): void {
    this.sessionDeactivated(sessionId);
    throw error;
  }

  abstract create(sessionRequest: CreateSessionRequest): Promise<void>;

  abstract update(sessionId: string, updateRequest: CreateSessionRequest): Promise<void>;

  abstract start(sessionId: string): Promise<void>;

  abstract rotate(sessionId: string): Promise<void>;

  abstract stop(sessionId: string): Promise<void>;

  abstract delete(sessionId: string): Promise<void>;

  abstract getDependantSessions(sessionId: string): Session[];

  abstract validateCredentials(sessionId: string): Promise<boolean>;

  abstract getCloneRequest(session: Session): Promise<CreateSessionRequest>;
}

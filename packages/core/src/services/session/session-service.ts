import { Session } from "../../models/session";
import { SessionStatus } from "../../models/session-status";
import { Repository } from "../repository";
import { ISessionNotifier } from "../../interfaces/i-session-notifier";
import { CreateSessionRequest } from "./create-session-request";

/** Used to manage AWS local sessions */
export abstract class SessionService {
  /** Creates a new SessionService
   *
   * @param sessionNotifier - to notify and update the workspace on session changes
   * @param repository - to read and update the file with the local leapp configuration */
  protected constructor(protected sessionNotifier: ISessionNotifier, protected repository: Repository) {}

  /** Called as soon as a session has been deactivated, to notify and update external states
   *
   * @param sessionId - id of the session */
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

  /** Called as soon as a session has been activated, to notify and update external states
   *
   * @param sessionId - id of the session */
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

  /** Called as soon as the activation phase of a session begins, to notify and update external states
   *
   * @param sessionId - id of the session */
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

  /** Called as soon as a session temporary credentials are rotated, to notify and update external states
   *
   * @param sessionId - id of the session */
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

  /** Called when some error occurs while changing the activation state of a session, to deactivate the session
   * and log the event
   *
   * @param sessionId - id of the session
   * @param error - error to log */
  protected sessionError(sessionId: string, error: any): void {
    this.sessionDeactivated(sessionId);
    throw error;
  }

  /** Create the session starting from a request containing all the necessary data
   *
   * @param sessionRequest - data required to create the session
   * @return creation promise */
  abstract create(sessionRequest: CreateSessionRequest): Promise<void>;

  /** Starts the session with the specified id
   *
   * @param sessionId - id of the session to start
   * @return starting promise */
  abstract start(sessionId: string): Promise<void>;

  /** Rotate the credentials of the session with the specified id
   *
   * @param sessionId - id of the session whose credentials are to be rotated
   * @return rotation promise */
  abstract rotate(sessionId: string): Promise<void>;

  /** Stops the session with the specified id
   *
   * @param sessionId - id of the session to stop
   * @return stopping promise */
  abstract stop(sessionId: string): Promise<void>;

  /** Deletes the session with the specified id
   *
   * @param sessionId - id of the session to delete
   * @return deletion promise */
  abstract delete(sessionId: string): Promise<void>;

  /** Returns the sessions dependent on the session specified by the id
   *
   * @param sessionId - id of the session
   * @return array of dependant sessions */
  abstract getDependantSessions(sessionId: string): Session[];

  /** Check if the credentials are still valid for the session specified by the id
   *
   * @param sessionId - id of the session
   * @return promise on the validity status of the credentials */
  abstract validateCredentials(sessionId: string): Promise<boolean>;
}

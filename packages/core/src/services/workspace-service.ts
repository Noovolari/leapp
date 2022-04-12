import { BehaviorSubject } from "rxjs";
import { AwsSsoIntegration } from "../models/aws-sso-integration";
import { Repository } from "./repository";
import { Session } from "../models/session";
import { SessionStatus } from "../models/session-status";
import { SessionType } from "../models/session-type";
import { AwsIamRoleChainedSession } from "../models/aws-iam-role-chained-session";
import { ISessionNotifier } from "../interfaces/i-session-notifier";

export class WorkspaceService implements ISessionNotifier {
  readonly sessions$: BehaviorSubject<Session[]>;
  readonly integrations$: BehaviorSubject<AwsSsoIntegration[]>;

  constructor(private repository: Repository) {
    this.sessions$ = new BehaviorSubject<Session[]>([]);
    this.integrations$ = new BehaviorSubject<AwsSsoIntegration[]>([]);
    this.sessions = this.repository.getSessions();
  }

  // the getter will return the last value emitted in _sessions subject
  get sessions(): Session[] {
    return this.sessions$.getValue();
  }

  // assigning a value to this.sessions will push it onto the observable
  // and down to all of its subscribers (ex: this.sessions = [])
  set sessions(sessions: Session[]) {
    this.sessions$.next(sessions);
  }

  // TODO: probably it could be removed as it is unused
  getSessions(): Session[] {
    return this.sessions$.getValue();
  }

  // TODO: probably it could be removed as it is unused
  getSessionById(sessionId: string): Session {
    const sessionFiltered = this.sessions.find((session) => session.sessionId === sessionId);
    return sessionFiltered ? sessionFiltered : null;
  }

  setSessions(sessions: Session[]): void {
    this.sessions$.next(sessions);
  }

  addSession(session: Session): void {
    // we assign a new copy of session by adding a new session to it
    this.sessions = [...this.sessions, session];
  }

  deleteSession(sessionId: string): void {
    this.sessions = this.sessions.filter((session) => session.sessionId !== sessionId);
  }

  // TODO: probably it could be removed as it is unused
  getIntegrations(): AwsSsoIntegration[] {
    return this.integrations$.getValue();
  }

  setIntegrations(integrations: AwsSsoIntegration[]): void {
    this.integrations$.next(integrations);
  }

  // TODO: probably it could be removed as it is unused
  listPending(): Session[] {
    return this.sessions.length > 0 ? this.sessions.filter((session) => session.status === SessionStatus.pending) : [];
  }

  // TODO: probably it could be removed as it is unused
  listActive(): Session[] {
    return this.sessions.length > 0 ? this.sessions.filter((session) => session.status === SessionStatus.active) : [];
  }

  // TODO: probably it could be removed as it is unused
  listAwsSsoRoles(): Session[] {
    return this.sessions.length > 0 ? this.sessions.filter((session) => session.type === SessionType.awsSsoRole) : [];
  }

  // TODO: probably it could be removed as it is unused
  listIamRoleChained(parentSession?: Session): Session[] {
    let childSession = this.sessions.length > 0 ? this.sessions.filter((session) => session.type === SessionType.awsIamRoleChained) : [];
    if (parentSession) {
      childSession = childSession.filter((session) => (session as AwsIamRoleChainedSession).parentSessionId === parentSession.sessionId);
    }
    return childSession;
  }

  // TODO: probably it could be removed as it is unused
  listInactive(): Session[] {
    return this.sessions.length > 0 ? this.sessions.filter((session) => session.status === SessionStatus.inactive) : [];
  }

  // TODO: probably it could be removed as it is unused
  listAssumable(): Session[] {
    return this.sessions.length > 0
      ? this.sessions.filter((session) => session.type !== SessionType.azure && session.type !== SessionType.awsIamRoleChained)
      : [];
  }

  updateSession(sessionId: string, session: Session): void {
    const sessions = this.sessions;
    const index = sessions.findIndex((sess) => sess.sessionId === sessionId);
    if (index > -1) {
      this.sessions[index] = session;
      this.sessions = [...this.sessions];
    }
  }
}

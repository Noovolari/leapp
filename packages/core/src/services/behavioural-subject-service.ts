import { BehaviorSubject } from "rxjs";
import { AwsSsoIntegration } from "../models/aws-sso-integration";
import { Repository } from "./repository";
import { Session } from "../models/session";
import { IBehaviouralNotifier } from "../interfaces/i-behavioural-notifier";

export class BehaviouralSubjectService implements IBehaviouralNotifier {
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

  getSessionById(sessionId: string): Session {
    return this.sessions.find((s) => s.sessionId === sessionId);
  }

  getSessions(): Session[] {
    return this.sessions;
  }

  setSessions(sessions: Session[]): void {
    this.sessions = sessions;
  }

  get integrations(): AwsSsoIntegration[] {
    return this.integrations$.getValue();
  }

  set integrations(integrations: AwsSsoIntegration[]) {
    this.integrations$.next(integrations);
  }

  getIntegrations(): AwsSsoIntegration[] {
    return this.integrations;
  }

  setIntegrations(integrations: AwsSsoIntegration[]) {
    this.integrations = integrations;
  }
}

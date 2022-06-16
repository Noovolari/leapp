import { BehaviorSubject } from "rxjs";
import { Repository } from "./repository";
import { Session } from "../models/session";
import { IBehaviouralNotifier } from "../interfaces/i-behavioural-notifier";
import { Integration } from "../models/integration";

export class BehaviouralSubjectService implements IBehaviouralNotifier {
  readonly sessions$: BehaviorSubject<Session[]>;
  readonly integrations$: BehaviorSubject<Integration[]>;

  constructor(private repository: Repository) {
    this.sessions$ = new BehaviorSubject<Session[]>([]);
    this.integrations$ = new BehaviorSubject<Integration[]>([]);
    this.sessions = this.repository.getSessions();
    this.integrations = [...this.repository.listAwsSsoIntegrations(), ...this.repository.listAzureIntegrations()];
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
    this.sessions = [...sessions];
  }

  get integrations(): Integration[] {
    return this.integrations$.getValue();
  }

  set integrations(integrations: Integration[]) {
    this.integrations$.next(integrations);
  }

  getIntegrations(): Integration[] {
    return this.integrations;
  }

  getIntegrationById(integrationId: string): Integration {
    return this.integrations.find((i) => i.id === integrationId);
  }

  setIntegrations(integrations: Integration[]): void {
    this.integrations = integrations;
  }
}

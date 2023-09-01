import { BehaviorSubject } from "rxjs";
import { Repository } from "./repository";
import { Session } from "../models/session";
import { IBehaviouralNotifier } from "../interfaces/i-behavioural-notifier";
import { Integration } from "../models/integration";
import { SessionSelectionState } from "../models/session-selection-state";

export class BehaviouralSubjectService implements IBehaviouralNotifier {
  readonly sessions$: BehaviorSubject<Session[]>;
  readonly integrations$: BehaviorSubject<Integration[]>;
  readonly sessionSelections$: BehaviorSubject<SessionSelectionState[]>;
  readonly fetchingIntegrationState$: BehaviorSubject<string | undefined>;

  constructor(private repository: Repository) {
    this.sessions$ = new BehaviorSubject([]);
    this.integrations$ = new BehaviorSubject([]);
    this.sessionSelections$ = new BehaviorSubject([]);
    this.fetchingIntegrationState$ = new BehaviorSubject<string | undefined>(undefined);
    this.reloadSessionsAndIntegrationsFromRepository();
  }

  // the getter will return the last value emitted in _sessions subject
  get sessions(): Session[] {
    return this.sessions$.getValue();
  }

  // assigning a value to this.sessions will push it onto the observable
  // and down to all of its subscribers (ex: this.sessions = [])
  set sessions(sessions: Session[]) {
    const sessionIds = new Set(sessions.map((session) => session.sessionId));
    this.sessionSelections = this.sessionSelections.filter((sessionSelection) => sessionIds.has(sessionSelection.sessionId));
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

  get sessionSelections(): SessionSelectionState[] {
    return this.sessionSelections$.getValue();
  }

  set sessionSelections(sessionSelections: SessionSelectionState[]) {
    this.sessionSelections$.next(sessionSelections);
  }

  // TODO: add tests
  selectSession(sessionId: string) {
    const sessionSelections = [new SessionSelectionState(sessionId, true, null, null, false)];
    this.sessionSelections = sessionSelections;
  }

  // TODO: add tests
  openContextualMenu(sessionId: string, menuX: number, menuY: number) {
    const sessionSelections = [new SessionSelectionState(sessionId, true, menuX, menuY, true)];
    this.sessionSelections = sessionSelections;
  }

  // TODO: add tests
  unselectSessions() {
    this.sessionSelections = [];
  }

  reloadSessionsAndIntegrationsFromRepository(): void {
    this.sessions = this.repository.getSessions();
    this.integrations = [...this.repository.listAwsSsoIntegrations(), ...this.repository.listAzureIntegrations()];
  }

  setFetchingIntegrations(fetchingState: string | undefined): void {
    this.fetchingIntegrationState$.next(fetchingState);
  }
}

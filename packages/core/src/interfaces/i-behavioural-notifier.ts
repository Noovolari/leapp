import { Session } from "../models/session";
import { Integration } from "../models/integration";

export interface IBehaviouralNotifier {
  getSessions(): Session[];

  getSessionById(sessionId: string): Session;

  setSessions(sessions: Session[]): void;

  getIntegrations(): Integration[];

  setIntegrations(integrations: Integration[]): void;

  setFetchingIntegrations(fetchingState: string | undefined): void;
}

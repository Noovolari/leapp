import { Session } from "../models/session";
import { AwsSsoIntegration } from "../models/aws/aws-sso-integration";

export interface IBehaviouralNotifier {
  getSessions(): Session[];

  getSessionById(sessionId: string): Session;

  setSessions(sessions: Session[]): void;

  getIntegrations(): AwsSsoIntegration[];

  setIntegrations(integrations: AwsSsoIntegration[]): void;
}

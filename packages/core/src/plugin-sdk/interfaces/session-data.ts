import { SessionType } from "../../models/session-type";
import { CreateSessionRequest } from "../../services/session/create-session-request";

/**
 * This class contains Leapp Session metadata needed to generate a create and update request;
 * it has a concrete implementation for each specific Leapp Session type,
 * except for Leapp Sessions provisioned through Integrations (AzureSession, AwsSsoRoleSession)
 */
export abstract class SessionData {
  protected constructor(public sessionType: SessionType) {}

  /**
   * Returns the specific Leapp Session creation request
   */
  abstract getCreationRequest(): CreateSessionRequest;
}

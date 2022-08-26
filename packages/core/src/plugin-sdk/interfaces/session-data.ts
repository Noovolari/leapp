import { SessionType } from "../../models/session-type";
import { CreateSessionRequest } from "../../services/session/create-session-request";

export abstract class SessionData {
  protected constructor(public sessionType: SessionType) {}

  abstract getCreationRequest(): CreateSessionRequest;
}

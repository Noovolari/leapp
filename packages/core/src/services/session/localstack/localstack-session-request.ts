import { CreateSessionRequest } from "../create-session-request";

export interface LocalstackSessionRequest extends CreateSessionRequest {
  sessionId?: string;
  profileId: string;
  region: string;
}

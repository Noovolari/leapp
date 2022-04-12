import { CreateSessionRequest } from "../create-session-request";

export interface AwsIamUserSessionRequest extends CreateSessionRequest {
  accessKey: string;
  secretKey: string;
  region: string;
  mfaDevice?: string;
  profileId: string;
}

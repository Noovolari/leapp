import { CreateAwsSessionRequest } from "../create-aws-session-request";

export interface AwsIamUserSessionRequest extends CreateAwsSessionRequest {
  sessionId?: string;
  accessKey: string;
  secretKey: string;
  mfaDevice?: string;
}

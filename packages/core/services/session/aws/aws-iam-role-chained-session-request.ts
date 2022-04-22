import { CreateSessionRequest } from "../create-session-request";

export interface AwsIamRoleChainedSessionRequest extends CreateSessionRequest {
  region: string;
  roleArn: string;
  roleSessionName?: string;
  parentSessionId: string;
  profileId: string;
}

import { CreateAwsSessionRequest } from "../create-aws-session-request";

export interface AwsIamRoleChainedSessionRequest extends CreateAwsSessionRequest {
  roleArn: string;
  parentSessionId: string;
  roleSessionName?: string;
}

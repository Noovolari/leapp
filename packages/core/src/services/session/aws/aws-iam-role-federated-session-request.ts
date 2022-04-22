import { CreateSessionRequest } from "../create-session-request";

export interface AwsIamRoleFederatedSessionRequest extends CreateSessionRequest {
  idpUrl: string;
  idpArn: string;
  roleArn: string;
  region: string;
  profileId: string;
}

import { CreateAwsSessionRequest } from "../create-aws-session-request";

export interface AwsIamRoleFederatedSessionRequest extends CreateAwsSessionRequest {
  idpUrl: string;
  idpArn: string;
  roleArn: string;
}

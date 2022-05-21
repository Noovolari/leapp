import { CreateAwsSessionRequest } from "../create-aws-session-request";

export interface AwsSsoRoleSessionRequest extends CreateAwsSessionRequest {
  sessionName: string;
  email: string;
  roleArn: string;
  awsSsoConfigurationId: string;
}

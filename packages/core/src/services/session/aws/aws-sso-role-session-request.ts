import { CreateSessionRequest } from "../create-session-request";

export interface AwsSsoRoleSessionRequest extends CreateSessionRequest {
  sessionName: string;
  region: string;
  email: string;
  roleArn: string;
  profileId: string;
  awsSsoConfigurationId: string;
}

import { CreateAwsSessionRequest } from "../create-aws-session-request";

export interface AwsConsoleLoginSessionRequest extends CreateAwsSessionRequest {
  email?: string;
}

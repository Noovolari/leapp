import { CreateAwsSessionRequest } from "../create-aws-session-request";
import { AwsIamUserLocalSessionDto } from "leapp-team-core/encryptable-dto/aws-iam-user-local-session-dto";

export interface AwsIamUserSessionRequest extends CreateAwsSessionRequest {
  sessionId?: string;
  accessKey: string;
  secretKey: string;
  mfaDevice?: string;
}

export const awsIamUserSessionRequestFromDto = (request: AwsIamUserSessionRequest, profileName: string): AwsIamUserLocalSessionDto =>
  new AwsIamUserLocalSessionDto(
    request.sessionId,
    request.sessionName,
    request.region,
    request.accessKey,
    request.secretKey,
    request.mfaDevice,
    profileName
  );

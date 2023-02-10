import { CreateAwsSessionRequest } from "../create-aws-session-request";
import { AwsIamUserLocalSessionDto } from "leapp-team-core/encryptable-dto/aws-iam-user-local-session-dto";

export interface AwsIamUserSessionRequest extends CreateAwsSessionRequest {
  sessionId?: string;
  accessKey: string;
  secretKey: string;
  mfaDevice?: string;
}

export const awsIamUserSessionRequestFromDto = (dto: AwsIamUserLocalSessionDto, profileId: string): AwsIamUserSessionRequest => ({
  sessionName: dto.sessionName,
  sessionId: dto.sessionId,
  profileId,
  region: dto.region,
  accessKey: dto.accessKey,
  secretKey: dto.secretKey,
  mfaDevice: dto.mfaDevice,
});

import { SecretType } from "./secret-type";
import { AwsLocalSessionDto } from "./aws-local-session-dto";

export class AwsIamUserLocalSessionDto extends AwsLocalSessionDto {
  constructor(
    sessionId: string,
    sessionName: string,
    region: string,
    public accessKey: string,
    public secretKey: string,
    public mfaDevice?: string,
    profileName?: string
  ) {
    super(sessionId, sessionName, region, SecretType.awsIamUserSession, profileName);
  }
}

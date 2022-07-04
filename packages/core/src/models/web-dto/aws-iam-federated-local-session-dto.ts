import { SecretType } from "./secret-type";
import { AwsLocalSessionDto } from "./aws-local-session-dto";

export class AwsIamFederatedLocalSessionDto extends AwsLocalSessionDto {
  constructor(
    sessionId: string,
    sessionName: string,
    region: string,
    public roleArn: string,
    public idpArn: string,
    public samlUrl: string,
    profileName?: string
  ) {
    super(sessionId, sessionName, region, SecretType.awsIamRoleFederatedSession, profileName);
  }
}

import { SecretType } from "./secret-type";
import { AwsLocalSessionDto } from "./aws-local-session-dto";

export class AwsIamRoleChainedLocalSessionDto extends AwsLocalSessionDto {
  constructor(
    sessionId: string,
    sessionName: string,
    region: string,
    public roleArn: string,
    public roleSessionName?: string,
    public assumerSessionId?: string,
    public assumerRoleName?: string,
    public assumerIntegrationId?: string,
    public assumerAccountId?: string,
    profileName?: string
  ) {
    super(sessionId, sessionName, region, SecretType.awsIamRoleChainedSession, profileName);
  }
}

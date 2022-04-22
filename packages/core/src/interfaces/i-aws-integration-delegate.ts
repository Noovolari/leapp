import { GetRoleCredentialsResponse } from "aws-sdk/clients/sso";

export interface IAwsIntegrationDelegate {
  getAccessToken(configurationId: string, region: string, portalUrl: string): Promise<string>;

  getRoleCredentials(accessToken: string, region: string, roleArn: string): Promise<GetRoleCredentialsResponse>;
}

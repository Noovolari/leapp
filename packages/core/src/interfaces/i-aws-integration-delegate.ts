import { GetRoleCredentialsResponse } from "@aws-sdk/client-sso";

export interface IAwsIntegrationDelegate {
  getAccessToken(configurationId: string, region: string, portalUrl: string, forceRefresh?: boolean): Promise<string>;

  getRoleCredentials(accessToken: string, region: string, roleArn: string): Promise<GetRoleCredentialsResponse>;
}

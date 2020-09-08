import { AwsCredentials } from './credential';
import { AccountRoleMapping } from './account-role-mapping';
import { SessionObject } from './sessionData';

export interface Workspace {
  type?: string;
  name: string;

  lastIDPToken?: string;
  idpUrl?: string;
  proxyUrl?: string;

  azureConfig?: string;
  azureProfile?: string;

  currentSessionList: SessionObject[];

  principalAccountNumber?: string; // Default to use on opening
  principalRoleName?: string;      // Default to use on opening

  accountRoleMapping?: AccountRoleMapping;
  awsCredentials?: AwsCredentials;
}

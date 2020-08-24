import { AwsCredentials } from './credential';
import { AccountRoleMapping } from './account-role-mapping';
import { SessionObject } from './sessionData';

export interface Workspace {
  type?: string;
  name: string;

  lastIDPToken?: string;
  idpUrl?: string;
  idpUrlAzure?: string;

  currentSessionList: SessionObject[];

  principalAccountNumber?: string; // Default to use on opening
  principalRoleName?: string;      // Default to use on opening

  accountRoleMapping?: AccountRoleMapping;
  awsCredentials?: AwsCredentials;
}

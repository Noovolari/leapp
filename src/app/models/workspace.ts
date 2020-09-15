import { AwsCredentials } from './credential';
import { Session } from './session';

export interface Workspace {
  type?: string;
  name: string;

  lastIDPToken?: string;
  idpUrl?: string;
  proxyUrl?: string;

  azureConfig?: string;
  azureProfile?: string;

  principalAccountNumber?: string; // Default to use on opening
  principalRoleName?: string;      // Default to use on opening

  sessions?: Session[];
  awsCredentials?: AwsCredentials;
}

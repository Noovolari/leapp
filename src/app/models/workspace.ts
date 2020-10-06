import { Session } from './session';

export interface Workspace {
  type?: string;
  name: string;

  lastIDPToken?: string;

  idpUrl?: string;
  proxyUrl?: string;
  ssoAlias?: string;

  azureConfig: string;
  azureProfile: string;

  ssmCredentials?: any;

  sessions: Session[];
}

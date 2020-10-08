import { Session } from './session';

export interface Workspace {
  type?: string;
  name: string;

  lastIDPToken?: string;

  setupDone?: boolean;

  idpUrl?: string;
  proxyUrl?: string;
  ssoAlias?: string;

  azureConfig: string;
  azureProfile: string;

  ssmCredentials?: any;

  sessions: Session[];
}

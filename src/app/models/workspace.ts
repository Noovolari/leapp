import { Session } from './session';

export interface Workspace {
  type?: string;
  name: string;

  lastIDPToken?: string;

  setupDone?: boolean;

  idpUrl?: string;

  proxyConfiguration: {
    proxyProtocol?: string;
    proxyUrl?: string;
    proxyPort?: string;
    username?: string;
    password?: string;
  };

  azureConfig: string;
  azureProfile: string;

  ssmCredentials?: any;

  sessions: Session[];
}

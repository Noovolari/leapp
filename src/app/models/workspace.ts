import {Session} from './session';

export interface Workspace {
  type?: string;

  // TODO WHY there are more than one workspace
  name: string;
  lastIDPToken?: string;
  setupDone?: boolean;
  idpUrl?: { id: string, url: string }[];
  profiles?: { id: string, name: string }[];

  proxyConfiguration: {
    proxyProtocol?: string;
    proxyUrl?: string;
    proxyPort?: string;
    username?: string;
    password?: string;
  };

  azureConfig: string;
  azureProfile: string;

  sessions: Session[];
  defaultRegion: string;
  defaultLocation: string;
}

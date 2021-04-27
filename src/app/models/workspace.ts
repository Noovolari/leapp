import {Session} from './session';
import * as uuid from 'uuid';
import {environment} from '../../environments/environment';

export class Workspace {

  idpUrl: { id: string, url: string }[];
  profiles: { id: string, name: string }[];
  sessions: Session[];

  proxyConfiguration: {
    proxyProtocol: string;
    proxyUrl: string;
    proxyPort: string;
    username: string;
    password: string;
  };

  defaultRegion: string;
  defaultLocation: string;

  constructor() {
    this.idpUrl = [];
    this.profiles = [{ id: uuid.v4(), name: 'default'}, {id: uuid.v4(), name: 'default-azure'}];
    this.sessions = [];
    this.defaultRegion = environment.defaultRegion;
    this.defaultLocation = environment.defaultLocation;
  }
}

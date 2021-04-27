import {Session} from './session';
import * as uuid from 'uuid';
import {environment} from '../../environments/environment';

export class Workspace {
  get sessions(): Session[] {
    return this._sessions;
  }

  set sessions(value: Session[]) {
    this._sessions = value;
  }

  idpUrl: { id: string, url: string }[];
  profiles: { id: string, name: string }[];
  private _sessions: Session[];

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
    this._sessions = [];
    this.defaultRegion = environment.defaultRegion;
    this.defaultLocation = environment.defaultLocation;
  }


}

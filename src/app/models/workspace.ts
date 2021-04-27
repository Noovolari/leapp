import {Session} from './session';
import * as uuid from 'uuid';
import {environment} from '../../environments/environment';

export class Workspace {
  get defaultLocation(): string {
    return this._defaultLocation;
  }

  set defaultLocation(value: string) {
    this._defaultLocation = value;
  }

  get defaultRegion(): string {
    return this._defaultRegion;
  }

  set defaultRegion(value: string) {
    this._defaultRegion = value;
  }

  get proxyConfiguration(): { proxyProtocol: string; proxyUrl: string; proxyPort: string; username: string; password: string } {
    return this._proxyConfiguration;
  }

  set proxyConfiguration(value: { proxyProtocol: string; proxyUrl: string; proxyPort: string; username: string; password: string }) {
    this._proxyConfiguration = value;
  }

  get profiles(): { id: string; name: string }[] {
    return this._profiles;
  }

  set profiles(value: { id: string; name: string }[]) {
    this._profiles = value;
  }

  get idpUrl(): { id: string; url: string }[] {
    return this._idpUrl;
  }

  set idpUrl(value: { id: string; url: string }[]) {
    this._idpUrl = value;
  }

  get sessions(): Session[] {
    return this._sessions;
  }

  set sessions(value: Session[]) {
    this._sessions = value;
  }

  private _idpUrl: { id: string, url: string }[];
  private _profiles: { id: string, name: string }[];
  private _sessions: Session[];

  private _proxyConfiguration: {
    proxyProtocol: string;
    proxyUrl: string;
    proxyPort: string;
    username: string;
    password: string;
  };

  private _defaultRegion: string;
  private _defaultLocation: string;

  constructor() {
    this._idpUrl = [];
    this._profiles = [
      { id: uuid.v4(), name: environment.defaultAwsProfileName },
      { id: uuid.v4(), name: environment.defaultAzureProfileName }
    ];
    this._sessions = [];
    this._defaultRegion = environment.defaultRegion;
    this._defaultLocation = environment.defaultLocation;
  }
}

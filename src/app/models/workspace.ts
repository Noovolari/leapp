import {Session} from './session';
import * as uuid from 'uuid';
import {environment} from '../../environments/environment';
import {Type} from 'class-transformer';
import {Constants} from './constants';
import {AwsSsoIntegration} from './aws-sso-integration';

export class Workspace {
  @Type(() => Session)
  private _sessions: Session[];
  private _defaultRegion: string;
  private _defaultLocation: string;
  private _idpUrls: { id: string; url: string }[];
  private _profiles: { id: string; name: string }[];
  private _macOsTerminal: string;

  private _awsSsoIntegrations: AwsSsoIntegration[];

  private _proxyConfiguration: {
    proxyProtocol: string;
    proxyUrl: string;
    proxyPort: string;
    username: string;
    password: string;
  };

  private _version: string;

  constructor() {
    this._sessions = [];
    this._defaultRegion = environment.defaultRegion;
    this._defaultLocation = environment.defaultLocation;
    this._idpUrls = [];
    this._profiles = [
      { id: uuid.v4(), name: environment.defaultAwsProfileName }
    ];

    this._awsSsoIntegrations = [];

    this._proxyConfiguration = {
      proxyProtocol: 'https',
      proxyUrl: undefined,
      proxyPort: '8080',
      username: undefined,
      password: undefined
    };
    this._macOsTerminal = Constants.macOsTerminal;
  }

  get sessions(): Session[] {
    return this._sessions;
  }

  set sessions(value: Session[]) {
    this._sessions = value;
  }

  get defaultRegion(): string {
    return this._defaultRegion;
  }

  set defaultRegion(value: string) {
    this._defaultRegion = value;
  }

  get defaultLocation(): string {
    return this._defaultLocation;
  }

  set defaultLocation(value: string) {
    this._defaultLocation = value;
  }

  get idpUrls(): { id: string; url: string }[] {
    return this._idpUrls;
  }

  set idpUrls(value: { id: string; url: string }[]) {
    this._idpUrls = value;
  }

  get profiles(): { id: string; name: string }[] {
    return this._profiles;
  }

  set profiles(value: { id: string; name: string }[]) {
    this._profiles = value;
  }

  get awsSsoIntegrations(): AwsSsoIntegration[] {
    return this._awsSsoIntegrations;
  }

  set awsSsoIntegrations(value: AwsSsoIntegration[]) {
    this._awsSsoIntegrations = value;
  }

  get proxyConfiguration(): { proxyProtocol: string; proxyUrl: string; proxyPort: string; username: string; password: string } {
    return this._proxyConfiguration;
  }

  set proxyConfiguration(value: { proxyProtocol: string; proxyUrl: string; proxyPort: string; username: string; password: string }) {
    this._proxyConfiguration = value;
  }

  get version(): string {
    return this._version;
  }

  get macOsTerminal(): string {
    return this._macOsTerminal;
  }

  set macOsTerminal(value: string) {
    this._macOsTerminal = value;
  }
}

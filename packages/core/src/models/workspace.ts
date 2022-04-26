import { AwsNamedProfile } from "./aws-named-profile";
import { IdpUrl } from "./idp-url";
import { Session } from "./session";
import * as uuid from "uuid";
import "reflect-metadata";
import { Type } from "class-transformer";
import { constants } from "./constants";
import { AwsSsoIntegration } from "./aws-sso-integration";
import Folder from "./folder";
import Segment from "./segment";

export class Workspace {
  @Type(() => Session)
  private _sessions: Session[];
  private _defaultRegion: string;
  private _defaultLocation: string;
  private _macOsTerminal: string;
  private _idpUrls: IdpUrl[];
  private _profiles: AwsNamedProfile[];

  private _awsSsoIntegrations: AwsSsoIntegration[];

  private _pinned: string[];
  private _folders: Folder[];
  private _segments: Segment[];

  private _colorTheme: string;

  private _proxyConfiguration: {
    proxyProtocol: string;
    proxyUrl?: string;
    proxyPort: string;
    username?: string;
    password?: string;
  };

  private _credentialMethod: string;

  constructor() {
    this._pinned = [];
    this._sessions = [];
    this._folders = [];
    this._segments = [];
    this._defaultRegion = constants.defaultRegion;
    this._defaultLocation = constants.defaultLocation;
    this._macOsTerminal = constants.macOsTerminal;
    this._idpUrls = [];
    this._profiles = [{ id: uuid.v4(), name: constants.defaultAwsProfileName }];

    this._awsSsoIntegrations = [];

    this._proxyConfiguration = {
      proxyProtocol: "https",
      proxyUrl: undefined,
      proxyPort: "8080",
      username: undefined,
      password: undefined,
    };

    this._credentialMethod = constants.credentialFile;
  }

  addIpUrl(idpUrl: IdpUrl): void {
    this._idpUrls.push(idpUrl);
  }

  get macOsTerminal(): string {
    return this._macOsTerminal;
  }

  set macOsTerminal(value: string) {
    this._macOsTerminal = value;
  }

  get idpUrls(): IdpUrl[] {
    return this._idpUrls;
  }

  set idpUrls(value: IdpUrl[]) {
    this._idpUrls = value;
  }

  get profiles(): AwsNamedProfile[] {
    return this._profiles;
  }

  set profiles(value: AwsNamedProfile[]) {
    this._profiles = value;
  }

  get sessions(): Session[] {
    return this._sessions;
  }

  set sessions(value: Session[]) {
    this._sessions = value;
  }

  get proxyConfiguration(): { proxyProtocol: string; proxyUrl?: string; proxyPort: string; username?: string; password?: string } {
    return this._proxyConfiguration;
  }

  set proxyConfiguration(value: { proxyProtocol: string; proxyUrl?: string; proxyPort: string; username?: string; password?: string }) {
    this._proxyConfiguration = value;
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

  get awsSsoIntegrations(): AwsSsoIntegration[] {
    return this._awsSsoIntegrations;
  }

  set awsSsoIntegrations(value: AwsSsoIntegration[]) {
    this._awsSsoIntegrations = value;
  }

  get pinned(): string[] {
    return this._pinned;
  }

  set pinned(pinned: string[]) {
    this._pinned = pinned;
  }

  get folders(): Folder[] {
    return this._folders;
  }

  set folders(folders: Folder[]) {
    this._folders = folders;
  }

  get segments(): Segment[] {
    return this._segments;
  }

  set segments(segments: Segment[]) {
    this._segments = segments;
  }

  get colorTheme(): string {
    return this._colorTheme;
  }

  set colorTheme(value: string) {
    this._colorTheme = value;
  }

  get credentialMethod(): string {
    return this._credentialMethod;
  }

  set credentialMethod(credentialMethod: string) {
    this._credentialMethod = credentialMethod;
  }
}
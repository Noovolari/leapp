import * as ipc from "node-ipc";
import { IMsalEncryptionService } from "./i-msal-encryption-service";

export interface INativeService {
  url: any;
  fs: any;
  rimraf: any;
  os: any;
  ini: any;
  exec: any;
  unzip: any;
  copydir: any;
  sudo: any;
  path: any;
  semver: any;
  machineId: any;
  keytar: any;
  followRedirects: any;
  httpProxyAgent: any;
  httpsProxyAgent: any;
  process: any;
  nodeIpc: typeof ipc;
  msalEncryptionService: IMsalEncryptionService;
  hashElement: any;
  requireModule: any;
  crypto: any;
  tar: any;
  fetch: any;
  systemPreferences: any;
}

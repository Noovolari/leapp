import { INativeService } from "@noovolari/leapp-core/interfaces/i-native-service";
import { IMsalEncryptionService } from "@noovolari/leapp-core/interfaces/i-msal-encryption-service";

export class CliNativeService implements INativeService {
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
  nodeIpc: any;
  msalEncryptionService: IMsalEncryptionService;
  requireModule: any;
  hashElement: any;
  crypto: any;
  tar: any;
  fetch: any;
  systemPreferences: any;

  constructor() {
    this.fs = require("fs-extra");
    this.rimraf = require("rimraf");
    this.os = require("os");
    this.ini = require("js-ini");
    this.path = require("path");
    this.exec = require("child_process").exec;
    this.process = global.process;
    this.nodeIpc = require("node-ipc");
    this.url = require("url");
    this.unzip = require("extract-zip");
    this.copydir = require("copy-dir");
    this.sudo = require("sudo-prompt");
    this.semver = require("semver");
    this.machineId = require("node-machine-id").machineIdSync();
    this.keytar = require("keytar");
    this.followRedirects = require("follow-redirects");
    this.httpProxyAgent = require("http-proxy-agent");
    this.httpsProxyAgent = require("https-proxy-agent");
    this.requireModule = require("require-module");
    this.hashElement = require("folder-hash");
    this.crypto = require("crypto");
    this.tar = require("tar");
    this.fetch = require("node-fetch");
    this.systemPreferences = null as any;
    this.msalEncryptionService = null as any;
  }
}

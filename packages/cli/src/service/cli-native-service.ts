import { INativeService } from "@noovolari/leapp-core/interfaces/i-native-service";
import { IMsalEncryptionService } from "@noovolari/leapp-core/interfaces/i-msal-encryption-service";

/**
 * Resolves the `fetch` implementation used by the CLI.
 *
 * Node.js >= 18 exposes the WHATWG `fetch` API on the global object, so it is always
 * preferred: the `node-fetch` v2 fallback transitively requires `whatwg-url` -> `tr46`
 * -> the core `punycode` module, which is deprecated (DEP0040) since Node.js 21 and
 * prints a DeprecationWarning on every leapp command.
 *
 * The `node-fetch` fallback is only loaded when no global `fetch` exists (Node.js < 18),
 * where the `punycode` deprecation warning does not exist either.
 */
export const resolveFetch = (globalObject: any = typeof global !== "undefined" ? global : {}): any => {
  const globalFetch = globalObject ? globalObject.fetch : undefined;
  return typeof globalFetch === "function" ? (input: any, init?: any) => globalFetch.call(globalObject, input, init) : require("node-fetch");
};

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
    this.fetch = resolveFetch();
    this.systemPreferences = null as any;
    this.msalEncryptionService = null as any;
  }
}

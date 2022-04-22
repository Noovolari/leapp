import { INativeService } from "@noovolari/leapp-core/interfaces/i-native-service";

export class CliNativeService implements INativeService {
  log: any;
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

  constructor() {
    this.fs = require("fs-extra");
    this.rimraf = require("rimraf");
    this.os = require("os");
    this.ini = require("ini");
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
    this.log = {
      info: (msg: string) => {
        global.console.info(msg);
      },
      warn: (msg: string) => {
        global.console.warn(msg);
      },
      error: (msg: string) => {
        global.console.error(msg);
      },
    };
  }
}

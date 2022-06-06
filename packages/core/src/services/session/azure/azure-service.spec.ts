import { describe, test, expect } from "@jest/globals";
import { AzureService } from "./azure-service";
import { ExecuteService } from "../../execute-service";
import { INativeService } from "../../../interfaces/i-native-service";
import { ILogger } from "../../../interfaces/i-logger";
import { LogLevel, LogService } from "../../log-service";
import { AzureSession } from "../../../models/azure/azure-session";

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
  }
}

export class CliNativeLoggerService implements ILogger {
  constructor() {}

  log(message: string, level: LogLevel): void {
    if (level === LogLevel.info || level === LogLevel.success) {
      global.console.info(message);
    } else if (level === LogLevel.warn) {
      global.console.warn(message);
    } else {
      global.console.error(message);
    }
  }

  show(_message: string, _level: LogLevel): void {
    // TODO: implement a user notification service
  }
}

describe("AzureService", () => {
  test("getDependantSessions", () => {
    const azureService = new AzureService(null, null, null, null, null, null);
    const dependantSessions = azureService.getDependantSessions("sessionId");

    expect(dependantSessions).toEqual([]);
  });

  const azureRealService = new AzureService(
    null,
    null,
    null,
    new ExecuteService(new CliNativeService(), null, new LogService(new CliNativeLoggerService())),
    ".azure/msal_token_cache.json",
    { os: { platform: () => "darwin" } } as INativeService
  );

  test("checkCliVersion", async () => {
    await azureRealService.checkCliVersion();
  });

  test("login", async () => {
    await azureRealService.login(
      new AzureSession("Session1", "eastus", "6d5f42d2-0b2a-4372-93da-3d835cb4852c", "20f03cc3-841f-412b-8f24-16621d26a8cb")
    );
  });

  test("logout", async () => {
    await azureRealService.logout();
  });

  test("refreshAccessToken", async () => {
    const session = new AzureSession("Session1", "eastus", "6d5f42d2-0b2a-4372-93da-3d835cb4852c", "20f03cc3-841f-412b-8f24-16621d26a8cb");
    await azureRealService.refreshAccessToken(session);
  });

  test("use case", async () => {
    await azureRealService.logout();

    const session = new AzureSession("Session1", "eastus", "6d5f42d2-0b2a-4372-93da-3d835cb4852c", "20f03cc3-841f-412b-8f24-16621d26a8cb");
    await azureRealService.login(session);
    await azureRealService.refreshAccessToken(session);
    await azureRealService.logout();
  }, 1000000);
});

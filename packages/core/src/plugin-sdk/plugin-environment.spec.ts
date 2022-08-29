import { beforeEach, describe, test, jest, expect } from "@jest/globals";
import { EnvironmentType, PluginEnvironment } from "./plugin-environment";
import { LoggedEntry, LogLevel } from "../services/log-service";
import { SessionType } from "../models/session-type";

describe("PluginEnvironment", () => {
  let pluginEnvironment;
  let providerService;
  beforeEach(() => {
    providerService = {} as any;
    pluginEnvironment = new PluginEnvironment(EnvironmentType.desktopApp, providerService);
  });

  test("log", () => {
    providerService.logService = { log: jest.fn() };
    pluginEnvironment.log("fake message", LogLevel.warn, false);
    expect(providerService.logService.log).toHaveBeenCalledWith(new LoggedEntry("fake message", this, LogLevel.warn, false));
  });

  test("fetch", () => {
    pluginEnvironment.nativeService = { fetch: jest.fn() };
    pluginEnvironment.fetch("fake url");
    expect(pluginEnvironment.nativeService.fetch).toHaveBeenCalledWith("fake url");
  });

  test("openExternalUrl", async () => {
    pluginEnvironment.openExternalUrlService = { openExternalUrl: jest.fn() };
    await pluginEnvironment.openExternalUrl("fake url");
    expect(pluginEnvironment.openExternalUrlService.openExternalUrl).toHaveBeenCalledWith("fake url");
  });

  test("createSession", async () => {});
  test("cloneSession", async () => {});
  test("updateSession", async () => {});

  test("openTerminal", async () => {
    providerService.executeService = { openTerminal: jest.fn() };
    await pluginEnvironment.openTerminal("fake command", { ciao: "ciao" });
    expect(providerService.executeService.openTerminal).toHaveBeenCalledWith("fake command", { ciao: "ciao" });
  });

  test("generalCredentials", async () => {
    const sessionService = { generateCredentials: jest.fn() };
    providerService.sessionFactory = { getSessionService: jest.fn(() => sessionService) };
    (pluginEnvironment as any).generateCredentials({ sessionId: "1", type: SessionType.awsIamUser });
    expect(providerService.sessionFactory.getSessionService).toHaveBeenCalledWith(SessionType.awsIamUser);
    expect(sessionService.generateCredentials).toHaveBeenCalledWith("1");
  });
});

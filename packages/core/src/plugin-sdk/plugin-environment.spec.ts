import { beforeEach, describe, test, jest, expect } from "@jest/globals";
import { EnvironmentType, PluginEnvironment } from "./plugin-environment";
import { LoggedEntry, LogLevel } from "../services/log-service";
import { SessionType } from "../models/session-type";
import { AwsIamUserService } from "../services/session/aws/aws-iam-user-service";

describe("PluginEnvironment", () => {
  let pluginEnvironment;
  let providerService;
  beforeEach(() => {
    providerService = {} as any;
    pluginEnvironment = new PluginEnvironment(EnvironmentType.desktopApp, providerService);
  });

  test("PluginEnvironment, using cliNativeService as the providerService in the constructor", () => {
    providerService.cliNativeService = { fakeMethod1: () => {} };
    providerService.cliOpenWebConsoleService = { fakeMethod2: () => {} };
    pluginEnvironment = new PluginEnvironment(EnvironmentType.cli, providerService);
    expect(pluginEnvironment.nativeService).toBe(providerService.cliNativeService);
    expect(pluginEnvironment.openExternalUrlService).toBe(providerService.cliOpenWebConsoleService);
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

  test("createSession", async () => {
    const createSessionData = {
      sessionType: SessionType.awsIamUser,
      getCreationRequest: jest.fn(() => "fake-request"),
    } as any;
    const awsIamUserService = new AwsIamUserService(null, null, null, null, null, null, null);
    awsIamUserService.create = jest.fn();
    providerService.sessionFactory = { getSessionService: jest.fn(() => awsIamUserService) };

    pluginEnvironment.createSession(createSessionData);
    expect(providerService.sessionFactory.getSessionService).toHaveBeenCalledWith(SessionType.awsIamUser);
    expect(createSessionData.getCreationRequest).toHaveBeenCalled();
    expect(awsIamUserService.create).toHaveBeenCalledWith("fake-request");
  });

  test("cloneSession", async () => {
    const session = { sessionType: SessionType.awsIamUser };
    const awsIamUserService = new AwsIamUserService(null, null, null, null, null, null, null);
    const fakeCreateSessionData = "fake-create-session-data";
    awsIamUserService.getCloneRequest = jest.fn(() => fakeCreateSessionData as any);
    awsIamUserService.create = jest.fn();
    providerService.repository = { getSession: jest.fn(() => session) };
    providerService.sessionFactory = { getSessionService: jest.fn(() => awsIamUserService) };

    pluginEnvironment.cloneSession("fake-session-id");
    expect(providerService.repository.getSession).toHaveBeenCalledWith("fake-session-id");
    expect(providerService.sessionFactory.getSessionService).toHaveBeenCalledWith(session.sessionType);
    expect(awsIamUserService.getCloneRequest).toHaveBeenCalledWith(session);
    expect(awsIamUserService.create).toHaveBeenCalledWith(fakeCreateSessionData);
  });

  test("updateSession", async () => {
    const session = { type: SessionType.awsIamUser };
    const awsIamUserService = new AwsIamUserService(null, null, null, null, null, null, null);
    awsIamUserService.update = jest.fn();
    providerService.repository = { getSessionById: jest.fn(() => session) };
    providerService.sessionFactory = { getSessionService: jest.fn(() => awsIamUserService) };

    pluginEnvironment.updateSession("fake-update-request-data", "fake-session-id");
    expect(providerService.repository.getSessionById).toHaveBeenCalledWith("fake-session-id");
    expect(providerService.sessionFactory.getSessionService).toHaveBeenCalledWith(session.type);
    expect(awsIamUserService.update).toHaveBeenCalledWith("fake-session-id", "fake-update-request-data");
  });

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

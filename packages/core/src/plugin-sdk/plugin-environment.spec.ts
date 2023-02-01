import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { EnvironmentType, PluginEnvironment } from "./plugin-environment";
import { LoggedEntry, LogLevel } from "../services/log-service";
import { SessionType } from "../models/session-type";
import { AwsIamUserService } from "../services/session/aws/aws-iam-user-service";
import { constants } from "../models/constants";

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
    const session = { type: SessionType.awsIamUser };
    const awsIamUserService = new AwsIamUserService(null, null, null, null, null, null, null);
    const fakeCreateSessionData = "fake-create-session-data";
    awsIamUserService.getCloneRequest = jest.fn(() => fakeCreateSessionData as any);
    awsIamUserService.create = jest.fn();
    providerService.repository = { getSession: jest.fn(() => session) };
    providerService.sessionFactory = { getSessionService: jest.fn(() => awsIamUserService) };

    await pluginEnvironment.cloneSession(session);
    expect(providerService.sessionFactory.getSessionService).toHaveBeenCalledWith(session.type);
    expect(awsIamUserService.getCloneRequest).toHaveBeenCalledWith(session);
    expect(awsIamUserService.create).toHaveBeenCalledWith(fakeCreateSessionData);
  });

  test("updateSession", async () => {
    const fakeCreationRequest = "fake-creation-request";
    const session = { type: SessionType.awsIamUser, sessionId: "fake-session-id" };
    const awsIamUserService = new AwsIamUserService(null, null, null, null, null, null, null);
    awsIamUserService.update = jest.fn();
    providerService.repository = { getSessionById: jest.fn(() => session) };
    providerService.sessionFactory = { getSessionService: jest.fn(() => awsIamUserService) };
    const updateRequestData = { getCreationRequest: jest.fn(() => fakeCreationRequest) };

    await pluginEnvironment.updateSession(updateRequestData, session);
    expect(providerService.sessionFactory.getSessionService).toHaveBeenCalledWith(session.type);
    expect(awsIamUserService.update).toHaveBeenCalledWith(session.sessionId, fakeCreationRequest);
  });

  test("openTerminal", async () => {
    const homedir = "homedir";
    pluginEnvironment.nativeService = {
      os: {
        homedir: jest.fn(() => homedir),
      },
      process: {
        platform: "darwin",
      },
      rimraf: jest.fn(),
    } as any;
    providerService.executeService = {
      openTerminalFromPlugin: jest.fn(async () => {}),
    };
    providerService.fileService = { writeFileSync: jest.fn() };
    await pluginEnvironment.openTerminal("fake-command arg1 arg2", { testEnv: "test", anotherEnvVar: `"test 2"` });
    expect(providerService.executeService.openTerminalFromPlugin).toHaveBeenCalledWith("fake-command arg1 arg2", {
      testEnv: "test",
      anotherEnvVar: `"test 2"`,
    });
    expect(pluginEnvironment.nativeService.os.homedir).toHaveBeenCalled();
    expect(providerService.fileService.writeFileSync).toHaveBeenCalledWith(
      homedir + "/" + constants.pluginEnvFileDestination,
      'export testEnv=test;\nexport anotherEnvVar="test 2";\n'
    );
    expect(pluginEnvironment.nativeService.rimraf).toHaveBeenCalledWith(homedir + "/" + constants.pluginEnvFileDestination, {}, expect.any(Function));
  });

  test("generalCredentials", async () => {
    const sessionService = { generateCredentials: jest.fn() };
    providerService.sessionFactory = { getSessionService: jest.fn(() => sessionService) };
    (pluginEnvironment as any).generateCredentials({ sessionId: "1", type: SessionType.awsIamUser });
    expect(providerService.sessionFactory.getSessionService).toHaveBeenCalledWith(SessionType.awsIamUser);
    expect(sessionService.generateCredentials).toHaveBeenCalledWith("1");
  });
});

import { describe, expect, jest, test } from "@jest/globals";
import StartSession from "./start";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { SessionType } from "@noovolari/leapp-core/models/session-type";

describe("StartSession", () => {
  const getTestCommand = (cliProviderService: any = null, argv = []): StartSession => {
    const command = new StartSession(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  const mockedDateString = "2022-02-24T10:00:00";
  const mockedIdpUrlId = "mocked-idp-url-id";
  const mockedIdpArn = "mocked-idp-arn";
  const mockedRoleArn = "arn:aws:iam::123123123123:role/test-mfa-role";
  const mockedAwsSsoRoleArn = "arn:aws:iam::123123123123/DatabaseAdministrator";
  const mockedProfileId = "mocked-profile-id";
  const mockedConfigurationId = "mocked-configuration-id";
  const mockedSubscriptionId = "mocked-subscription-id";
  const mockedTenantId = "mocked-tenant-id";
  const mockedAzureIntegrationId = "mocked-azure-integration-id";

  const awsIamRoleFederatedSession: any = {
    sessionId: "fake-id-1",
    status: SessionStatus.inactive,
    startDateTime: undefined,
    type: SessionType.awsIamRoleFederated,
    sessionTokenExpiration: new Date(mockedDateString).toISOString(),
    idpUrlId: mockedIdpUrlId,
    idpArn: mockedIdpArn,
    roleArn: mockedRoleArn,
    profileId: mockedProfileId,
  };

  const awsIamRoleChainedSession: any = {
    sessionId: "fake-id-2",
    status: SessionStatus.inactive,
    startDateTime: undefined,
    type: SessionType.awsIamRoleChained,
    sessionTokenExpiration: new Date(mockedDateString).toISOString(),
    roleArn: mockedRoleArn,
    profileId: mockedProfileId,
    parentSessionId: awsIamRoleFederatedSession.sessionId,
  };

  const awsIamUserSession: any = {
    sessionId: "fake-id-3",
    status: SessionStatus.inactive,
    startDateTime: undefined,
    type: SessionType.awsIamUser,
    sessionTokenExpiration: new Date(mockedDateString).toISOString(),
    profile: mockedProfileId,
  };

  const awsSsoRoleSession: any = {
    sessionId: "fake-id-4",
    status: SessionStatus.inactive,
    startDateTime: undefined,
    type: SessionType.awsSsoRole,
    sessionTokenExpiration: new Date(mockedDateString).toISOString(),
    roleArn: mockedAwsSsoRoleArn,
    profileId: mockedProfileId,
    awsSsoConfigurationId: mockedConfigurationId,
  };

  const azureSession: any = {
    sessionId: "fake-id-5",
    status: SessionStatus.inactive,
    startDateTime: undefined,
    type: SessionType.azure,
    sessionTokenExpiration: new Date(mockedDateString).toISOString(),
    subscriptionId: mockedSubscriptionId,
    tenantId: mockedTenantId,
    azureIntegrationId: mockedAzureIntegrationId,
  };

  const noTypeSession: any = {
    sessionId: "fake-id-6",
    status: SessionStatus.inactive,
    startDateTime: undefined,
    type: undefined,
    sessionTokenExpiration: new Date(mockedDateString).toISOString(),
    idpUrlId: mockedIdpUrlId,
    idpArn: mockedIdpArn,
    roleArn: mockedRoleArn,
    profileId: mockedProfileId,
  };

  test("it throws an error if the given session is active", async () => {
    const sessionService: any = {
      start: jest.fn(async () => {}),
      sessionDeactivated: jest.fn(async () => {}),
    };
    const sessionFactory: any = {
      getSessionService: jest.fn(() => sessionService),
    };
    const remoteProceduresClient: any = { refreshSessions: jest.fn() };
    const session: any = { sessionId: "sessionId", type: "sessionType", status: SessionStatus.active };
    const cliProviderService: any = {
      sessionFactory,
      remoteProceduresClient,
      sessionManagementService: {
        getSessionById: jest.fn((id: string) => [session].find((s) => s.sessionId === id)),
      },
    };
    const command = getTestCommand(cliProviderService, ["--sessionId", "sessionId"]);
    await expect(command.run()).rejects.toThrow("session already started");
  });

  test("Flags - Session Id", async () => {
    const sessionService: any = {
      start: jest.fn(async () => {}),
      sessionDeactivated: jest.fn(async () => {}),
    };
    const sessionFactory: any = {
      getSessionService: jest.fn(() => sessionService),
    };
    const remoteProceduresClient: any = { refreshSessions: jest.fn() };
    const session: any = { sessionId: "sessionId", type: "sessionType" };
    const cliProviderService: any = {
      sessionFactory,
      remoteProceduresClient,
      sessionManagementService: {
        getSessionById: jest.fn((id: string) => [session].find((s) => s.sessionId === id)),
      },
    };
    const processOn = jest.spyOn(process, "on").mockImplementation((event: any, callback: any): any => {
      expect(event).toBe("SIGINT");
      callback();
    });
    const processExit = jest.spyOn(process, "exit").mockImplementation((): any => {});

    let command = getTestCommand(cliProviderService, ["--sessionId"]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("Flag --sessionId expects a value");

    const mockedSessionId = "mocked-session-id";
    command = getTestCommand(cliProviderService, ["--sessionId", mockedSessionId]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("No session with id " + mockedSessionId + " found");

    command = getTestCommand(cliProviderService, ["--sessionId", "sessionId"]);
    command.log = jest.fn();
    await command.run();
    expect(sessionFactory.getSessionService).toHaveBeenCalledWith("sessionType");
    expect(sessionService.start).toHaveBeenCalledWith("sessionId");
    expect(command.log).toHaveBeenCalledWith("session started");
    expect(processOn).toHaveBeenCalled();
    expect(sessionService.sessionDeactivated).toHaveBeenCalledWith("sessionId");
    expect(processExit).toHaveBeenCalledWith(0);
    expect(remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });

  test("startSession", async () => {
    const sessionService: any = {
      start: jest.fn(async () => {}),
      sessionDeactivated: jest.fn(async () => {}),
    };
    const sessionFactory: any = {
      getSessionService: jest.fn(() => sessionService),
    };
    const remoteProceduresClient: any = { refreshSessions: jest.fn() };

    const cliProviderService: any = {
      sessionFactory,
      remoteProceduresClient,
    };

    const session: any = { sessionId: "sessionId", type: "sessionType" };
    const command = getTestCommand(cliProviderService);
    command.log = jest.fn();
    const processOn = jest.spyOn(process, "on").mockImplementation((event: any, callback: any): any => {
      expect(event).toBe("SIGINT");
      callback();
    });
    const processExit = jest.spyOn(process, "exit").mockImplementation((): any => {});
    await command.startSession(session);

    expect(sessionFactory.getSessionService).toHaveBeenCalledWith("sessionType");
    expect(sessionService.start).toHaveBeenCalledWith("sessionId");
    expect(command.log).toHaveBeenCalledWith("session started");
    expect(processOn).toHaveBeenCalled();
    expect(sessionService.sessionDeactivated).toHaveBeenCalledWith("sessionId");
    expect(processExit).toHaveBeenCalledWith(0);
    expect(remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });

  test("selectSession without secondarySessionInfo", async () => {
    const cliProviderService: any = {
      sessionManagementService: {
        getSessions: jest.fn(() => [
          { sessionName: "sessionActive", status: SessionStatus.active },
          { sessionName: "sessionPending", status: SessionStatus.pending },
          { sessionName: "sessionInactive", status: SessionStatus.inactive },
        ]),
      },
      inquirer: {
        prompt: jest.fn(() => ({ selectedSession: { name: "sessionInactive", value: "InactiveSession" } })),
      },
    };

    const command = getTestCommand(cliProviderService);
    const fakeRoleName = undefined;
    command.secondarySessionInfo = jest.fn(() => fakeRoleName);

    const selectedSession = await command.selectSession();
    expect(cliProviderService.inquirer.prompt).toHaveBeenCalledWith([
      {
        choices: [
          {
            name: "sessionInactive",
            value: { sessionName: "sessionInactive", status: SessionStatus.inactive },
          },
        ],
        message: "select a session",
        name: "selectedSession",
        type: "list",
      },
    ]);
    expect(selectedSession).toEqual({ name: "sessionInactive", value: "InactiveSession" });
  });

  test("selectSession with secondarySessionInfo", async () => {
    const inactiveSession: any = { sessionName: "sessionInactive", status: SessionStatus.inactive };

    const cliProviderService: any = {
      sessionManagementService: {
        getSessions: jest.fn(() => [
          { sessionName: "sessionActive", status: SessionStatus.active },
          { sessionName: "sessionPending", status: SessionStatus.pending },
          inactiveSession,
        ]),
      },
      inquirer: {
        prompt: jest.fn(() => ({ selectedSession: { name: "sessionInactive", value: "InactiveSession" } })),
      },
    };

    const command = getTestCommand(cliProviderService);
    const fakeRoleName = "fake-role";
    command.secondarySessionInfo = jest.fn(() => fakeRoleName);

    const selectedSession = await command.selectSession();
    expect(cliProviderService.inquirer.prompt).toHaveBeenCalledWith([
      {
        choices: [
          {
            name: `sessionInactive - ${fakeRoleName}`,
            value: { sessionName: "sessionInactive", status: SessionStatus.inactive },
          },
        ],
        message: "select a session",
        name: "selectedSession",
        type: "list",
      },
    ]);
    expect(selectedSession).toEqual({ name: "sessionInactive", value: "InactiveSession" });
    expect(command.secondarySessionInfo).toHaveBeenNthCalledWith(1, inactiveSession);
    expect(command.secondarySessionInfo).toHaveBeenNthCalledWith(2, inactiveSession);
  });

  test("selectSession, no session available", async () => {
    const cliProviderService: any = {
      sessionManagementService: {
        getSessions: jest.fn(() => []),
      },
    };

    const command = getTestCommand(cliProviderService);
    await expect(command.selectSession()).rejects.toThrow(new Error("no sessions available"));
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const command = getTestCommand();

    command.selectSession = jest.fn(async (): Promise<any> => "session");

    command.startSession = jest.fn(async (): Promise<any> => {
      if (errorToThrow) {
        throw errorToThrow;
      }
    });

    try {
      await command.run();
    } catch (error) {
      expect(error).toEqual(new Error(expectedErrorMessage));
    }
    expect(command.startSession).toHaveBeenCalledWith("session");
  };

  test.each([
    { session: awsIamRoleFederatedSession, expected: "test-mfa-role" },
    { session: awsIamRoleChainedSession, expected: "test-mfa-role" },
    { session: awsIamUserSession, expected: "" },
    { session: awsSsoRoleSession, expected: "DatabaseAdministrator" },
    { session: azureSession, expected: mockedSubscriptionId },
    { session: noTypeSession, expected: undefined },
  ])("test secondarySessionInfo $session.type", ({ session, expected }) => {
    const cliProviderService: any = {};
    const command = getTestCommand(cliProviderService);
    const result = command.secondarySessionInfo(session);
    expect(result).toBe(expected);
  });

  test("run - all ok", async () => {
    await runCommand(undefined, "");
  });

  test("run - createSession throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - createSession throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });
});

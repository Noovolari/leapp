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
        getSessions: jest.fn(() => [session]),
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
    const sessions: any = [
      { sessionId: "sessionId0", type: "sessionType0", sessionName: "mock-session-1" },
      { sessionId: "sessionId1", type: "sessionType", sessionName: "mock-session-2" },
    ];
    const cliProviderService: any = {
      sessionFactory,
      remoteProceduresClient,
      sessionManagementService: {
        getSessions: jest.fn(() => sessions),
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
    await expect(command.run()).rejects.toThrow("No sessions found");

    command = getTestCommand(cliProviderService, ["--sessionId", "sessionId0"]);
    command.log = jest.fn();
    await command.run();
    expect(sessionFactory.getSessionService).toHaveBeenCalledWith("sessionType0");
    expect(sessionFactory.getSessionService).not.toHaveBeenCalledWith("sessionType1");
    expect(sessionService.start).toHaveBeenCalledWith("sessionId0");
    expect(sessionService.start).not.toHaveBeenCalledWith("sessionId1");
    expect(command.log).toHaveBeenCalledWith("session mock-session-1 started");
    expect(processOn).toHaveBeenCalled();
    expect(sessionService.sessionDeactivated).toHaveBeenCalledWith("sessionId0");
    expect(sessionService.sessionDeactivated).not.toHaveBeenCalledWith("sessionId1");
    expect(processExit).toHaveBeenCalledWith(0);
    expect(remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });

  const testSessions = [
    { sessionId: "sessionId1", sessionName: "sessionName1", type: "sessionType", roleArn: "sessionRole1" },
    { sessionId: "sessionId2", sessionName: "sessionName1", type: "sessionType", roleArn: "sessionRole2" },
    { sessionId: "sessionId3", sessionName: "sessionName2", type: "sessionType", roleArn: "sessionRole1" },
    { sessionId: "sessionId4", sessionName: "sessionName3", type: "sessionType", roleArn: "sessionRole1" },
    { sessionId: "sessionId5", sessionName: "sessionName3", type: "sessionType", roleArn: "sessionRole1" },
    { sessionId: "sessionId6", sessionName: "sessionName3", type: "sessionType", roleArn: "sessionRole2" },
  ];

  test.each([
    {
      name: "run - no flags, no args, selectSession called",
      sessions: testSessions,
      args: [],
      flags: [],
      expected: { selectedSessions: testSessions, selectedSession: testSessions[1] },
      selectSession: jest.fn(() => testSessions[1]),
    },
    {
      name: "run - --noInteractive flag, no args, throws an error",
      sessions: testSessions,
      args: [],
      flags: ["--noInteractive"],
      expected: { selectedSessions: testSessions, selectedSession: undefined },
      selectSession: undefined,
    },
    {
      name: "run - no flags, unique sessionName arg, starts the specified session",
      sessions: testSessions,
      args: ["sessionName2"],
      flags: [],
      expected: { selectedSessions: testSessions, selectedSession: testSessions[2] },
      selectSession: undefined,
    },
    {
      name: "run - no flags, ambiguous sessionName arg, selectSession called",
      sessions: testSessions,
      args: ["sessionName1"],
      flags: [],
      expected: { selectedSessions: testSessions.filter((session) => session.sessionName === "sessionName1"), selectedSession: testSessions[1] },
      selectSession: jest.fn(() => testSessions[1]),
    },
    {
      name: "run - --noInteractive flag, ambiguous sessionName arg, starts the first session found",
      sessions: testSessions,
      args: ["sessionName1"],
      flags: ["--noInteractive"],
      expected: { selectedSessions: [testSessions[0], testSessions[1]], selectedSession: undefined },
      selectSession: undefined,
    },
    {
      name: "run - no flags, non-existent sessionName arg, command.error called",
      sessions: testSessions,
      args: ["sessionName5"],
      flags: [],
      expected: { selectedSessions: testSessions, selectedSession: undefined },
      selectSession: undefined,
    },
    {
      name: "run - no flags, non-existent second argument, command.error called",
      sessions: testSessions,
      args: ["sessionName3 sessionRole3"],
      flags: [],
      expected: { selectedSessions: testSessions, selectedSession: undefined },
      selectSession: undefined,
    },
    {
      name: "run - existent sessionId flag, no args, starts specified session",
      sessions: testSessions,
      args: [],
      flags: ["--sessionId", "sessionId1"],
      expected: { selectedSessions: testSessions, selectedSession: testSessions[0] },
      selectSession: undefined,
    },
    {
      name: "run - sessionId flag, existent and coherent sessionName arg, starts specified session",
      sessions: testSessions,
      args: ["sessionName1"],
      flags: ["--sessionId", "sessionId1"],
      expected: { selectedSessions: undefined, selectedSession: testSessions[0] },
      selectSession: undefined,
    },
    {
      name: "run - non-existent sessionId flag, no args, command.error called",
      sessions: testSessions,
      args: [],
      flags: ["--sessionId", "sessionId9"],
      expected: { selectedSessions: undefined, selectedSession: undefined },
      selectSession: undefined,
    },
  ])("$name", async ({ sessions, args, flags, expected, selectSession }) => {
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
      sessionManagementService: {
        getSessions: jest.fn(() => sessions),
      },
    };
    const command = getTestCommand(cliProviderService, [...args, ...flags]);
    if (selectSession) {
      command.selectSession = selectSession;
    }
    command.startSession = jest.fn();
    (command as any).error = jest.fn();

    await command.run();

    if (selectSession) {
      expect(selectSession).toHaveBeenCalledWith(expected.selectedSessions);
    }
    if (expected.selectedSession) {
      expect(command.startSession).toHaveBeenCalledWith(expected.selectedSession);
    } else {
      expect(command.error).toHaveBeenCalledWith("No sessions found");
    }
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

    const session: any = { sessionId: "sessionId", type: "sessionType", sessionName: "mock-session" };
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
    expect(command.log).toHaveBeenCalledWith("session mock-session started");
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
          { sessionName: "sessionInactive1", status: SessionStatus.inactive },
          { sessionName: "sessionInactive2", status: SessionStatus.inactive },
        ]),
      },
      inquirer: {
        prompt: jest.fn(() => ({ selectedSession: { name: "sessionInactive1", value: "InactiveSession" } })),
      },
    };

    const command = getTestCommand(cliProviderService);
    const fakeRoleName = undefined;
    command.secondarySessionInfo = jest.fn(() => fakeRoleName);

    const selectedSession = await command.selectSession([
      { sessionName: "sessionInactive1", status: SessionStatus.inactive } as any,
      { sessionName: "sessionInactive2", status: SessionStatus.inactive } as any,
    ]);
    expect(cliProviderService.inquirer.prompt).toHaveBeenCalledWith([
      {
        choices: [
          {
            name: "sessionInactive1",
            value: { sessionName: "sessionInactive1", status: SessionStatus.inactive },
          },
          {
            name: "sessionInactive2",
            value: { sessionName: "sessionInactive2", status: SessionStatus.inactive },
          },
        ],
        message: "select a session",
        name: "selectedSession",
        type: "list",
      },
    ]);
    expect(selectedSession).toEqual({ name: "sessionInactive1", value: "InactiveSession" });
  });

  test("selectSession with secondarySessionInfo", async () => {
    const inactiveSession1: any = { sessionName: "sessionInactive1", status: SessionStatus.inactive };
    const inactiveSession2: any = { sessionName: "sessionInactive2", status: SessionStatus.inactive };

    const cliProviderService: any = {
      sessionManagementService: {
        getSessions: jest.fn(() => [
          { sessionName: "sessionActive", status: SessionStatus.active },
          { sessionName: "sessionPending", status: SessionStatus.pending },
          inactiveSession1,
          inactiveSession2,
        ]),
      },
      inquirer: {
        prompt: jest.fn(() => ({ selectedSession: { name: "sessionInactive1", value: "InactiveSession" } })),
      },
    };

    const command = getTestCommand(cliProviderService);
    const fakeRoleName = "fake-role";
    command.secondarySessionInfo = jest.fn(() => fakeRoleName);

    const selectedSession = await command.selectSession([inactiveSession1, inactiveSession2]);
    expect(cliProviderService.inquirer.prompt).toHaveBeenCalledWith([
      {
        choices: [
          {
            name: `sessionInactive1 - ${fakeRoleName}`,
            value: { sessionName: "sessionInactive1", status: SessionStatus.inactive },
          },
          {
            name: `sessionInactive2 - ${fakeRoleName}`,
            value: { sessionName: "sessionInactive2", status: SessionStatus.inactive },
          },
        ],
        message: "select a session",
        name: "selectedSession",
        type: "list",
      },
    ]);
    expect(selectedSession).toEqual({ name: "sessionInactive1", value: "InactiveSession" });
    expect(command.secondarySessionInfo).toHaveBeenNthCalledWith(1, inactiveSession1);
    expect(command.secondarySessionInfo).toHaveBeenNthCalledWith(2, inactiveSession1);
  });

  test("selectSession, no session available", async () => {
    const cliProviderService: any = {
      sessionManagementService: {
        getSessions: jest.fn(() => []),
      },
    };

    const command = getTestCommand(cliProviderService);
    await expect(command.selectSession([])).rejects.toThrow(new Error("no sessions available"));
  });

  test("selectSession, one session available", async () => {
    const command = getTestCommand();
    const selectedSession = await command.selectSession([{ sessionId: "sessionIdMock", status: SessionStatus.inactive } as any]);
    expect(selectedSession).toEqual({ sessionId: "sessionIdMock", status: SessionStatus.inactive });
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const cliProviderService = {
      sessionManagementService: {
        getSessions: jest.fn(() => {
          if (errorToThrow) {
            throw errorToThrow;
          } else {
            return ["session"];
          }
        }),
      },
    };
    const command = getTestCommand(cliProviderService);

    command.startSession = jest.fn();

    try {
      await command.run();
      expect(command.startSession).toHaveBeenCalledWith("session");
    } catch (error) {
      expect(error).toEqual(new Error(expectedErrorMessage));
    }
    expect((command as any).cliProviderService.sessionManagementService.getSessions).toHaveBeenCalled();
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

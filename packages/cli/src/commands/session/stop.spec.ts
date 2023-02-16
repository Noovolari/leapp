import { describe, expect, jest, test } from "@jest/globals";
import StopSession from "./stop";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { SessionType } from "@noovolari/leapp-core/models/session-type";

describe("StopSession", () => {
  const getTestCommand = (cliProviderService: any = null, argv = []): StopSession => {
    const command = new StopSession(argv, {} as any);
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

  const sessions: any = [
    { sessionId: "sessionId1", sessionName: "sessionName1", type: "sessionType", roleArn: "mock/sessionRole1", status: SessionStatus.inactive },
    { sessionId: "sessionId2", sessionName: "sessionName1", type: "sessionType", roleArn: "mock/sessionRole2", status: SessionStatus.pending },
    { sessionId: "sessionId3", sessionName: "sessionName2", type: "sessionType", roleArn: "mock/sessionRole1", status: SessionStatus.active },
    { sessionId: "sessionId4", sessionName: "sessionName3", type: "sessionType", roleArn: "mock/sessionRole1", status: SessionStatus.inactive },
    { sessionId: "sessionId5", sessionName: "sessionName3", type: "sessionType", roleArn: "mock/sessionRole1", status: SessionStatus.inactive },
    { sessionId: "sessionId6", sessionName: "sessionName3", type: "sessionType", roleArn: "mock/sessionRole2", status: SessionStatus.inactive },
  ];

  test("Flags - Session Id", async () => {
    const sessionService: any = {
      stop: jest.fn(async () => {}),
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

    let command = getTestCommand(cliProviderService, ["--sessionId"]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("Flag --sessionId expects a value");

    command = getTestCommand(cliProviderService, ["--sessionId", "invalid-session-id"]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("No sessions found");

    command = getTestCommand(cliProviderService, ["--sessionId", "sessionId3"]);
    command.log = jest.fn();
    await command.run();
    expect(sessionFactory.getSessionService).toHaveBeenCalledWith("sessionType");
    expect(sessionService.stop).toHaveBeenCalledWith("sessionId3");
    expect(command.log).toHaveBeenCalledWith("session stopped");
    expect(remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });

  test("stopSession", async () => {
    const sessionService: any = {
      stop: jest.fn(async () => {}),
    };
    const sessionFactory: any = {
      getSessionService: jest.fn(() => sessionService),
    };
    const remoteProceduresClient = { refreshSessions: jest.fn() };

    const cliProviderService: any = {
      sessionFactory,
      remoteProceduresClient,
      sessionManagementService: {
        getSessions: jest.fn(() => sessions),
      },
    };

    const session: any = { sessionId: "sessionId1", type: "sessionType" };
    const command = getTestCommand(cliProviderService);
    command.log = jest.fn();
    await command.stopSession(session);

    expect(sessionFactory.getSessionService).toHaveBeenCalledWith("sessionType");
    expect(sessionService.stop).toHaveBeenCalledWith("sessionId1");
    expect(command.log).toHaveBeenCalledWith("session stopped");
    expect(cliProviderService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });

  test("selectSession, availableSessions length > 1", async () => {
    const cliProviderService: any = {
      inquirer: {
        prompt: jest.fn(() => ({ selectedSession: { name: "sessionName1", value: "ActiveSession" } })),
      },
    };

    const command = getTestCommand(cliProviderService);
    command.secondarySessionInfo = jest.fn(() => "mock-info");
    const selectedSession = await command.selectSession(sessions);
    expect(cliProviderService.inquirer.prompt).toHaveBeenCalledWith([
      {
        choices: [
          { name: "sessionName1 - mock-info", value: sessions[1] },
          { name: "sessionName2 - mock-info", value: sessions[2] },
        ],
        message: "select a session",
        name: "selectedSession",
        type: "list",
      },
    ]);
    expect(selectedSession).toEqual({ name: "sessionName1", value: "ActiveSession" });
  });

  test("selectSession, no session available", async () => {
    const emptySessions = [];
    const cliProviderService: any = {};

    const command = getTestCommand(cliProviderService);
    await expect(command.selectSession(emptySessions)).rejects.toThrow(new Error("no active sessions available"));
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

    command.stopSession = jest.fn();

    try {
      await command.run();
      expect(command.stopSession).toHaveBeenCalledWith("session");
    } catch (error) {
      expect(error).toEqual(new Error(expectedErrorMessage));
    }
    expect((command as any).cliProviderService.sessionManagementService.getSessions).toHaveBeenCalled();
  };

  test("run - all ok", async () => {
    await runCommand(undefined, "");
  });

  test("run - createSession throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - createSession throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });

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

  test.each([
    {
      name: "run - no flags, no args, selectSession called",
      args: [],
      flags: [],
      expected: { selectedSessions: sessions, selectedSession: sessions[1] },
      selectSession: jest.fn(() => sessions[1]),
    },
    {
      name: "run - --noInteractive flag, no args, throws an error",
      args: [],
      flags: ["--noInteractive"],
      expected: { selectedSessions: sessions, selectedSession: undefined },
      selectSession: undefined,
    },
    {
      name: "run - no flags, unique sessionName arg, stops the specified session",
      args: ["sessionName2"],
      flags: [],
      expected: { selectedSessions: sessions, selectedSession: sessions[2] },
      selectSession: undefined,
    },
    {
      name: "run - no flags, ambiguous sessionName arg, selectSession called",
      args: ["sessionName1"],
      flags: [],
      expected: { selectedSessions: sessions.filter((session) => session.sessionName === "sessionName1"), selectedSession: sessions[1] },
      selectSession: jest.fn(() => sessions[1]),
    },
    {
      name: "run - --noInteractive flag, ambiguous sessionName arg, doesn't stop any session",
      args: ["sessionName3"],
      flags: ["--noInteractive"],
      expected: { selectedSessions: [sessions[4], sessions[5]], selectedSession: undefined },
      selectSession: undefined,
    },
    {
      name: "run - no flags, non-existent sessionName arg, command.error called",
      args: ["sessionName5"],
      flags: [],
      expected: { selectedSessions: sessions, selectedSession: undefined },
      selectSession: undefined,
    },
    {
      name: "run - no flags, non-existent second argument, command.error called",
      args: ["sessionName3 sessionRole3"],
      flags: [],
      expected: { selectedSessions: sessions, selectedSession: undefined },
      selectSession: undefined,
    },
    {
      name: "run - existent sessionId flag, no args, stops specified session",
      args: [],
      flags: ["--sessionId", "sessionId2"],
      expected: { selectedSessions: sessions, selectedSession: sessions[1] },
      selectSession: undefined,
    },
    {
      name: "run - sessionId flag, existent and coherent sessionName arg, stops specified session",
      args: ["sessionName1"],
      flags: ["--sessionId", "sessionId2"],
      expected: { selectedSessions: undefined, selectedSession: sessions[1] },
      selectSession: undefined,
    },
    {
      name: "run - non-existent sessionId flag, no args, command.error called",
      args: [],
      flags: ["--sessionId", "sessionId9"],
      expected: { selectedSessions: undefined, selectedSession: undefined },
      selectSession: undefined,
    },
    {
      name: "run - sessionRole flag, no args, selectSession called",
      args: [],
      flags: ["--sessionRole", "sessionRole2"],
      expected: { selectedSessions: [sessions[1], sessions[5]], selectedSession: sessions[1] },
      selectSession: jest.fn(() => sessions[1]),
    },
    {
      name: "run - sessionRole flag, argument, selectSession not called",
      args: ["sessionName1"],
      flags: ["--sessionRole", "sessionRole2"],
      expected: { selectedSessions: sessions[1], selectedSession: sessions[1] },
      selectSession: undefined,
    },
    {
      name: "run - sessionRole flag, session role not found",
      args: [],
      flags: ["--sessionRole", "sessionRole9"],
      expected: { selectedSessions: undefined, selectedSession: undefined },
      selectSession: undefined,
    },
  ])("$name", async ({ args, flags, expected, selectSession }) => {
    const cliProviderService: any = {
      sessionManagementService: {
        getSessions: jest.fn(() => sessions),
      },
    };
    const command = getTestCommand(cliProviderService, [...args, ...flags]);
    if (selectSession) {
      command.selectSession = selectSession;
    }
    command.stopSession = jest.fn();
    (command as any).error = jest.fn();

    await command.run();

    if (selectSession) {
      expect(selectSession).toHaveBeenCalledWith(expected.selectedSessions);
    }
    if (expected.selectedSession) {
      expect(command.stopSession).toHaveBeenCalledWith(expected.selectedSession);
    } else {
      expect(command.error).toHaveBeenCalledWith("No sessions found");
    }
  });
});

import { jest, describe, test, expect } from "@jest/globals";
import { AwsIamUserService } from "@hesketh-racing/leapp-core/services/session/aws/aws-iam-user-service";
import ChangeSessionProfile from "./change-profile";

describe("ChangeProfile", () => {
  const getTestCommand = (cliProviderService: any = null, argv = []): ChangeSessionProfile => {
    const command = new ChangeSessionProfile(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("Flags - sessionId && profileId", async () => {
    const sessions = [
      {
        sessionId: "Session1",
        profileId: "profile1",
      },
      {
        sessionId: "Session2",
        profileId: "profile2",
      },
    ];
    const profiles = [
      {
        id: "profile1",
        name: "myProfile1",
      },
      {
        id: "profile2",
        name: "myProfile2",
      },
      {
        id: "profile3",
        name: "myProfile3",
      },
    ];

    const cliProviderService: any = {
      namedProfilesService: {
        changeNamedProfile: jest.fn(),
        getNamedProfiles: jest.fn(() => profiles),
      },
      remoteProceduresClient: { refreshSessions: jest.fn() },
      sessionManagementService: {
        getSessions: jest.fn(() => sessions),
        getSessionById: jest.fn((id: string) => sessions.find((s) => s.sessionId === id)),
      },
    };

    let command = getTestCommand(cliProviderService, ["--profileId"]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("Flag --profileId expects a value");

    command = getTestCommand(cliProviderService, ["--profileId", "", "--sessionId"]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("Flag --sessionId expects a value");

    command = getTestCommand(cliProviderService, ["--profileId", "profileXX", "--sessionId", "Session1"]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("Profile not found with id profileXX");

    command = getTestCommand(cliProviderService, ["--profileId", "profile3", "--sessionId", "sessionXX"]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("Session not found with id sessionXX");

    command = getTestCommand(cliProviderService, ["--profileId", "profile3", "--sessionId", "Session1"]);
    command.log = jest.fn();
    await command.run();

    expect(cliProviderService.namedProfilesService.changeNamedProfile).toHaveBeenCalledWith(sessions[0], profiles[2].id);
    expect(command.log).toHaveBeenCalledWith("session profile changed");
    expect(cliProviderService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });

  test("selectSession", async () => {
    const session1 = { sessionName: "sessionName" };
    const cliProviderService: any = {
      sessionManagementService: {
        getSessions: () => [session1],
      },
      sessionFactory: {
        getSessionService: () => new AwsIamUserService(null, null, null, null, null, null, null),
      },
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toEqual([
            {
              name: "selectedSession",
              message: "select a session",
              type: "list",
              choices: [{ name: session1.sessionName, value: session1 }],
            },
          ]);
          return { selectedSession: "selectedSession" };
        },
      },
    };

    const command = getTestCommand(cliProviderService);
    const selectedSession = await command.selectSession();
    expect(selectedSession).toBe("selectedSession");
  });

  test("selectProfile", async () => {
    const profileFieldChoice = { name: "profileName1", id: "profileId1" };
    const cliProviderService: any = {
      namedProfilesService: {
        getNamedProfiles: jest.fn(() => [profileFieldChoice]),
        getProfileName: jest.fn(() => "profileName1"),
      },
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toEqual([
            {
              name: "selectedProfile",
              message: "current profile is profileName1, select a new profile",
              type: "list",
              choices: [{ name: profileFieldChoice.name, value: profileFieldChoice.id }],
            },
          ]);
          return { selectedProfile: "selectedProfile" };
        },
      },
    };

    const command = getTestCommand(cliProviderService);

    const session = { type: "type", profileId: "profileId2" } as any;
    const selectedProfile = await command.selectProfile(session);

    expect(selectedProfile).toBe("selectedProfile");
    expect(cliProviderService.namedProfilesService.getNamedProfiles).toHaveBeenCalled();
    expect(cliProviderService.namedProfilesService.getProfileName).toHaveBeenCalledWith(session.profileId);
  });

  test("selectProfile - error: no profile available", async () => {
    const cliProviderService: any = {
      namedProfilesService: {
        getNamedProfiles: jest.fn(() => []),
        getProfileName: jest.fn(() => "profileName1"),
      },
    };

    const command = getTestCommand(cliProviderService);

    const session = { type: "type", profileId: "profileId2" } as any;

    await expect(command.selectProfile(session)).rejects.toThrow(new Error("no profiles available"));
    expect(cliProviderService.namedProfilesService.getNamedProfiles).toHaveBeenCalled();
    expect(cliProviderService.namedProfilesService.getProfileName).toHaveBeenCalledWith(session.profileId);
  });

  test("changeSessionProfile", async () => {
    const session = {} as any;
    const newProfile = {} as any;

    const cliProviderService: any = {
      namedProfilesService: {
        changeNamedProfile: jest.fn(),
      },
      remoteProceduresClient: { refreshSessions: jest.fn() },
    };

    const command = getTestCommand(cliProviderService);
    command.log = jest.fn();

    await command.changeSessionProfile(session, newProfile);
    expect(cliProviderService.namedProfilesService.changeNamedProfile).toHaveBeenCalledWith(session, newProfile);
    expect(command.log).toHaveBeenCalledWith("session profile changed");
    expect(cliProviderService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const session = "session";
    const region = "region";
    const command = getTestCommand();
    command.selectSession = jest.fn(async (): Promise<any> => session);
    command.selectProfile = jest.fn(async (): Promise<any> => region);
    command.changeSessionProfile = jest.fn(async (): Promise<void> => {
      if (errorToThrow) {
        throw errorToThrow;
      }
    });

    let occurredError;
    try {
      await command.run();
    } catch (error) {
      occurredError = error;
    }

    expect(command.selectSession).toHaveBeenCalled();
    expect(command.selectProfile).toHaveBeenCalledWith(session);
    expect(command.changeSessionProfile).toHaveBeenCalledWith(session, region);
    if (errorToThrow) {
      expect(occurredError).toEqual(new Error(expectedErrorMessage));
    }
  };

  test("run", async () => {
    await runCommand(undefined, "");
  });

  test("run - changeSessionRegion throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - changeSessionRegion throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });
});

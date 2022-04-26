import { jest, describe, test, expect } from "@jest/globals";
import ChangeSessionRegion from "./change-region";
import { CliProviderService } from "../../service/cli-provider-service";

describe("ChangeRegion", () => {
  const getTestCommand = (cliProviderService: any = null, argv = []): ChangeSessionRegion => {
    const command = new ChangeSessionRegion(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("Flags - sessionId && region", async () => {
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
      },
      remoteProceduresClient: { refreshSessions: jest.fn() },
      repository: {
        getSessions: jest.fn(() => sessions),
        getSessionById: jest.fn((id: string) => sessions.find((s) => s.sessionId === id)),
        getProfiles: jest.fn(() => profiles),
      },
      awsCoreService: new CliProviderService().awsCoreService,
    };

    let command = getTestCommand(cliProviderService, ["--region"]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("Flag --region expects a value");

    command = getTestCommand(cliProviderService, ["--region", "", "--sessionId"]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("Flag --sessionId expects a value");

    command = getTestCommand(cliProviderService, ["--region", "profileXX", "--sessionId", "Session1"]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("Region not found with name profileXX");

    command = getTestCommand(cliProviderService, ["--region", "eu-west-1", "--sessionId", "sessionXX"]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("Session not found with id sessionXX");

    command = getTestCommand(cliProviderService, ["--region", "eu-west-1", "--sessionId", "Session1"]);
    command.log = jest.fn();
    command.changeSessionRegion = jest.fn();
    await command.run();

    expect(command.changeSessionRegion).toHaveBeenCalledWith(sessions[0], "eu-west-1");
  });

  test("selectSession", async () => {
    const session1 = { sessionName: "sessionName" };
    const cliProviderService: any = {
      repository: {
        getSessions: () => [session1],
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

  test("selectRegion", async () => {
    const regionFieldChoice = { fieldName: "regionName2", fieldValue: "regionName3" };
    const cliProviderService: any = {
      cloudProviderService: {
        availableRegions: jest.fn(() => [regionFieldChoice]),
      },
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toEqual([
            {
              name: "selectedRegion",
              message: "current region is regionName1, select a new region",
              type: "list",
              choices: [{ name: regionFieldChoice.fieldName, value: regionFieldChoice.fieldValue }],
            },
          ]);
          return { selectedRegion: "selectedRegion" };
        },
      },
    };

    const command = getTestCommand(cliProviderService);

    const session = { type: "type", region: "regionName1" } as any;
    const selectedRegion = await command.selectRegion(session);

    expect(selectedRegion).toBe("selectedRegion");
    expect(cliProviderService.cloudProviderService.availableRegions).toHaveBeenCalledWith(session.type);
  });

  test("changeSessionRegion", async () => {
    const session = {} as any;
    const newRegion = {} as any;

    const cliProviderService: any = {
      regionsService: {
        changeRegion: jest.fn(),
      },
      remoteProceduresClient: { refreshSessions: jest.fn() },
    };

    const command = getTestCommand(cliProviderService);
    command.log = jest.fn();

    await command.changeSessionRegion(session, newRegion);
    expect(cliProviderService.regionsService.changeRegion).toHaveBeenCalledWith(session, newRegion);
    expect(command.log).toHaveBeenCalledWith("session region changed");
    expect(cliProviderService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const session = "session";
    const region = "region";
    const command = getTestCommand();
    command.selectSession = jest.fn(async (): Promise<any> => session);
    command.selectRegion = jest.fn(async (): Promise<any> => region);
    command.changeSessionRegion = jest.fn(async (): Promise<void> => {
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
    expect(command.selectRegion).toHaveBeenCalledWith(session);
    expect(command.changeSessionRegion).toHaveBeenCalledWith(session, region);
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

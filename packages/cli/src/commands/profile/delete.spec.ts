import { jest, describe, test, expect } from "@jest/globals";
import DeleteNamedProfile from "./delete";

describe("DeleteNamedProfile", () => {
  const getTestCommand = (cliProviderService: any = null, argv: string[] = []): DeleteNamedProfile => {
    const command = new DeleteNamedProfile(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("Flags - profileId & force", async () => {
    const cliProviderService: any = {
      namedProfilesService: {
        deleteNamedProfile: jest.fn(),
        getSessionsWithNamedProfile: jest.fn(() => []),
        getProfileName: jest.fn(() => true),
      },
      remoteProceduresClient: { refreshSessions: jest.fn() },
    };

    let command = getTestCommand(cliProviderService, ["--profileId"]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("Flag --profileId expects a value");

    const mockedProfile = "mockedProfile";
    command = getTestCommand(cliProviderService, ["--profileId", mockedProfile]);
    command.log = jest.fn();
    command.askForConfirmation = jest.fn(() => Promise.resolve(true));
    await command.run();

    expect(command.askForConfirmation).toHaveBeenCalled();
    expect(cliProviderService.namedProfilesService.deleteNamedProfile).toHaveBeenCalledWith(mockedProfile);
    expect(command.log).toHaveBeenCalledWith("profile deleted");
    expect(cliProviderService.namedProfilesService.getProfileName).toHaveBeenCalledWith(mockedProfile);
    expect(cliProviderService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();

    command = getTestCommand(cliProviderService, ["--profileId", mockedProfile, "--force"]);
    command.log = jest.fn();
    command.askForConfirmation = jest.fn(() => Promise.resolve(true));
    await command.run();

    expect(command.askForConfirmation).not.toHaveBeenCalled();
    expect(cliProviderService.namedProfilesService.deleteNamedProfile).toHaveBeenCalledWith(mockedProfile);
    expect(command.log).toHaveBeenCalledWith("profile deleted");
    expect(cliProviderService.namedProfilesService.getProfileName).toHaveBeenCalledWith(mockedProfile);
    expect(cliProviderService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });

  test("selectNamedProfile", async () => {
    const namedProfile = { name: "profileName" };
    const cliProviderService: any = {
      namedProfilesService: {
        getNamedProfiles: jest.fn(() => [namedProfile]),
      },
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toEqual([
            {
              name: "selectedNamedProfile",
              message: `select a profile to delete`,
              type: "list",
              choices: [{ name: namedProfile.name, value: namedProfile }],
            },
          ]);
          return { selectedNamedProfile: namedProfile };
        },
      },
    };

    const command = getTestCommand(cliProviderService);
    const selectedProfile = await command.selectNamedProfile();

    expect(cliProviderService.namedProfilesService.getNamedProfiles).toHaveBeenCalledWith(true);
    expect(selectedProfile).toBe(namedProfile);
  });

  test("selectNamedProfile, no named profiles", async () => {
    const cliProviderService: any = {
      namedProfilesService: {
        getNamedProfiles: jest.fn(() => []),
      },
    };
    const command = getTestCommand(cliProviderService);

    await expect(command.selectNamedProfile()).rejects.toThrow(new Error("no profiles available"));
  });

  test("getAffectedSessions", async () => {
    const cliProviderService: any = {
      namedProfilesService: {
        getSessionsWithNamedProfile: jest.fn(() => "sessions"),
      },
    };
    const command = getTestCommand(cliProviderService);

    const sessions = command.getAffectedSessions("profileId");
    expect(sessions).toBe("sessions");
    expect(cliProviderService.namedProfilesService.getSessionsWithNamedProfile).toHaveBeenCalledWith("profileId");
  });

  test("askForConfirmation", async () => {
    const cliProviderService: any = {
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toEqual([
            {
              name: "confirmation",
              message: "Deleting this profile will set default to these sessions\n" + "- sess1\n" + "- sess2\n" + "Do you want to continue?",
              type: "confirm",
            },
          ]);
          return { confirmation: true };
        },
      },
    };
    const command = getTestCommand(cliProviderService);

    const affectedSessions = [{ sessionName: "sess1" }, { sessionName: "sess2" }] as any;
    const confirmation = await command.askForConfirmation(affectedSessions);

    expect(confirmation).toBe(true);
  });

  test("askForConfirmation, no affected sessions", async () => {
    const command = getTestCommand();

    const confirmation = await command.askForConfirmation([]);
    expect(confirmation).toBe(true);
  });

  test("deleteNamedProfile", async () => {
    const cliProviderService: any = {
      namedProfilesService: {
        deleteNamedProfile: jest.fn(),
        getProfileName: jest.fn(() => true),
      },
      remoteProceduresClient: { refreshSessions: jest.fn() },
    };

    const profileId = "profileId";
    const command = getTestCommand(cliProviderService);
    command.log = jest.fn();
    await command.deleteNamedProfile(profileId);

    expect(cliProviderService.namedProfilesService.deleteNamedProfile).toHaveBeenCalledWith(profileId);
    expect(command.log).toHaveBeenCalledWith("profile deleted");
    expect(cliProviderService.namedProfilesService.getProfileName).toHaveBeenCalledWith(profileId);
    expect(cliProviderService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const namedProfile = { id: "1" };
    const affectedSessions = [{ sessionId: "2" }] as any;

    const command = getTestCommand();
    command.selectNamedProfile = jest.fn(async (): Promise<any> => namedProfile);
    command.getAffectedSessions = jest.fn(() => affectedSessions);
    command.askForConfirmation = jest.fn(async (): Promise<any> => true);
    command.deleteNamedProfile = jest.fn(async () => {
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

    expect(command.selectNamedProfile).toHaveBeenCalled();
    expect(command.getAffectedSessions).toHaveBeenCalledWith(namedProfile.id);
    expect(command.askForConfirmation).toHaveBeenCalledWith(affectedSessions);
    expect(command.deleteNamedProfile).toHaveBeenCalledWith(namedProfile.id);
    if (errorToThrow) {
      expect(occurredError).toEqual(new Error(expectedErrorMessage));
    }
  };

  test("run", async () => {
    await runCommand(undefined, "");
  });

  test("run - deleteNamedProfile throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - deleteNamedProfile throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });
});

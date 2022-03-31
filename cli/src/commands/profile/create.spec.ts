import { jest, describe, test, expect } from "@jest/globals";
import CreateNamedProfile from "./create";

describe("CreateNamedProfile", () => {
  const getTestCommand = (cliProviderService: any = null, argv: string[] = []): CreateNamedProfile => {
    const command = new CreateNamedProfile(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("getProfileName", async () => {
    const cliProviderService: any = {
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toMatchObject([
            {
              name: "namedProfileName",
              message: `choose a name for the profile`,
              type: "input",
            },
          ]);
          expect(params[0].validate("profileName")).toBe("validationResult");
          return { namedProfileName: "profileName" };
        },
      },
      namedProfilesService: {
        validateNewProfileName: jest.fn(() => "validationResult"),
      },
    };

    const command = getTestCommand(cliProviderService);
    const profileName = await command.getProfileName();
    expect(profileName).toBe("profileName");
    expect(cliProviderService.namedProfilesService.validateNewProfileName).toHaveBeenCalledWith("profileName");
  });

  test("createNamedProfile", async () => {
    const cliProviderService: any = {
      namedProfilesService: {
        createNamedProfile: jest.fn(),
      },
      remoteProceduresClient: { refreshSessions: jest.fn() },
    };

    const command = getTestCommand(cliProviderService);
    command.log = jest.fn();
    await command.createNamedProfile("profileName");

    expect(cliProviderService.namedProfilesService.createNamedProfile).toHaveBeenCalledWith("profileName");
    expect(command.log).toHaveBeenCalledWith("profile created");
    expect(cliProviderService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const profileName = "profile1";
    const command = getTestCommand();
    command.getProfileName = jest.fn(async (): Promise<any> => profileName);
    command.createNamedProfile = jest.fn(async () => {
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

    expect(command.getProfileName).toHaveBeenCalled();
    expect(command.createNamedProfile).toHaveBeenCalledWith(profileName);
    if (errorToThrow) {
      expect(occurredError).toEqual(new Error(expectedErrorMessage));
    }
  };

  test("run", async () => {
    await runCommand(undefined, "");
  });

  test("run - createNamedProfile throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - createNamedProfile throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });
});

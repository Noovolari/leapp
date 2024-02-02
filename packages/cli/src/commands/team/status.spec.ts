import { describe, expect, jest, test } from "@jest/globals";
import TeamStatus from "./status";

describe("Workspace", () => {
  const getTestCommand = (cliProviderService: any = null, argv = []): TeamStatus => {
    const command = new TeamStatus(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("run, without errors", async () => {
    const cliProviderService: any = {
      teamService: {
        getTeamStatus: jest.fn(() => "mocked-team-status"),
        getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
      },
    };
    const command = getTestCommand(cliProviderService, []);

    (command as any).log = jest.fn();
    await command.run();
    expect(cliProviderService.teamService.getTeamStatus).toHaveBeenCalled();
    expect((command as any).log).toHaveBeenCalledWith("mocked-team-status");
  });

  test("run, error", async () => {
    const mockedError = "mocked-error";
    const cliProviderService: any = {
      teamService: {
        getTeamStatus: jest.fn(() => {
          throw mockedError;
        }),
        getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
      },
    };
    const command = getTestCommand(cliProviderService, []);

    (command as any).error = jest.fn();
    await command.run();
    expect(cliProviderService.teamService.getTeamStatus).toHaveBeenCalled();
    expect((command as any).error).toHaveBeenCalledWith(`Unknown error: ${mockedError}`);
  });
});

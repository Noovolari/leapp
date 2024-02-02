import { describe, expect, jest, test } from "@jest/globals";
import TeamLogout from "./logout";

describe("TeamLogout", () => {
  const getTestCommand = (cliProviderService: any = null, argv = []): TeamLogout => {
    const command = new TeamLogout(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  describe("TeamLogin.logout", () => {
    test("without errors", async () => {
      const cliProviderService: any = {
        teamService: {
          signOut: jest.fn(),
          getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
        },
        remoteProceduresClient: {
          refreshWorkspaceState: jest.fn(),
        },
      };
      const command = getTestCommand(cliProviderService, []);
      (command as any).log = jest.fn();
      await command.run();
      expect(cliProviderService.teamService.signOut).toHaveBeenCalledTimes(1);
      expect(cliProviderService.remoteProceduresClient.refreshWorkspaceState).toHaveBeenCalled();
      expect((command as any).log).toHaveBeenCalledWith("logout successful");
    });

    test("if this.teamService.signOut throws an error", async () => {
      const mockedErrorMessage = "mocked-error";
      const mockedError = new Error(mockedErrorMessage);
      const cliProviderService: any = {
        teamService: {
          signOut: jest.fn(() => {
            throw mockedError;
          }),
          getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
        },
      };
      const command = getTestCommand(cliProviderService, []);
      (command as any).error = jest.fn();
      await command.run();
      expect(cliProviderService.teamService.signOut).toHaveBeenCalledTimes(1);
      expect((command as any).error).toHaveBeenCalledTimes(1);
      expect((command as any).error).toHaveBeenCalledWith(mockedErrorMessage);
    });

    test("if this.teamService.signOut throws something that isn't an error", async () => {
      const mockedError = "mocked-error";
      const cliProviderService: any = {
        teamService: {
          signOut: jest.fn(() => {
            throw mockedError;
          }),
          getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
        },
      };
      const command = getTestCommand(cliProviderService, []);
      (command as any).error = jest.fn();
      await command.run();
      expect(cliProviderService.teamService.signOut).toHaveBeenCalledTimes(1);
      expect((command as any).error).toHaveBeenCalledTimes(1);
      expect((command as any).error).toHaveBeenCalledWith(`Unknown error: ${mockedError}`);
    });

    test("run - all ok", async () => {
      const command = getTestCommand(null, []);
      command.logout = jest.fn();
      await command.run();
      expect(command.logout).toHaveBeenCalled();
    });

    test("run - login throws an error", async () => {
      const command = getTestCommand(null, []);
      command.logout = jest.fn(() => {
        throw new Error("mocked-error");
      });
      (command as any).error = jest.fn();
      await command.run();
      expect(command.error).toHaveBeenCalledWith("mocked-error");
    });

    test("run - logout throws something that isn't an error", async () => {
      const mockedError = "mocked-error";
      const command = getTestCommand(null, []);
      command.logout = jest.fn(() => {
        throw mockedError;
      });
      (command as any).error = jest.fn();
      await command.run();
      expect(command.error).toHaveBeenCalledWith(`Unknown error: ${mockedError}`);
    });
  });
});

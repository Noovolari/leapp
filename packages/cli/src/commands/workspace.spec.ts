import { describe, expect, jest, test } from "@jest/globals";
import { constants } from "@noovolari/leapp-core/models/constants";
import Workspace from "./workspace";

describe("Workspace", () => {
  const getTestCommand = (cliProviderService: any = null, argv = []): Workspace => {
    const command = new Workspace(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  describe("Workspace.current", () => {
    test("without errors, local workspace", async () => {
      const mockedWorkspaceState = [{ id: constants.localWorkspaceKeychainValue, selected: true }];
      const cliProviderService: any = {
        teamService: {
          workspacesState: {
            getValue: jest.fn(() => mockedWorkspaceState),
          },
          getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
        },
      };
      const command = getTestCommand(cliProviderService, []);

      (command as any).log = jest.fn();
      await command.run();
      expect(cliProviderService.teamService.workspacesState.getValue).toHaveBeenCalled();
      expect((command as any).log).toHaveBeenCalledWith("local");
    });

    test("without errors, remote workspace", async () => {
      const mockedWorkspaceState = [{ name: "mocked-workspace-name", selected: true }];
      const cliProviderService: any = {
        teamService: {
          workspacesState: {
            getValue: jest.fn(() => mockedWorkspaceState),
          },
          getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
        },
      };
      const command = getTestCommand(cliProviderService, []);

      (command as any).log = jest.fn();
      await command.run();
      expect(cliProviderService.teamService.workspacesState.getValue).toHaveBeenCalled();
      expect((command as any).log).toHaveBeenCalledWith("mocked-workspace-name");
    });

    test("error", async () => {
      const mockedError = "mocked-error";
      const cliProviderService: any = {
        teamService: {
          workspacesState: {
            getValue: jest.fn(() => {
              throw mockedError;
            }),
            getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
          },
        },
      };
      const command = getTestCommand(cliProviderService, []);

      (command as any).error = jest.fn();
      await command.run();
      expect(cliProviderService.teamService.workspacesState.getValue).toHaveBeenCalled();
      expect((command as any).error).toHaveBeenCalledWith(`Unknown error: ${mockedError}`);
    });
  });
});

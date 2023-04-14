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
      const mockedWorkspace = constants.localWorkspaceName;
      const cliProviderService: any = {
        teamService: {
          workspaceNameState: {
            getValue: jest.fn(() => mockedWorkspace),
          },
        },
      };
      const command = getTestCommand(cliProviderService, []);

      (command as any).log = jest.fn();
      await command.run();
      expect(cliProviderService.teamService.workspaceNameState.getValue).toHaveBeenCalled();
      expect((command as any).log).toHaveBeenCalledWith("local");
    });

    test("without errors, remote workspace", async () => {
      const mockedWorkspace = "mocked-workspace-name";
      const cliProviderService: any = {
        teamService: {
          workspaceNameState: {
            getValue: jest.fn(() => mockedWorkspace),
          },
        },
      };
      const command = getTestCommand(cliProviderService, []);

      (command as any).log = jest.fn();
      await command.run();
      expect(cliProviderService.teamService.workspaceNameState.getValue).toHaveBeenCalled();
      expect((command as any).log).toHaveBeenCalledWith("mocked-workspace-name");
    });

    test("error", async () => {
      const mockedError = "mocked-error";
      const cliProviderService: any = {
        teamService: {
          workspaceNameState: {
            getValue: jest.fn(() => {
              throw mockedError;
            }),
          },
        },
      };
      const command = getTestCommand(cliProviderService, []);

      (command as any).error = jest.fn();
      await command.run();
      expect(cliProviderService.teamService.workspaceNameState.getValue).toHaveBeenCalled();
      expect((command as any).error).toHaveBeenCalledWith(`Unknown error: ${mockedError}`);
    });
  });
});

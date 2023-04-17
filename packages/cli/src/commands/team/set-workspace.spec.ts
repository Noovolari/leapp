import { describe, expect, jest, test } from "@jest/globals";
import SetWorkspace from "./set-workspace";
import { constants } from "@noovolari/leapp-core/models/constants";

describe("SetWorkspace", () => {
  const getTestCommand = (cliProviderService: any = null, argv = []): any => {
    const command = new SetWorkspace(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("run in interactive mode", async () => {
    const args = {};
    const workspaceId = "mock-workspace-id";
    const command = getTestCommand(null, []);
    command.parse = jest.fn(() => ({ args }));
    command.getWorkspaceIdInteractively = jest.fn(() => workspaceId);
    command.setWorkspace = jest.fn();
    await command.run();
    expect(command.parse).toHaveBeenCalled();
    expect(command.getWorkspaceIdInteractively).toHaveBeenCalled();
    expect(command.setWorkspace).toHaveBeenCalledWith(workspaceId);
  });

  test("run with argument", async () => {
    const workspaceId = "mock-workspace-id";
    const workspaceName = "mock-workspace-name";
    const args = { workspaceName };
    const command = getTestCommand(null, []);
    command.parse = () => ({ args });
    command.setWorkspace = jest.fn(() => {});
    command.getWorkspaceIdByName = jest.fn(() => workspaceId);
    await command.run();
    expect(command.getWorkspaceIdByName).toHaveBeenCalledWith(workspaceName);
    expect(command.setWorkspace).toHaveBeenCalledWith(workspaceId);
  });

  test("run - throws an error", async () => {
    const command = getTestCommand(null, []);
    command.parse = jest.fn(() => {
      throw new Error("mocked-error");
    });
    (command as any).error = jest.fn();
    await command.run();
    expect(command.error).toHaveBeenCalledWith("mocked-error");
  });

  test("run - throws something that isn't an error", async () => {
    const mockedError = "mocked-error";
    const command = getTestCommand(null, []);
    command.parse = jest.fn(() => {
      throw mockedError;
    });
    (command as any).error = jest.fn();
    await command.run();
    expect(command.error).toHaveBeenCalledWith(`Unknown error: ${mockedError}`);
  });

  test("getWorkspaceIdByName - local workspace", async () => {
    const command = getTestCommand(null, []);
    command.cliProviderService = {
      teamService: {
        signedInUserState: {
          getValue: jest.fn(),
        },
      },
    };
    const result = await command.getWorkspaceIdByName("local");
    expect(result).toBe(constants.localWorkspaceKeychainValue);
  });

  test("getWorkspaceIdByName - remote workspace exists", async () => {
    const signedInUser = { teamName: "mocked-team-name", teamId: "mocked-id" };
    const command = getTestCommand(null, []);
    command.cliProviderService = {
      teamService: {
        signedInUserState: {
          getValue: jest.fn(() => signedInUser),
        },
      },
    };
    const result = await command.getWorkspaceIdByName("mocked-team-name");
    expect(command.cliProviderService.teamService.signedInUserState.getValue).toHaveBeenCalled();
    expect(result).toBe("mocked-id");
  });

  test("getWorkspaceIdByName - remote workspace does not exists", async () => {
    const signedInUser = { teamName: "mocked-team-name", teamId: "mocked-id" };
    const command = getTestCommand(null, []);
    command.cliProviderService = {
      teamService: {
        signedInUserState: {
          getValue: () => signedInUser,
        },
      },
    };
    await expect(command.getWorkspaceIdByName("wrong-mocked-team-name")).rejects.toThrow("the selected workspace does not exist");
  });

  test("getWorkspaceIdByName - user is not signed in", async () => {
    const signedInUser = {};
    const command = getTestCommand(null, []);
    command.cliProviderService = {
      teamService: {
        signedInUserState: {
          getValue: () => signedInUser,
        },
      },
    };
    await expect(command.getWorkspaceIdByName("mocked-team-name")).rejects.toThrow("the selected workspace does not exist");
  });

  test("getWorkspaceIdInteractively - user is signed in", async () => {
    const questions = [
      {
        name: "selectedWorkspaceId",
        message: "select a workspace",
        type: "list",
        choices: [
          {
            name: constants.localWorkspaceName,
            value: constants.localWorkspaceKeychainValue,
          },
          {
            name: "mocked-team-name",
            value: "mocked-id",
          },
        ],
      },
    ];
    const signedInUser = { teamName: "mocked-team-name", teamId: "mocked-id" };
    const selectedWorkspaceId = "mocked-id";
    const command = getTestCommand(null, []);
    command.cliProviderService = {
      teamService: {
        signedInUserState: {
          getValue: jest.fn(() => signedInUser),
        },
      },
      inquirer: {
        prompt: jest.fn(async () => ({ selectedWorkspaceId })),
      },
    };
    const result = await command.getWorkspaceIdInteractively();
    expect(command.cliProviderService.teamService.signedInUserState.getValue).toHaveBeenCalled();
    expect(command.cliProviderService.inquirer.prompt).toHaveBeenCalledWith(questions);
    expect(result).toBe(selectedWorkspaceId);
  });

  test("getWorkspaceIdInteractively - user is not signed in", async () => {
    const questions = [
      {
        name: "selectedWorkspaceId",
        message: "select a workspace",
        type: "list",
        choices: [
          {
            name: constants.localWorkspaceName,
            value: constants.localWorkspaceKeychainValue,
          },
        ],
      },
    ];
    const signedInUser = undefined;
    const selectedWorkspaceId = constants.localWorkspaceKeychainValue;
    const command = getTestCommand(null, []);
    command.cliProviderService = {
      teamService: {
        signedInUserState: {
          getValue: jest.fn(() => signedInUser),
        },
      },
      inquirer: {
        prompt: jest.fn(async () => ({ selectedWorkspaceId })),
      },
    };
    const result = await command.getWorkspaceIdInteractively();
    expect(command.cliProviderService.teamService.signedInUserState.getValue).toHaveBeenCalled();
    expect(command.cliProviderService.inquirer.prompt).toHaveBeenCalledWith(questions);
    expect(result).toBe(selectedWorkspaceId);
  });

  test("setWorkspace - local", async () => {
    const command = getTestCommand(null, []);
    command.cliProviderService = {
      teamService: {
        switchToLocalWorkspace: jest.fn(),
      },
      remoteProceduresClient: {
        refreshWorkspaceState: jest.fn(),
      },
    };
    command.log = jest.fn();
    await command.setWorkspace(constants.localWorkspaceKeychainValue);
    expect(command.cliProviderService.teamService.switchToLocalWorkspace).toHaveBeenCalled();
    expect(command.log).toHaveBeenCalledWith("workspace set correctly");
    expect(command.cliProviderService.remoteProceduresClient.refreshWorkspaceState).toHaveBeenCalled();
  });

  test("setWorkspace - remote", async () => {
    const command = getTestCommand(null, []);
    command.cliProviderService = {
      teamService: {
        syncSecrets: jest.fn(),
      },
      remoteProceduresClient: {
        refreshWorkspaceState: jest.fn(),
      },
    };
    command.log = jest.fn();
    await command.setWorkspace("mocked-workspace-id");
    expect(command.cliProviderService.teamService.syncSecrets).toHaveBeenCalled();
    expect(command.log).toHaveBeenCalledWith("workspace set correctly");
    expect(command.cliProviderService.remoteProceduresClient.refreshWorkspaceState).toHaveBeenCalled();
  });
});

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
    const workspaceInfo = { workspaceId: "mock-workspace-id", workspaceName: "mock-name" };
    const command = getTestCommand(null, []);
    command.parse = jest.fn(() => ({ args }));
    command.getWorkspaceInteractively = jest.fn(() => workspaceInfo);
    command.setWorkspace = jest.fn();
    await command.run();
    expect(command.parse).toHaveBeenCalled();
    expect(command.getWorkspaceInteractively).toHaveBeenCalled();
    expect(command.setWorkspace).toHaveBeenCalledWith(workspaceInfo);
  });

  test("run with argument", async () => {
    const workspaceInfo = { workspaceId: "mock-workspace-id", workspaceName: "mock-name" };
    const args = { workspaceName: workspaceInfo.workspaceName };
    const command = getTestCommand(null, []);
    command.parse = () => ({ args });
    command.setWorkspace = jest.fn(() => {});
    command.getWorkspaceByName = jest.fn(() => workspaceInfo);
    await command.run();
    expect(command.getWorkspaceByName).toHaveBeenCalledWith(workspaceInfo.workspaceName);
    expect(command.setWorkspace).toHaveBeenCalledWith(workspaceInfo);
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

  test("getWorkspaceByName - local workspace", async () => {
    const command = getTestCommand(null, []);
    command.cliProviderService = {
      teamService: {
        signedInUserState: {
          getValue: jest.fn(),
        },
        getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
      },
    };
    const result = await command.getWorkspaceByName("locAL");
    expect(result).toStrictEqual({ workspaceId: constants.localWorkspaceKeychainValue, workspaceName: constants.localWorkspaceName });
  });

  test("getWorkspaceByName - remote workspace exists", async () => {
    const signedInUser = { teamName: "mocked-TEAM-name", teamId: "mocked-id" };
    const command = getTestCommand(null, []);
    command.cliProviderService = {
      teamService: {
        signedInUserState: {
          getValue: jest.fn(() => signedInUser),
        },
        getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
      },
    };
    const result = await command.getWorkspaceByName("Mocked-Team-Name");
    expect(command.cliProviderService.teamService.signedInUserState.getValue).toHaveBeenCalled();
    expect(result).toStrictEqual({ workspaceId: "mocked-id", workspaceName: "mocked-TEAM-name" });
  });

  test("getWorkspaceByName - remote workspace does not exists", async () => {
    const signedInUser = { teamName: "mocked-team-name", teamId: "mocked-id" };
    const command = getTestCommand(null, []);
    command.cliProviderService = {
      teamService: {
        signedInUserState: {
          getValue: () => signedInUser,
        },
        getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
      },
    };
    await expect(command.getWorkspaceByName("wrong-mocked-team-name")).rejects.toThrow("the selected workspace does not exist");
  });

  test("getWorkspaceByName - user is not signed in", async () => {
    const signedInUser = { teamName: "wrong-team-name" };
    const command = getTestCommand(null, []);
    command.cliProviderService = {
      teamService: {
        signedInUserState: {
          getValue: () => signedInUser,
        },
        getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
      },
    };
    await expect(command.getWorkspaceByName("mocked-team-name")).rejects.toThrow("the selected workspace does not exist");
  });

  test("getWorkspaceInteractively - user is signed in", async () => {
    const questions = [
      {
        name: "selectedWorkspace",
        message: "select a workspace",
        type: "list",
        choices: [
          {
            name: `${constants.localWorkspaceName} (${constants.localWorkspaceKeychainValue})`,
            value: { workspaceId: constants.localWorkspaceKeychainValue, workspaceName: constants.localWorkspaceName },
          },
          {
            name: "mocked-workspace-name",
            value: { workspaceId: "mocked-id", workspaceName: "mocked-workspace-name" },
          },
        ],
      },
    ];
    const signedInUser = { teamName: "mocked-workspace-name", teamId: "mocked-id" };
    const selectedWorkspace = { workspaceId: "mocked-id", workspaceName: "mocked-workspace-name" };
    const command = getTestCommand(null, []);
    command.cliProviderService = {
      teamService: {
        signedInUserState: {
          getValue: jest.fn(() => signedInUser),
        },
        getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
      },
      inquirer: {
        prompt: jest.fn(async () => ({ selectedWorkspace })),
      },
    };
    const result = await command.getWorkspaceInteractively();
    expect(command.cliProviderService.teamService.signedInUserState.getValue).toHaveBeenCalled();
    expect(command.cliProviderService.inquirer.prompt).toHaveBeenCalledWith(questions);
    expect(result).toBe(selectedWorkspace);
  });

  test("getWorkspaceInteractively - user is not signed in", async () => {
    const questions = [
      {
        name: "selectedWorkspace",
        message: "select a workspace",
        type: "list",
        choices: [
          {
            name: `${constants.localWorkspaceName} (${constants.localWorkspaceKeychainValue})`,
            value: { workspaceId: constants.localWorkspaceKeychainValue, workspaceName: constants.localWorkspaceName },
          },
        ],
      },
    ];
    const signedInUser = undefined;
    const selectedWorkspace = { workspaceId: constants.localWorkspaceKeychainValue, workspaceName: constants.localWorkspaceName };
    const command = getTestCommand(null, []);
    command.cliProviderService = {
      teamService: {
        signedInUserState: {
          getValue: jest.fn(() => signedInUser),
        },
        getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
      },
      inquirer: {
        prompt: jest.fn(async () => ({ selectedWorkspace })),
      },
    };
    const result = await command.getWorkspaceInteractively();
    expect(command.cliProviderService.teamService.signedInUserState.getValue).toHaveBeenCalled();
    expect(command.cliProviderService.inquirer.prompt).toHaveBeenCalledWith(questions);
    expect(result).toBe(selectedWorkspace);
  });

  test("setWorkspace - local", async () => {
    const command = getTestCommand(null, []);
    command.cliProviderService = {
      teamService: {
        switchToLocalWorkspace: jest.fn(),
        getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
      },
      remoteProceduresClient: {
        refreshWorkspaceState: jest.fn(),
      },
    };
    command.log = jest.fn();
    await command.setWorkspace({ workspaceId: constants.localWorkspaceKeychainValue, workspaceName: constants.localWorkspaceName });
    expect(command.cliProviderService.teamService.switchToLocalWorkspace).toHaveBeenCalled();
    expect(command.log).toHaveBeenCalledWith(`workspace ${constants.localWorkspaceName} set correctly`);
    expect(command.cliProviderService.remoteProceduresClient.refreshWorkspaceState).toHaveBeenCalled();
  });

  test("setWorkspace - remote", async () => {
    const command = getTestCommand(null, []);
    command.cliProviderService = {
      teamService: {
        pullFromRemote: jest.fn(),
        getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
      },
      remoteProceduresClient: {
        refreshWorkspaceState: jest.fn(),
      },
    };
    command.log = jest.fn();
    await command.setWorkspace({ workspaceId: "mocked-workspace-id", workspaceName: "mocked-workspace-name" });
    expect(command.cliProviderService.teamService.pullFromRemote).toHaveBeenCalledWith(false);
    expect(command.log).toHaveBeenCalledWith(`workspace mocked-workspace-name set correctly`);
    expect(command.cliProviderService.remoteProceduresClient.refreshWorkspaceState).toHaveBeenCalled();
  });
});

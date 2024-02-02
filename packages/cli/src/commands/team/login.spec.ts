import { describe, expect, jest, test } from "@jest/globals";
import TeamLogin from "./login";

describe("TeamLogin", () => {
  const getTestCommand = (cliProviderService: any = null, argv = []): TeamLogin => {
    const command = new TeamLogin(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("insertUserEmail", async () => {
    const expectedPromptPayload = [
      {
        name: "userEmail",
        message: "insert your email",
        type: "input",
      },
    ];
    const expectedAnswer = {
      userEmail: "mocked-user-email",
    };
    const cliProviderService: any = {
      inquirer: {
        prompt: jest.fn(async () => expectedAnswer),
      },
    };
    const command = getTestCommand(cliProviderService, []);
    const answer = await (command as any).insertUserEmail();
    expect(cliProviderService.inquirer.prompt).toBeCalledTimes(1);
    expect(cliProviderService.inquirer.prompt).toHaveBeenCalledWith(expectedPromptPayload);
    expect(answer as any).toEqual(expectedAnswer.userEmail);
  });

  test("insertUserPassword", async () => {
    const expectedPromptPayload = [
      {
        name: "userPassword",
        message: "insert your password",
        type: "password",
      },
    ];
    const expectedAnswer = {
      userPassword: "mocked-user-password",
    };
    const cliProviderService: any = {
      inquirer: {
        prompt: jest.fn(async () => expectedAnswer),
      },
    };
    const command = getTestCommand(cliProviderService, []);
    const answer = await (command as any).insertUserPassword();
    expect(cliProviderService.inquirer.prompt).toBeCalledTimes(1);
    expect(cliProviderService.inquirer.prompt).toHaveBeenCalledWith(expectedPromptPayload);
    expect(answer as any).toEqual(expectedAnswer.userPassword);
  });

  describe("TeamLogin.login", () => {
    test("without errors", async () => {
      const mockedUser = "mocked-user";
      const cliProviderService: any = {
        teamService: {
          signIn: jest.fn(() => mockedUser),
          getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
        },
        remoteProceduresClient: {
          refreshWorkspaceState: jest.fn(),
        },
      };
      const command = getTestCommand(cliProviderService, []);
      const mockedUserEmail = "mocked-user-email";
      const mockedUserPassword = "mocked-user-password";
      (command as any).insertUserEmail = () => mockedUserEmail;
      (command as any).insertUserPassword = () => mockedUserPassword;
      (command as any).log = jest.fn();
      await command.run();
      expect(cliProviderService.teamService.signIn).toHaveBeenCalledTimes(1);
      expect(cliProviderService.teamService.signIn).toHaveBeenCalledWith(mockedUserEmail, mockedUserPassword);
      expect(cliProviderService.remoteProceduresClient.refreshWorkspaceState).toHaveBeenCalled();
      expect((command as any).log).toHaveBeenCalledWith("login successful");
    });

    test("if this.teamService.signIn throws an error", async () => {
      const mockedErrorMessage = "mocked-error";
      const mockedError = new Error(mockedErrorMessage);
      const cliProviderService: any = {
        teamService: {
          signIn: jest.fn(() => {
            throw mockedError;
          }),
          getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
        },
      };
      const command = getTestCommand(cliProviderService, []);
      const mockedUserEmail = "mocked-user-email";
      const mockedUserPassword = "mocked-user-password";
      (command as any).insertUserEmail = () => mockedUserEmail;
      (command as any).insertUserPassword = () => mockedUserPassword;
      (command as any).error = jest.fn();
      await command.run();
      expect((command as any).error).toHaveBeenCalledTimes(1);
      expect((command as any).error).toHaveBeenCalledWith(mockedErrorMessage);
    });

    test("if this.teamService.signIn throws something that isn't an error", async () => {
      const mockedError = "mocked-error";
      const cliProviderService: any = {
        teamService: {
          signIn: jest.fn(() => {
            throw mockedError;
          }),
          getKeychainCurrentWorkspace: async () => Promise.resolve("remoteWorkspace"),
        },
      };
      const command = getTestCommand(cliProviderService, []);
      const mockedUserEmail = "mocked-user-email";
      const mockedUserPassword = "mocked-user-password";
      (command as any).insertUserEmail = () => mockedUserEmail;
      (command as any).insertUserPassword = () => mockedUserPassword;
      (command as any).error = jest.fn();
      await command.run();
      expect((command as any).error).toHaveBeenCalledTimes(1);
      expect((command as any).error).toHaveBeenCalledWith(`Unknown error: ${mockedError}`);
    });

    test("run - all ok", async () => {
      const command = getTestCommand(null, []);
      command.login = jest.fn();
      await command.run();
      expect(command.login).toHaveBeenCalled();
    });

    test("run - login throws an error", async () => {
      const command = getTestCommand(null, []);
      command.login = jest.fn(() => {
        throw new Error("mocked-error");
      });
      (command as any).error = jest.fn();
      await command.run();
      expect(command.error).toHaveBeenCalledWith("mocked-error");
    });

    test("run - login throws something that isn't an error", async () => {
      const mockedError = "mocked-error";
      const command = getTestCommand(null, []);
      command.login = jest.fn(() => {
        throw mockedError;
      });
      (command as any).error = jest.fn();
      await command.run();
      expect(command.error).toHaveBeenCalledWith(`Unknown error: ${mockedError}`);
    });
  });
});

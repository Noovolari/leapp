import { describe, expect, jest, test } from "@jest/globals";
import { CredentialsInfo } from "@noovolari/leapp-core/models/credentials-info";
import GetWebConsoleUrl from "./get-web-console-url";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";

describe("GetWebConsoleUrl", () => {
  const getTestCommand = (cliProviderService: any = null, argv = []): GetWebConsoleUrl => {
    const command = new GetWebConsoleUrl(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const credentialInfo = { sessionToken: { aws_access_key_id: "123", aws_secret_access_key: "345", aws_session_token: "678" } };

  test("Flags - Session id", async () => {
    const sessionService: any = {
      generateCredentials: jest.fn(async () => credentialInfo),
    };
    const sessionFactory: any = {
      getSessionService: jest.fn(() => sessionService),
    };

    const ssmService: any = {
      startSession: jest.fn((_0: CredentialsInfo, _1: string, _2: string) => {}),
      getSsmInstances: jest.fn(() => []),
    };

    const webConsoleService: any = {
      getWebConsoleUrl: jest.fn(async () => "https://dummy.web.console.url"),
    };

    const inquirer: any = {
      prompt: jest.fn(() => ({ selectedInstance: {} })),
    };

    const session: any = { sessionId: "sessionId", type: "sessionType", region: "eu-west-1" };

    const cliProviderService: any = {
      sessionFactory,
      ssmService,
      inquirer,
      webConsoleService,
      sessionManagementService: {
        getSessionById: jest.fn((id: string) => [session].find((s) => s.sessionId === id)),
      },
    };

    let command = getTestCommand(cliProviderService, ["--sessionId"]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("Flag --sessionId expects a value");

    command = getTestCommand(cliProviderService, ["--sessionId", "sjklhnjkl"]);
    command.log = jest.fn();
    await expect(command.run()).rejects.toThrow("No session found with id sjklhnjkl");

    command = getTestCommand(cliProviderService, ["--sessionId", "sessionId"]);
    command.log = jest.fn();

    await command.run();

    expect(command.log).toHaveBeenCalledWith("https://dummy.web.console.url");
    expect(sessionFactory.getSessionService).toHaveBeenCalledWith("sessionType");
    expect(sessionService.generateCredentials).toHaveBeenCalledWith("sessionId");
    expect(webConsoleService.getWebConsoleUrl).toHaveBeenCalledWith(credentialInfo, "eu-west-1");
  });

  test("getWebConsoleUrl", async () => {
    const sessionService: any = {
      generateCredentials: jest.fn(async () => credentialInfo),
    };
    const sessionFactory: any = {
      getSessionService: jest.fn(() => sessionService),
    };

    const ssmService: any = {
      startSession: jest.fn((_0: CredentialsInfo, _1: string, _2: string) => {}),
      getSsmInstances: jest.fn(() => []),
    };

    const webConsoleService: any = {
      getWebConsoleUrl: jest.fn(async () => "https://dummy.web.console.url"),
    };

    const inquirer: any = {
      prompt: jest.fn(() => ({ selectedInstance: {} })),
    };

    const cliProviderService: any = {
      sessionFactory,
      ssmService,
      inquirer,
      webConsoleService,
    };

    const session: any = { sessionId: "sessionId", type: "sessionType", region: "eu-west-1" };
    const command = getTestCommand(cliProviderService);
    command.log = jest.fn();

    const loginURL = await command.getWebConsoleUrl(session);

    expect(sessionFactory.getSessionService).toHaveBeenCalledWith("sessionType");
    expect(sessionService.generateCredentials).toHaveBeenCalledWith("sessionId");
    expect(webConsoleService.getWebConsoleUrl).toHaveBeenCalledWith(credentialInfo, "eu-west-1");
    expect(loginURL).toBe("https://dummy.web.console.url");
  });

  test("selectSession", async () => {
    const sessionService: any = {
      generateCredentials: jest.fn(async () => credentialInfo),
    };
    const sessionFactory: any = {
      getSessionService: jest.fn(() => sessionService),
    };

    const ssmService: any = {
      startSession: jest.fn((_0: CredentialsInfo, _1: string, _2: string) => {}),
      getSsmInstances: jest.fn(() => []),
    };

    const webConsoleService: any = {
      getWebConsoleUrl: jest.fn(async () => {}),
    };

    const session: any = { sessionName: "a", sessionId: "sessionId", type: "sessionType", region: "eu-west-1", status: 0 };
    const session2: any = { sessionName: "b", sessionId: "sessionId2", type: "sessionType2", region: "eu-west-2", status: 1 };

    const inquirer: any = {
      prompt: jest.fn(() => ({ selectedSession: session })),
    };

    const sessionManagementService: any = {
      getSessions: jest.fn(() => [session, session2]),
    };

    const cliProviderService: any = {
      sessionFactory,
      ssmService,
      inquirer,
      webConsoleService,
      sessionManagementService,
    };

    let command = getTestCommand(cliProviderService);
    command.log = jest.fn();

    const result = await (command as any).selectSession();

    expect(sessionManagementService.getSessions).toHaveBeenCalledTimes(1);
    expect(sessionManagementService.getSessions).toReturnWith([session, session2]);
    expect(sessionManagementService.getSessions().filter((s) => s.status === SessionStatus.inactive)).toStrictEqual([session]);
    expect(inquirer.prompt).toHaveBeenCalledTimes(1);
    expect(inquirer.prompt).toHaveBeenCalledWith([
      {
        name: "selectedSession",
        message: "select a session",
        type: "list",
        choices: [{ name: "a", value: session }],
      },
    ]);

    expect(result).toBe(session);

    cliProviderService.sessionManagementService.getSessions = () => [];
    command = getTestCommand(cliProviderService);
    try {
      await (command as any).selectSession();
    } catch (err) {
      expect(err.toString()).toBe("Error: no sessions available");
    }
  });
});

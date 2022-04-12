import { describe, expect, jest, test } from "@jest/globals";
import StartSession from "./start";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";

describe("StartSession", () => {
  const getTestCommand = (cliProviderService: any = null): StartSession => {
    const command = new StartSession([], {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("startSession", async () => {
    const sessionService: any = {
      start: jest.fn(async () => {}),
      sessionDeactivated: jest.fn(async () => {}),
    };
    const sessionFactory: any = {
      getSessionService: jest.fn(() => sessionService),
    };
    const remoteProceduresClient: any = { refreshSessions: jest.fn() };

    const cliProviderService: any = {
      sessionFactory,
      remoteProceduresClient,
    };

    const session: any = { sessionId: "sessionId", type: "sessionType" };
    const command = getTestCommand(cliProviderService);
    command.log = jest.fn();
    const processOn = jest.spyOn(process, "on").mockImplementation((event: any, callback: any): any => {
      expect(event).toBe("SIGINT");
      callback();
    });
    const processExit = jest.spyOn(process, "exit").mockImplementation((): any => {});
    await command.startSession(session);

    expect(sessionFactory.getSessionService).toHaveBeenCalledWith("sessionType");
    expect(sessionService.start).toHaveBeenCalledWith("sessionId");
    expect(command.log).toHaveBeenCalledWith("session started");
    expect(processOn).toHaveBeenCalled();
    expect(sessionService.sessionDeactivated).toHaveBeenCalledWith("sessionId");
    expect(processExit).toHaveBeenCalledWith(0);
    expect(remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });

  test("selectSession", async () => {
    const cliProviderService: any = {
      repository: {
        getSessions: jest.fn(() => [
          { sessionName: "sessionActive", status: SessionStatus.active },
          { sessionName: "sessionPending", status: SessionStatus.pending },
          { sessionName: "sessionInactive", status: SessionStatus.inactive },
        ]),
      },
      inquirer: {
        prompt: jest.fn(() => ({ selectedSession: { name: "sessionInactive", value: "InactiveSession" } })),
      },
    };

    const command = getTestCommand(cliProviderService);
    const selectedSession = await command.selectSession();
    expect(cliProviderService.inquirer.prompt).toHaveBeenCalledWith([
      {
        choices: [
          {
            name: "sessionInactive",
            value: { sessionName: "sessionInactive", status: SessionStatus.inactive },
          },
        ],
        message: "select a session",
        name: "selectedSession",
        type: "list",
      },
    ]);
    expect(selectedSession).toEqual({ name: "sessionInactive", value: "InactiveSession" });
  });

  test("selectSession, no session available", async () => {
    const cliProviderService: any = {
      repository: {
        getSessions: jest.fn(() => []),
      },
    };

    const command = getTestCommand(cliProviderService);
    await expect(command.selectSession()).rejects.toThrow(new Error("no sessions available"));
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const command = getTestCommand();

    command.selectSession = jest.fn(async (): Promise<any> => "session");

    command.startSession = jest.fn(async (): Promise<any> => {
      if (errorToThrow) {
        throw errorToThrow;
      }
    });

    try {
      await command.run();
    } catch (error) {
      expect(error).toEqual(new Error(expectedErrorMessage));
    }
    expect(command.startSession).toHaveBeenCalledWith("session");
  };

  test("run - all ok", async () => {
    await runCommand(undefined, "");
  });

  test("run - createSession throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - createSession throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });
});

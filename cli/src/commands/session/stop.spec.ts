import { describe, expect, jest, test } from "@jest/globals";
import StopSession from "./stop";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";

describe("StopSession", () => {
  const getTestCommand = (cliProviderService: any = null): StopSession => {
    const command = new StopSession([], {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("stopSession", async () => {
    const sessionService: any = {
      stop: jest.fn(async () => {}),
    };
    const sessionFactory: any = {
      getSessionService: jest.fn(() => sessionService),
    };
    const remoteProceduresClient = { refreshSessions: jest.fn() };

    const cliProviderService: any = {
      sessionFactory,
      remoteProceduresClient,
    };

    const session: any = { sessionId: "sessionId", type: "sessionType" };
    const command = getTestCommand(cliProviderService);
    command.log = jest.fn();
    await command.stopSession(session);

    expect(sessionFactory.getSessionService).toHaveBeenCalledWith("sessionType");
    expect(sessionService.stop).toHaveBeenCalledWith("sessionId");
    expect(command.log).toHaveBeenCalledWith("session stopped");
    expect(cliProviderService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
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
        prompt: jest.fn(() => ({ selectedSession: { name: "sessionActive", value: "ActiveSession" } })),
      },
    };

    const command = getTestCommand(cliProviderService);
    const selectedSession = await command.selectSession();
    expect(cliProviderService.inquirer.prompt).toHaveBeenCalledWith([
      {
        choices: [
          { name: "sessionActive", value: { sessionName: "sessionActive", status: SessionStatus.active } },
          { name: "sessionPending", value: { sessionName: "sessionPending", status: SessionStatus.pending } },
        ],
        message: "select a session",
        name: "selectedSession",
        type: "list",
      },
    ]);
    expect(selectedSession).toEqual({ name: "sessionActive", value: "ActiveSession" });
  });

  test("selectSession, no session available", async () => {
    const cliProviderService: any = {
      repository: {
        getSessions: jest.fn(() => []),
      },
    };

    const command = getTestCommand(cliProviderService);
    await expect(command.selectSession()).rejects.toThrow(new Error("no active sessions available"));
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const command = getTestCommand();
    command.selectSession = jest.fn(async (): Promise<any> => "session");
    command.stopSession = jest.fn(async (): Promise<any> => {
      if (errorToThrow) {
        throw errorToThrow;
      }
    });

    try {
      await command.run();
    } catch (error) {
      expect(error).toEqual(new Error(expectedErrorMessage));
    }
    expect(command.stopSession).toHaveBeenCalledWith("session");
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

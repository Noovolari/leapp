import { describe, expect, jest, test } from "@jest/globals";
import DeleteSession from "./delete";
import { SessionStatus } from "@noovolari/leapp-core/models/session-status";
import { CliProviderService } from "../../service/cli-provider-service";

describe("DeleteSession", () => {
  const getTestCommand = (cliProviderService: any = null, argv = []): DeleteSession => {
    const command = new DeleteSession(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("Flags - sessionId && force", async () => {
    let command = getTestCommand(new CliProviderService(), ["--sessionId"]);
    command.getAffectedSessions = jest.fn((): any => ["session1"]);
    command.askForConfirmation = jest.fn(async () => true);
    command.deleteSession = jest.fn(async (): Promise<any> => {});
    await expect(command.run()).rejects.toThrow("");

    const sessions = [{ sessionId: "session", sessionName: "sessionName" }];
    const cliMockService = {
      repository: {
        getSessionById: jest.fn((id: string) => sessions.find((s) => s.sessionId === id)),
      },
    };
    command = getTestCommand(cliMockService, ["--sessionId", "session"]);
    command.getAffectedSessions = jest.fn((): any => ["session1"]);
    command.askForConfirmation = jest.fn(async () => true);
    command.deleteSession = jest.fn(async (): Promise<any> => {});
    await command.run();

    expect(command.deleteSession).toHaveBeenCalledWith(sessions[0]);
    expect(command.getAffectedSessions).toHaveBeenCalledWith(sessions[0]);
    expect(command.askForConfirmation).toHaveBeenCalledWith(["session1"]);

    command = getTestCommand(cliMockService, ["--sessionId", "session", "--force"]);
    command.getAffectedSessions = jest.fn((): any => ["session1"]);
    command.askForConfirmation = jest.fn(async () => true);
    command.deleteSession = jest.fn(async (): Promise<any> => {});
    await command.run();

    expect(command.deleteSession).toHaveBeenCalledWith(sessions[0]);
    expect(command.getAffectedSessions).toHaveBeenCalledWith(sessions[0]);
    expect(command.askForConfirmation).not.toHaveBeenCalled();
  });

  test("deleteSession", async () => {
    const sessionService: any = {
      delete: jest.fn(async () => {}),
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
    await command.deleteSession(session);

    expect(sessionFactory.getSessionService).toHaveBeenCalledWith("sessionType");
    expect(sessionService.delete).toHaveBeenCalledWith("sessionId");
    expect(command.log).toHaveBeenCalledWith("session deleted");
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
        prompt: jest.fn(() => ({ selectedSession: { name: "sessionName", value: "sessionValue" } })),
      },
    };

    const command = getTestCommand(cliProviderService);
    const selectedSession = await command.selectSession();
    expect(cliProviderService.inquirer.prompt).toHaveBeenCalledWith([
      {
        choices: [
          {
            name: "sessionActive",
            value: {
              sessionName: "sessionActive",
              status: SessionStatus.active,
            },
          },
          {
            name: "sessionPending",
            value: {
              sessionName: "sessionPending",
              status: SessionStatus.pending,
            },
          },
          {
            name: "sessionInactive",
            value: {
              sessionName: "sessionInactive",
              status: SessionStatus.inactive,
            },
          },
        ],
        message: "select a session",
        name: "selectedSession",
        type: "list",
      },
    ]);
    expect(selectedSession).toEqual({ name: "sessionName", value: "sessionValue" });
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

  test("getAffectedSessions", async () => {
    const session = {
      type: "sessionType",
      sessionId: "sessionId",
    } as any;
    const sessionService = {
      getDependantSessions: jest.fn(() => "sessions"),
    };
    const cliProviderService: any = {
      sessionFactory: {
        getSessionService: jest.fn(() => sessionService),
      },
    };
    const command = getTestCommand(cliProviderService);

    const sessions = command.getAffectedSessions(session);
    expect(sessions).toBe("sessions");
    expect(sessionService.getDependantSessions).toHaveBeenCalledWith(session.sessionId);
    expect(cliProviderService.sessionFactory.getSessionService).toHaveBeenCalledWith(session.type);
  });

  test("askForConfirmation", async () => {
    const cliProviderService: any = {
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toEqual([
            {
              name: "confirmation",
              message: "deleting this session will delete also these chained sessions\n" + "- sess1\n" + "- sess2\n" + "Do you want to continue?",
              type: "confirm",
            },
          ]);
          return { confirmation: true };
        },
      },
    };
    const command = getTestCommand(cliProviderService);

    const affectedSessions = [{ sessionName: "sess1" }, { sessionName: "sess2" }] as any;
    const confirmation = await command.askForConfirmation(affectedSessions);

    expect(confirmation).toBe(true);
  });

  test("run - without confirmation", async () => {
    const command = getTestCommand();

    command.selectSession = jest.fn(async (): Promise<any> => "session");
    command.getAffectedSessions = jest.fn((): any => ["session1"]);
    command.askForConfirmation = jest.fn(async () => false);
    command.deleteSession = jest.fn();

    await command.run();

    expect(command.getAffectedSessions).toHaveBeenCalledWith("session");
    expect(command.askForConfirmation).toHaveBeenCalledWith(["session1"]);
    expect(command.deleteSession).not.toHaveBeenCalled();
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const command = getTestCommand();

    command.selectSession = jest.fn(async (): Promise<any> => "session");
    command.getAffectedSessions = jest.fn((): any => ["session1"]);
    command.askForConfirmation = jest.fn(async () => true);
    command.deleteSession = jest.fn(async (): Promise<any> => {
      if (errorToThrow) {
        throw errorToThrow;
      }
    });

    try {
      await command.run();
    } catch (error) {
      expect(error).toEqual(new Error(expectedErrorMessage));
    }
    expect(command.deleteSession).toHaveBeenCalledWith("session");
    expect(command.getAffectedSessions).toHaveBeenCalledWith("session");
    expect(command.askForConfirmation).toHaveBeenCalledWith(["session1"]);
  };

  test("run - all ok", async () => {
    await runCommand(undefined, "");
  });

  test("run - deleteSession throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - deleteSession throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });
});

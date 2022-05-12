import { describe, expect, jest, test } from "@jest/globals";
import { Session } from "@noovolari/leapp-core/models/session";
import { AwsSessionService } from "@noovolari/leapp-core/services/session/aws/aws-session-service";
import GenerateSession from "./generate";

describe("GenerateSession", () => {
  const getTestCommand = (cliProviderService: any = null, argv: string[] = []): GenerateSession => {
    const command = new GenerateSession(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("generateSession", async () => {
    const sessionService = {
      generateProcessCredentials: jest.fn(async () => ["credentials"]),
    };
    const sessionFactory: any = {
      getSessionService: jest.fn(() => sessionService),
    };

    const cliProviderService: any = {
      sessionFactory,
    };

    const session = { sessionId: "sessionId", type: "sessionType" } as unknown as AwsSessionService;
    const command = getTestCommand(cliProviderService);

    command.log = jest.fn();
    command.isAwsSession = jest.fn(() => true);
    await command.generateSession(session as unknown as Session);

    expect(sessionFactory.getSessionService).toHaveBeenCalledWith("sessionType");
    expect(sessionService.generateProcessCredentials).toHaveBeenCalledWith("sessionId");
    expect(command.log).toHaveBeenCalledWith('["credentials"]');
  });

  test("generateSession - not AWS Session", async () => {
    const sessionService = {
      generateProcessCredentials: jest.fn(async () => ["credentials"]),
    };
    const sessionFactory: any = {
      getSessionService: jest.fn(() => sessionService),
    };

    const cliProviderService: any = {
      sessionFactory,
    };

    const session = { sessionId: "sessionId", type: "sessionType" };
    const command = getTestCommand(cliProviderService);

    command.log = jest.fn();
    command.isAwsSession = jest.fn(() => false);

    await expect(command.generateSession(session as Session)).rejects.toThrow(new Error("AWS session is required"));
  });

  test("getSession", async () => {
    const cliProviderService: any = {
      sessionManagementService: {
        getSessions: jest.fn(() => [{ sessionId: "sessionId1" }, { sessionId: "sessionId2" }, { sessionId: "sessionId3" }]),
      },
    };

    const command = getTestCommand(cliProviderService);

    const selectedSession = await command.getSession("sessionId1");
    expect(selectedSession).toEqual({ sessionId: "sessionId1" });
  });

  test("getSession, no session available", async () => {
    const cliProviderService: any = {
      sessionManagementService: {
        getSessions: jest.fn(() => []),
      },
    };

    const command = getTestCommand(cliProviderService);

    await expect(command.getSession("sessionId1")).rejects.toThrow(new Error("no sessions available"));
  });

  test("getSession, id not unique", async () => {
    const cliProviderService: any = {
      sessionManagementService: {
        getSessions: jest.fn(() => [{ sessionId: "sessionId1" }, { sessionId: "sessionId1" }, { sessionId: "sessionId3" }]),
      },
    };

    const command = getTestCommand(cliProviderService);

    await expect(command.getSession("sessionId1")).rejects.toThrow(new Error("id must be unique"));
  });

  test("isAwsSession - true", () => {
    const command = getTestCommand();
    const session = new (AwsSessionService as any)();
    const isAwsSession = command.isAwsSession(session);

    expect(isAwsSession).toBe(true);
  });

  test("isAwsSession - false", () => {
    const command = getTestCommand();
    const session = {} as Session;
    const isAwsSession = command.isAwsSession(session as any);

    expect(isAwsSession).toBe(false);
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const command = getTestCommand(null, ["sessionId"]);

    command.getSession = jest.fn(async (): Promise<any> => "session");
    command.generateSession = jest.fn(async (): Promise<any> => {
      if (errorToThrow) {
        throw errorToThrow;
      }
    });

    try {
      await command.run();
    } catch (error) {
      expect(error).toEqual(new Error(expectedErrorMessage));
    }
    expect(command.getSession).toHaveBeenCalledWith("sessionId");
    expect(command.generateSession).toHaveBeenCalledWith("session");
  };

  test("run - all ok", async () => {
    await runCommand(undefined, "");
  });

  test("run - generateSession throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - generateSession throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });
});

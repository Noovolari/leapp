import { jest, describe, test, expect } from "@jest/globals";
import SyncIntegration from "./sync";

describe("SyncIntegration", () => {
  const getTestCommand = (cliProviderService: any = null, argv: string[] = []): SyncIntegration => {
    const command = new SyncIntegration(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("selectIntegration", async () => {
    const integration = { alias: "integration1" };
    const cliProviderService: any = {
      awsSsoIntegrationService: {
        getOnlineIntegrations: jest.fn(() => [integration]),
      },
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toEqual([
            {
              name: "selectedIntegration",
              message: "select an integration",
              type: "list",
              choices: [{ name: integration.alias, value: integration }],
            },
          ]);
          return { selectedIntegration: integration };
        },
      },
    };

    const command = getTestCommand(cliProviderService);
    const selectedIntegration = await command.selectIntegration();

    expect(cliProviderService.awsSsoIntegrationService.getOnlineIntegrations).toHaveBeenCalled();
    expect(selectedIntegration).toBe(integration);
  });

  test("selectIntegration, no integrations", async () => {
    const cliProviderService: any = {
      awsSsoIntegrationService: {
        getOnlineIntegrations: jest.fn(() => []),
      },
    };

    const command = getTestCommand(cliProviderService);
    await expect(command.selectIntegration()).rejects.toThrow(new Error("no online integrations available"));
  });

  test("sync", async () => {
    const sessionsDiff = { sessionsToAdd: ["session1", "session2"], sessionsToDelete: ["session3"] };
    const cliProviderService: any = {
      awsSsoIntegrationService: {
        syncSessions: jest.fn(async () => sessionsDiff),
      },
      remoteProceduresClient: {
        refreshSessions: jest.fn(),
      },
    };

    const command = getTestCommand(cliProviderService);
    command.log = jest.fn();

    const integration = { id: "id1" } as any;
    await command.sync(integration);

    expect(cliProviderService.awsSsoIntegrationService.syncSessions).toHaveBeenCalledWith(integration.id);
    expect(command.log).toHaveBeenNthCalledWith(1, `${sessionsDiff.sessionsToAdd.length} sessions added`);
    expect(command.log).toHaveBeenNthCalledWith(2, `${sessionsDiff.sessionsToDelete.length} sessions removed`);
    expect(cliProviderService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const selectedIntegration = { id: "1" };

    const command = getTestCommand();
    command.selectIntegration = jest.fn(async (): Promise<any> => selectedIntegration);
    command.sync = jest.fn(async () => {
      if (errorToThrow) {
        throw errorToThrow;
      }
    });

    let occurredError;
    try {
      await command.run();
    } catch (error) {
      occurredError = error;
    }

    expect(command.selectIntegration).toHaveBeenCalled();
    expect(command.sync).toHaveBeenCalledWith(selectedIntegration);
    if (errorToThrow) {
      expect(occurredError).toEqual(new Error(expectedErrorMessage));
    }
  };

  test("run", async () => {
    await runCommand(undefined, "");
  });

  test("run - sync throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - sync throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });
});

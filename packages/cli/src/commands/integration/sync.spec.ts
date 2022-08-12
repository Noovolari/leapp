import { jest, describe, test, expect } from "@jest/globals";
import SyncIntegration from "./sync";
import { CliProviderService } from "../../service/cli-provider-service";

describe("SyncIntegration", () => {
  const getTestCommand = (cliProviderService: any = null, argv: string[] = []): SyncIntegration => {
    const command = new SyncIntegration(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("Flags - integrationId", async () => {
    let command = getTestCommand(new CliProviderService(), ["--integrationId"]);
    await expect(command.run()).rejects.toThrow("Flag --integrationId expects a value");

    const mockIntegration = {
      id: "validId",
      alias: "mock",
      portalUrl: "url",
      browserOpening: "In-app",
    };

    command = getTestCommand(new CliProviderService(), ["--integrationId", ""]);
    (command as any).selectIntegration = jest.fn(() => Promise.resolve(mockIntegration));
    command.sync = jest.fn();
    await command.run();
    expect(command.selectIntegration).toHaveBeenCalled();

    const cliProviderService = {
      integrationFactory: {
        getIntegrationById: jest.fn((id: string) => {
          if (id === "validId") {
            return mockIntegration;
          } else return null;
        }),
      },
    };

    command = getTestCommand(cliProviderService, ["--integrationId", "validId"]);
    (command as any).selectIntegration = jest.fn(() => Promise.resolve(mockIntegration));
    command.sync = jest.fn();
    await command.run();
    expect(command.sync).toHaveBeenCalledWith(mockIntegration);
  });

  test("Flags - integration not found", async () => {
    const cliProviderService = { integrationFactory: { getIntegrationById: () => null } };
    const command = getTestCommand(cliProviderService, ["--integrationId", "invalidId"]);
    await expect(command.run()).rejects.toThrow('integrationId "invalidId" is not associated to an existing integration');
  });

  test("selectIntegration", async () => {
    const integration = { alias: "integration1" };
    const cliProviderService: any = {
      integrationFactory: {
        getIntegrations: jest.fn(() => [integration]),
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

    expect(cliProviderService.integrationFactory.getIntegrations).toHaveBeenCalled();
    expect(selectedIntegration).toBe(integration);
  });

  test("selectIntegration, no integrations", async () => {
    const cliProviderService: any = {
      integrationFactory: {
        getIntegrations: () => [],
      },
    };

    const command = getTestCommand(cliProviderService);
    await expect(command.selectIntegration()).rejects.toThrow(new Error("no integrations available"));
  });

  test("sync", async () => {
    const sessionsDiff = { sessionsAdded: 2, sessionsDeleted: 1 };
    const cliProviderService: any = {
      integrationFactory: {
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

    expect(cliProviderService.integrationFactory.syncSessions).toHaveBeenCalledWith(integration.id);
    expect(command.log).toHaveBeenNthCalledWith(1, `${sessionsDiff.sessionsAdded} sessions added`);
    expect(command.log).toHaveBeenNthCalledWith(2, `${sessionsDiff.sessionsDeleted} sessions removed`);
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

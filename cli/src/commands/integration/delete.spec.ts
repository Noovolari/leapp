import { jest, describe, test, expect } from "@jest/globals";
import DeleteIntegration from "./delete";
import { CliProviderService } from "../../service/cli-provider-service";

describe("DeleteIntegration", () => {
  const getTestCommand = (cliProviderService: any = null, argv: string[] = []): DeleteIntegration => {
    const command = new DeleteIntegration(argv, {} as any);
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
    command.delete = jest.fn();
    await command.run();
    expect(command.selectIntegration).toHaveBeenCalled();

    const cliProviderService = {
      awsSsoIntegrationService: {
        getIntegration: jest.fn((id: string) => {
          if (id === "validId") {
            return mockIntegration;
          } else return null;
        }),
      },
    };

    command = getTestCommand(cliProviderService, ["--integrationId", "validId"]);
    (command as any).selectIntegration = jest.fn(() => Promise.resolve(mockIntegration));
    command.delete = jest.fn();
    await command.run();
    expect(command.delete).toHaveBeenCalledWith(mockIntegration);
  });

  test("selectIntegration", async () => {
    const integration = { alias: "integration1" };
    const cliProviderService: any = {
      awsSsoIntegrationService: {
        getIntegrations: jest.fn(() => [integration]),
      },
      inquirer: {
        prompt: async (params: any) => {
          expect(params).toEqual([
            {
              name: "selectedIntegration",
              message: "select an integration to delete",
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

    expect(cliProviderService.awsSsoIntegrationService.getIntegrations).toHaveBeenCalled();
    expect(selectedIntegration).toBe(integration);
  });

  test("selectIntegration, no integrations", async () => {
    const cliProviderService: any = {
      awsSsoIntegrationService: {
        getIntegrations: jest.fn(() => []),
      },
    };

    const command = getTestCommand(cliProviderService);
    await expect(command.selectIntegration()).rejects.toThrow(new Error("no integrations available"));
  });

  test("delete", async () => {
    const cliProviderService: any = {
      awsSsoIntegrationService: {
        deleteIntegration: jest.fn(),
      },
      remoteProceduresClient: {
        refreshIntegrations: jest.fn(),
        refreshSessions: jest.fn(),
      },
    };

    const command = getTestCommand(cliProviderService);
    command.log = jest.fn();

    const integration = { id: "integration1" } as any;
    await command.delete(integration);

    expect(cliProviderService.awsSsoIntegrationService.deleteIntegration).toHaveBeenCalledWith(integration.id);
    expect(command.log).toHaveBeenLastCalledWith("integration deleted");
    expect(cliProviderService.remoteProceduresClient.refreshIntegrations).toHaveBeenCalled();
    expect(cliProviderService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const selectedIntegration = { id: "1" };

    const command = getTestCommand();
    command.selectIntegration = jest.fn(async (): Promise<any> => selectedIntegration);
    command.delete = jest.fn(async () => {
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
    expect(command.delete).toHaveBeenCalledWith(selectedIntegration);
    if (errorToThrow) {
      expect(occurredError).toEqual(new Error(expectedErrorMessage));
    }
  };

  test("run", async () => {
    await runCommand(undefined, "");
  });

  test("run - delete throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - delete throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });
});

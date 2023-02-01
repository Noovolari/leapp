import { jest, describe, test, expect } from "@jest/globals";
import LogoutIntegration from "./logout";
import { CliProviderService } from "../../service/cli-provider-service";

describe("LogoutIntegration", () => {
  const getTestCommand = (cliProviderService: any = null, argv: string[] = []): LogoutIntegration => {
    const command = new LogoutIntegration(argv, {} as any);
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
      isOnline: true,
    };

    command = getTestCommand(new CliProviderService(), ["--integrationId", ""]);
    (command as any).selectIntegration = jest.fn(() => Promise.resolve(mockIntegration));
    command.logout = jest.fn();
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
    command.logout = jest.fn();
    await command.run();
    expect(command.logout).toHaveBeenCalledWith(mockIntegration);
  });

  test("selectIntegration", async () => {
    const integration = { alias: "integration1", isOnline: true };
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
        getIntegrations: jest.fn(() => []),
      },
    };

    const command = getTestCommand(cliProviderService);
    await expect(command.selectIntegration()).rejects.toThrow(new Error("no online integrations available"));
  });

  test("logout", async () => {
    const cliProviderService: any = {
      integrationFactory: {
        logout: jest.fn(),
      },
      remoteProceduresClient: { refreshIntegrations: jest.fn(), refreshSessions: jest.fn() },
    };

    const command = getTestCommand(cliProviderService);
    command.log = jest.fn();

    const integration = { id: "id1" } as any;
    await command.logout(integration);

    expect(cliProviderService.integrationFactory.logout).toHaveBeenCalledWith(integration.id);
    expect(command.log).toHaveBeenLastCalledWith("logout successful");
    expect(cliProviderService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
    expect(cliProviderService.remoteProceduresClient.refreshSessions).toHaveBeenCalled();
  });

  const runCommand = async (errorToThrow: any, expectedErrorMessage: string) => {
    const selectedIntegration = { id: "1" };

    const command = getTestCommand();
    command.selectIntegration = jest.fn(async (): Promise<any> => selectedIntegration);
    command.logout = jest.fn(async () => {
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
    expect(command.logout).toHaveBeenCalledWith(selectedIntegration);
    if (errorToThrow) {
      expect(occurredError).toEqual(new Error(expectedErrorMessage));
    }
  };

  test("run", async () => {
    await runCommand(undefined, "");
  });

  test("run - logout throws exception", async () => {
    await runCommand(new Error("errorMessage"), "errorMessage");
  });

  test("run - logout throws undefined object", async () => {
    await runCommand({ hello: "randomObj" }, "Unknown error: [object Object]");
  });

  test("run - integration not found", async () => {
    const cliProviderService = { integrationFactory: { getIntegrationById: () => null } };
    const command = getTestCommand(cliProviderService, ["--integrationId", "invalidId"]);
    await expect(command.run()).rejects.toThrow('integrationId "invalidId" is not associated to an existing integration');
  });

  test("run - integration already offline", async () => {
    const cliProviderService = { integrationFactory: { getIntegrationById: () => ({ isOnline: false }) } };
    const command = getTestCommand(cliProviderService, ["--integrationId", "already-offline-id"]);
    await expect(command.run()).rejects.toThrow("integration is already offline");
  });
});

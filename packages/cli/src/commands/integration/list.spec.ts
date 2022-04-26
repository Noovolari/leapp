import ListIntegrations from "./list";
import { CliUx } from "@oclif/core";
import { describe, expect, jest, test } from "@jest/globals";

describe("ListIntegrations", () => {
  const getTestCommand = (cliProviderService: any = null, argv: string[] = []): ListIntegrations => {
    const command = new ListIntegrations(argv, {} as any);
    (command as any).cliProviderService = cliProviderService;
    return command;
  };

  test("run", async () => {
    const command = getTestCommand();
    command.showIntegrations = jest.fn();
    await command.run();

    expect(command.showIntegrations).toHaveBeenCalled();
  });

  test("run - showIntegrations throw an error", async () => {
    const command = getTestCommand();
    command.showIntegrations = jest.fn(async () => {
      throw new Error("error");
    });
    try {
      await command.run();
    } catch (error) {
      expect(error).toEqual(new Error("error"));
    }
  });

  test("run - showIntegrations throw an object", async () => {
    const command = getTestCommand();
    const errorToThrow = "string";
    command.showIntegrations = jest.fn(async () => {
      throw errorToThrow;
    });
    try {
      await command.run();
    } catch (error) {
      expect(error).toEqual(new Error("Unknown error: string"));
    }
  });

  test("showIntegrations", async () => {
    const integrations = [
      {
        alias: "integrationName",
        portalUrl: "portalUrl",
        region: "region",
        accessTokenExpiration: "expiration",
      },
    ];
    const cliProviderService = {
      awsSsoIntegrationService: {
        getIntegrations: () => integrations,
        isOnline: jest.fn(() => true),
        remainingHours: jest.fn(() => "remainingHours"),
      },
    };

    const command = getTestCommand(cliProviderService);
    const tableSpy = jest.spyOn(CliUx.ux, "table").mockImplementation(() => null);

    await command.showIntegrations();

    const expectedData = [
      {
        integrationName: "integrationName",
        portalUrl: "portalUrl",
        region: "region",
        status: "Online",
        expirationInHours: "Expiring remainingHours",
      },
    ];

    expect(tableSpy.mock.calls[0][0]).toEqual(expectedData);

    expect(cliProviderService.awsSsoIntegrationService.isOnline).toHaveBeenCalledWith(integrations[0]);
    expect(cliProviderService.awsSsoIntegrationService.remainingHours).toHaveBeenCalledWith(integrations[0]);

    const expectedColumns = {
      integrationId: { header: "ID", extended: true },
      integrationName: { header: "Integration Name" },
      portalUrl: { header: "Portal URL" },
      region: { header: "Region" },
      status: { header: "Status" },
      expirationInHours: { header: "Expiration" },
    };
    expect(tableSpy.mock.calls[0][1]).toEqual(expectedColumns);
  });
});

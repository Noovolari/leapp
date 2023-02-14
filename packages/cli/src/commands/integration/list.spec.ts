import ListIntegrations from "./list";
import { ux } from "@oclif/core";
import { describe, expect, jest, test } from "@jest/globals";
import { IntegrationType } from "@noovolari/leapp-core/models/integration-type";

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
        id: "integration1",
        type: IntegrationType.awsSso,
        alias: "ssoIntegrationName",
        portalUrl: "portalUrl",
        region: "region",
        accessTokenExpiration: "expiration1",
        isOnline: true,
      },
      {
        id: "integration2",
        type: IntegrationType.azure,
        alias: "azureIntegrationName",
        tenantId: "tenantId",
        location: "location",
        accessTokenExpiration: "expiration2",
        isOnline: false,
      },
    ];
    const cliProviderService = {
      integrationFactory: {
        getIntegrations: () => integrations,
        getRemainingHours: jest.fn(() => "remainingHours"),
      },
    };

    const command = getTestCommand(cliProviderService);
    const tableSpy = jest.spyOn(ux, "table").mockImplementation(() => null);

    await command.showIntegrations();

    const expectedData = [
      {
        integrationId: "integration1",
        integrationType: IntegrationType.awsSso,
        integrationName: "ssoIntegrationName",
        urlOrTenant: "portalUrl",
        region: "region",
        status: "Online",
        expirationInHours: "Expiring remainingHours",
      },
      {
        integrationId: "integration2",
        integrationType: IntegrationType.azure,
        integrationName: "azureIntegrationName",
        urlOrTenant: "tenantId",
        region: "location",
        status: "Offline",
        expirationInHours: "-",
      },
    ];

    expect(tableSpy.mock.calls[0][0]).toEqual(expectedData);
    expect(cliProviderService.integrationFactory.getRemainingHours).toHaveBeenCalledWith(integrations[0]);
    expect(cliProviderService.integrationFactory.getRemainingHours).toHaveBeenCalledTimes(1);

    const expectedColumns = {
      integrationId: { header: "ID", extended: true },
      integrationType: { header: "Type" },
      integrationName: { header: "Integration Name" },
      urlOrTenant: { header: "AWS Portal URL/Azure Tenant ID" },
      region: { header: "Region/Location" },
      status: { header: "Status" },
      expirationInHours: { header: "Expiration" },
    };
    expect(tableSpy.mock.calls[0][1]).toEqual(expectedColumns);
  });
});

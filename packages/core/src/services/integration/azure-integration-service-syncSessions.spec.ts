import { describe, expect, jest, test } from "@jest/globals";
import { AzureIntegrationService } from "./azure-integration-service";
import { SessionType } from "../../models/session-type";

describe("AzureIntegrationService", () => {
  test("getIntegration", async () => {
    const integrationId = "integrationId";
    const expectedIntegration = {};
    const repository = {
      getAzureIntegration: jest.fn(() => expectedIntegration),
    } as any;
    const service = new AzureIntegrationService(repository, null, null, null, null, null, null, null);
    const integration = await service.getIntegration(integrationId);
    expect(integration).toBe(expectedIntegration);
    expect(repository.getAzureIntegration).toHaveBeenCalledWith(integrationId);
  });

  test("syncSessions, no available azure local sessions", async () => {
    const executeService = { execute: jest.fn() } as any;
    const azureProfile = {
      subscriptions: [{ id: "subscriptionId", name: "subscriptionName" }],
    };
    const azurePersistenceService = { loadProfile: () => azureProfile } as any;
    const sessions = [{ type: SessionType.awsIamUser }, { type: SessionType.azure, azureIntegrationId: "anotherIntegrationId" }];
    const repository = { getSessions: () => sessions } as any;
    const azureService = { create: jest.fn() } as any;
    const service = new AzureIntegrationService(repository, null, null, null, null, executeService, azureService, azurePersistenceService);

    const integrationId = "integrationId";
    const integration = { tenantId: "tenantId", region: "region" } as any;
    service.getIntegration = jest.fn(() => integration);

    await service.syncSessions(integrationId);

    expect(service.getIntegration).toHaveBeenCalledWith(integrationId);
    expect(executeService.execute).toHaveBeenCalledWith("az login --tenant tenantId 2>&1");
    expect(azureService.create).toHaveBeenCalledWith({
      region: "region",
      subscriptionId: "subscriptionId",
      tenantId: "tenantId",
      sessionName: "subscriptionName",
      azureIntegrationId: integrationId,
    });
  });

  // A local azure session already exists with the same fields of the creation request
  test("syncSessions, azure local session to keep", async () => {});

  // A local azure session already exists but with at least a different field from the creation request
  test("syncSessions, azure local session to delete", async () => {});
});

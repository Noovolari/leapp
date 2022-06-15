import { describe, expect, jest, test } from "@jest/globals";
import { AzureIntegrationService } from "./azure-integration-service";
import { SessionType } from "../../models/session-type";
import { constants } from "../../models/constants";

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
    service.setOnline = jest.fn();
    (service as any).moveSecretsToKeychain = jest.fn();
    (service as any).notifyIntegrationChanges = jest.fn();

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
    expect((service as any).moveSecretsToKeychain).toHaveBeenCalledWith(integration, azureProfile);
    expect(service.setOnline).toHaveBeenCalledWith(integration, true);
    expect((service as any).notifyIntegrationChanges).toHaveBeenCalled();
  });

  test("syncSessions, azure local session to keep", async () => {
    const executeService = { execute: jest.fn() } as any;
    const azureProfile = {
      subscriptions: [{ id: "subscriptionId", name: "subscriptionName" }],
    };
    const azurePersistenceService = { loadProfile: () => azureProfile } as any;
    const integrationId = "integrationId";
    const sessions = [
      {
        type: SessionType.azure,
        sessionName: "subscriptionName",
        tenantId: "tenantId",
        subscriptionId: "subscriptionId",
        region: "region",
        azureIntegrationId: integrationId,
      },
    ];
    const repository = { getSessions: () => sessions } as any;
    const azureService = { create: jest.fn() } as any;
    const service = new AzureIntegrationService(repository, null, null, null, null, executeService, azureService, azurePersistenceService);
    service.setOnline = jest.fn();
    (service as any).moveSecretsToKeychain = jest.fn();
    (service as any).notifyIntegrationChanges = jest.fn();

    const integration = { tenantId: "tenantId", region: "region" } as any;
    service.getIntegration = jest.fn(() => integration);

    await service.syncSessions(integrationId);

    expect(service.getIntegration).toHaveBeenCalledWith(integrationId);
    expect(executeService.execute).toHaveBeenCalledWith("az login --tenant tenantId 2>&1");
    expect(azureService.create).not.toHaveBeenCalled();
    expect((service as any).moveSecretsToKeychain).toHaveBeenCalledWith(integration, azureProfile);
    expect(service.setOnline).toHaveBeenCalledWith(integration, true);
    expect((service as any).notifyIntegrationChanges).toHaveBeenCalled();
  });

  test("syncSessions, azure local session to delete", async () => {
    const executeService = { execute: jest.fn() } as any;
    const azureProfile = {
      subscriptions: [{ id: "subscriptionId", name: "subscriptionName" }],
    };
    const azurePersistenceService = { loadProfile: () => azureProfile } as any;
    const integrationId = "integrationId";
    const sessions = [
      {
        sessionId: "sessionId",
        type: SessionType.azure,
        sessionName: "differentName",
        tenantId: "tenantId",
        subscriptionId: "subscriptionId",
        region: "region",
        azureIntegrationId: integrationId,
      },
    ];
    const repository = { getSessions: () => sessions } as any;
    const azureService = {
      delete: jest.fn(),
      create: jest.fn(),
    } as any;
    const service = new AzureIntegrationService(repository, null, null, null, null, executeService, azureService, azurePersistenceService);
    service.setOnline = jest.fn();
    (service as any).moveSecretsToKeychain = jest.fn();
    (service as any).notifyIntegrationChanges = jest.fn();

    const integration = { tenantId: "tenantId", region: "region" } as any;
    service.getIntegration = jest.fn(() => integration);

    await service.syncSessions(integrationId);

    expect(service.getIntegration).toHaveBeenCalledWith(integrationId);
    expect(executeService.execute).toHaveBeenCalledWith("az login --tenant tenantId 2>&1");
    expect(azureService.delete).toHaveBeenCalledWith("sessionId");
    expect(azureService.create).toHaveBeenCalledWith({
      region: "region",
      subscriptionId: "subscriptionId",
      tenantId: "tenantId",
      sessionName: "subscriptionName",
      azureIntegrationId: integrationId,
    });
    expect((service as any).moveSecretsToKeychain).toHaveBeenCalledWith(integration, azureProfile);
    expect(service.setOnline).toHaveBeenCalledWith(integration, true);
    expect((service as any).notifyIntegrationChanges).toHaveBeenCalled();
  });

  test("setOnline, is online, forcedState", async () => {
    const repository = { updateAzureIntegration: jest.fn() } as any;
    const azurePersistenceService = { loadMsalCache: jest.fn(), loadProfile: jest.fn() } as any;
    const service = new AzureIntegrationService(repository, null, null, null, null, null, null, azurePersistenceService);
    const integration = { id: "fakeId", alias: "fakeAlias", tenantId: "fakeTenant", region: "fakeRegion", isOnline: "fakeOnline" } as any;
    const forcedIsOnlineState = true;
    await service.setOnline(integration, forcedIsOnlineState);
    expect(repository.updateAzureIntegration).toHaveBeenCalledWith("fakeId", "fakeAlias", "fakeTenant", "fakeRegion", forcedIsOnlineState);
    expect(azurePersistenceService.loadMsalCache).not.toHaveBeenCalled();
    expect(azurePersistenceService.loadProfile).not.toHaveBeenCalled();
  });

  test("setOnline, is not online, forcedState", async () => {
    const repository = { updateAzureIntegration: jest.fn() } as any;
    const azurePersistenceService = { loadMsalCache: jest.fn(), loadProfile: jest.fn() } as any;
    const service = new AzureIntegrationService(repository, null, null, null, null, null, null, azurePersistenceService);
    const integration = { id: "fakeId", alias: "fakeAlias", tenantId: "fakeTenant", region: "fakeRegion", isOnline: "fakeOnline" } as any;
    const forcedIsOnlineState = false;
    await service.setOnline(integration, forcedIsOnlineState);
    expect(repository.updateAzureIntegration).toHaveBeenCalledWith("fakeId", "fakeAlias", "fakeTenant", "fakeRegion", forcedIsOnlineState);
    expect(azurePersistenceService.loadMsalCache).not.toHaveBeenCalled();
    expect(azurePersistenceService.loadProfile).not.toHaveBeenCalled();
  });

  test("setOnline, is online, without forcedState", async () => {
    const keychainService = { getSecret: jest.fn(() => "secret") } as any;
    const repository = { updateAzureIntegration: jest.fn() } as any;
    const service = new AzureIntegrationService(repository, keychainService, null, null, null, null, null, null);
    const integration = { id: "fakeId", alias: "fakeAlias", tenantId: "fakeTenant", region: "fakeRegion", isOnline: "fakeOnline" } as any;
    await service.setOnline(integration);
    expect(repository.updateAzureIntegration).toHaveBeenCalledWith("fakeId", "fakeAlias", "fakeTenant", "fakeRegion", true);
    expect(keychainService.getSecret).toHaveBeenNthCalledWith(1, constants.appName, "azure-integration-profile-fakeId");
    expect(keychainService.getSecret).toHaveBeenNthCalledWith(2, constants.appName, "azure-integration-account-fakeId");
    expect(keychainService.getSecret).toHaveBeenNthCalledWith(3, constants.appName, "azure-integration-refresh-token-fakeId");
  });

  test("setOnline, is not online, without forcedState", async () => {
    const keychainService = { getSecret: jest.fn(() => null) } as any;
    const repository = { updateAzureIntegration: jest.fn() } as any;
    const service = new AzureIntegrationService(repository, keychainService, null, null, null, null, null, null);
    const integration = { id: "fakeId", alias: "fakeAlias", tenantId: "fakeTenant", region: "fakeRegion", isOnline: "fakeOnline" } as any;
    await service.setOnline(integration);
    expect(repository.updateAzureIntegration).toHaveBeenCalledWith("fakeId", "fakeAlias", "fakeTenant", "fakeRegion", false);
    expect(keychainService.getSecret).toHaveBeenNthCalledWith(1, constants.appName, "azure-integration-profile-fakeId");
    expect(keychainService.getSecret).toHaveBeenNthCalledWith(2, constants.appName, "azure-integration-account-fakeId");
    expect(keychainService.getSecret).toHaveBeenNthCalledWith(3, constants.appName, "azure-integration-refresh-token-fakeId");
  });
});

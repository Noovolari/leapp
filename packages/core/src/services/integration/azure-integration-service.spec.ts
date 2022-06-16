import { describe, expect, jest, test } from "@jest/globals";
import { AzureIntegrationService } from "./azure-integration-service";
import { SessionType } from "../../models/session-type";
import { constants } from "../../models/constants";

describe("AzureIntegrationService", () => {
  test("checkCliVersion, cli installed with version 2.30", async () => {
    const expectedCliOutput = `azure-cli                         2.30.0 *\n\ncore                              2.36.0 *\ntelemetry                          1.0.6\n\nDependencies:\nmsal                              1.17.0\nazure-mgmt-resource               20.0.0\n\nPython location '/usr/local/Cellar/azure-cli/2.36.0/libexec/bin/python'\nExtensions directory '/Users/marcovanetti/.azure/cliextensions'\n\nPython (Darwin) 3.10.4 (main, Apr 26 2022, 19:42:59) [Clang 13.1.6 (clang-1316.0.21.2)]\n\nLegal docs and information: aka.ms/AzureCliLegal\n\n\nYou have 2 updates available. Consider updating your CLI installation with 'az upgrade'\n\nPlease let us know how we are doing: https://aka.ms/azureclihats\nand let us know if you're interested in trying out our newest features: https://aka.ms/CLIUXstudy\n`;
    const executeService = {
      execute: jest.fn(async () => expectedCliOutput),
    } as any;
    const service = new AzureIntegrationService(null, null, null, null, null, executeService, null, null);
    await service.checkCliVersion();

    expect(executeService.execute).toHaveBeenCalledWith("az --version");
  });

  test("checkCliVersion, cli installed with version 2.31", async () => {
    const expectedCliOutput = `azure-cli                         2.31.0`;
    const executeService = { execute: async () => expectedCliOutput } as any;
    const service = new AzureIntegrationService(null, null, null, null, null, executeService, null, null);
    await service.checkCliVersion();
  });

  test("checkCliVersion, cli installed with version 2.29", async () => {
    const expectedCliOutput = `azure-cli                         2.29.0`;
    const executeService = { execute: async () => expectedCliOutput } as any;
    const service = new AzureIntegrationService(null, null, null, null, null, executeService, null, null);
    await expect(service.checkCliVersion()).rejects.toThrowError("Unsupported Azure CLI version (< 2.30). Please update Azure CLI.");
  });

  test("checkCliVersion, cli with unknown version", async () => {
    const executeService = { execute: async () => Promise.reject() } as any;
    const service = new AzureIntegrationService(null, null, null, null, null, executeService, null, null);
    await expect(service.checkCliVersion()).rejects.toThrowError("Azure CLI is not installed.");
  });

  test("checkCliVersion, cli not installed", async () => {
    const expectedCliOutput = `azure-cli version-2.31.0`;
    const executeService = { execute: async () => expectedCliOutput } as any;
    const service = new AzureIntegrationService(null, null, null, null, null, executeService, null, null);
    await expect(service.checkCliVersion()).rejects.toThrowError("Unknown Azure CLI version.");
  });

  test("createIntegration", async () => {
    const repository = {
      getDefaultLocation: jest.fn(() => "fakeLocation"),
      addAzureIntegration: jest.fn(),
    } as any;
    const service = new AzureIntegrationService(repository, null, null, null, null, null, null, null);
    service.checkCliVersion = jest.fn();

    await service.createIntegration({ alias: "fakeAlias", tenantId: "fakeTenantId" });
    expect(service.checkCliVersion).toHaveBeenCalled();
    expect(repository.getDefaultLocation).toHaveBeenCalled();
    expect(repository.addAzureIntegration).toHaveBeenCalledWith("fakeAlias", "fakeTenantId", "fakeLocation");
  });

  test("updateIntegration", async () => {
    const repository = {
      getAzureIntegration: jest.fn(() => ({ isOnline: "fakeOnlineStatus" })),
      getDefaultLocation: jest.fn(() => "fakeLocation"),
      updateAzureIntegration: jest.fn(),
    } as any;
    const service = new AzureIntegrationService(repository, null, null, null, null, null, null, null);

    await service.updateIntegration("fakeId", { alias: "fakeAlias", tenantId: "fakeTenantId" });
    expect(repository.getAzureIntegration).toHaveBeenCalledWith("fakeId");
    expect(repository.getDefaultLocation).toHaveBeenCalled();
    expect(repository.updateAzureIntegration).toHaveBeenCalledWith("fakeId", "fakeAlias", "fakeTenantId", "fakeLocation", "fakeOnlineStatus");
  });

  test("deleteIntegration", async () => {
    const repository = {
      deleteAzureIntegration: jest.fn(),
    } as any;
    const service = new AzureIntegrationService(repository, null, null, null, null, null, null, null);
    service.logout = jest.fn();

    await service.deleteIntegration("fakeId");
    expect(service.logout).toHaveBeenCalledWith("fakeId");
    expect(repository.deleteAzureIntegration).toHaveBeenCalledWith("fakeId");
  });

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

  test("getIntegrations", async () => {
    const repository = {
      listAzureIntegrations: () => "integrations",
    } as any;
    const service = new AzureIntegrationService(repository, null, null, null, null, null, null, null);

    const integrations = service.getIntegrations();
    expect(integrations).toBe("integrations");
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

  test("logout, integration is offline", async () => {
    const keychainService = { deletePassword: jest.fn(async () => null) } as any;
    const repository = { updateAzureIntegration: jest.fn() } as any;
    const service = new AzureIntegrationService(repository, keychainService, null, null, null, null, null, null);
    const integration = { isOnline: false };
    service.getIntegration = jest.fn(() => integration) as any;
    service.setOnline = jest.fn();
    (service as any).deleteDependentSessions = jest.fn();
    (service as any).notifyIntegrationChanges = jest.fn();

    await service.logout("fakeId");
    expect(service.getIntegration).toHaveBeenCalledWith("fakeId");
    expect(keychainService.deletePassword).not.toHaveBeenCalled();
    expect(service.setOnline).toHaveBeenCalledWith(integration, false);
    expect((service as any).deleteDependentSessions).toHaveBeenCalledWith("fakeId");
    expect((service as any).notifyIntegrationChanges).toHaveBeenCalled();
  });

  test("logout, integration is online", async () => {
    const keychainService = { deletePassword: jest.fn(async () => null) } as any;
    const repository = { updateAzureIntegration: jest.fn() } as any;
    const service = new AzureIntegrationService(repository, keychainService, null, null, null, null, null, null);
    const integration = { isOnline: true };
    service.getIntegration = jest.fn(() => integration) as any;
    service.setOnline = jest.fn();
    (service as any).deleteDependentSessions = jest.fn();
    (service as any).notifyIntegrationChanges = jest.fn();

    await service.logout("fakeId");
    expect(service.getIntegration).toHaveBeenCalledWith("fakeId");
    expect(keychainService.deletePassword).toHaveBeenNthCalledWith(1, constants.appName, "azure-integration-profile-fakeId");
    expect(keychainService.deletePassword).toHaveBeenNthCalledWith(2, constants.appName, "azure-integration-account-fakeId");
    expect(keychainService.deletePassword).toHaveBeenNthCalledWith(3, constants.appName, "azure-integration-refresh-token-fakeId");
    expect(service.setOnline).toHaveBeenCalledWith(integration, false);
    expect((service as any).deleteDependentSessions).toHaveBeenCalledWith("fakeId");
    expect((service as any).notifyIntegrationChanges).toHaveBeenCalled();
  });

  test("remainingHours", async () => {
    const service = new AzureIntegrationService(null, null, null, null, null, null, null, null);
    const remainingHours = service.remainingHours(null);

    expect(remainingHours).toBe("8hrs");
  });

  test("notifyIntegrationChanges", async () => {
    const repository = {
      listAwsSsoIntegrations: () => ["fakeSsoIntegration"],
      listAzureIntegrations: () => ["fakeAzureIntegration"],
    } as any;
    const behaviouralNotifier = {
      setIntegrations: jest.fn(),
    } as any;
    const service = new AzureIntegrationService(repository, null, behaviouralNotifier, null, null, null, null, null);
    (service as any).notifyIntegrationChanges();

    expect(behaviouralNotifier.setIntegrations).toHaveBeenCalledWith(["fakeSsoIntegration", "fakeAzureIntegration"]);
  });

  test("moveSecretsToKeychain", async () => {
    const keychainService = { saveSecret: jest.fn(async () => null) } as any;
    const executeService = { execute: jest.fn(async () => null) } as any;
    const msalTokenCache = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      AccessToken: {
        accessTokenKey1: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          home_account_id: "wrongHomeAccountId",
          realm: "wrongRealm",
        },
        accessTokenKey2: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          home_account_id: "fakeHomeAccountId",
          realm: "fakeTenantId",
        },
      },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Account: {
        accountKey1: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          home_account_id: "wrongHomeAccountId",
          fake: "account1",
        },
        accountKey2: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          home_account_id: "fakeHomeAccountId",
          fake: "account2",
        },
      },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      RefreshToken: {
        refreshTokenKey1: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          home_account_id: "wrongHomeAccountId",
          fake: "refreshToken1",
        },
        refreshTokenKey2: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          home_account_id: "fakeHomeAccountId",
          fake: "refreshToken2",
        },
      },
    };
    const azurePersistenceService = { loadMsalCache: jest.fn(async () => msalTokenCache) } as any;

    const service = new AzureIntegrationService(null, keychainService, null, null, null, executeService, null, azurePersistenceService);

    const integration = { id: "fakeId", tenantId: "fakeTenantId" } as any;
    const azureProfile = { fake: "azureProfile" } as any;
    await (service as any).moveSecretsToKeychain(integration, azureProfile);

    expect(keychainService.saveSecret).toHaveBeenNthCalledWith(1, constants.appName, "azure-integration-profile-fakeId", '{"fake":"azureProfile"}');
    expect(keychainService.saveSecret).toHaveBeenNthCalledWith(
      2,
      constants.appName,
      "azure-integration-account-fakeId",
      '["accountKey2",{"home_account_id":"fakeHomeAccountId","fake":"account2"}]'
    );
    expect(keychainService.saveSecret).toHaveBeenNthCalledWith(
      3,
      constants.appName,
      "azure-integration-refresh-token-fakeId",
      '["refreshTokenKey2",{"home_account_id":"fakeHomeAccountId","fake":"refreshToken2"}]'
    );
    expect(executeService.execute).toHaveBeenCalledWith("az logout");
  });

  test("deleteDependentSessions", async () => {
    const azureSession = { azureIntegrationId: "fakeIntegrationId", sessionId: "fakeSessionId" };
    const sessions = [{ azureIntegrationId: "wrongId" }, {}, azureSession];
    const repository = { getSessions: jest.fn(() => sessions), deleteSession: jest.fn() } as any;
    const behaviouralNotifier = { setSessions: jest.fn() } as any;

    const service = new AzureIntegrationService(repository, null, behaviouralNotifier, null, null, null, null, null);
    (service as any).deleteDependentSessions("fakeIntegrationId");

    expect(repository.getSessions).toHaveBeenCalledTimes(2);
    expect(repository.deleteSession).toHaveBeenCalledWith(azureSession.sessionId);
    expect(behaviouralNotifier.setSessions).toHaveBeenCalledWith(sessions);
  });
});

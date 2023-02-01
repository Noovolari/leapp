import { describe, expect, jest, test } from "@jest/globals";
import { AzureIntegrationService } from "./azure-integration-service";
import { SessionType } from "../../models/session-type";
import { SessionStatus } from "../../models/session-status";
import { LoggedException, LogLevel } from "../log-service";

describe("AzureIntegrationService", () => {
  test("validateAlias - empty alias", () => {
    const aliasParam = "";
    const actualValidationResult = AzureIntegrationService.validateAlias(aliasParam);

    expect(actualValidationResult).toBe("Empty alias");
  });

  test("validateAlias - only spaces alias", () => {
    const aliasParam = "      ";
    const actualValidationResult = AzureIntegrationService.validateAlias(aliasParam);

    expect(actualValidationResult).toBe("Empty alias");
  });

  test("validateAlias - valid alias", () => {
    const aliasParam = "alias";
    const actualValidationResult = AzureIntegrationService.validateAlias(aliasParam);

    expect(actualValidationResult).toBe(true);
  });

  test("validateTenantId - empty alias", () => {
    const tenantIdParam = "";
    const actualValidationResult = AzureIntegrationService.validateTenantId(tenantIdParam);

    expect(actualValidationResult).toBe("Empty tenant id");
  });

  test("validateTenantId - only spaces alias", () => {
    const tenantIdParam = "      ";
    const actualValidationResult = AzureIntegrationService.validateTenantId(tenantIdParam);

    expect(actualValidationResult).toBe("Empty tenant id");
  });

  test("validateTenantId - valid alias", () => {
    const tenantIdParam = "alias";
    const actualValidationResult = AzureIntegrationService.validateTenantId(tenantIdParam);

    expect(actualValidationResult).toBe(true);
  });

  test("checkCliVersion, cli installed with version 2.30", async () => {
    const expectedCliOutput = `azure-cli                         2.30.0 *\n\ncore                              2.36.0 *\ntelemetry                          1.0.6\n\nDependencies:\nmsal                              1.17.0\nazure-mgmt-resource               20.0.0\n\nPython location '/usr/local/Cellar/azure-cli/2.36.0/libexec/bin/python'\nExtensions directory '/Users/marcovanetti/.azure/cliextensions'\n\nPython (Darwin) 3.10.4 (main, Apr 26 2022, 19:42:59) [Clang 13.1.6 (clang-1316.0.21.2)]\n\nLegal docs and information: aka.ms/AzureCliLegal\n\n\nYou have 2 updates available. Consider updating your CLI installation with 'az upgrade'\n\nPlease let us know how we are doing: https://aka.ms/azureclihats\nand let us know if you're interested in trying out our newest features: https://aka.ms/CLIUXstudy\n`;
    const executeService = {
      execute: jest.fn(async () => expectedCliOutput),
    } as any;
    const service = new AzureIntegrationService(null, null, null, null, executeService, null, null);
    await service.checkCliVersion();

    expect(executeService.execute).toHaveBeenCalledWith("az --version");
  });

  test("checkCliVersion, cli installed with version 2.31", async () => {
    const expectedCliOutput = `azure-cli                         2.31.0`;
    const executeService = { execute: async () => expectedCliOutput } as any;
    const service = new AzureIntegrationService(null, null, null, null, executeService, null, null);
    await service.checkCliVersion();
  });

  test("checkCliVersion, cli installed with version 2.29", async () => {
    const expectedCliOutput = `azure-cli                         2.29.0`;
    const executeService = { execute: async () => expectedCliOutput } as any;
    const service = new AzureIntegrationService(null, null, null, null, executeService, null, null);
    await expect(service.checkCliVersion()).rejects.toThrowError("Unsupported Azure CLI version (< 2.30). Please update Azure CLI.");
  });

  test("checkCliVersion, cli with unknown version", async () => {
    const executeService = { execute: async () => Promise.reject() } as any;
    const service = new AzureIntegrationService(null, null, null, null, executeService, null, null);
    await expect(service.checkCliVersion()).rejects.toThrowError("Azure CLI is not installed.");
  });

  test("checkCliVersion, cli not installed", async () => {
    const expectedCliOutput = `azure-cli version-2.31.0`;
    const executeService = { execute: async () => expectedCliOutput } as any;
    const service = new AzureIntegrationService(null, null, null, null, executeService, null, null);
    await expect(service.checkCliVersion()).rejects.toThrowError("Unknown Azure CLI version.");
  });

  test("createIntegration", async () => {
    const repository = {
      getDefaultLocation: jest.fn(() => "fakeLocation"),
      addAzureIntegration: jest.fn(),
    } as any;
    const service = new AzureIntegrationService(repository, null, null, null, null, null, null);
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
    const service = new AzureIntegrationService(repository, null, null, null, null, null, null);

    await service.updateIntegration("fakeId", { alias: "fakeAlias", tenantId: "fakeTenantId" });
    expect(repository.getAzureIntegration).toHaveBeenCalledWith("fakeId");
    expect(repository.getDefaultLocation).toHaveBeenCalled();
    expect(repository.updateAzureIntegration).toHaveBeenCalledWith(
      "fakeId",
      "fakeAlias",
      "fakeTenantId",
      "fakeLocation",
      "fakeOnlineStatus",
      undefined
    );
  });

  test("deleteIntegration", async () => {
    const repository = {
      deleteAzureIntegration: jest.fn(),
    } as any;
    const service = new AzureIntegrationService(repository, null, null, null, null, null, null);
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
    const service = new AzureIntegrationService(repository, null, null, null, null, null, null);
    const integration = await service.getIntegration(integrationId);
    expect(integration).toBe(expectedIntegration);
    expect(repository.getAzureIntegration).toHaveBeenCalledWith(integrationId);
  });

  test("getIntegrations", async () => {
    const repository = {
      listAzureIntegrations: () => "integrations",
    } as any;
    const service = new AzureIntegrationService(repository, null, null, null, null, null, null);

    const integrations = service.getIntegrations();
    expect(integrations).toBe("integrations");
  });

  test("syncSessions, if error in execute service with code 1 and stdoutput identifying integration we catch a specific error", async () => {
    const executeService = {
      execute: jest.fn().mockRejectedValue({
        code: 1,
        killed: false,
        signal: null,
        stdout: "ERROR: No subscriptions found for X",
      }),
    } as any;

    const azurePersistenceService = {} as any;
    const repository = { getSessions: () => [] } as any;
    const azureSessionService = {} as any;

    const service = new AzureIntegrationService(repository, null, null, null, executeService, azureSessionService, azurePersistenceService);
    const integrationId = "integrationId";
    const integration = { tenantId: "tenantId", region: "region", alias: "alias" } as any;
    service.getIntegration = jest.fn(() => integration);

    await expect(service.syncSessions(integrationId)).rejects.toThrow(
      new LoggedException(`No Azure Subscriptions found for integration: ${integration.alias}`, this, LogLevel.warn, true)
    );
  });

  test("syncSessions, if error in execute service with killed true we catch a specific error", async () => {
    const executeService = {
      execute: jest.fn().mockRejectedValue({
        code: null,
        killed: true,
      }),
    } as any;

    const azurePersistenceService = {} as any;
    const repository = { getSessions: () => [] } as any;
    const azureSessionService = {} as any;

    const service = new AzureIntegrationService(repository, null, null, null, executeService, azureSessionService, azurePersistenceService);
    const integrationId = "integrationId";
    const integration = { tenantId: "tenantId", region: "region", alias: "alias" } as any;
    service.getIntegration = jest.fn(() => integration);

    await expect(service.syncSessions(integrationId)).rejects.toThrow(
      new LoggedException(`Timeout error during Azure login with integration: ${integration.alias}`, this, LogLevel.error, true)
    );
  });

  test("syncSessions, if generic error in execute service we catch a generic error", async () => {
    const executeService = {
      execute: jest.fn().mockRejectedValue({
        code: 12,
      }),
    } as any;

    const azurePersistenceService = {} as any;
    const repository = { getSessions: () => [] } as any;
    const azureSessionService = {} as any;

    const service = new AzureIntegrationService(repository, null, null, null, executeService, azureSessionService, azurePersistenceService);
    const integrationId = "integrationId";
    const integration = { tenantId: "tenantId", region: "region", alias: "alias" } as any;
    service.getIntegration = jest.fn(() => integration);

    await expect(service.syncSessions(integrationId)).rejects.toThrow(
      new LoggedException(JSON.parse(JSON.stringify({ code: "12" })).toString(), this, LogLevel.error, false)
    );
  });

  test("syncSessions, no available azure local sessions, with another azure integration's session active", async () => {
    const executeService = { execute: jest.fn() } as any;
    const azureProfile = {
      subscriptions: [{ id: "subscriptionId", name: "subscriptionName" }],
    };
    const azurePersistenceService = { loadProfile: () => azureProfile } as any;
    const sessions = [
      { type: SessionType.awsIamUser },
      {
        sessionId: "anotherSessionId",
        type: SessionType.azure,
        azureIntegrationId: "anotherIntegrationId",
        status: SessionStatus.active,
      },
    ];
    const repository = { getSessions: () => sessions } as any;
    const azureSessionService = { create: jest.fn(async () => null), stop: jest.fn(async () => null) } as any;
    const service = new AzureIntegrationService(repository, null, null, null, executeService, azureSessionService, azurePersistenceService);
    service.setOnline = jest.fn();
    (service as any).moveSecretsToKeychain = jest.fn();
    (service as any).notifyIntegrationChanges = jest.fn();

    const integrationId = "integrationId";
    const integration = { tenantId: "tenantId", region: "region" } as any;
    service.getIntegration = jest.fn(() => integration);

    const syncResult = await service.syncSessions(integrationId);
    expect(syncResult).toEqual({ sessionsAdded: 1, sessionsDeleted: 0 });

    expect(azureSessionService.stop).toHaveBeenCalledWith("anotherSessionId");
    expect(service.getIntegration).toHaveBeenCalledWith(integrationId);
    expect(executeService.execute).toHaveBeenCalledWith("az login --tenant tenantId 2>&1");
    expect(azureSessionService.create).toHaveBeenCalledWith({
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

  test("syncSessions, active azure local session to keep", async () => {
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
        sessionName: "subscriptionName",
        tenantId: "tenantId",
        subscriptionId: "subscriptionId",
        region: "region",
        status: SessionStatus.active,
        azureIntegrationId: integrationId,
      },
    ];
    const repository = { getSessions: () => sessions } as any;
    const azureSessionService = { create: jest.fn(), start: jest.fn(), stop: jest.fn() } as any;
    const service = new AzureIntegrationService(repository, null, null, null, executeService, azureSessionService, azurePersistenceService);
    service.setOnline = jest.fn();
    (service as any).moveSecretsToKeychain = jest.fn();
    (service as any).notifyIntegrationChanges = jest.fn();

    const integration = { tenantId: "tenantId", region: "region" } as any;
    service.getIntegration = jest.fn(() => integration);

    const syncResult = await service.syncSessions(integrationId);
    expect(syncResult).toEqual({ sessionsAdded: 0, sessionsDeleted: 0 });

    expect(service.getIntegration).toHaveBeenCalledWith(integrationId);
    expect(executeService.execute).toHaveBeenCalledWith("az login --tenant tenantId 2>&1");
    expect(azureSessionService.stop).toHaveBeenCalledWith("sessionId");
    expect(azureSessionService.start).toHaveBeenCalledWith("sessionId");
    expect(azureSessionService.create).not.toHaveBeenCalled();
    expect((service as any).moveSecretsToKeychain).toHaveBeenCalledWith(integration, azureProfile);
    expect(service.setOnline).toHaveBeenCalledWith(integration, true);
    expect((service as any).notifyIntegrationChanges).toHaveBeenCalled();
  });

  test("syncSessions, inactive azure local session to keep", async () => {
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
        status: SessionStatus.inactive,
        azureIntegrationId: integrationId,
      },
    ];
    const repository = { getSessions: () => sessions } as any;
    const azureSessionService = { create: jest.fn(), start: jest.fn(), stop: jest.fn() } as any;
    const service = new AzureIntegrationService(repository, null, null, null, executeService, azureSessionService, azurePersistenceService);
    service.setOnline = jest.fn();
    (service as any).moveSecretsToKeychain = jest.fn();
    (service as any).notifyIntegrationChanges = jest.fn();

    const integration = { tenantId: "tenantId", region: "region" } as any;
    service.getIntegration = jest.fn(() => integration);

    const syncResult = await service.syncSessions(integrationId);
    expect(syncResult).toEqual({ sessionsAdded: 0, sessionsDeleted: 0 });

    expect(service.getIntegration).toHaveBeenCalledWith(integrationId);
    expect(executeService.execute).toHaveBeenCalledWith("az login --tenant tenantId 2>&1");
    expect(azureSessionService.stop).not.toHaveBeenCalled();
    expect(azureSessionService.start).not.toHaveBeenCalled();
    expect(azureSessionService.create).not.toHaveBeenCalled();
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
    const azureSessionService = {
      delete: jest.fn(),
      create: jest.fn(),
    } as any;
    const service = new AzureIntegrationService(repository, null, null, null, executeService, azureSessionService, azurePersistenceService);
    service.setOnline = jest.fn();
    (service as any).moveSecretsToKeychain = jest.fn();
    (service as any).notifyIntegrationChanges = jest.fn();

    const integration = { tenantId: "tenantId", region: "region" } as any;
    service.getIntegration = jest.fn(() => integration);

    const syncResult = await service.syncSessions(integrationId);
    expect(syncResult).toEqual({ sessionsAdded: 1, sessionsDeleted: 1 });

    expect(service.getIntegration).toHaveBeenCalledWith(integrationId);
    expect(executeService.execute).toHaveBeenCalledWith("az login --tenant tenantId 2>&1");
    expect(azureSessionService.delete).toHaveBeenCalledWith("sessionId");
    expect(azureSessionService.create).toHaveBeenCalledWith({
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

  test("syncSessions, deleteDependentSessions method is called once if 'ERROR: No subscriptions found for' was catched in the 'az login' command stdout", async () => {
    const executeService = {
      execute: jest.fn(() => {
        const azLoginError = {
          code: 1,
          killed: false,
          signal: null,
          stdout: "ERROR: No subscriptions found for",
        };
        return Promise.reject(azLoginError);
      }),
    } as any;

    const integrationAlias = "fake-alias";

    const service = new AzureIntegrationService(null, null, null, null, executeService, null, null);
    (service as any).getIntegration = jest.fn(() => ({
      alias: integrationAlias,
      tenantId: "fake-tenant-id",
    }));
    (service as any).deleteDependentSessions = jest.fn();

    try {
      await service.syncSessions("fake-integration-id");
    } catch (err) {
      expect(err instanceof LoggedException).toBeTruthy();
      expect(err.message).toEqual(`No Azure Subscriptions found for integration: ${integrationAlias}`);
      expect(err.level).toEqual(LogLevel.warn);
      expect(err.display).toBeTruthy();
    }

    expect((service as any).deleteDependentSessions).toHaveBeenCalledTimes(1);
  });

  test("syncSessions, timeout error is raised if 'az login' command raised error with code === null and killed === true", async () => {
    const executeService = {
      execute: jest.fn(() => {
        const azLoginError = {
          code: null,
          killed: true,
        };
        return Promise.reject(azLoginError);
      }),
    } as any;

    const integrationAlias = "fake-alias";

    const service = new AzureIntegrationService(null, null, null, null, executeService, null, null);
    (service as any).getIntegration = jest.fn(() => ({
      alias: integrationAlias,
      tenantId: "fake-tenant-id",
    }));

    try {
      await service.syncSessions("fake-integration-id");
    } catch (err) {
      expect(err instanceof LoggedException).toBeTruthy();
      expect(err.message).toEqual(`Timeout error during Azure login with integration: ${integrationAlias}`);
      expect(err.level).toEqual(LogLevel.error);
      expect(err.display).toBeTruthy();
    }
  });

  test("setOnline, is online, forcedState", async () => {
    const repository = { updateAzureIntegration: jest.fn() } as any;
    const azurePersistenceService = { loadMsalCache: jest.fn(), loadProfile: jest.fn() } as any;
    const service = new AzureIntegrationService(repository, null, null, null, null, null, azurePersistenceService);

    const integration = { id: "fakeId", alias: "fakeAlias", tenantId: "fakeTenant", region: "fakeRegion", isOnline: "fakeOnline" } as any;
    const forcedIsOnlineState = true;
    await service.setOnline(integration, forcedIsOnlineState);
    expect(repository.updateAzureIntegration).toHaveBeenCalledWith("fakeId", "fakeAlias", "fakeTenant", "fakeRegion", forcedIsOnlineState, undefined);
    expect(azurePersistenceService.loadMsalCache).not.toHaveBeenCalled();
    expect(azurePersistenceService.loadProfile).not.toHaveBeenCalled();
  });

  test("setOnline, is not online, forcedState", async () => {
    const repository = { updateAzureIntegration: jest.fn() } as any;
    const azurePersistenceService = { loadMsalCache: jest.fn(), loadProfile: jest.fn() } as any;
    const service = new AzureIntegrationService(repository, null, null, null, null, null, azurePersistenceService);

    const integration = { id: "fakeId", alias: "fakeAlias", tenantId: "fakeTenant", region: "fakeRegion", isOnline: "fakeOnline" } as any;
    const forcedIsOnlineState = false;
    await service.setOnline(integration, forcedIsOnlineState);
    expect(repository.updateAzureIntegration).toHaveBeenCalledWith("fakeId", "fakeAlias", "fakeTenant", "fakeRegion", forcedIsOnlineState, undefined);
    expect(azurePersistenceService.loadMsalCache).not.toHaveBeenCalled();
    expect(azurePersistenceService.loadProfile).not.toHaveBeenCalled();
  });

  test("setOnline, is online, without forcedState", async () => {
    const azurePersistenceService = { getAzureSecrets: jest.fn(() => ({ profile: true, account: true, refreshToken: true })) } as any;
    const repository = { updateAzureIntegration: jest.fn() } as any;
    const service = new AzureIntegrationService(repository, null, null, null, null, null, azurePersistenceService);
    const integration = { id: "fakeId", alias: "fakeAlias", tenantId: "fakeTenant", region: "fakeRegion", isOnline: false } as any;
    await service.setOnline(integration);

    expect(repository.updateAzureIntegration).toHaveBeenCalledWith("fakeId", "fakeAlias", "fakeTenant", "fakeRegion", true, undefined);
    expect(azurePersistenceService.getAzureSecrets).toHaveBeenCalledWith("fakeId");
  });

  test("setOnline, is not online, without forcedState", async () => {
    const azurePersistenceService = { getAzureSecrets: jest.fn(() => ({ profile: false, account: true, refreshToken: true })) } as any;
    const repository = { updateAzureIntegration: jest.fn() } as any;
    const service = new AzureIntegrationService(repository, null, null, null, null, null, azurePersistenceService);
    service.logout = jest.fn(async () => null);

    const integration = { id: "fakeId", alias: "fakeAlias", tenantId: "fakeTenant", region: "fakeRegion", isOnline: true } as any;
    await service.setOnline(integration);

    expect(repository.updateAzureIntegration).toHaveBeenCalledWith("fakeId", "fakeAlias", "fakeTenant", "fakeRegion", false, undefined);
    expect(azurePersistenceService.getAzureSecrets).toHaveBeenCalledWith("fakeId");
    expect(service.logout).toHaveBeenCalledWith("fakeId");
  });

  test("logout, integration is offline", async () => {
    const azurePersistenceService = { deleteAzureSecrets: jest.fn(async () => null) } as any;
    const repository = { updateAzureIntegration: jest.fn() } as any;
    const service = new AzureIntegrationService(repository, null, null, null, null, null, azurePersistenceService);
    const integration = { isOnline: false };
    service.getIntegration = jest.fn(() => integration) as any;
    service.setOnline = jest.fn();
    (service as any).deleteDependentSessions = jest.fn();
    (service as any).notifyIntegrationChanges = jest.fn();

    await service.logout("fakeId");
    expect(service.getIntegration).toHaveBeenCalledWith("fakeId");
    expect(azurePersistenceService.deleteAzureSecrets).not.toHaveBeenCalled();
    expect(service.setOnline).toHaveBeenCalledWith(integration, false);
    expect((service as any).deleteDependentSessions).toHaveBeenCalledWith("fakeId");
    expect((service as any).notifyIntegrationChanges).toHaveBeenCalled();
  });

  test("logout, integration is online", async () => {
    const azurePersistenceService = { deleteAzureSecrets: jest.fn(async () => null) } as any;
    const repository = { updateAzureIntegration: jest.fn() } as any;
    const service = new AzureIntegrationService(repository, null, null, null, null, null, azurePersistenceService);
    const integration = { isOnline: true };
    service.getIntegration = jest.fn(() => integration) as any;
    service.setOnline = jest.fn();
    (service as any).deleteDependentSessions = jest.fn();
    (service as any).notifyIntegrationChanges = jest.fn();

    await service.logout("fakeId");
    expect(service.getIntegration).toHaveBeenCalledWith("fakeId");
    expect(azurePersistenceService.deleteAzureSecrets).toHaveBeenCalledWith("fakeId");
    expect(service.setOnline).toHaveBeenCalledWith(integration, false);
    expect((service as any).deleteDependentSessions).toHaveBeenCalledWith("fakeId");
    expect((service as any).notifyIntegrationChanges).toHaveBeenCalled();
  });

  test("remainingHours", async () => {
    const service = new AzureIntegrationService(null, null, null, null, null, null, null);
    const remainingHours = service.remainingHours(null);

    expect(remainingHours).toBe("90 days");
  });

  test("notifyIntegrationChanges", async () => {
    const repository = {
      listAwsSsoIntegrations: () => ["fakeSsoIntegration"],
      listAzureIntegrations: () => ["fakeAzureIntegration"],
    } as any;
    const behaviouralNotifier = {
      setIntegrations: jest.fn(),
    } as any;
    const service = new AzureIntegrationService(repository, behaviouralNotifier, null, null, null, null, null);
    (service as any).notifyIntegrationChanges();

    expect(behaviouralNotifier.setIntegrations).toHaveBeenCalledWith(["fakeSsoIntegration", "fakeAzureIntegration"]);
  });

  test("moveSecretsToKeychain", async () => {
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
    const azurePersistenceService = {
      loadMsalCache: jest.fn(async () => msalTokenCache),
      setAzureSecrets: jest.fn(async () => null),
    } as any;

    const service = new AzureIntegrationService(null, null, null, null, executeService, null, azurePersistenceService);

    const integration = { id: "fakeId", tenantId: "fakeTenantId" } as any;
    const azureProfile = { fake: "azureProfile" } as any;
    await (service as any).moveSecretsToKeychain(integration, azureProfile);

    expect(azurePersistenceService.setAzureSecrets).toHaveBeenCalledWith("fakeId", {
      profile: { fake: "azureProfile" },
      // eslint-disable-next-line @typescript-eslint/naming-convention
      account: ["accountKey2", { home_account_id: "fakeHomeAccountId", fake: "account2" }],
      // eslint-disable-next-line @typescript-eslint/naming-convention
      refreshToken: ["refreshTokenKey2", { home_account_id: "fakeHomeAccountId", fake: "refreshToken2" }],
    });
    expect(executeService.execute).toHaveBeenCalledWith("az logout");
  });

  test("deleteDependentSessions", async () => {
    const azureSession = { azureIntegrationId: "fakeIntegrationId", sessionId: "fakeSessionId" };
    const sessions = [{ azureIntegrationId: "wrongId" }, {}, azureSession];
    const repository = { getSessions: jest.fn(() => sessions) } as any;
    const azureSessionService = { delete: jest.fn(async () => null) } as any;

    const service = new AzureIntegrationService(repository, null, null, null, null, azureSessionService, null);
    (service as any).deleteDependentSessions("fakeIntegrationId");

    expect(repository.getSessions).toHaveBeenCalled();
    expect(azureSessionService.delete).toHaveBeenCalledWith(azureSession.sessionId);
  });
});

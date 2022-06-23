import { afterAll, describe, expect, jest, test } from "@jest/globals";
import { AzureSessionService } from "./azure-session-service";
import { SessionType } from "../../../models/session-type";
import { AzureSession } from "../../../models/azure/azure-session";
import { SessionStatus } from "../../../models/session-status";
import { LoggedEntry, LogLevel } from "../../log-service";
import { AzureSubscription } from "../../azure-persistence-service";
import { AzureIntegration } from "../../../models/azure/azure-integration";

describe("AzureSessionService", () => {
  afterAll(() => {
    jest.useRealTimers();
  });

  test("getDependantSessions", async () => {
    const azureSessionService = new AzureSessionService(null, null, null, null, null, null, null, null);
    const dependantSessions = azureSessionService.getDependantSessions(null);
    expect(dependantSessions).toEqual([]);
  });

  test("create", async () => {
    const sessionParams = {
      sessionName: "fakeSessionName",
      region: "fakeRegion",
      subscriptionId: "fakeSubscriptionId",
      tenantId: "fakeTenantId",
      azureIntegrationId: "fakeIntegrationId",
    };

    const repository = {
      addSession: jest.fn((session: any) => {
        expect(session).toMatchObject(sessionParams);
        expect(session.type).toBe(SessionType.azure);
      }),
      getSessions: () => ["session1"],
    } as any;
    const sessionNotifier = { setSessions: jest.fn() } as any;
    const azureSessionService = new AzureSessionService(sessionNotifier, repository, null, null, null, null, null, null);
    await azureSessionService.create(sessionParams);
    expect(repository.addSession).toHaveBeenCalled();
    expect(sessionNotifier.setSessions).toHaveBeenCalledWith(["session1"]);
  });

  test("rotate, token still valid", async () => {
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date(2022, 12, 1, 10, 0, 0, 0));
    const sessionTokenExpiration = new Date(2022, 12, 1, 10, 21, 0, 0).toISOString();
    const repository = {
      getSessionById: () => ({ integrationId: "fakeIntegrationId" }),
      getAzureIntegration: () => ({ tokenExpiration: sessionTokenExpiration }),
    } as any;

    const azureSessionService = new AzureSessionService(null, repository, null, null, null, null, null, null);
    azureSessionService.start = jest.fn(async () => null);

    await azureSessionService.rotate("fakeId");
    expect(azureSessionService.start).not.toHaveBeenCalled();
  });

  test("rotate, token should be rotated", async () => {
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date(2022, 12, 1, 10, 0, 0, 1));
    const sessionTokenExpiration = new Date(2022, 12, 1, 10, 21, 0, 0).toISOString();
    const repository = {
      getSessionById: () => ({ integrationId: "fakeIntegrationId" }),
      getAzureIntegration: () => ({ tokenExpiration: sessionTokenExpiration }),
    } as any;

    const azureSessionService = new AzureSessionService(null, repository, null, null, null, null, null, null);
    azureSessionService.start = jest.fn(async () => null);

    await azureSessionService.rotate("fakeId");
    expect(azureSessionService.start).toHaveBeenCalled();
  });

  test("stop, 'az logout' command is executed when profile contains less than 2 subscriptions", () => {
    const azureSession = new AzureSession("fake-session-name", "fake-region", "fake-subscription-id", "fake-tenant-id", "fake-azure-integration-id");
    azureSession.status = SessionStatus.active;

    const repository = {
      getSessionById: () => ({}),
      getSessions: () => [azureSession],
      updateSessions: () => {},
      getAzureIntegration: () => ({}),
      updateAzureIntegration: () => {},
    } as any;

    const sessionNotifier = {
      setSessions: () => {},
    } as any;

    const executeService = {
      execute: () => {
        expect(azureSession.status).toEqual(SessionStatus.pending);
      },
    } as any;

    const azurePersistenceService = {
      loadProfile: () => ({ subscriptions: [{}] }),
    } as any;

    const logger = {
      log: (loggedEntry: LoggedEntry) => {
        console.log(loggedEntry);
      },
    } as any;

    const azureSessionService = new AzureSessionService(
      sessionNotifier,
      repository,
      null,
      executeService,
      null,
      null,
      azurePersistenceService,
      logger
    );

    azureSessionService.stop(azureSession.sessionId);
  });

  test("stop, logService's log is called if an error is thrown inside try catch block", async () => {
    const azureSession = new AzureSession("fake-session-name", "fake-region", "fake-subscription-id", "fake-tenant-id", "fake-azure-integration-id");
    azureSession.status = SessionStatus.active;

    const error = new Error("fake-error");

    const repository = {
      getSessionById: () => {
        throw error;
      },
      getSessions: () => ["fakeId"],
    } as any;

    const logService = {
      log: jest.fn(() => {}),
    } as any;

    const azureSessionService = new AzureSessionService(null, repository, null, null, null, null, null, logService);

    (azureSessionService as any).sessionLoading = jest.fn();
    await azureSessionService.stop(azureSession.sessionId);

    expect(logService.log).toHaveBeenNthCalledWith(1, new LoggedEntry(error.message, this, LogLevel.warn));
  });

  test("stop, when the default subscription is stopped, the first of the remaining subscriptions is set to default and persisted", async () => {
    const subscriptionId = "fake-subscription-2-id";
    const subscriptionTenantId = "fake-tenant-id";
    const azureSession = new AzureSession("fake-session-name", "fake-region", subscriptionId, "fake-tenant-id", "fake-azure-integration-id");
    azureSession.status = SessionStatus.active;

    const sub1: AzureSubscription = {
      id: "fake-subscription-1-id",
      name: "fake-name",
      state: "fake-state",
      user: { name: "fake-user-name", type: "fake-user-type" },
      isDefault: false,
      tenantId: subscriptionTenantId,
      environmentName: "fake-env-name",
      homeTenantId: subscriptionTenantId,
      managedByTenants: [],
    };

    const sub2: AzureSubscription = {
      id: subscriptionId,
      name: "fake-name",
      state: "fake-state",
      user: { name: "fake-user-name", type: "fake-user-type" },
      isDefault: true,
      tenantId: subscriptionTenantId,
      environmentName: "fake-env-name",
      homeTenantId: subscriptionTenantId,
      managedByTenants: [],
    };

    const sub3: AzureSubscription = {
      id: "fake-subscription-3-id",
      name: "fake-name",
      state: "fake-state",
      user: { name: "fake-user-name", type: "fake-user-type" },
      isDefault: false,
      tenantId: subscriptionTenantId,
      environmentName: "fake-env-name",
      homeTenantId: subscriptionTenantId,
      managedByTenants: [],
    };

    const expectedSub1: AzureSubscription = {
      id: "fake-subscription-1-id",
      name: "fake-name",
      state: "fake-state",
      user: { name: "fake-user-name", type: "fake-user-type" },
      isDefault: true,
      tenantId: subscriptionTenantId,
      environmentName: "fake-env-name",
      homeTenantId: subscriptionTenantId,
      managedByTenants: [],
    };

    const subscriptions = [sub1, sub2, sub3];
    const expectedSubscriptions = [expectedSub1, sub3];
    const expectedProfiles = {
      subscriptions: expectedSubscriptions,
    };

    const repository = {
      getSessionById: () => azureSession,
    } as any;

    const azurePersistenceService = {
      loadProfile: () => ({ subscriptions }),
      saveProfile: jest.fn(),
    } as any;

    const azureSessionService = new AzureSessionService(null, repository, null, null, null, null, azurePersistenceService, null);
    (azureSessionService as any).sessionLoading = () => {};
    (azureSessionService as any).sessionDeactivated = () => {};

    await azureSessionService.stop(azureSession.sessionId);

    expect(azurePersistenceService.saveProfile).toBeCalledTimes(1);
    expect(azurePersistenceService.saveProfile).toHaveBeenCalledWith(expectedProfiles);
  });

  test("stop, when there is <= 1 subscription in the profile, the AzureIntegration token expiration is set to undefined once 'az logout' is called", async () => {
    const subscriptionId = "fake-subscription-1-id";
    const tenantId = "fake-tenant-id";
    const integrationId = "fake-integration-id";
    const azureSession = new AzureSession("fake-session-name", "fake-region", subscriptionId, tenantId, integrationId);
    azureSession.status = SessionStatus.active;

    const azureIntegration = new AzureIntegration(integrationId, "fake-alias", tenantId, "fake-region");
    azureIntegration.isOnline = true;

    const sub1: AzureSubscription = {
      id: subscriptionId,
      name: "fake-name",
      state: "fake-state",
      user: { name: "fake-user-name", type: "fake-user-type" },
      isDefault: true,
      tenantId,
      environmentName: "fake-env-name",
      homeTenantId: tenantId,
      managedByTenants: [],
    };

    const subscriptions = [sub1];

    const executeService = {
      execute: jest.fn(),
    } as any;

    const repository = {
      getSessionById: () => azureSession,
      updateAzureIntegration: jest.fn(() => {
        expect(executeService.execute).toBeCalledTimes(1);
        expect(executeService.execute).toHaveBeenCalledWith("az logout");
      }),
      getAzureIntegration: () => azureIntegration,
    } as any;

    const azurePersistenceService = {
      loadProfile: () => ({ subscriptions }),
      saveProfile: jest.fn(),
    } as any;

    const azureSessionService = new AzureSessionService(null, repository, null, executeService, null, null, azurePersistenceService, null);
    (azureSessionService as any).sessionLoading = () => {};
    (azureSessionService as any).sessionDeactivated = () => {};

    await azureSessionService.stop(azureSession.sessionId);

    expect(repository.updateAzureIntegration).toBeCalledTimes(1);
    expect(repository.updateAzureIntegration).toHaveBeenCalledWith(
      azureIntegration.id,
      azureIntegration.alias,
      azureIntegration.tenantId,
      azureIntegration.region,
      azureIntegration.isOnline,
      undefined
    );
  });

  test("stop, sessionDeactivated is called once and the stopped session becomes inactive", async () => {
    const subscriptionId = "fake-subscription-1-id";
    const tenantId = "fake-tenant-id";
    const integrationId = "fake-integration-id";
    const azureSession = new AzureSession("fake-session-name", "fake-region", subscriptionId, tenantId, integrationId);
    azureSession.status = SessionStatus.active;
    const azureIntegration = new AzureIntegration(integrationId, "fake-alias", tenantId, "fake-region");

    const executeService = {
      execute: () => {},
    } as any;

    const repository = {
      getSessions: () => [azureSession],
      getSessionById: () => azureSession,
      updateAzureIntegration: () => {},
      getAzureIntegration: () => azureIntegration,
      updateSessions: () => {},
    } as any;

    const azurePersistenceService = {
      loadProfile: () => ({
        subscriptions: [],
      }),
      saveProfile: () => {},
    } as any;

    const azureSessionService = new AzureSessionService(null, repository, null, executeService, null, null, azurePersistenceService, null);
    (azureSessionService as any).sessionLoading = () => {};

    const spySessionDeactivated = jest.spyOn(azureSessionService, "sessionDeactivated");
    await azureSessionService.stop(azureSession.sessionId);

    expect(spySessionDeactivated).toBeCalledTimes(1);
    expect(spySessionDeactivated).toHaveBeenCalledWith(azureSession.sessionId);
    expect(azureSession.status).toEqual(SessionStatus.inactive);
  });

  test("start, with integration token not expired, one session available", async () => {
    const sessionId = "fake-session-id";
    const session = {
      sessionId,
      azureIntegrationId: "fakeIntegrationId",
      subscriptionId: "fakeSubscriptionId",
      type: SessionType.azure,
      region: "fakeRegion",
    } as AzureSession;

    const repository = {
      getSessionById: jest.fn(() => session),
      getSessions: () => [session],
      getAzureIntegration: () => ({ tokenExpiration: new Date().toISOString() }),
    } as any;

    const executeService = {
      execute: jest.fn(async () => {}),
    } as any;

    const azureSessionService = new AzureSessionService(null, repository, null, executeService, null, null, null, null);
    (azureSessionService as any).stopAllOtherSessions = jest.fn(async () => {});
    (azureSessionService as any).sessionLoading = jest.fn();
    (azureSessionService as any).updateProfiles = jest.fn(async () => {});
    (azureSessionService as any).sessionActivated = jest.fn(async () => {});

    await azureSessionService.start(sessionId);

    expect(repository.getSessionById).toHaveBeenCalledTimes(1);
    expect(repository.getSessionById).toHaveBeenCalledWith(sessionId);
    expect((azureSessionService as any).stopAllOtherSessions).toHaveBeenCalledWith(sessionId);
    expect((azureSessionService as any).sessionLoading).toHaveBeenCalledWith(sessionId);
    expect(executeService.execute).toHaveBeenCalledWith("az configure --default location=fakeRegion");

    expect((azureSessionService as any).updateProfiles).toHaveBeenCalledWith("fakeIntegrationId", [session.subscriptionId], "fakeSubscriptionId");
    expect((azureSessionService as any).sessionActivated).toHaveBeenCalledWith(sessionId, undefined);
  });

  test("start, with integration token expiration undefined", async () => {
    const sessionId = "fake-session-id";
    const session = {
      sessionId,
      azureIntegrationId: "fakeIntegrationId",
      subscriptionId: "fakeSubscriptionId",
      tenantId: "fakeTenantId",
      type: SessionType.azure,
    } as AzureSession;

    const repository = {
      getSessionById: () => session,
      getSessions: () => [],
      getAzureIntegration: () => ({
        tokenExpiration: undefined,
        id: "fakeIntId",
        alias: "fakeIntAlias",
        tenantId: "fakeIntTenantId",
        region: "fakeIntRegion",
        isOnline: "fakeIntIsOnline",
      }),
      updateAzureIntegration: jest.fn(() => {}),
    } as any;

    const executeService = {
      execute: jest.fn(async () => {}),
    } as any;

    const msalTokenCache = {
      ["AccessToken"]: {
        tokenKey1: { realm: "wrongTenantId" },
        tokenKey2: { realm: "fakeTenantId", ["expires_on"]: "fakeExpiresOn" },
      },
    };

    const azurePersistenceService = {
      loadMsalCache: jest.fn(async () => msalTokenCache),
    } as any;

    const azureSessionService = new AzureSessionService(null, repository, null, executeService, null, null, azurePersistenceService, null);
    (azureSessionService as any).stopAllOtherSessions = async () => {};
    (azureSessionService as any).sessionLoading = () => {};
    (azureSessionService as any).updateProfiles = async () => {};
    (azureSessionService as any).sessionActivated = () => {};

    (azureSessionService as any).restoreSecretsFromKeychain = jest.fn(async () => {});
    (azureSessionService as any).moveRefreshTokenToKeychain = jest.fn(async () => {});
    (azureSessionService as any).getAccessTokenExpiration = jest.fn(async () => {});

    await azureSessionService.start(sessionId);

    expect((azureSessionService as any).restoreSecretsFromKeychain).toHaveBeenCalledWith("fakeIntegrationId");
    expect(executeService.execute).toHaveBeenNthCalledWith(2, "az account get-access-token --subscription fakeSubscriptionId", undefined, true);
    expect(repository.updateAzureIntegration).toHaveBeenCalledWith(
      "fakeIntId",
      "fakeIntAlias",
      "fakeIntTenantId",
      "fakeIntRegion",
      "fakeIntIsOnline",
      "fakeExpiresOn"
    );
    expect((azureSessionService as any).moveRefreshTokenToKeychain).toHaveBeenCalledWith(msalTokenCache, "fakeIntegrationId", "fakeTenantId");
    expect((azureSessionService as any).getAccessTokenExpiration).toHaveBeenCalledWith(msalTokenCache, "fakeTenantId");
  });

  test("start, with integration token expired", async () => {
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date(2022, 1, 1, 10, 0, 0, 1));
    const tokenExpiration = new Date(2022, 1, 1, 10, 0, 0, 0).toISOString();

    const sessionId = "fake-session-id";
    const session = {
      sessionId,
      azureIntegrationId: "fakeIntegrationId",
      subscriptionId: "fakeSubscriptionId",
      tenantId: "fakeTenantId",
      type: SessionType.azure,
    } as AzureSession;

    const repository = {
      getSessionById: () => session,
      getSessions: () => [],
      getAzureIntegration: () => ({
        tokenExpiration,
      }),
      updateAzureIntegration: jest.fn(() => {}),
    } as any;

    const executeService = {
      execute: jest.fn(async () => {}),
    } as any;

    const msalTokenCache = {
      ["AccessToken"]: {
        tokenKey1: { realm: "wrongTenantId" },
        tokenKey2: { realm: "fakeTenantId", ["expires_on"]: "fakeExpiresOn" },
      },
    };

    const azurePersistenceService = {
      loadMsalCache: jest.fn(async () => msalTokenCache),
    } as any;

    const azureSessionService = new AzureSessionService(null, repository, null, executeService, null, null, azurePersistenceService, null);
    (azureSessionService as any).stopAllOtherSessions = async () => {};
    (azureSessionService as any).sessionLoading = () => {};
    (azureSessionService as any).updateProfiles = async () => {};
    (azureSessionService as any).sessionActivated = () => {};

    (azureSessionService as any).restoreSecretsFromKeychain = jest.fn(async () => {});
    (azureSessionService as any).moveRefreshTokenToKeychain = jest.fn(async () => {});
    (azureSessionService as any).getAccessTokenExpiration = jest.fn(async () => {});

    await azureSessionService.start(sessionId);

    expect((azureSessionService as any).restoreSecretsFromKeychain).toHaveBeenCalledWith("fakeIntegrationId");
    expect((azureSessionService as any).getAccessTokenExpiration).toHaveBeenCalledWith(msalTokenCache, "fakeTenantId");
  });

  test("start, with managed exception", async () => {
    const sessionId = "fake-session-id";
    const session = {
      sessionId,
      azureIntegrationId: "fakeIntegrationId",
      subscriptionId: "fakeSubscriptionId",
      tenantId: "fakeTenantId",
      type: SessionType.azure,
    } as AzureSession;

    const repository = {
      getSessionById: () => session,
      getSessions: () => [],
      updateAzureIntegration: jest.fn(() => {}),
    } as any;

    const executeService = {
      execute: jest.fn(async () => {
        throw new Error("Execute error");
      }),
    } as any;

    const azureSessionService = new AzureSessionService(null, repository, null, executeService, null, null, null, null);
    (azureSessionService as any).stopAllOtherSessions = async () => {};
    (azureSessionService as any).sessionLoading = () => {};
    (azureSessionService as any).sessionDeactivated = jest.fn(() => {});

    await expect(azureSessionService.start(sessionId)).rejects.toThrow("Execute error");

    expect((azureSessionService as any).sessionDeactivated).toHaveBeenCalledWith(sessionId);
  });
});

import { afterAll, describe, expect, jest, test } from "@jest/globals";
import { AzureSessionService } from "./azure-session-service";
import { SessionType } from "../../../models/session-type";
import { AzureSession } from "../../../models/azure/azure-session";
import { SessionStatus } from "../../../models/session-status";
import { LoggedEntry, LoggedException, LogLevel } from "../../log-service";
import { AzureSecrets, AzureSubscription } from "../../azure-persistence-service";
import { AzureIntegration } from "../../../models/azure/azure-integration";
import { JsonCache } from "@azure/msal-node";
import { constants } from "../../../models/constants";

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

  test("update", async () => {
    const sessionNotifier = { setSessions: jest.fn() } as any;
    const azureSessionService = new AzureSessionService(sessionNotifier, null, null, null, null, null, null, null);
    await expect(async () => azureSessionService.update(null, null)).rejects.toThrow(
      new LoggedException(`Update is not supported for Azure Session Type`, this, LogLevel.error, false)
    );
  });

  test("getCloneRequest", () => {
    const azureSessionService = new AzureSessionService(null, null, null, null, null, null, null, null);
    expect(() => azureSessionService.getCloneRequest({ type: SessionType.azure } as any)).rejects.toThrow(
      new LoggedException(`Clone is not supported for sessionType ${SessionType.azure}`, this, LogLevel.error, false)
    );
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

  test("stop, session already inactive", async () => {
    const isInactive = jest.fn(() => true);
    const sessionLoading = jest.fn();

    const azureSessionService = new AzureSessionService(null, null, null, null, null, null, null, null);
    (azureSessionService as any).isInactive = isInactive;
    (azureSessionService as any).sessionLoading = sessionLoading;

    await azureSessionService.stop("sessionId");
    expect(isInactive).toHaveBeenCalledWith("sessionId");
    expect(sessionLoading).not.toHaveBeenCalled();
  });

  test("stop, 'az logout' command is executed when profile contains less than 2 subscriptions", async () => {
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
      execute: jest.fn(() => {
        expect(azureSession.status).toEqual(SessionStatus.pending);
      }),
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
    (azureSessionService as any).isInactive = () => false;

    await azureSessionService.stop(azureSession.sessionId);

    expect(executeService.execute).toHaveBeenCalledWith("az logout");
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
    (azureSessionService as any).isInactive = () => false;
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
    (azureSessionService as any).isInactive = () => false;
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
    (azureSessionService as any).isInactive = () => false;
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
    (azureSessionService as any).isInactive = () => false;
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
      updateSessions: () => {},
      updateAzureIntegration: jest.fn(() => {}),
    } as any;

    const executeService = {
      execute: jest.fn(async () => {}),
    } as any;

    const azurePersistenceService = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      loadMsalCache: jest.fn(async () => ({ AccessToken: jest.fn(() => "") })),
      getAzureSecrets: jest.fn(() => {}),
    };

    const azureSessionService = new AzureSessionService(null, repository, null, executeService, null, null, azurePersistenceService as any, null);
    (azureSessionService as any).stopAllOtherSessions = jest.fn(async () => {});
    (azureSessionService as any).sessionLoading = jest.fn();
    (azureSessionService as any).updateProfiles = jest.fn(async () => {});
    (azureSessionService as any).sessionActivated = jest.fn(async () => {});
    (azureSessionService as any).restoreSecretsFromKeychain = jest.fn(async () => {});
    (azureSessionService as any).moveRefreshTokenToKeychain = jest.fn(async () => {});
    (azureSessionService as any).getAccessTokenExpiration = jest.fn(async () => Promise.resolve(new Date().toISOString()));

    await azureSessionService.start(sessionId);

    expect(repository.getSessionById).toHaveBeenCalledTimes(1);
    expect(repository.getSessionById).toHaveBeenCalledWith(sessionId);
    expect((azureSessionService as any).stopAllOtherSessions).toHaveBeenCalledWith(sessionId);
    expect((azureSessionService as any).sessionLoading).toHaveBeenCalledWith(sessionId);
    expect(executeService.execute).toHaveBeenCalledTimes(2);
    expect(executeService.execute).toHaveBeenCalledWith("az configure --default location=undefined");

    expect((azureSessionService as any).updateProfiles).toHaveBeenCalledWith("fakeIntegrationId", [session.subscriptionId], "fakeSubscriptionId");
    expect((azureSessionService as any).sessionActivated).toHaveBeenCalledWith(sessionId, new Date().toISOString());
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
      getAzureIntegration: jest.fn(() => ({ tokenExpiration: "", region: "useast" })),
      updateAzureIntegration: jest.fn(() => {}),
    } as any;

    const executeService = {
      execute: jest.fn(async () => {
        throw new Error("Execute error");
      }),
    } as any;

    const service = new AzureSessionService(null, repository, null, executeService, null, null, null, null);
    (service as any).stopAllOtherSessions = async () => {};
    (service as any).sessionLoading = () => {};
    (service as any).sessionDeactivated = jest.fn(() => {});

    let expectedError;
    try {
      await service.start(sessionId);
    } catch (error) {
      expectedError = error;
    }
    expect(expectedError.message).toBe("Execute error");
    expect(expectedError.context).toBe(service);
    expect(expectedError.level).toBe(LogLevel.warn);

    expect((service as any).sessionDeactivated).toHaveBeenCalledWith(sessionId);
  });

  test("delete, with active session", async () => {
    const sessions = "sessions";
    let service: AzureSessionService = null;
    const sessionId = "fakeSessionId";
    const repository = {
      getSessionById: jest.fn(() => ({ status: SessionStatus.pending })),
      deleteSession: jest.fn(() => {
        expect(service.stop).toHaveBeenCalledWith(sessionId);
      }),
      getSessions: () => sessions,
    } as any;
    const sessionNotifier = {
      setSessions: jest.fn(),
    } as any;
    service = new AzureSessionService(sessionNotifier, repository, null, null, null, null, null, null);
    service.stop = jest.fn(async () => {});

    await service.delete(sessionId);
    expect(repository.getSessionById).toHaveBeenCalledWith(sessionId);
    expect(repository.deleteSession).toHaveBeenCalledWith(sessionId);
    expect(sessionNotifier.setSessions).toHaveBeenCalledWith(sessions);
  });

  test("delete, with inactive session", async () => {
    const sessions = "sessions";
    const repository = {
      getSessionById: () => ({ status: SessionStatus.inactive }),
      deleteSession: jest.fn(),
      getSessions: () => sessions,
    } as any;
    const sessionNotifier = {
      setSessions: () => {},
    } as any;
    const service = new AzureSessionService(sessionNotifier, repository, null, null, null, null, null, null);
    service.stop = jest.fn(async () => {});

    const sessionId = "fakeSessionId";
    await service.delete(sessionId);

    expect(service.stop).not.toHaveBeenCalled();
    expect(repository.deleteSession).toHaveBeenCalledWith(sessionId);
  });

  test("delete, with exception handling", async () => {
    const errorMessage = "Error to handle";
    const repository = {
      getSessionById: () => ({ status: SessionStatus.inactive }),
      deleteSession: () => {
        throw new Error(errorMessage);
      },
    } as any;
    const service = new AzureSessionService(null, repository, null, null, null, null, null, null);

    let expectedError;
    try {
      await service.delete("fakeSessionId");
    } catch (error) {
      expectedError = error;
    }
    expect(expectedError.message).toBe(errorMessage);
    expect(expectedError.context).toBe(service);
    expect(expectedError.level).toBe(LogLevel.warn);
  });

  test("validateCredentials", async () => {
    const service = new AzureSessionService(null, null, null, null, null, null, null, null);
    expect(await service.validateCredentials("anySessionId")).toBe(false);
  });

  test("restoreSecretsFromKeychain", async () => {
    const msalCache = { ["AppMetadata"]: "metadata" };
    const azureSecrets = { account: ["accountKey", "accountValue"], refreshToken: ["refreshTokenKey", "refreshTokenValue"] };
    const azurePersistenceService = {
      loadMsalCache: jest.fn(async () => msalCache),
      saveMsalCache: jest.fn(async (msalTokenCache: any) => {
        expect(msalTokenCache.Account).toEqual({ accountKey: "accountValue" });
        expect(msalTokenCache.RefreshToken).toEqual({ refreshTokenKey: "refreshTokenValue" });
        expect(msalTokenCache.AccessToken).toEqual({});
        expect(msalTokenCache.IdToken).toEqual({});
      }),
      getAzureSecrets: jest.fn(async () => azureSecrets),
    } as any;

    const service = new AzureSessionService(null, null, null, null, null, null, azurePersistenceService, null);
    const integrationId = "integrationId";
    await (service as any).restoreSecretsFromKeychain(integrationId);

    expect(azurePersistenceService.loadMsalCache).toHaveBeenCalled();
    expect(azurePersistenceService.getAzureSecrets).toHaveBeenCalledWith(integrationId);
    expect(azurePersistenceService.saveMsalCache).toHaveBeenCalled();
  });

  test("restoreSecretsFromKeychain, error handling", async () => {
    const errorMessage = "Error to handle";
    const azurePersistenceService = {
      loadMsalCache: async () => {
        throw new Error(errorMessage);
      },
    } as any;

    const service = new AzureSessionService(null, null, null, null, null, null, azurePersistenceService, null);
    let expectedError;
    try {
      await (service as any).restoreSecretsFromKeychain();
    } catch (error) {
      expectedError = error;
    }
    expect(expectedError.message).toEqual(errorMessage);
    expect(expectedError.context).toBe(service);
    expect(expectedError.level).toBe(LogLevel.warn);
  });

  test("moveRefreshTokenToKeychain", async () => {
    const integrationId = "fakeIntegrationId";
    const tenantId = "fakeTenantId";
    const refreshToken = { ["home_account_id"]: "fakeHomeAccountId" };
    const secrets = {};
    const msalTokenCache = {
      ["AccessToken"]: { key1: { realm: "realm1" }, key2: { realm: tenantId, ["home_account_id"]: "fakeHomeAccountId" } },
      ["RefreshToken"]: { key1: { ["home_account_id"]: "id1" }, key2: refreshToken },
    };

    const azurePersistenceService = {
      getAzureSecrets: jest.fn(async () => secrets),
      setAzureSecrets: jest.fn(async (intId, sec: AzureSecrets) => {
        expect(intId).toBe(integrationId);
        expect(sec).toBe(secrets);
        expect(sec.refreshToken).toEqual(["key2", refreshToken]);
      }),
      saveMsalCache: jest.fn(async (msalCache: JsonCache) => {
        expect(msalCache).toBe(msalTokenCache);
        expect(msalCache.RefreshToken).toEqual({});
      }),
    } as any;
    const service = new AzureSessionService(null, null, null, null, null, null, azurePersistenceService, null);

    await (service as any).moveRefreshTokenToKeychain(msalTokenCache, integrationId, tenantId);

    expect(azurePersistenceService.getAzureSecrets).toHaveBeenCalledWith(integrationId);
    expect(azurePersistenceService.setAzureSecrets).toHaveBeenCalled();
    expect(azurePersistenceService.saveMsalCache).toHaveBeenCalled();
  });

  test("getAccessTokenExpiration", async () => {
    const tenantId = "fakeTenantId";
    const expirationDate = new Date(2020, 1, 1);
    const expiration = expirationDate.getTime() / 1000;
    const msalTokenCache = {
      ["AccessToken"]: { key1: { realm: "realm1" }, key2: { realm: tenantId, ["expires_on"]: expiration } },
    };

    const service = new AzureSessionService(null, null, null, null, null, null, null, null);
    const actualExpiration = await (service as any).getAccessTokenExpiration(msalTokenCache, tenantId);

    expect(actualExpiration).toBe(expirationDate.toISOString());
  });

  test("updateProfiles", async () => {
    const secrets = {
      profile: {
        subscriptions: [
          { id: "id1", isDefault: false },
          { id: "id2", isDefault: false },
          { id: "id3", isDefault: false },
        ],
      },
    };
    const azurePersistenceService = {
      getAzureSecrets: async () => secrets,
      saveProfile: jest.fn(async (profile: any) => {
        expect(profile).toBe(secrets.profile);
        expect(profile.subscriptions).toEqual([
          { id: "id1", isDefault: false },
          { id: "id3", isDefault: true },
        ]);
      }),
    } as any;
    const service = new AzureSessionService(null, null, null, null, null, null, azurePersistenceService, null);
    const integrationId = "fakeIntegrationId";
    const subscriptionIdsToStart = ["id1", "id3"];
    const subscriptionId = "id3";
    await (service as any).updateProfiles(integrationId, subscriptionIdsToStart, subscriptionId);

    expect(azurePersistenceService.saveProfile).toHaveBeenCalled();
  });

  test("stopAllOtherSessions", async () => {
    const repository = {
      getSessions: () => [
        { type: SessionType.awsIamUser, status: SessionStatus.active, sessionId: "id0" },
        { type: SessionType.azure, status: SessionStatus.inactive, sessionId: "id1" },
        { type: SessionType.azure, status: SessionStatus.active, sessionId: "id2" },
        { type: SessionType.azure, status: SessionStatus.pending, sessionId: "id3" },
      ],
    } as any;
    const service = new AzureSessionService(null, repository, null, null, null, null, null, null);
    service.stop = jest.fn(async () => {});

    await (service as any).stopAllOtherSessions();

    expect(service.stop).toHaveBeenCalledTimes(2);
    expect(service.stop).toHaveBeenNthCalledWith(1, "id2");
    expect(service.stop).toHaveBeenNthCalledWith(2, "id3");
  });

  test("getNextRotationTime", () => {
    const repository = {
      getSessions: () => [
        { type: SessionType.awsIamUser, status: SessionStatus.active, sessionId: "id0" },
        { type: SessionType.azure, status: SessionStatus.inactive, sessionId: "id1" },
        { type: SessionType.azure, status: SessionStatus.active, sessionId: "id2" },
        { type: SessionType.azure, status: SessionStatus.pending, sessionId: "id3" },
      ],
    } as any;
    const service = new AzureSessionService(null, repository, null, null, null, null, null, null);

    const oneMinuteMargin = 60 * 1000;
    expect((service as any).getNextRotationTime()).toBe(new Date().getTime() + constants.sessionDuration * 1000 + oneMinuteMargin);
  });
});

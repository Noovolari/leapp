import { afterAll, describe, expect, jest, test } from "@jest/globals";
import { AzureSessionService } from "./azure-session-service";
import { SessionType } from "../../../models/session-type";
import { AzureSession } from "../../../models/azure/azure-session";
import { SessionStatus } from "../../../models/session-status";
import { LoggedEntry, LogLevel } from "../../log-service";

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

  test("start, Repository's getSessionById is called once to retrieve the Session to be started", async () => {
    const repository = {
      getSessionById: jest.fn(() => ({})),
      getSessions: () => [],
      getAzureIntegration: () => ({ tokenExpiration: new Date().toISOString() }),
    } as any;

    const executeService = {
      execute: () => {},
    } as any;

    const azureSessionService = new AzureSessionService(null, repository, null, executeService, null, null, null, null);
    (azureSessionService as any).stopSessionsByIntegrationId = () => {};
    (azureSessionService as any).sessionLoading = () => {};
    (azureSessionService as any).updateProfiles = () => {};

    const sessionId = "fake-session-id";

    await azureSessionService.start(sessionId);

    expect(repository.getSessionById).toHaveBeenCalledTimes(1);
    expect(repository.getSessionById).toHaveBeenCalledWith(sessionId);
  });

  test("start, all sessions that belong to the same integration are stopped before the session is moved to pending state", async () => {
    const fakeAzureIntegrationId = "fake-azure-integration-id";

    const repository = {
      getSessionById: jest.fn(() => ({ azureIntegrationId: fakeAzureIntegrationId })),
      getSessions: () => [],
      getAzureIntegration: () => ({ tokenExpiration: new Date().toISOString() }),
    } as any;

    const executeService = {
      execute: () => {},
    } as any;

    const sessionId = "fake-session-id";

    const azureSessionService = new AzureSessionService(null, repository, null, executeService, null, null, null, null);
    (azureSessionService as any).sessionLoading = () => {
      expect((azureSessionService as any).stopAllOtherSessions).toHaveBeenCalledTimes(1);
      expect((azureSessionService as any).stopAllOtherSessions).toHaveBeenCalledWith(sessionId);
    };
    (azureSessionService as any).updateProfiles = () => {};
    (azureSessionService as any).stopAllOtherSessions = jest.fn();

    await azureSessionService.start(sessionId);
  });

  test("start, default location is set once the session is in pending state", async () => {
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date(2022, 12, 1, 10, 0, 0, 0));
    const tokenExpiration = new Date(2022, 12, 1, 11, 0, 0, 0).toISOString();

    const azureSession = new AzureSession("fake-session-name", "fake-region", "fake-subscription-id", "fake-tenant-id", "fake-azure-integration-id");
    azureSession.status = SessionStatus.inactive;

    const fakeAzureIntegrationId = "fake-azure-integration-id";

    const repository = {
      getSessionById: jest.fn(() => ({ azureIntegrationId: fakeAzureIntegrationId })),
      getSessions: () => [azureSession],
      getAzureIntegration: () => ({ tokenExpiration }),
      updateSessions: () => {},
    } as any;

    const executeService = {
      execute: jest.fn(() => {
        expect(azureSession.status).not.toEqual(SessionStatus.inactive);
        expect(azureSession.status).toEqual(SessionStatus.pending);
        expect(azureSession.status).not.toEqual(SessionStatus.active);
      }),
    } as any;

    const azureSessionService = new AzureSessionService(null, repository, null, executeService, null, null, null, null);
    (azureSessionService as any).stopSessionsByIntegrationId = () => {};
    (azureSessionService as any).updateProfiles = () => {};
    (azureSessionService as any).stopSessionsByIntegrationId = jest.fn();

    await azureSessionService.start(azureSession.sessionId);
  });

  test("start, updateProfiles is invoked with expected parameters", async () => {
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date(2022, 12, 1, 10, 0, 0, 0));
    const tokenExpiration = new Date(2022, 12, 1, 11, 0, 0, 0).toISOString();

    const azureSession = new AzureSession("fake-session-name", "fake-region", "fake-subscription-id", "fake-tenant-id", "fake-azure-integration-id");
    azureSession.status = SessionStatus.inactive;

    const repository = {
      getSessionById: () => azureSession,
      getSessions: () => [azureSession],
      getAzureIntegration: () => ({ tokenExpiration }),
      updateSessions: () => {},
    } as any;

    const executeService = {
      execute: jest.fn(() => {}),
    } as any;

    const azureSessionService = new AzureSessionService(null, repository, null, executeService, null, null, null, null);
    (azureSessionService as any).stopSessionsByIntegrationId = () => {};
    (azureSessionService as any).updateProfiles = jest.fn();
    (azureSessionService as any).stopSessionsByIntegrationId = () => {};

    await azureSessionService.start(azureSession.sessionId);

    const expectedSubscriptionIdsToStart = [azureSession.subscriptionId];

    expect((azureSessionService as any).updateProfiles).toHaveBeenCalledTimes(1);
    expect((azureSessionService as any).updateProfiles).toHaveBeenCalledWith(
      azureSession.azureIntegrationId,
      expectedSubscriptionIdsToStart,
      azureSession.subscriptionId
    );
  });

  /*test("start, loadMsalCache and getAzureSecrets are invoked once and that saveMsalCache is invoked with the expected msalTokenCache object", async () => {
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date(2022, 12, 1, 10, 0, 0, 0));
    const tokenExpiration = new Date(2022, 12, 1, 9, 0, 0, 0).toISOString();

    const azureSession = new AzureSession("fake-session-name", "fake-region", "fake-subscription-id", "fake-tenant-id", "fake-azure-integration-id");
    azureSession.status = SessionStatus.inactive;

    const repository = {
      getSessionById: () => azureSession,
      getSessions: () => [azureSession],
      getAzureIntegration: () => ({ tokenExpiration }),
      updateSessions: () => {},
    } as any;

    const executeService = {
      execute: jest.fn(() => {}),
    } as any;

    const azurePersistenceService = {
      loadMsalCache: jest.fn(),
      getAzureSecrets: jest.fn(() => {
        return {
          account: []
        };
      }),
      saveMsalCache: jest.fn(),
    } as any;

    const azureSessionService = new AzureSessionService(null, repository, null, executeService, null, null, null, null);
    (azureSessionService as any).stopSessionsByIntegrationId = () => {};
    (azureSessionService as any).updateProfiles = () => {};
    (azureSessionService as any).stopSessionsByIntegrationId = () => {};

    await azureSessionService.start(azureSession.sessionId);

  });*/
});

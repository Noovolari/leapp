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
});

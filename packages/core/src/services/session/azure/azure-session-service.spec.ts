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
    const repository = { getSessionById: () => ({ sessionTokenExpiration }) } as any;

    const azureSessionService = new AzureSessionService(null, repository, null, null, null, null, null, null);
    azureSessionService.start = jest.fn(async () => null);

    await azureSessionService.rotate("fakeId");
    expect(azureSessionService.start).not.toHaveBeenCalled();
  });

  test("rotate, token should be rotated", async () => {
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date(2022, 12, 1, 10, 0, 0, 1));
    const sessionTokenExpiration = new Date(2022, 12, 1, 10, 21, 0, 0).toISOString();
    const repository = { getSessionById: () => ({ sessionTokenExpiration }) } as any;

    const azureSessionService = new AzureSessionService(null, repository, null, null, null, null, null, null);
    azureSessionService.start = jest.fn(async () => null);

    await azureSessionService.rotate("fakeId");
    expect(azureSessionService.start).toHaveBeenCalled();
  });

  test("stop, 'az logout' command is executed when session is in pending state", () => {
    const azureSession = new AzureSession("fake-session-name", "fake-region", "fake-subscription-id", "fake-tenant-id", "fake-azure-integration-id");
    azureSession.status = SessionStatus.active;

    const repository = {
      getSessions: () => [azureSession],
      updateSessions: () => {},
    } as any;

    const sessionNotifier = {
      setSessions: () => {},
    } as any;

    const executeService = {
      execute: () => {
        expect(azureSession.status).toEqual(SessionStatus.pending);
      },
    } as any;

    const azureSessionService = new AzureSessionService(sessionNotifier, repository, null, executeService, null, null, null, null);

    azureSessionService.stop(azureSession.sessionId);
  });

  test("stop, sessionDeactivated is called once after 'az logout' command execution", async () => {
    const azureSession = new AzureSession("fake-session-name", "fake-region", "fake-subscription-id", "fake-tenant-id", "fake-azure-integration-id");
    azureSession.status = SessionStatus.active;

    const repository = {
      getSessions: () => [azureSession],
      updateSessions: () => {},
    } as any;

    const sessionNotifier = {
      setSessions: () => {},
    } as any;

    const executeService = {
      execute: jest.fn(() => {}),
    } as any;

    const azureSessionService = new AzureSessionService(sessionNotifier, repository, null, executeService, null, null, null, null);

    azureSessionService.sessionDeactivated = jest.fn(() => {
      expect(executeService.execute).toHaveBeenNthCalledWith(1, "az logout");
    });

    await azureSessionService.stop(azureSession.sessionId);

    expect(azureSessionService.sessionDeactivated).toHaveBeenNthCalledWith(1, azureSession.sessionId);
  });

  test("stop, logService's log is called if executeService's execute throw error", async () => {
    const azureSession = new AzureSession("fake-session-name", "fake-region", "fake-subscription-id", "fake-tenant-id", "fake-azure-integration-id");
    azureSession.status = SessionStatus.active;

    const repository = {
      getSessions: () => [azureSession],
      updateSessions: () => {},
    } as any;

    const sessionNotifier = {
      setSessions: () => {},
    } as any;

    const error = new Error("fake-error");

    const executeService = {
      execute: () => {
        throw error;
      },
    } as any;

    const logService = {
      log: jest.fn(() => {}),
    };

    const azureSessionService = new AzureSessionService(sessionNotifier, repository, null, executeService, null, null, null, logService);

    await azureSessionService.stop(azureSession.sessionId);

    expect(logService.log).toHaveBeenNthCalledWith(1, new LoggedEntry(error.message, this, LogLevel.warn));
  });
});

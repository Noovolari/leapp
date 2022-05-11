import { jest, describe, test, expect } from "@jest/globals";
import { RegionsService } from "./regions-service";
import { SessionStatus } from "../models/session-status";

describe("RegionsService", () => {
  test("changeRegion, session not active", async () => {
    const session = { sessionId: "sid1", type: "sessionType", status: SessionStatus.pending, region: "oldRegion" };
    const sessionFactory = {
      getSessionService: jest.fn(),
    };

    const repositorySessions = [{ sessionId: "sid0" }, { sessionId: "sid1" }];
    const repository = {
      getSessions: () => repositorySessions,
      updateSession: jest.fn(),
    };

    const behaviouralSubjectService = {
      setSessions: jest.fn(),
    };

    const regionService = new RegionsService(sessionFactory as any, repository as any, behaviouralSubjectService as any);
    await regionService.changeRegion(session as any, "newRegion");

    expect(session.region).toBe("newRegion");
    expect(sessionFactory.getSessionService).toHaveBeenCalledWith(session.type);
    expect(repository.updateSession).toHaveBeenCalledWith(session.sessionId, session);
    expect(behaviouralSubjectService.setSessions).toHaveBeenCalled();
  });

  test("changeRegion, session active", async () => {
    const session = { sessionId: "sid1", type: "sessionType", status: SessionStatus.active, region: "oldRegion" };

    let isSessionActive = false;
    const sessionService = {
      stop: jest.fn(() => (isSessionActive = false)),
      start: jest.fn(() => (isSessionActive = true)),
    };
    const sessionFactory = {
      getSessionService: jest.fn(() => sessionService),
    };

    const repositorySessions = [{ sessionId: "sid0" }, { sessionId: "sid1" }];
    const repository = {
      getSessions: () => repositorySessions,
      updateSession: jest.fn((sessionId, sessionToUpdate: any) => {
        expect(sessionToUpdate.region).toBe("newRegion");
        expect(isSessionActive).toBe(false);
      }),
    };

    const behaviouralSubjectService = {
      setSessions: jest.fn(),
    };

    const regionService = new RegionsService(sessionFactory as any, repository as any, behaviouralSubjectService as any);
    await regionService.changeRegion(session as any, "newRegion");

    expect(isSessionActive).toBe(true);
    expect(sessionFactory.getSessionService).toHaveBeenCalledWith(session.type);
    expect(sessionService.stop).toHaveBeenCalledWith(session.sessionId);
    expect(repository.updateSession).toHaveBeenCalledWith(session.sessionId, session);
    expect(behaviouralSubjectService.setSessions).toHaveBeenCalled();
    expect(sessionService.start).toHaveBeenCalledWith(session.sessionId);
  });

  test("getDefaultAwsRegion", () => {
    const defaultRegion = "defaultRegion";
    const repository = {
      getDefaultRegion: () => defaultRegion,
    };
    const regionService = new RegionsService(null, repository as any, null);

    expect(regionService.getDefaultAwsRegion()).toBe(defaultRegion);
  });

  test("changeDefaultAwsRegion", () => {
    const repository = {
      updateDefaultRegion: jest.fn(),
    };
    const regionService = new RegionsService(null, repository as any, null);

    const newRegion = "newDefaultRegion";
    regionService.changeDefaultAwsRegion(newRegion);
    expect(repository.updateDefaultRegion).toHaveBeenCalledWith(newRegion);
  });
});

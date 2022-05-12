import { SessionManagementService } from "./session-management-service";
import { jest } from "@jest/globals";
import { Session } from "../models/session";

describe("SessionManagementService", () => {
  test("getSessions - return a list of sessions from repository", () => {
    const repository = {
      getSessions: jest.fn(() => []),
    };
    const service = new SessionManagementService(repository as any);
    expect(service.getSessions()).toStrictEqual([]);
    expect(repository.getSessions).toHaveBeenCalled();
  });

  test("getAssumableSessions - return a list of sessions from repository that are assumable", () => {
    const repository = {
      listAssumable: jest.fn(() => []),
    };
    const service = new SessionManagementService(repository as any);
    expect(service.getAssumableSessions()).toStrictEqual([]);
    expect(repository.listAssumable).toHaveBeenCalled();
  });

  test("getActiveAndPendingSessions - return a list of sessions from repository that are active or pending", () => {
    const repository = {
      listActiveAndPending: jest.fn(() => []),
    };
    const service = new SessionManagementService(repository as any);
    expect(service.getActiveAndPendingSessions()).toStrictEqual([]);
    expect(repository.listActiveAndPending).toHaveBeenCalled();
  });

  test("getActiveSessions - return a list of sessions from repository that are active", () => {
    const repository = {
      listActive: jest.fn(() => []),
    };
    const service = new SessionManagementService(repository as any);
    expect(service.getActiveSessions()).toStrictEqual([]);
    expect(repository.listActive).toHaveBeenCalled();
  });

  test("getPendingSessions - return a list of sessions from repository that are pending", () => {
    const repository = {
      listPending: jest.fn(() => []),
    };
    const service = new SessionManagementService(repository as any);
    expect(service.getPendingSessions()).toStrictEqual([]);
    expect(repository.listPending).toHaveBeenCalled();
  });

  test("getSessionById - return a session from repository based on its ID", () => {
    const repository = {
      getSessions: jest.fn(() => [{ sessionId: "1" }, { sessionId: "2" }]),
    };
    const service = new SessionManagementService(repository as any);
    expect(service.getSessionById("1")).toStrictEqual({ sessionId: "1" });
    expect(service.getSessionById("2")).toStrictEqual({ sessionId: "2" });
  });

  test("updateSessions - update and persists all the sessions", () => {
    let savedSessions = [{ sessionId: "1" }, { sessionId: "2" }];
    const repository = {
      updateSessions: jest.fn((s: Session[]) => (savedSessions = s)),
      getSessions: jest.fn(() => savedSessions),
    };
    const service = new SessionManagementService(repository as any);
    const sessions = service.getSessions();
    sessions[1].sessionId = "3";
    service.updateSessions(sessions);
    expect(savedSessions).toStrictEqual(sessions);
    expect(service.getSessionById("1")).toStrictEqual({ sessionId: "1" });
    expect(service.getSessionById("3")).toStrictEqual({ sessionId: "3" });
  });

  test("deleteSession - delete a session and persists all the other sessions", () => {
    const sessions = [{ sessionId: "1" }, { sessionId: "2" }];
    let newSessions = sessions;
    const repository = {
      deleteSession: jest.fn((sId: string) => {
        newSessions = sessions.filter((s) => s.sessionId !== sId);
      }),
      getSessions: jest.fn(() => sessions),
    };
    const service = new SessionManagementService(repository as any);
    service.deleteSession("2");
    expect(newSessions).toStrictEqual([{ sessionId: "1" }]);
    expect(service.getSessionById("1")).toStrictEqual({ sessionId: "1" });
    expect(service.getSessionById("3")).toStrictEqual(undefined);
  });
});

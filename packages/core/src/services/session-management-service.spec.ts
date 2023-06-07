import { SessionManagementService } from "./session-management-service";
import { jest, describe, test, expect } from "@jest/globals";
import { Session } from "../models/session";
import { SessionType } from "../models/session-type";

describe("SessionManagementService", () => {
  let sessionServiceMock = { stop: jest.fn() };
  let factory = {
    getSessionService: jest.fn(() => sessionServiceMock),
  };

  test("getSessions - return a list of sessions from repository", () => {
    const repository = {
      getSessions: jest.fn(() => []),
    };

    const service = new SessionManagementService(repository as any, factory as any);
    expect(service.getSessions()).toStrictEqual([]);
    expect(repository.getSessions).toHaveBeenCalled();
  });

  test("getAssumableSessions - return a list of sessions from repository that are assumable", () => {
    const repository = {
      listAssumable: jest.fn(() => []),
    };
    const service = new SessionManagementService(repository as any, factory as any);
    expect(service.getAssumableSessions()).toStrictEqual([]);
    expect(repository.listAssumable).toHaveBeenCalled();
  });

  test("getActiveAndPendingSessions - return a list of sessions from repository that are active or pending", () => {
    const repository = {
      listActiveAndPending: jest.fn(() => []),
    };
    const service = new SessionManagementService(repository as any, factory as any);
    expect(service.getActiveAndPendingSessions()).toStrictEqual([]);
    expect(repository.listActiveAndPending).toHaveBeenCalled();
  });

  test("getActiveSessions - return a list of sessions from repository that are active", () => {
    const repository = {
      listActive: jest.fn(() => []),
    };
    const service = new SessionManagementService(repository as any, factory as any);
    expect(service.getActiveSessions()).toStrictEqual([]);
    expect(repository.listActive).toHaveBeenCalled();
  });

  test("getPendingSessions - return a list of sessions from repository that are pending", () => {
    const repository = {
      listPending: jest.fn(() => []),
    };
    const service = new SessionManagementService(repository as any, factory as any);
    expect(service.getPendingSessions()).toStrictEqual([]);
    expect(repository.listPending).toHaveBeenCalled();
  });

  test("getSessionById - return a session from repository based on its ID", () => {
    const repository = {
      getSessions: jest.fn(() => [{ sessionId: "1" }, { sessionId: "2" }]),
    };
    const service = new SessionManagementService(repository as any, factory as any);
    expect(service.getSessionById("1")).toStrictEqual({ sessionId: "1" });
    expect(service.getSessionById("2")).toStrictEqual({ sessionId: "2" });
  });

  test("updateSessions - update and persists all the sessions", () => {
    let savedSessions = [{ sessionId: "1" }, { sessionId: "2" }];
    const repository = {
      updateSessions: jest.fn((s: Session[]) => (savedSessions = s)),
      getSessions: jest.fn(() => savedSessions),
    };
    const service = new SessionManagementService(repository as any, factory as any);
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
    const service = new SessionManagementService(repository as any, factory as any);
    service.deleteSession("2");
    expect(newSessions).toStrictEqual([{ sessionId: "1" }]);
    expect(service.getSessionById("1")).toStrictEqual({ sessionId: "1" });
    expect(service.getSessionById("3")).toStrictEqual(undefined);
  });

  test("getIamRoleChained", () => {
    const sessions = [
      { sessionId: "3", type: SessionType.awsIamRoleChained, parentSessionId: "not-found" },
      { sessionId: "2", parentSessionId: "1", type: SessionType.awsIamRoleChained },
      { sessionId: "1", type: SessionType.awsIamRoleFederated },
    ];
    const repository = {
      listIamRoleChained: jest.fn((session: Session) =>
        sessions.filter((s) => s.type === SessionType.awsIamRoleChained).filter((s) => s.parentSessionId === session.sessionId)
      ),
    };
    const service = new SessionManagementService(repository as any, factory as any);
    const result = service.getIamRoleChained(sessions[2] as any);
    expect(result).toStrictEqual([sessions[1] as any]);
    expect(service.getIamRoleChained({ sessionId: "4" } as any)).toStrictEqual([]);
    expect(repository.listIamRoleChained).toHaveBeenCalled();
  });

  test("updateSession", () => {
    const sessions = [
      { sessionId: "3", type: SessionType.awsIamRoleChained, parentSessionId: "not-found" },
      { sessionId: "2", parentSessionId: "1", type: SessionType.awsIamRoleChained },
      { sessionId: "1", type: SessionType.awsIamRoleFederated },
    ];
    const repository = {
      updateSession: jest.fn((sessionId, sess: Session) => {
        const sessionIndex = sessions.findIndex((s) => s.sessionId === sessionId);
        if (sessionIndex > -1) {
          sessions[sessionIndex] = sess;
        }
      }),
    };
    const service = new SessionManagementService(repository as any, factory as any);
    service.updateSession("1", { sessionId: "1", type: SessionType.awsIamRoleFederated, newProperty: true } as any);
    expect(repository.updateSession).toHaveBeenCalled();
    expect((sessions.find((s) => s.sessionId === "1") as any).newProperty).toStrictEqual(true);
  });

  test("stopAllSessions", async () => {
    sessionServiceMock = { stop: jest.fn() };
    factory = {
      getSessionService: jest.fn(() => sessionServiceMock),
    };

    const sessions = [
      { sessionId: "3", type: SessionType.awsIamRoleChained, parentSessionId: "not-found" },
      { sessionId: "2", parentSessionId: "1", type: SessionType.awsIamRoleChained },
      { sessionId: "1", type: SessionType.awsIamRoleFederated },
    ];
    const repository = {
      listActiveAndPending: jest.fn(() => sessions),
    };
    const service = new SessionManagementService(repository as any, factory as any);
    await service.stopAllSessions();
    expect(repository.listActiveAndPending).toHaveBeenCalled();
    expect(factory.getSessionService).toHaveBeenCalledTimes(3);
    expect(sessionServiceMock.stop).toHaveBeenCalledTimes(3);
    expect(sessionServiceMock.stop).toHaveBeenNthCalledWith(1, "3");
    expect(sessionServiceMock.stop).toHaveBeenNthCalledWith(2, "2");
    expect(sessionServiceMock.stop).toHaveBeenNthCalledWith(3, "1");
  });
});

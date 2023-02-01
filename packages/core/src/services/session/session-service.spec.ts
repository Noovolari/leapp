import { describe, test, expect, jest } from "@jest/globals";
import { SessionService } from "./session-service";
import { SessionStatus } from "../../models/session-status";

describe("SessionService", () => {
  test("isInactive", () => {
    const activeSessionId = "active-session-id";
    const pendingSessionId = "pending-session-id";
    const inactiveSessionId = "inactive-session-id";
    const sessionList = [
      { sessionId: activeSessionId, status: SessionStatus.active },
      { sessionId: pendingSessionId, status: SessionStatus.pending },
      { sessionId: inactiveSessionId, status: SessionStatus.inactive },
    ];
    const repository = {
      getSessions: jest.fn(() => sessionList),
    } as any;
    const sessionService: any = new (SessionService as any)(null, repository);

    expect(sessionService.isInactive(activeSessionId)).toBe(false);
    expect(sessionService.isInactive(pendingSessionId)).toBe(false);
    expect(sessionService.isInactive(inactiveSessionId)).toBe(true);

    expect(repository.getSessions).toHaveBeenCalledTimes(3);
  });

  test("sessionDeactivated - sessionId found", () => {
    const sessionId = "fake-session-id";
    const sessionList = [{ sessionId }, { sessionId: "another-session-id" }];
    const repository = {
      getSessions: jest.fn(() => sessionList),
      updateSessions: jest.fn(),
    } as any;
    const sessionNotifier = {
      setSessions: jest.fn(),
    } as any;
    const sessionService: any = new (SessionService as any)(sessionNotifier, repository);
    sessionService.sessionDeactivated(sessionId);
    expect(repository.getSessions).toHaveBeenCalled();
    expect(repository.updateSessions).toHaveBeenCalledWith(sessionList);
    expect(sessionList[sessionList.findIndex((s) => s.sessionId === sessionId)]).toStrictEqual({
      sessionId,
      status: SessionStatus.inactive,
      startDateTime: undefined,
    });
    expect(sessionNotifier.setSessions).toHaveBeenCalledWith([...sessionList]);
  });

  test("sessionDeactivated - no session notifier", () => {
    const sessionId = "fake-session-id";
    const sessionList = [{ sessionId }, { sessionId: "another-session-id" }];
    const repository = {
      getSessions: () => sessionList,
      updateSessions: () => {},
    } as any;
    const sessionNotifier = {
      setSessions: jest.fn(),
    } as any;
    const sessionService: any = new (SessionService as any)(null, repository);
    sessionService.sessionDeactivated(sessionId);
    expect(sessionNotifier.setSessions).not.toHaveBeenCalled();
  });

  test("sessionDeactivated - sessionId not found", () => {
    const sessionId = "fake-session-id";
    const sessionList = [{ sessionId }, { sessionId: "another-session-id" }];
    const repository = {
      getSessions: jest.fn(() => sessionList),
      updateSessions: jest.fn(),
    } as any;
    const sessionNotifier = {
      setSessions: jest.fn(),
    } as any;
    const sessionService: any = new (SessionService as any)(sessionNotifier, repository);
    sessionService.sessionDeactivated("wrong-session-id");
    expect(repository.updateSessions).not.toHaveBeenCalled();
    expect(sessionNotifier.setSessions).not.toHaveBeenCalled();
  });

  test("sessionActivated - sessionId found with sessionTokenExpiration", () => {
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date());
    const sessionTokenExpiration = "fake-session-token-expiration";
    const sessionId = "fake-session-id";
    const sessionList = [{ sessionId }, { sessionId: "another-session-id" }];
    const repository = {
      getSessions: jest.fn(() => sessionList),
      updateSessions: jest.fn(),
    } as any;
    const sessionNotifier = {
      setSessions: jest.fn(),
    } as any;
    const sessionService: any = new (SessionService as any)(sessionNotifier, repository);
    sessionService.sessionActivated(sessionId, sessionTokenExpiration);
    expect(repository.getSessions).toHaveBeenCalled();
    expect(repository.updateSessions).toHaveBeenCalledWith(sessionList);
    expect(sessionList[sessionList.findIndex((s) => s.sessionId === sessionId)]).toStrictEqual({
      sessionId,
      sessionTokenExpiration,
      status: SessionStatus.active,
      startDateTime: new Date().toISOString(),
    });
    expect(sessionNotifier.setSessions).toHaveBeenCalledWith([...sessionList]);
  });

  test("sessionActivated - sessionId found without sessionTokenExpiration", () => {
    const sessionId = "fake-session-id";
    const sessionList = [{ sessionId }, { sessionId: "another-session-id" }];
    const repository = {
      getSessions: jest.fn(() => sessionList),
      updateSessions: jest.fn(),
    } as any;
    const sessionNotifier = {
      setSessions: jest.fn(),
    } as any;
    const sessionService: any = new (SessionService as any)(null, repository);
    sessionService.sessionActivated(sessionId);
    expect(sessionList[sessionList.findIndex((s) => s.sessionId === sessionId)]["sessionTokenExpiration"]).toBeUndefined();
    expect(sessionNotifier.setSessions).not.toHaveBeenCalled();
  });

  test("sessionActivated - sessionId not found", () => {
    const sessionId = "fake-session-id";
    const sessionList = [{ sessionId }, { sessionId: "another-session-id" }];
    const repository = {
      getSessions: jest.fn(() => sessionList),
      updateSessions: jest.fn(),
    } as any;
    const sessionNotifier = {
      setSessions: jest.fn(),
    } as any;
    const sessionService: any = new (SessionService as any)(sessionNotifier, repository);
    sessionService.sessionActivated("wrong-session-id");
    expect(repository.updateSessions).not.toHaveBeenCalled();
    expect(sessionNotifier.setSessions).not.toHaveBeenCalled();
  });

  test("sessionLoading - sessionId found", () => {
    const sessionId = "fake-session-id";
    const sessionList = [{ sessionId }, { sessionId: "another-session-id" }];
    const repository = {
      getSessions: jest.fn(() => sessionList),
      updateSessions: jest.fn(),
    } as any;
    const sessionNotifier = {
      setSessions: jest.fn(),
    } as any;
    const sessionService: any = new (SessionService as any)(sessionNotifier, repository);
    sessionService.sessionLoading(sessionId);
    expect(repository.getSessions).toHaveBeenCalled();
    expect(repository.updateSessions).toHaveBeenCalledWith(sessionList);
    expect(sessionList[sessionList.findIndex((s) => s.sessionId === sessionId)]).toStrictEqual({
      sessionId,
      status: SessionStatus.pending,
    });
    expect(sessionNotifier.setSessions).toHaveBeenCalledWith([...sessionList]);
  });

  test("sessionLoading - sessionId not found", () => {
    const sessionId = "fake-session-id";
    const sessionList = [{ sessionId }, { sessionId: "another-session-id" }];
    const repository = {
      getSessions: jest.fn(() => sessionList),
      updateSessions: jest.fn(),
    } as any;
    const sessionNotifier = {
      setSessions: jest.fn(),
    } as any;
    const sessionService: any = new (SessionService as any)(sessionNotifier, repository);
    sessionService.sessionLoading("wrong-session-id");
    expect(repository.updateSessions).not.toHaveBeenCalled();
    expect(sessionNotifier.setSessions).not.toHaveBeenCalled();
  });

  test("sessionLoading - no session notifier", () => {
    const sessionId = "fake-session-id";
    const sessionList = [{ sessionId }, { sessionId: "another-session-id" }];
    const repository = {
      getSessions: () => sessionList,
      updateSessions: () => {},
    } as any;
    const sessionNotifier = {
      setSessions: jest.fn(),
    } as any;
    const sessionService: any = new (SessionService as any)(null, repository);
    sessionService.sessionLoading(sessionId);
    expect(sessionNotifier.setSessions).not.toHaveBeenCalled();
  });

  test("sessionError", () => {
    const sessionId = "fake-session-id";
    const error = "fake-error";
    const sessionService: any = new (SessionService as any)(null, null);
    (sessionService as any).sessionDeactivated = jest.fn();
    expect(() => sessionService.sessionError(sessionId, error)).toThrowError(error);
    expect(sessionService.sessionDeactivated).toHaveBeenCalledWith(sessionId);
  });
});

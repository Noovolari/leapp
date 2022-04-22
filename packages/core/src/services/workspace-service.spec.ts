import { jest, describe, expect, beforeEach, test } from "@jest/globals";
import { Session } from "../models/session";
import { Repository } from "./repository";
import { SessionStatus } from "../models/session-status";
import { SessionType } from "../models/session-type";
import { WorkspaceService } from "./workspace-service";

describe("WorkspaceService", () => {
  let repositoryMock: Repository;
  let mockedSession1: Session;
  let mockedSession2: Session;
  let mockedSession3: Session;
  let workspaceService: WorkspaceService;

  beforeEach(() => {
    mockedSession1 = {
      region: "eu-west-1",
      sessionId: "session-id-1",
      sessionName: "session1",
      status: SessionStatus.active,
      type: SessionType.awsSsoRole,
      expired: (): boolean => false,
    };
    mockedSession2 = {
      region: "eu-west-2",
      sessionId: "session-id-2",
      sessionName: "session2",
      status: SessionStatus.inactive,
      type: SessionType.awsSsoRole,
      expired: (): boolean => false,
    };
    mockedSession3 = {
      region: "eu-west-3",
      sessionId: "session-id-3",
      sessionName: "session3",
      status: SessionStatus.inactive,
      type: SessionType.azure,
      expired: (): boolean => false,
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    repositoryMock = {
      getSessions: jest.fn((): Session[] => [mockedSession1, mockedSession2, mockedSession3]),
    };

    workspaceService = new WorkspaceService(repositoryMock);
  });

  test("Should exists when created", () => {
    expect(workspaceService).not.toBe(undefined);
  });

  test("get sessions() - retrieve sessions as Values from Behavioural Subject", () => {
    expect(workspaceService.sessions).toStrictEqual(repositoryMock.getSessions());
    expect(workspaceService.sessions.length).toBe(3);
  });

  test("getSessions() - retrieve sessions as Values from Behavioural Subject", () => {
    expect(workspaceService.getSessions()).toStrictEqual(repositoryMock.getSessions());
    expect(workspaceService.getSessions().length).toBe(3);
  });

  test("set sessions() - set sessions as Values to Behavioural Subject", () => {
    const newSessionArray = repositoryMock.getSessions();
    newSessionArray.push({
      region: "eu-west-2",
      sessionId: "session-id-4",
      sessionName: "session4",
      status: SessionStatus.pending,
      type: SessionType.azure,
      expired: (): boolean => false,
    });
    workspaceService.sessions = [...newSessionArray];

    expect(workspaceService.sessions).toStrictEqual(newSessionArray);
    expect(workspaceService.sessions.length).toBe(4);
  });

  test("setSessions() - set sessions as Values to Behavioural Subject", () => {
    const newSessionArray = repositoryMock.getSessions();
    newSessionArray.push({
      region: "eu-west-2",
      sessionId: "session-id-4",
      sessionName: "session4",
      status: SessionStatus.pending,
      type: SessionType.azure,
      expired: (): boolean => false,
    });
    workspaceService.sessions = [...newSessionArray];

    expect(workspaceService.getSessions()).toStrictEqual(newSessionArray);
    expect(workspaceService.getSessions().length).toBe(4);
  });

  test("getSessionById() - retrieve a session given its id", () => {
    expect(workspaceService.getSessionById("session-id-3")).toStrictEqual(mockedSession3);
  });

  test("addSession() - set a new session into the Behavioural Subject array", () => {
    const newSession: Session = {
      region: "eu-west-2",
      sessionId: "session-id-4",
      sessionName: "session4",
      status: SessionStatus.pending,
      type: SessionType.azure,
      expired: (): boolean => false,
    };
    workspaceService.addSession(newSession);

    expect(workspaceService.getSessionById("session-id-4")).toStrictEqual(newSession);
    expect(workspaceService.getSessions().length).toBe(4);
  });

  test("deleteSession() - remove a session from the Behavioural Subject array", () => {
    const newSession: Session = {
      region: "eu-west-2",
      sessionId: "session-id-4",
      sessionName: "session4",
      status: SessionStatus.pending,
      type: SessionType.azure,
      expired: (): boolean => false,
    };
    workspaceService.addSession(newSession);

    expect(workspaceService.getSessionById("session-id-4")).toStrictEqual(newSession);
    expect(workspaceService.getSessions().length).toBe(4);

    workspaceService.deleteSession("session-id-4");

    expect(workspaceService.getSessionById("session-id-4")).toBe(null);
    expect(workspaceService.getSessions().length).toBe(3);
  });

  test("listPending() - list of sessions filtered by pending state", () => {
    const newSession: Session = {
      region: "eu-west-2",
      sessionId: "session-id-4",
      sessionName: "session4",
      status: SessionStatus.pending,
      type: SessionType.azure,
      expired: (): boolean => false,
    };
    workspaceService.addSession(newSession);

    expect(workspaceService.getSessionById("session-id-4")).toStrictEqual(newSession);
    expect(workspaceService.getSessions().length).toBe(4);
    expect(workspaceService.listPending()).toStrictEqual([newSession]);
    expect(workspaceService.listPending().length).toBe(1);
  });

  test("listActive() - list of sessions filtered by active state", () => {
    const newSession: Session = {
      region: "eu-west-2",
      sessionId: "session-id-4",
      sessionName: "session4",
      status: SessionStatus.active,
      type: SessionType.azure,
      expired: (): boolean => false,
    };
    workspaceService.addSession(newSession);

    expect(workspaceService.getSessionById("session-id-4")).toStrictEqual(newSession);
    expect(workspaceService.getSessions().length).toBe(4);
    expect(workspaceService.listActive()).toStrictEqual([mockedSession1, newSession]);
    expect(workspaceService.listActive().length).toBe(2);
  });

  test("listInActive() - list of sessions filtered by inactive state", () => {
    const newSession: Session = {
      region: "eu-west-2",
      sessionId: "session-id-4",
      sessionName: "session4",
      status: SessionStatus.active,
      type: SessionType.azure,
      expired: (): boolean => false,
    };
    workspaceService.addSession(newSession);

    expect(workspaceService.getSessionById("session-id-4")).toStrictEqual(newSession);
    expect(workspaceService.getSessions().length).toBe(4);
    expect(workspaceService.listInactive()).toStrictEqual([mockedSession2, mockedSession3]);
    expect(workspaceService.listInactive().length).toBe(2);
  });

  test("listAwsSsoRoles() - list of sessions filtered by aws sso role type", () => {
    const newSession: Session = {
      region: "eu-west-2",
      sessionId: "session-id-4",
      sessionName: "session4",
      status: SessionStatus.active,
      type: SessionType.azure,
      expired: (): boolean => false,
    };
    workspaceService.addSession(newSession);

    expect(workspaceService.getSessionById("session-id-4")).toStrictEqual(newSession);
    expect(workspaceService.getSessions().length).toBe(4);
    expect(workspaceService.listAwsSsoRoles()).toStrictEqual([mockedSession1, mockedSession2]);
    expect(workspaceService.listAwsSsoRoles().length).toBe(2);
  });

  test("listIamRoleChained() - list of sessions filtered by iam role chained type", () => {
    const newSession: Session = {
      region: "eu-west-2",
      sessionId: "session-id-4",
      sessionName: "session4",
      status: SessionStatus.active,
      type: SessionType.awsIamRoleChained,
      expired: (): boolean => false,
    };
    workspaceService.addSession(newSession);

    expect(workspaceService.getSessionById("session-id-4")).toStrictEqual(newSession);
    expect(workspaceService.getSessions().length).toBe(4);
    expect(workspaceService.listIamRoleChained()).toStrictEqual([newSession]);
    expect(workspaceService.listIamRoleChained().length).toBe(1);
  });

  test("listIamRoleChained(parentSession) - list of sessions filtered by iam role chained type with a specific parent session", () => {
    const newSession: Session = {
      region: "eu-west-2",
      sessionId: "session-id-4",
      sessionName: "session4",
      status: SessionStatus.active,
      type: SessionType.awsIamRoleChained,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      parentSessionId: "session-id-1",
      expired: (): boolean => false,
    };

    const newSession2: Session = {
      region: "eu-west-2",
      sessionId: "session-id-5",
      sessionName: "session5",
      status: SessionStatus.active,
      type: SessionType.awsIamRoleChained,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      parentSessionId: "session-id-3",
      expired: (): boolean => false,
    };

    workspaceService.addSession(newSession);
    workspaceService.addSession(newSession2);

    expect(workspaceService.getSessionById("session-id-4")).toStrictEqual(newSession);
    expect(workspaceService.getSessionById("session-id-5")).toStrictEqual(newSession2);
    expect(workspaceService.getSessions().length).toBe(5);
    expect(workspaceService.listIamRoleChained(mockedSession1)).toStrictEqual([newSession]);
    expect(workspaceService.listIamRoleChained(mockedSession1).length).toBe(1);
    expect(workspaceService.listIamRoleChained(mockedSession3)).toStrictEqual([newSession2]);
    expect(workspaceService.listIamRoleChained(mockedSession1).length).toBe(1);
  });

  test("listAssumable() - list of sessions filtered by any type except for azure and another chained", () => {
    const newSession: Session = {
      region: "eu-west-2",
      sessionId: "session-id-4",
      sessionName: "session4",
      status: SessionStatus.active,
      type: SessionType.awsIamRoleChained,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      parentSessionId: "session-id-1",
      expired: (): boolean => false,
    };

    const newSession2: Session = {
      region: "eu-west-2",
      sessionId: "session-id-5",
      sessionName: "session5",
      status: SessionStatus.active,
      type: SessionType.awsIamRoleChained,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      parentSessionId: "session-id-3",
      expired: (): boolean => false,
    };

    workspaceService.addSession(newSession);
    workspaceService.addSession(newSession2);

    expect(workspaceService.getSessionById("session-id-4")).toStrictEqual(newSession);
    expect(workspaceService.getSessionById("session-id-5")).toStrictEqual(newSession2);
    expect(workspaceService.getSessions().length).toBe(5);

    expect(workspaceService.listAssumable()).toStrictEqual([mockedSession1, mockedSession2]);
    expect(workspaceService.listAssumable().length).toBe(2);
  });

  test("updateSession() - check that a session is updated correctly after property are changed", () => {
    const newSession: Session = {
      region: "eu-west-2",
      sessionId: "session-id-4",
      sessionName: "session4",
      status: SessionStatus.active,
      type: SessionType.awsIamRoleChained,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      parentSessionId: "session-id-1",
      expired: (): boolean => false,
    };

    const updatedSession: Session = {
      region: "eu-west-1",
      sessionId: "session-id-4",
      sessionName: "session4b",
      status: SessionStatus.pending,
      type: SessionType.awsIamRoleChained,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      parentSessionId: "session-id-1",
      expired: (): boolean => false,
    };

    workspaceService.addSession(newSession);

    expect(workspaceService.getSessionById("session-id-4")).toStrictEqual(newSession);
    expect(workspaceService.getSessions().length).toBe(4);
    expect(newSession).not.toStrictEqual(updatedSession);

    // Apply update
    workspaceService.updateSession("session-id-4", updatedSession);
    expect(workspaceService.getSessionById("session-id-4")).toStrictEqual(updatedSession);
    expect(workspaceService.getSessionById("session-id-4")).not.toStrictEqual(newSession);
  });
});

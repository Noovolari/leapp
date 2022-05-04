import { jest, describe, expect, beforeEach, test } from "@jest/globals";
import { Session } from "../models/session";
import { Repository } from "./repository";
import { SessionStatus } from "../models/session-status";
import { SessionType } from "../models/session-type";
import { BehaviouralSubjectService } from "./behavioural-subject-service";

describe("WorkspaceService", () => {
  let repositoryMock: Repository;
  let mockedSession1: Session;
  let mockedSession2: Session;
  let mockedSession3: Session;
  let behaviouralSubjectService: BehaviouralSubjectService;

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

    behaviouralSubjectService = new BehaviouralSubjectService(repositoryMock);
  });

  test("Should exists when created", () => {
    expect(behaviouralSubjectService).not.toBe(undefined);
  });

  test("get sessions() - retrieve sessions as Values from Behavioural Subject", () => {
    expect(behaviouralSubjectService.sessions).toStrictEqual(repositoryMock.getSessions());
    expect(behaviouralSubjectService.sessions.length).toBe(3);
  });

  test("getSessions() - retrieve sessions as Values from Behavioural Subject", () => {
    expect(behaviouralSubjectService.getSessions()).toStrictEqual(repositoryMock.getSessions());
    expect(behaviouralSubjectService.getSessions().length).toBe(3);
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
    behaviouralSubjectService.sessions = [...newSessionArray];

    expect(behaviouralSubjectService.sessions).toStrictEqual(newSessionArray);
    expect(behaviouralSubjectService.sessions.length).toBe(4);
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
    behaviouralSubjectService.sessions = [...newSessionArray];

    expect(behaviouralSubjectService.getSessions()).toStrictEqual(newSessionArray);
    expect(behaviouralSubjectService.getSessions().length).toBe(4);
  });

  test("getSessionById() - retrieve a session given its id", () => {
    expect(behaviouralSubjectService.getSessionById("session-id-3")).toStrictEqual(mockedSession3);
  });
});

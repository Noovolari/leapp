import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Session } from "../models/session";
import { Repository } from "./repository";
import { SessionStatus } from "../models/session-status";
import { SessionType } from "../models/session-type";
import { BehaviouralSubjectService } from "./behavioural-subject-service";
import { Integration } from "../models/integration";
import { IntegrationType } from "../models/integration-type";
import { AwsSsoIntegration } from "../models/aws/aws-sso-integration";
import { AzureIntegration } from "../models/azure/azure-integration";

describe("WorkspaceService", () => {
  let repositoryMock: Repository;
  let mockedSession1: Session;
  let mockedSession2: Session;
  let mockedSession3: Session;
  let mockedIntegration1: Integration;
  let mockedIntegration2: Integration;
  let mockedIntegration3: Integration;
  let behaviouralSubjectService: BehaviouralSubjectService;

  beforeEach(() => {
    mockedSession1 = {
      sessionTokenExpiration: "",
      region: "eu-west-1",
      sessionId: "session-id-1",
      sessionName: "session1",
      status: SessionStatus.active,
      type: SessionType.awsSsoRole,
      expired: (): boolean => false,
    };
    mockedSession2 = {
      sessionTokenExpiration: "",
      region: "eu-west-2",
      sessionId: "session-id-2",
      sessionName: "session2",
      status: SessionStatus.inactive,
      type: SessionType.awsSsoRole,
      expired: (): boolean => false,
    };
    mockedSession3 = {
      sessionTokenExpiration: "",
      region: "eu-west-3",
      sessionId: "session-id-3",
      sessionName: "session3",
      status: SessionStatus.inactive,
      type: SessionType.azure,
      expired: (): boolean => false,
    };

    mockedIntegration1 = {
      id: "1",
      alias: "abc",
      isOnline: false,
      type: IntegrationType.awsSso,
    };
    mockedIntegration2 = {
      id: "2",
      alias: "cba",
      isOnline: false,
      type: IntegrationType.awsSso,
    };
    mockedIntegration3 = {
      id: "3",
      alias: "def",
      isOnline: true,
      type: IntegrationType.azure,
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    repositoryMock = {
      getSessions: jest.fn((): Session[] => [mockedSession1, mockedSession2, mockedSession3]),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      listAwsSsoIntegrations: jest.fn((): AwsSsoIntegration[] => [mockedIntegration1, mockedIntegration2]),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      listAzureIntegrations: jest.fn((): AwsSsoIntegration[] => [mockedIntegration3]),
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
      sessionTokenExpiration: "",
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
      sessionTokenExpiration: "",
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

  test("get integrations() - retrieve integrations as Values from Behavioural Subject", () => {
    expect(behaviouralSubjectService.integrations).toEqual([...repositoryMock.listAwsSsoIntegrations(), ...repositoryMock.listAzureIntegrations()]);
    expect(behaviouralSubjectService.integrations.length).toBe(3);
  });

  test("getIntegrations() - retrieve integrations as Values from Behavioural Subject", () => {
    expect(behaviouralSubjectService.getIntegrations()).toEqual([
      ...repositoryMock.listAwsSsoIntegrations(),
      ...repositoryMock.listAzureIntegrations(),
    ]);
    expect(behaviouralSubjectService.getIntegrations().length).toBe(3);
  });

  test("set integrations() - set integrations as Values to Behavioural Subject", () => {
    const newIntegrationArray = [...repositoryMock.listAwsSsoIntegrations(), ...repositoryMock.listAzureIntegrations()];
    newIntegrationArray.push(new AzureIntegration("333", "aaa", "bbb", ""));
    behaviouralSubjectService.integrations = [...newIntegrationArray];

    expect(behaviouralSubjectService.integrations).toStrictEqual(newIntegrationArray);
    expect(behaviouralSubjectService.integrations.length).toBe(4);
  });

  test("setIntegrations() - set integrations as Values to Behavioural Subject", () => {
    const newIntegrationArray = [...repositoryMock.listAwsSsoIntegrations(), ...repositoryMock.listAzureIntegrations()];
    newIntegrationArray.push(new AzureIntegration("333", "aaa", "bbb", ""));
    behaviouralSubjectService.integrations = [...newIntegrationArray];

    expect(behaviouralSubjectService.getIntegrations()).toStrictEqual(newIntegrationArray);
    expect(behaviouralSubjectService.getIntegrations().length).toBe(4);
  });

  test("getIntegrationsById() - retrieve a integrations given its id", () => {
    expect(behaviouralSubjectService.getIntegrationById("3")).toStrictEqual(mockedIntegration3);
  });

  test("setSessions", () => {
    jest.spyOn(behaviouralSubjectService.sessions$, "next");
    const sessions = [{ id: 1 }, { id: 2 }, { id: 3 }] as unknown as Session[];
    behaviouralSubjectService.setSessions(sessions);
    expect(behaviouralSubjectService.sessions).toEqual(sessions);
    expect(behaviouralSubjectService.sessions$.next).toHaveBeenCalledWith(sessions);
  });

  test("setIntegrations", () => {
    jest.spyOn(behaviouralSubjectService.integrations$, "next");
    const integrations = [{ id: 1 }, { id: 2 }, { id: 3 }] as unknown as Integration[];
    behaviouralSubjectService.setIntegrations(integrations);
    expect(behaviouralSubjectService.integrations).toEqual(integrations);
    expect(behaviouralSubjectService.integrations$.next).toHaveBeenCalledWith(integrations);
  });

  test("setFetchingIntegrations", () => {
    jest.spyOn(behaviouralSubjectService.fetchingIntegrationState$, "next");
    behaviouralSubjectService.setFetchingIntegrations("fake-state");
    expect(behaviouralSubjectService.fetchingIntegrationState$.next).toHaveBeenCalledWith("fake-state");
  });
});

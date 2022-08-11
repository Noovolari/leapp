import { describe, test, expect, jest } from "@jest/globals";
import { Session } from "../models/session";
import { SessionStatus } from "../models/session-status";
import { RotationService } from "./rotation-service";
import { SessionType } from "../models/session-type";
jest.mock("../models/session");

describe("RotationService", () => {
  test("rotate - should rotate an active session when expired", () => {
    const sessionActive: any = {};
    sessionActive.status = SessionStatus.active;
    sessionActive.type = SessionType.awsIamUser;
    sessionActive.expired = jest.fn(() => true);

    const expectedSessions: Session[] = [sessionActive];
    const repository = {
      listActive: () => expectedSessions,
    } as any;

    const awsIamUserService: any = {
      name: "IamUser",
      rotate: jest.fn(async () => {}),
    };

    const sessionFactory: any = {};
    sessionFactory.getSessionService = jest.fn(() => awsIamUserService);

    const rotationService = new RotationService(sessionFactory, repository);
    rotationService.rotate();

    expect(sessionActive.expired).toBeCalledTimes(1);
    expect(sessionFactory.getSessionService).toBeCalledTimes(1);
    expect(sessionFactory.getSessionService).toHaveBeenCalledWith(sessionActive.type);
    expect(awsIamUserService.rotate).toBeCalledTimes(1);
  });

  test("rotate - should not rotate when a session is not expired", () => {
    const sessionActive: any = {};
    sessionActive.status = SessionStatus.active;
    sessionActive.type = SessionType.awsIamUser;
    sessionActive.expired = jest.fn(() => false);

    const expectedSessions: Session[] = [sessionActive];
    const repository = {
      listActive: () => expectedSessions,
    } as any;

    const awsIamUserService: any = {
      name: "IamUser",
      rotate: jest.fn(async () => {}),
    };

    const sessionFactory: any = {};
    sessionFactory.getSessionService = jest.fn(() => awsIamUserService);

    const rotationService = new RotationService(sessionFactory, repository);
    rotationService.rotate();

    expect(sessionActive.expired).toBeCalledTimes(1);
    expect(sessionFactory.getSessionService).toBeCalledTimes(0);
    expect(awsIamUserService.rotate).toBeCalledTimes(0);
  });
});

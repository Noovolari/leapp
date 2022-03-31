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
});

/*
describe('RotationService', () => {
  let rotationService: RotationService;

  let spySessionService;
  let sessionActive;

  let spySessionProviderService;
  let concreteSessionServiceFake;

  beforeEach(() => {
    spySessionService = jasmine.createSpyObj('SessionService', ['listActive']);
    sessionActive = new Session('fakeaccount', 'eu-west-1');
    sessionActive.active = true;
    spySessionService.listActive.and.returnValue([sessionActive]);


    spySessionProviderService = jasmine.createSpyObj('SessionProviderService', ['getService']);
    concreteSessionServiceFake = { rotate: () => {} };
    spySessionProviderService.getService.and.returnValue(concreteSessionServiceFake);

    TestBed.configureTestingModule({
      providers: [
        { provide: AwsSessionService, useValue: spySessionService },
        { provide: SessionFactory, useValue: spySessionProviderService },
      ].concat(mustInjected())
    });
    rotationService = TestBed.inject(RotationService);
  });

  it('should be created', () => {
    expect(rotationService).toBeTruthy();
  });

  describe('rotate()', () => {
    it('should rotate an active session when expired', () => {

      spyOn(sessionActive, 'expired').and.returnValue(true);
      spyOn(concreteSessionServiceFake, 'rotate').and.callThrough();

      rotationService.rotate();

      expect(sessionActive.expired).toHaveBeenCalled();
      expect(concreteSessionServiceFake.rotate).toHaveBeenCalled();
    });
  });
});*/

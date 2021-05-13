import { TestBed } from '@angular/core/testing';

import { RotationService } from './rotation.service';
import {mustInjected} from "../../base-injectables";
import {SessionService} from "./session.service";
import {SessionProviderService} from "./session-provider.service";
import {Session} from "../models/session";
import {Account} from "../models/account";

describe('RotationService', () => {
  let rotationService: RotationService;

  let spySessionService;
  let sessionActive;

  let spySessionProviderService;
  let concreteSessionServiceFake;

  beforeEach(() => {
    spySessionService = jasmine.createSpyObj('SessionService', ['listActive']);
    sessionActive = new Session(new Account('fakeaccount', 'eu-west-1'), 'fakeid');
    sessionActive.active = true;
    spySessionService.listActive.and.returnValue([sessionActive]);


    spySessionProviderService = jasmine.createSpyObj('SessionProviderService', ['getService']);
    concreteSessionServiceFake = { rotate: () => {} };
    spySessionProviderService.getService.and.returnValue(concreteSessionServiceFake);

    TestBed.configureTestingModule({
      providers: [
        { provide: SessionService, useValue: spySessionService },
        { provide: SessionProviderService, useValue: spySessionProviderService },
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
});

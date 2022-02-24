// noinspection DuplicatedCode

import {TestBed} from '@angular/core/testing';

import {AwsSessionService} from './aws-session.service';
import {mustInjected} from '../../../../base-injectables';
import {serialize} from 'class-transformer';
import {Workspace} from '../../../models/workspace';
import {AppService} from '../../app.service';
import {FileService} from '../../file.service';
import {Session} from '../../../models/session';
import {WorkspaceService} from '../../workspace.service';
import {SessionType} from '../../../models/session-type';
import {AwsIamUserService} from './methods/aws-iam-user.service';
import {LeappNotFoundError} from '../../../errors/leapp-not-found-error';
import {SessionStatus} from '../../../models/session-status';
import {AwsIamUserSession} from '../../../models/aws-iam-user-session';

let spyAppService;
let spyFileService;
let spyWorkspaceService;

let mockedSession;
let mockedSessions = [];

const fakePromise = Promise.resolve(undefined);

describe('AwsSessionService', () => {
  spyAppService = jasmine.createSpyObj('AppService', ['getOS']);
  spyAppService.getOS.and.returnValue({ homedir : () => '~/testing' });

  spyFileService = jasmine.createSpyObj('FileService', ['encryptText', 'decryptText', 'writeFileSync', 'readFileSync', 'exists', 'newDir']);
  spyFileService.exists.and.returnValue(true);
  spyFileService.newDir.and.returnValue(true);
  spyFileService.encryptText.and.callFake((text: string) => text);
  spyFileService.decryptText.and.callFake((text: string) => text);
  spyFileService.writeFileSync.and.callFake((_: string, __: string) => {});
  spyFileService.readFileSync.and.callFake((_: string) => serialize(new Workspace()) );

  beforeEach(() => {
    mockedSession = new AwsIamUserSession('fakeaccount', 'eu-west-1', 'default');
    mockedSession.sessionId = 'fakeid';

    mockedSessions = [mockedSession];
    spyWorkspaceService = {
      sessions: mockedSessions,
      getProfileName: (_: string) => 'default'
    };

    TestBed.configureTestingModule({
      providers: [
        AwsSessionService,
        { provide: WorkspaceService, useValue: spyWorkspaceService },
        { provide: AppService, useValue: spyAppService },
        { provide: FileService, useValue: spyFileService }
      ].concat(mustInjected())

    });
  });

  it('should be created', () => {
    const service: AwsSessionService = TestBed.inject(AwsSessionService);
    expect(service).toBeTruthy();
  });

  describe('get()', () => {
    it('should return a sessions given the id', () => {
      const service: AwsSessionService = TestBed.inject(AwsSessionService);

      expect(service.get('fakeid')).toBeInstanceOf(Session);
      expect(service.get('fakeid').sessionId).toEqual('fakeid');
      expect(service.get('fakeid').sessionName).toEqual('fakeaccount');
    });

    it('should return null if sessions is not found given the id', () => {
      const service: AwsSessionService = TestBed.inject(AwsSessionService);

      expect(service.get('notfoundid')).toBe(null);
    });
  });

  describe('list()', () => {
    it('should return a sessions list retrieved from workspace', () => {
      const service: AwsSessionService = TestBed.inject(AwsSessionService);

      expect(service.list()).toBeInstanceOf(Array);
      expect(service.list().length).toBeDefined();
      expect(spyWorkspaceService.sessions).toEqual(mockedSessions);
    });
  });

  describe('listChildren()', () => {
    it('should return a sessions list composed only of IAM Role Chained accounts', () => {
      const service: AwsSessionService = TestBed.inject(AwsSessionService);

      expect(service.listIamRoleChained()).toBeInstanceOf(Array);
      expect(service.listIamRoleChained().filter(c => c.type === SessionType.awsIamRoleChained)).toEqual([]);

      const mockedSession2 = new AwsIamUserSession('fakeaccount2', 'eu-west-2', 'fakeprofile2');
      mockedSession2.type = SessionType.awsIamRoleChained;
      mockedSessions.push(mockedSession2);

      expect(service.listIamRoleChained()).toBeInstanceOf(Array);
      expect(service.listIamRoleChained().filter(c => c.type === SessionType.awsIamRoleChained)).toEqual([mockedSession2]);
    });

    it('should call list() under the hood', () => {
      const service: AwsSessionService = TestBed.inject(AwsSessionService);

      spyOn(service, 'list').and.callThrough();
      service.listIamRoleChained();
      expect(service.list).toHaveBeenCalled();
    });
  });

  describe('listActive()', () => {
    it('should return a sessions list of active sessins only', () => {
      const service: AwsSessionService = TestBed.inject(AwsSessionService);

      expect(service.listActive()).toBeInstanceOf(Array);
      expect(service.listActive().filter(c => c.status === SessionStatus.active)).toEqual([]);

      const mockedSession2 = new AwsIamUserSession('fakeaccount2', 'eu-west-2', 'fakeprofile2');
      mockedSession2.status = SessionStatus.active;
      mockedSessions.push(mockedSession2);

      expect(service.listActive()).toBeInstanceOf(Array);
      expect(service.listActive().filter(c => c.status === SessionStatus.active)).toEqual([mockedSession2]);
    });

    it('should call list() under the hood', () => {
      const service: AwsSessionService = TestBed.inject(AwsSessionService);

      spyOn(service, 'list').and.callThrough();
      service.listActive();
      expect(service.list).toHaveBeenCalled();
    });
  });

  describe('start()', () => {
    it('should start a sessions', (done) => {
      const service: AwsSessionService = TestBed.inject(AwsIamUserService);

      // <any> is a trick to spy on private methods!
      spyOn<any>(service,'sessionLoading').and.callThrough();
      spyOn<any>(service,'sessionActivate').and.callThrough();
      spyOn(service,'generateCredentials').and.callFake(() => fakePromise);
      spyOn(service,'applyCredentials').and.callFake(() => fakePromise);

      expect(mockedSession.status).toBe(SessionStatus.inactive);

      service.start('fakeid');

      const caller = setTimeout(() => {
        expect((service as any).sessionActivate).toHaveBeenCalled();
        expect(mockedSession.status).toBe(SessionStatus.active);

        done();
        clearTimeout(caller);
      }, 200);
    });

    it('should call a list of predefined steps inside', (done) => {
      const service: AwsSessionService = TestBed.inject(AwsIamUserService);

      // <any> is a trick to spy on private methods!
      spyOn<any>(service,'sessionLoading').and.callThrough();
      spyOn<any>(service,'sessionActivate').and.callThrough();
      spyOn(service,'generateCredentials').and.callFake(() => fakePromise);
      spyOn(service,'applyCredentials').and.callFake(() => fakePromise);

      service.start('fakeid');

      const caller = setTimeout(() => {
        expect((service as any).sessionLoading).toHaveBeenCalled();
        expect((service as any).generateCredentials).toHaveBeenCalled();
        expect((service as any).applyCredentials).toHaveBeenCalled();
        expect((service as any).sessionActivate).toHaveBeenCalled();

        done();
        clearTimeout(caller);
      }, 200);
    });

    it('should manage an error thrown in a child step', () => {
      const service: AwsSessionService = TestBed.inject(AwsIamUserService);

      // <any> is a trick to spy on private methods!
      spyOn<any>(service, 'sessionError').and.callThrough();
      spyOn<any>(service,'sessionLoading').and.callFake(() => {
 throw new LeappNotFoundError(this, 'exploded fake function');
});



      service.start('fakeid');
      expect((service as any).sessionError).toHaveBeenCalled();
    });
  });

  describe('stop()', () => {
    it('should stop a sessions', (done) => {
      const service: AwsSessionService = TestBed.inject(AwsIamUserService);

      mockedSession.status = SessionStatus.active;
      mockedSessions = [mockedSession];

      // <any> is a trick to spy on private methods!
      spyOn(service,'deApplyCredentials').and.callFake(() => fakePromise);
      spyOn<any>(service,'sessionDeactivated').and.callThrough();

      expect(mockedSession.status === SessionStatus.active).toBe(true);
      service.stop('fakeid');

      const caller = setTimeout(() => {
        expect((service as any).sessionDeactivated).toHaveBeenCalled();
        expect(mockedSession.status === SessionStatus.active).toBe(false);

        done();
        clearTimeout(caller);
      }, 200);
    });

    it('should call a list of predefined steps inside', (done) => {
      const service: AwsSessionService = TestBed.inject(AwsIamUserService);

      // <any> is a trick to spy on private methods!
      spyOn(service,'deApplyCredentials').and.callFake(() => fakePromise);
      spyOn<any>(service,'sessionDeactivated').and.callThrough();

      service.stop('fakeid');

      const caller = setTimeout(() => {
        expect((service).deApplyCredentials).toHaveBeenCalled();
        expect((service as any).sessionDeactivated).toHaveBeenCalled();

        done();
        clearTimeout(caller);
      }, 200);
    });

    it('should manage an error thrown in a child step', (done) => {
      const service: AwsSessionService = TestBed.inject(AwsIamUserService);

      // <any> is a trick to spy on private methods!
      spyOn<any>(service, 'sessionError').and.callFake(() => {});
      spyOn(service,'deApplyCredentials').and.callFake(() => fakePromise);
      spyOn<any>(service,'sessionDeactivated').and.callFake(() => {
 throw new LeappNotFoundError(this, 'exploded fake function');
});

      service.stop('fakeid');

      const caller = setTimeout(() => {
        expect((service as any).sessionError).toHaveBeenCalled();

        done();
        clearTimeout(caller);
      }, 200);
    });
  });

  describe('rotate()', () => {
    it('should rotate a sessions when expired', (done) => {
      const service: AwsSessionService = TestBed.inject(AwsIamUserService);

      // <any> is a trick to spy on private methods!
      spyOn<any>(service,'sessionLoading').and.callThrough();
      spyOn<any>(service,'sessionRotated').and.callThrough();
      spyOn(service,'generateCredentials').and.callFake(() => fakePromise);
      spyOn(service,'applyCredentials').and.callFake(() => fakePromise);

      mockedSession.loading = true;
      mockedSession.startDateTime = new Date().toISOString();
      mockedSessions = [mockedSession];

      const previousStartDateTime = mockedSession.startDateTime;

      const caller = setTimeout(() => {
        service.rotate('fakeid');

        const caller2 = setTimeout(() => {
          expect((service as any).sessionLoading).toHaveBeenCalled();
          expect((service as any).generateCredentials).toHaveBeenCalled();
          expect((service as any).applyCredentials).toHaveBeenCalled();
          expect((service as any).sessionRotated).toHaveBeenCalled();

          expect(mockedSession.status).toBe(SessionStatus.active);
          expect(service.get('fakeid').startDateTime).not.toBe(previousStartDateTime);
          expect(new Date(service.get('fakeid').startDateTime).getTime()).toBeGreaterThan(new Date(previousStartDateTime).getTime());

          done();
          clearTimeout(caller);
          clearTimeout(caller2);
        }, 100);
      }, 100);
      service.rotate('fakeid');
    });

    it('should call a list of predefined steps inside', (done) => {
      const service: AwsSessionService = TestBed.inject(AwsIamUserService);

      // <any> is a trick to spy on private methods!
      spyOn<any>(service,'sessionLoading').and.callThrough();
      spyOn<any>(service,'sessionRotated').and.callThrough();
      spyOn(service,'generateCredentials').and.callFake(() => fakePromise);
      spyOn(service,'applyCredentials').and.callFake(() => fakePromise);

      service.rotate('fakeid');

      const caller = setTimeout(() => {
        expect((service as any).sessionLoading).toHaveBeenCalled();
        expect((service as any).generateCredentials).toHaveBeenCalled();
        expect((service as any).applyCredentials).toHaveBeenCalled();
        expect((service as any).sessionRotated).toHaveBeenCalled();

        done();
        clearTimeout(caller);
      }, 200);
    });

    it('should manage an error thrown in a child step', () => {
      const service: AwsSessionService = TestBed.inject(AwsIamUserService);

      // <any> is a trick to spy on private methods!
      spyOn<any>(service, 'sessionError').and.callThrough();
      spyOn<any>(service,'sessionLoading').and.callFake(() => {
 throw new LeappNotFoundError(this, 'exploded fake function');
});

      service.rotate('fakeid');
      expect((service as any).sessionError).toHaveBeenCalled();
    });
  });
});

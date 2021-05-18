import {WorkspaceService} from './workspace.service';
import {TestBed} from '@angular/core/testing';
import {Workspace} from '../models/workspace';
import {mustInjected} from '../../base-injectables';
import {Session} from '../models/session';
import {AwsPlainAccount} from '../models/aws-plain-account';
import {serialize} from 'class-transformer';
import {AppService} from './app.service';
import {FileService} from './file.service';

describe('WorkspaceService', () => {
  let workspaceService;
  let workspace;
  let mockedSession;
  let spyAppService;
  let spyFileService;

  beforeEach(() => {

    spyAppService = jasmine.createSpyObj('AppService', ['getOS']);
    spyAppService.getOS.and.returnValue({ homedir : () => '~/testing' });

    spyFileService = jasmine.createSpyObj('FileService', ['encryptText', 'decryptText', 'writeFileSync', 'readFileSync', 'exists', 'newDir']);
    spyFileService.exists.and.returnValue(true);
    spyFileService.newDir.and.returnValue(true);
    spyFileService.encryptText.and.callFake((text: string) => text);
    spyFileService.decryptText.and.callFake((text: string) => text);
    spyFileService.writeFileSync.and.callFake((_: string, __: string) => {});
    spyFileService.readFileSync.and.callFake((_: string) => serialize(new Workspace()) );

    TestBed.configureTestingModule({
      providers: [
        WorkspaceService,
        { provide: AppService, useValue: spyAppService },
        { provide: FileService, useValue: spyFileService }
      ].concat(mustInjected())
    });

    workspaceService = TestBed.inject(WorkspaceService) as WorkspaceService;
    workspace = workspaceService.create();

    mockedSession = new Session(new AwsPlainAccount('', '', ''), 'profile');
  });

  it('should be created', () => {
    expect(workspaceService).toBeTruthy();
  });

  describe('create()', () => {
    it('should persist code in the .Leapp-lock.json file the first time is called', () => {
      spyOn(workspaceService, 'persist').and.callThrough();
      // Mock first time access
      spyFileService.exists.and.returnValue(false);
      spyFileService.newDir.and.returnValue(false);
      // Call create
      workspaceService.create();
      expect(workspaceService.persist).toHaveBeenCalled();
    });

    it('should not create a second instance of Workspace after first one', () => {
      spyFileService.readFileSync.and.callFake((_: string) => serialize(new Workspace()));
      workspaceService.create();
      const workspace1 = workspaceService.get();
      workspace1.sessions.push(mockedSession);
      spyFileService.readFileSync.and.callFake((_: string) => serialize(workspace1) );
      workspaceService.updatePersistedSessions(workspace1.sessions);

      workspaceService.create();
      const workspace2 = workspaceService.get();
      expect(serialize(workspace1)).toEqual(serialize(workspace2));
    });
  });

  describe('get()', () => {
    it('should return a workspace object', () => {
      workspace = workspaceService.get();

      expect(workspace).toBeDefined();
      expect(workspace).toBeInstanceOf(Workspace);
    });
  });

  describe('getPersistedSessions()', () => {
    it('should return a Session array: Session[]', () => {
      workspace = new Workspace();

      spyFileService.readFileSync.and.callFake((_: string) => serialize(workspace));
      workspaceService.get();

      workspace.sessions.push(mockedSession);

      expect(workspaceService.getPersistedSessions()).toBeInstanceOf(Array);
      expect(workspaceService.getPersistedSessions()[0]).toBeInstanceOf(Session);
    });
  });

  describe('get sessions()', () => {
    it('should return an array of sessions', () => {
      workspace = new Workspace();
      workspace.sessions.push(mockedSession);
      workspaceService.sessions = [...workspace.sessions];

      expect(workspaceService.sessions).toBeInstanceOf(Array);
      expect(workspaceService.sessions[0]).toBeInstanceOf(Session);
    });
  });

  describe('set sessions()', () => {
    it('should set sessions to an array of session', () => {
      workspace = new Workspace();
      workspace.sessions.push(mockedSession);

      workspaceService.sessions = [...workspace.sessions];

      expect(workspaceService.sessions).toBeInstanceOf(Array);
      expect(workspaceService.sessions[0]).toBeInstanceOf(Session);
    });

    it('should call next to notify observers', () => {
      workspace = new Workspace();
      workspace.sessions.push(mockedSession);

      spyOn(workspaceService._sessions, 'next').and.callThrough();

      workspaceService.sessions = [...workspace.sessions];

      expect(workspaceService._sessions.next).toHaveBeenCalled();
    });
  });

  describe('getProfileName()', () => {
    it('should return a profile name when an id matches', () => {
      workspace = new Workspace();
      spyFileService.readFileSync.and.callFake((_: string) => serialize(workspace));
      expect(workspaceService.getProfileName(workspaceService.get().profiles[0].id)).toEqual('default');
    });

    it('should return null  when an id NOT matches', () => {
      expect(workspaceService.getProfileName('fakeid')).toEqual(null);
    });
  });

  describe('addSession()', () => {
    it('should add a session to the session array of workspace service', () => {
      const oldLength = workspaceService.sessions.length;
      workspaceService.addSession(mockedSession);
      expect(workspaceService.sessions.length).toEqual(oldLength + 1);
      expect(serialize(workspaceService.sessions[oldLength])).toEqual(serialize(mockedSession));
    });

    it('should invoke next and persist data', () => {

      spyOn(workspaceService._sessions, 'next').and.callThrough();
      spyOn(workspaceService, 'persist').and.callThrough();

      workspaceService.addSession(mockedSession);

      expect(workspaceService._sessions.next).toHaveBeenCalled();
      expect(workspaceService.persist).toHaveBeenCalled();
    });
  });

  describe('removeSession()', () => {
    it('should remove a session from the workspace sessions', () => {

      workspaceService.addSession(mockedSession);

      const sessionId = mockedSession.sessionId;
      const oldLength = workspaceService.sessions.length;
      workspaceService.removeSession(sessionId);

      expect(workspaceService.sessions.length).toEqual(oldLength - 1);
      expect(workspaceService.sessions.find(s => s.sessionId === sessionId)).toBeUndefined();
    });
  });
});

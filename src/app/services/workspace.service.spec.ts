import {WorkspaceService} from './workspace.service';
import {TestBed} from '@angular/core/testing';
import {Workspace} from '../models/workspace';
import {AppService} from './app.service';
import {mustInjected} from '../../base-injectables';
import {FileService} from './file.service';
import {Session} from '../models/session';
import {AwsPlainAccount} from '../models/aws-plain-account';
import {serialize} from 'class-transformer';

describe('WorkspaceService', () => {
  let workspaceService;
  let workspace;
  let mockedSession;
  let spyAppService;
  let spyFileService;

  beforeEach(() => {
    spyAppService = jasmine.createSpyObj('AppService', ['getOS']);
    spyAppService.getOS.and.returnValue({ homedir : () => '~/testing' });

    spyFileService = jasmine.createSpyObj('FileService', ['encryptText', 'decryptText', 'writeFileSync', 'readFileSync', 'exists']);
    spyFileService.exists.and.returnValue(true);
    spyFileService.encryptText.and.callFake((text: string) => text);
    spyFileService.decryptText.and.callFake((text: string) => text);
    spyFileService.writeFileSync.and.callFake((_: string, __: string) => {});
    spyFileService.readFileSync.and.callFake((_: string) => JSON.stringify(new Workspace()) );

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
      spyFileService.readFileSync.and.returnValue(null);
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
      workspace = workspaceService.get();
      workspace.sessions.push(mockedSession);

      spyFileService.readFileSync.and.callFake((_: string) => serialize(workspace));

      expect(workspaceService.getPersistedSessions()).toBeInstanceOf(Array);
      expect(workspaceService.getPersistedSessions()[0]).toBeInstanceOf(Session);
    });
  });
});

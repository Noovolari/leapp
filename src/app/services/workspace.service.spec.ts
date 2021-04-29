import {WorkspaceService} from './workspace.service';
import {TestBed} from '@angular/core/testing';
import {Workspace} from '../models/workspace';
import {AppService} from '../services-system/app.service';
import {mustInjected} from '../../base-injectables';
import {FileService} from '../services-system/file.service';
import {Session} from '../models/session';
import {AwsPlainAccount} from '../models/aws-plain-account';

describe('WorkspaceService', () => {
  let workspaceService;
  let workspace;
  let spyAppService;
  let spyFileService;

  beforeEach(() => {
    spyAppService = jasmine.createSpyObj('AppService', ['getOS']);
    spyAppService.getOS.and.returnValue({ homedir : () => '~/testing' });

    spyFileService = jasmine.createSpyObj('FileService', ['encryptText', 'decryptText', 'writeFileSync', 'readFileSync']);
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
  });

  it('should be created', () => {
    expect(workspaceService).toBeTruthy();
  });

  describe('Create()', () => {
    it('should persist code in the .Leapp-lock.json file the first time is called', () => {
      spyOn(workspaceService, 'persist').and.callThrough();
      // Mock first time access
      spyFileService.readFileSync.and.returnValue(null);
      // Call create
      workspaceService.create();
      expect(workspaceService.persist).toHaveBeenCalled();
    });

    it('should not create a second instance of Workspace after first one', () => {
      spyFileService.readFileSync.and.callFake((_: string) => JSON.stringify(new Workspace()) );
      workspaceService.create();
      const workspace1 = workspaceService.get();
      console.log(new Workspace());

      workspace1.sessions.push(new Session(new AwsPlainAccount('', '', '', '', ''), 'profile'));
      spyFileService.readFileSync.and.callFake((_: string) => JSON.stringify(workspace1) );

      workspaceService.create();
      const workspace2 = workspaceService.get();

      expect(workspace1).toEqual(workspace2);
    });
  });

  describe('Get()', () => {
    it('should return a workspace object', () => {
      workspace = workspaceService.get();

      expect(workspace).toBeDefined();
      expect(workspace).toBeInstanceOf(Workspace);
    });
  });
});

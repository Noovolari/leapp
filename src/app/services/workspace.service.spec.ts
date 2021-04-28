import {WorkspaceService} from './workspace.service';
import {TestBed} from '@angular/core/testing';
import {Workspace} from '../models/workspace';
import {AppService} from '../services-system/app.service';
import {mustInjected} from '../../base-injectables';
import {FileService} from '../services-system/file.service';

describe('WorkspaceService', () => {
  let workspaceService;

  const spyAppService = jasmine.createSpyObj('AppService', ['getOS']);
  spyAppService.getOS.and.returnValue({ homedir : () => '~/testing' });

  const spyFileService = jasmine.createSpyObj('FileService', ['encryptText', 'decryptText', 'writeFileSync', 'readFileSync']);
  spyFileService.encryptText.and.returnValue((text: string) => text);
  spyFileService.decryptText.and.returnValue((text: string) => text);
  spyFileService.writeFileSync.and.returnValue((filePath: string, content: string) => {});
  spyFileService.readFileSync.and.returnValue((path: string) => '');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WorkspaceService,
        { provide: AppService, useValue: spyAppService },
        { provide: FileService, useValue: spyFileService }
      ].concat(mustInjected())
    });

    workspaceService = TestBed.inject(WorkspaceService) as WorkspaceService;
  });

  it('should be created', () => {
    expect(workspaceService).toBeTruthy();
  });

  describe('Create()', () => {
    it('should persist code in the .Leapp-lock.json file', () => {
      spyOn(workspaceService, 'persist').and.callThrough();

      workspaceService.create();

      expect(workspaceService.persist).toHaveBeenCalled();
    });

    it('should generate an instance of Workspace', () => {
      expect(workspaceService.create()).toBeInstanceOf(Workspace);
    });
  });
});

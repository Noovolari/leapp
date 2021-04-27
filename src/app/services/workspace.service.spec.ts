import {WorkspaceService} from './workspace.service';
import {TestBed} from '@angular/core/testing';
import {Workspace} from '../models/workspace';
import {AppService} from '../services-system/app.service';
import {mustInjected} from '../../base-injectables';

describe('WorkspaceService', () => {
  let workspaceService;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('AppService', ['getOS']);
    spy.getOS.and.returnValue({ homedir : () => '~/' });

    TestBed.configureTestingModule({
      providers: [
        WorkspaceService,
        { provide: AppService, useValue: spy }
      ].concat(mustInjected())
    });

    workspaceService = TestBed.inject(WorkspaceService) as WorkspaceService;
  });

  it('should be created', () => {
    expect(workspaceService).toBeTruthy();
    expect(workspaceService.create()).toBeInstanceOf(Workspace);
  });
});

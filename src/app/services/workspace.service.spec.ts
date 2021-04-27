import {WorkspaceService} from './workspace.service';
import {TestBed} from '@angular/core/testing';
import {Workspace} from '../models/workspace';
import {AppService} from '../services-system/app.service';
import {mustInjected} from '../../base-injectables';

class MokedAppService {
  constructor() {}
  getOS() {
    return { homedir : () => '~/' };
  }
}

describe('WorkspaceService', () => {
  let workspaceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provider: AppService, useClass: MokedAppService }, WorkspaceService].concat(mustInjected())
    });

    workspaceService = TestBed.inject(WorkspaceService) as WorkspaceService;
  });

  it('should be created', () => {
    expect(workspaceService).toBeTruthy();
    expect(workspaceService.create()).toBeInstanceOf(Workspace);
  });
});

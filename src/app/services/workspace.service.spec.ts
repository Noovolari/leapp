import {WorkspaceService} from './workspace.service';
import {TestBed} from '@angular/core/testing';

describe('WorkspaceService', () => {
  let workspaceService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [WorkspaceService] });
    workspaceService = TestBed.inject(WorkspaceService);
  });

  it('should be created', () => {
    expect(workspaceService).toBeTruthy();
  });
});

import {TestBed} from '@angular/core/testing';

import {WorkspaceService} from './workspace.service';

describe('WorkspaceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WorkspaceService = TestBed.get(WorkspaceService);
    expect(service).toBeTruthy();
  });
});

import {WorkspaceService} from './workspace.service';
import {TestBed} from '@angular/core/testing';
import {IndividualConfig, ToastrService} from 'ngx-toastr';
import {BsModalService} from 'ngx-bootstrap/modal';
import {ComponentLoaderFactory} from 'ngx-bootstrap/component-loader';
import {PositioningService} from 'ngx-bootstrap/positioning';

const toastrService = {
  success: (
    message?: string,
    title?: string,
    override?: Partial<IndividualConfig>
  ) => {},
  error: (
    message?: string,
    title?: string,
    override?: Partial<IndividualConfig>
  ) => {},
};

describe('WorkspaceService', () => {
  let workspaceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WorkspaceService, PositioningService, ComponentLoaderFactory, BsModalService, { provide: ToastrService, useValue: toastrService }]
    });

    workspaceService = TestBed.inject(WorkspaceService);
  });

  it('should be created', () => {
    expect(workspaceService).toBeTruthy();
  });
});

import {TestBed} from '@angular/core/testing';

import {ExecuteServiceService} from './execute-service.service';

describe('ExecuteServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ExecuteServiceService = TestBed.get(ExecuteServiceService);
    expect(service).toBeTruthy();
  });
});

import {TestBed} from '@angular/core/testing';

import {SsmService} from './ssm.service';

describe('SsmService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SsmService = TestBed.get(SsmService);
    expect(service).toBeTruthy();
  });
});

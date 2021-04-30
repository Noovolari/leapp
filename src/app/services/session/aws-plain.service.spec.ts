import {TestBed} from '@angular/core/testing';

import {AwsPlainService} from './aws-plain.service';

describe('AwsPlainService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AwsPlainService = TestBed.get(AwsPlainService);
    expect(service).toBeTruthy();
  });
});

import {TestBed} from '@angular/core/testing';

import {AwsSsoService} from './aws-sso.service';

describe('AwsSsoService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AwsSsoService = TestBed.get(AwsSsoService);
    expect(service).toBeTruthy();
  });
});

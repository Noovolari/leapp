import { TestBed } from '@angular/core/testing';

import { AwsSsoService } from './aws-sso.service';

describe('AwsSsoService', () => {
  let service: AwsSsoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AwsSsoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

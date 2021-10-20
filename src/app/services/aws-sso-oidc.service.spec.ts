import { TestBed } from '@angular/core/testing';

import { AwsSsoOidcService } from './aws-sso-oidc.service';

describe('AwsSsoOidcService', () => {
  let service: AwsSsoOidcService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AwsSsoOidcService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

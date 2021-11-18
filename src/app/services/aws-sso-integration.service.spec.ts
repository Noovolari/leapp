import { TestBed } from '@angular/core/testing';

import { AwsSsoIntegrationService } from './aws-sso-integration.service';

describe('AwsSsoIntegrationService', () => {
  let service: AwsSsoIntegrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AwsSsoIntegrationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

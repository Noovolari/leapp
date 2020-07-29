import {TestBed} from '@angular/core/testing';

import {CredentialsService} from './credentials.service';

describe('CredentialsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CredentialsService = TestBed.get(CredentialsService);
    expect(service).toBeTruthy();
  });
});

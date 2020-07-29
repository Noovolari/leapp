import {TestBed} from '@angular/core/testing';

import {FederatedAccountService} from './federated-account.service';

describe('FederatedAccountService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FederatedAccountService = TestBed.get(FederatedAccountService);
    expect(service).toBeTruthy();
  });
});

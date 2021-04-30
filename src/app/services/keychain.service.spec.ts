import { TestBed } from '@angular/core/testing';

import { KeychainService } from './keychain.service';

describe('KeychainService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: KeychainService = TestBed.get(KeychainService);
    expect(service).toBeTruthy();
  });
});

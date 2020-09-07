import { TestBed } from '@angular/core/testing';

import { ProviderManagerService } from './provider-manager.service';

describe('ProviderManagerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ProviderManagerService = TestBed.get(ProviderManagerService);
    expect(service).toBeTruthy();
  });
});

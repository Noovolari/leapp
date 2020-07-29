import {TestBed} from '@angular/core/testing';

import {LicenceService} from './licence.service';

describe('LicenceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LicenceService = TestBed.get(LicenceService);
    expect(service).toBeTruthy();
  });
});

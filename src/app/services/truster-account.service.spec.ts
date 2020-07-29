import {TestBed} from '@angular/core/testing';

import {TrusterAccountService} from './truster-account.service';

describe('TrusterAccountService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TrusterAccountService = TestBed.get(TrusterAccountService);
    expect(service).toBeTruthy();
  });
});

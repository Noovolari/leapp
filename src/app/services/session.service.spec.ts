import {TestBed} from '@angular/core/testing';

import {SessionService} from './session.service';
import {mustInjected} from '../../base-injectables';

describe('SessionService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [SessionService].concat(mustInjected())
  }));

  it('should be created', () => {
    const service: SessionService = TestBed.get(SessionService);
    expect(service).toBeTruthy();
  });
});

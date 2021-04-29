import {TestBed} from '@angular/core/testing';

import {TimerService} from './timer.service';
import {mustInjected} from '../../base-injectables';

describe('TimerService', () => {
  let service: TimerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TimerService].concat(mustInjected())
    });
    service = TestBed.inject(TimerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

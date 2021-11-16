import {TestBed} from '@angular/core/testing';

import {TimerService} from './timer.service';
import {mustInjected} from '../../base-injectables';

describe('TimerService', () => {
  let timerService: TimerService;

  beforeEach(() => {
    jasmine.clock().uninstall();
    jasmine.clock().install();

    TestBed.configureTestingModule({
      providers: [TimerService].concat(mustInjected())
    });
    timerService = TestBed.inject(TimerService);
  });

  it('should be created', () => {
    expect(timerService).toBeTruthy();
  });

  describe('start()', () => {
    it('should run the callback function after one second', () => {
      const fakeCallbackObject = {
        fakeCallback: () => {
          console.log('fake callback called');
        }
      };
      const spyCallback = spyOn(fakeCallbackObject, 'fakeCallback').and.callThrough();

      timerService.start(fakeCallbackObject.fakeCallback);
      expect(spyCallback).not.toHaveBeenCalled();

      jasmine.clock().tick(1001);
      expect(spyCallback).toHaveBeenCalled();
    });

    it('should run the setInterval timer', () => {
      const fakeCallbackObject = {
        fakeCallback: () => {
          console.log('fake callback called');
        }
      };
      const spySetInterval = spyOn(window, 'setInterval').and.callThrough();

      timerService.start(fakeCallbackObject.fakeCallback);
      expect(spySetInterval).toHaveBeenCalled();
    });

    it('should manage timer as a singleton', () => {
      const fakeCallbackObject = {
        fakeCallback: () => {
          console.log('fake callback called');
        }
      };
      const spyTimerProperty = spyOnProperty(timerService, 'timer', 'set').and.callThrough();
      timerService.start(fakeCallbackObject.fakeCallback);
      timerService.start(fakeCallbackObject.fakeCallback);
      timerService.start(fakeCallbackObject.fakeCallback);
      expect(spyTimerProperty).toHaveBeenCalledTimes(1);
    });

    it('should run callback every 1 second', () => {
      const fakeCallbackObject = {
        fakeCallback: () => {
          console.log('fake callback called');
        }
      };
      const spyCallback = spyOn(fakeCallbackObject, 'fakeCallback').and.callThrough();

      timerService.start(fakeCallbackObject.fakeCallback);
      expect(spyCallback).not.toHaveBeenCalled();

      jasmine.clock().tick(1001);
      jasmine.clock().tick(1001);
      jasmine.clock().tick(1001);
      jasmine.clock().tick(1001);
      jasmine.clock().tick(1001);

      expect(spyCallback).toHaveBeenCalledTimes(5);
    });
  });
});

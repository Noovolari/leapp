import {EventEmitter, Injectable} from '@angular/core';
import {NativeService} from '../services-system/native-service';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TimerService extends NativeService {
  processRefreshByTimer = new EventEmitter();

  // Unique timer object and time data
  timer = null;
  startTime;

  /**
   * Process the actual refresh credential check: if we are over the sessionDuration parameters we need to refresh credentials
   */
  private processRefreshCredentials() {
    if (this.startTime) {
      const currentTime = new Date();
      const seconds = (currentTime.getTime() - this.startTime.getTime()) / 1000;
      const timeToRefresh = (seconds > environment.sessionDuration);
      if (timeToRefresh) {
        this.processRefreshByTimer.emit();
      }
    }
  }

  defineTimer() {
    // Start Calculating time here once credentials are actually retrieved
    this.startTime = new Date();

    // If the timer is not set, set the unique timer object and fix the starting time
    if (this.timer === undefined || this.timer === null) {
      this.timer = setInterval(() => {
        // process time check for session
        this.processRefreshCredentials();
      }, 1000);
    }
  }

  clearTimer() {
    // Stop the current timer and start date
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.startTime = null;
    }
  }
}

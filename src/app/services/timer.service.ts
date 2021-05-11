import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  private _timer: NodeJS.Timeout;
  private timeInterval = 1000;

  constructor() { }

  set timer(value: NodeJS.Timeout) {
    this._timer = value;
  }

  get timer(): NodeJS.Timeout {
    return this._timer;
  }

  start(callback: () => void) {
    if (!this.timer) {
      this.timer = setInterval(() => {
        callback();
      }, this.timeInterval);
    }
  }
}

import {Injectable} from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class TimerService {
  set timer(value: NodeJS.Timeout) {
    this._timer = value;
  }
  get timer(): NodeJS.Timeout {
    return this._timer;
  }

  private _timer: NodeJS.Timeout;
  private TIME_INTERVAL = 1000;

  constructor() { }

  start(callback: () => void) {
    if (!this.timer) {
      this.timer = setInterval(() => {
        callback();
      }, this.TIME_INTERVAL);
    }
  }

}

import {Injectable} from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class TimerService {

  timer: NodeJS.Timeout;
  TIME_INTERVAL = 1000;

  constructor() { }

  start(callback: () => void) {
    if (this.timer) {
      this.timer = setInterval(() => {
        callback();
      }, this.TIME_INTERVAL);
    }
  }

}

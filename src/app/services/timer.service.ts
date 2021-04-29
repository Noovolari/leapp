import {Injectable} from '@angular/core';
import {SessionService} from './session.service';

@Injectable({
  providedIn: 'root'
})
export class TimerService {

  timer: NodeJS.Timeout;
  TIME_INTERVAL = 1000;

  constructor(private sessionService: SessionService) { }

  start() {
    if (this.timer) {
      this.timer = setInterval(() => {
        this.checkExpiringSessions();
      }, this.TIME_INTERVAL);
    }
  }

  private checkExpiringSessions() {
    const activeSessions = this.sessionService.listActive();
    activeSessions.forEach(session => {
      if (this.sessionService.expired(session.sessionId)) {this.sessionService.rotate(session.sessionId); }
    });
  }
}

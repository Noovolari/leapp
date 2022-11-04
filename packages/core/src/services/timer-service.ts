export class TimerService {
  private timeOutTimer: NodeJS.Timeout;

  constructor(private intervalInMs: number) {}

  set timer(value: NodeJS.Timeout) {
    this.timeOutTimer = value;
  }

  get timer(): NodeJS.Timeout {
    return this.timeOutTimer;
  }

  start(callback: () => void): void {
    if (!this.timer) {
      this.timer = setInterval(() => {
        callback();
      }, this.intervalInMs);
    }
  }
}

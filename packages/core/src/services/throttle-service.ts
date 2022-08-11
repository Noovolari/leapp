export class ThrottleService {
  private totalCalls: number;
  private pendingCalls: number;
  private lastCallId: number;
  private lastCallTime: number;
  private readonly minDelay: number;

  constructor(private call: (...params: any) => Promise<any>, maxCallsPerSecond: number) {
    this.lastCallId = -1;
    this.totalCalls = 0;
    this.pendingCalls = 0;
    this.lastCallTime = 0;
    this.minDelay = (1 / maxCallsPerSecond) * 1000;
  }

  async waitFor(delayInMs: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, delayInMs));
  }

  async callWithThrottle(...params: any): Promise<any> {
    const callId = this.totalCalls++;
    if (this.lastCallTime) {
      const timeout = this.pendingCalls * this.minDelay;
      this.pendingCalls++;
      await this.waitFor(timeout);

      let timeSinceLastCall = new Date().getTime() - this.lastCallTime;
      while (timeSinceLastCall <= this.minDelay || this.lastCallId !== callId - 1) {
        await this.waitFor(1);
        timeSinceLastCall = new Date().getTime() - this.lastCallTime;
      }

      this.pendingCalls--;
    }
    this.lastCallId = callId;
    this.lastCallTime = new Date().getTime();
    return this.call(...params);
  }
}

export class ThrottledService {
  private pendingCalls: number;

  constructor(private call: (...params: any) => Promise<any>, private tps: number) {
    this.pendingCalls = 0;
  }

  async callWithThrottle(...params: any): Promise<any> {
    this.pendingCalls++;
    const timeout = this.pendingCalls === 1 ? 0 : this.pendingCalls / this.tps;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.pendingCalls--;
        this.call(...params)
          .then((value) => {
            resolve(value);
          })
          .catch((error) => {
            reject(error);
          });
      }, timeout);
    });
  }
}

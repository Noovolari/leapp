import { describe, test, expect, jest } from "@jest/globals";
import { ThrottleService } from "./throttle-service";

jest.mock("../models/session");

describe("ThrottledService", () => {
  test("callWithThrottle", async () => {
    const totalCalls = 40;
    const tps = 20;

    let lastEndpointCall = 0;
    let lastNthEndpointCall = 0;
    const endpointFn = jest.fn((p1: number, nthCall: number) => {
      const callTime = new Date().getTime();

      expect(p1).toBe(1);
      expect(nthCall).toBe(lastNthEndpointCall);
      lastNthEndpointCall++;

      if (lastEndpointCall) {
        expect(callTime - lastEndpointCall).toBeGreaterThanOrEqual(1000 / tps);
      }
      lastEndpointCall = callTime;
      if (nthCall % 2) {
        return Promise.resolve();
      } else {
        return Promise.reject("endpoint error");
      }
    });

    const service = new ThrottleService((p1, p2) => endpointFn(p1, p2), tps);

    const callPromises = [];
    for (let i = 0; i < totalCalls; i++) {
      callPromises.push(service.callWithThrottle(1, i));
    }

    await Promise.allSettled(callPromises);

    expect(endpointFn).toHaveBeenCalledTimes(totalCalls);
  });
});

import { describe, test, expect, jest } from "@jest/globals";
import { ThrottleService } from "./throttle-service";

jest.mock("../models/session");

describe("ThrottledService", () => {
  test("callWithThrottle", async () => {
    const totalCalls = 50;
    const tps = 20;

    let lastNthEndpointCall = 0;
    // eslint-disable-next-line prefer-const
    let service;

    const endpointFn = jest.fn((p1: number, nthCall: number) => {
      expect(p1).toBe(1);
      expect(nthCall).toBe(lastNthEndpointCall);
      lastNthEndpointCall++;

      expect(service.pendingCalls).toBeLessThanOrEqual(tps);
      // Call duration must be enough to test the max pendingCalls limiter
      return new Promise<void>((resolve) => setTimeout(() => resolve(), 100));
    });

    service = new ThrottleService((p1, p2) => endpointFn(p1, p2), tps);

    const startTime = new Date().getTime();

    const callPromises = [];
    for (let i = 0; i < totalCalls; i++) {
      callPromises.push(service.callWithThrottle(1, i));
    }

    await Promise.all(callPromises);
    const elapsedTime = new Date().getTime() - startTime;
    expect(elapsedTime).toBeGreaterThanOrEqual(((totalCalls - 1) / tps) * 1000);
    expect(endpointFn).toHaveBeenCalledTimes(totalCalls);
  });

  test("callWithThrottle, max pendingCalls", async () => {
    const totalCalls = 21;
    const tps = 20;

    // eslint-disable-next-line prefer-const
    let service;

    const endpointFn = jest.fn(() => {
      expect(service.pendingCalls).toBeLessThanOrEqual(tps);
      // Call duration must be enough to test the max pendingCalls limiter
      return new Promise<void>((resolve) => setTimeout(() => resolve(), 2000));
    });

    service = new ThrottleService(() => endpointFn(), tps);
    const callPromises = [];
    for (let i = 0; i < totalCalls; i++) {
      callPromises.push(service.callWithThrottle());
    }
    await Promise.all(callPromises);
  });

  test("callWithThrottle, error handling", async () => {
    const endpointFn = jest.fn(() => {
      throw new Error("fake error");
    });
    const service = new ThrottleService(() => endpointFn(), 20);
    try {
      await service.callWithThrottle();
    } catch (error) {}
    expect((service as any).pendingCalls).toBe(0);
  });
});

import { describe, test, expect } from "@jest/globals";
import { LoggedEntry, LoggedException, LogLevel, LogService } from "./log-service";
import { ILogger } from "../interfaces/i-logger";

describe("LogService", () => {
  test("log", () => {
    const logMessages = [];
    const toasts = [];

    const nativeLogger: ILogger = {
      log: (message: string, level: LogLevel) => {
        logMessages.push({ message, level });
      },
      show: (message: string, level: LogLevel) => {
        toasts.push({ message, level });
      },
    };
    const logService = new LogService(nativeLogger);
    logService.log(new LoggedEntry("message1", "context1", LogLevel.info));
    logService.log(new LoggedEntry("message2", 12, LogLevel.warn, true, "stack2"));
    logService.log(new LoggedException("message3", new Date(), LogLevel.error, undefined, "stack3"));

    expect(logMessages[0].level).toBe(LogLevel.info);
    expect(logMessages[0].message.startsWith("[String] Error: message1\n    at Object.")).toBe(true);

    expect(logMessages[1].level).toBe(LogLevel.warn);
    expect(logMessages[1].message).toBe("[Number] stack2");

    expect(logMessages[2].level).toBe(LogLevel.error);
    expect(logMessages[2].message).toBe("[Date] stack3");

    expect(toasts).toEqual([
      { level: 2, message: "message2" },
      { level: 3, message: "message3" },
    ]);
  });
});

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
    logService.log(new LoggedEntry("[String] Error: message1\\n    at Object.", "context1", LogLevel.info));
    logService.log(new LoggedEntry("[Number] stack2", 12, LogLevel.warn, true, "stack2"));
    logService.log(new LoggedException("[Date] stack3", new Date(), LogLevel.error, undefined, "stack3"));

    expect(logMessages[0].level).toBe(LogLevel.info);
    expect(logMessages[0].message.startsWith("[String] Error")).toBe(true);

    expect(logMessages[1].level).toBe(LogLevel.warn);
    expect(logMessages[1].message).toBe("[Number] stack2");

    expect(logMessages[2].level).toBe(LogLevel.error);
    expect(logMessages[2].message).toBe("[Date] stack3");

    expect(toasts).toEqual([
      { level: 2, message: "[Number] stack2" },
      { level: 3, message: "[Date] stack3" },
    ]);
  });

  test("log - 2", () => {
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
    logService.log(new LoggedEntry("[String] Error: message1\\n    at Object.", "context1", LogLevel.info));
    logService.log(new LoggedEntry("[Number] stack2", 12, LogLevel.warn, true, "stack2"));
    logService.log(new LoggedException("[Date] stack3", new Date(), LogLevel.error, undefined, "stack3"));
    logService.log(new LoggedException("[Date] stack4", undefined, LogLevel.error, undefined, "stack4 custom"));
    logService.log(new LoggedException("[Date] stack5", undefined, LogLevel.error, undefined, undefined));

    expect(logMessages[0].level).toBe(LogLevel.info);
    expect(logMessages[0].message.startsWith("[String] Error")).toBe(true);

    expect(logMessages[1].level).toBe(LogLevel.warn);
    expect(logMessages[1].message).toBe("[Number] stack2");

    expect(logMessages[2].level).toBe(LogLevel.error);
    expect(logMessages[2].message).toBe("[Date] stack3");

    expect(logMessages[3].level).toBe(LogLevel.error);
    expect(logMessages[3].message).toBe("stack4 custom");

    expect(toasts).toEqual([
      { level: 2, message: "[Number] stack2" },
      { level: 3, message: "[Date] stack3" },
      { level: 3, message: "[Date] stack4" },
      { level: 3, message: "[Date] stack5" },
    ]);
  });
});

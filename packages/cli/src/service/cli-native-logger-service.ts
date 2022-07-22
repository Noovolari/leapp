import { ILogger } from "@hesketh-racing/leapp-core/interfaces/i-logger";
import { LogLevel } from "@hesketh-racing/leapp-core/services/log-service";

export class CliNativeLoggerService implements ILogger {
  constructor() {}

  log(message: string, level: LogLevel): void {
    if (level === LogLevel.info || level === LogLevel.success) {
      global.console.info(message);
    } else if (level === LogLevel.warn) {
      global.console.warn(message);
    } else {
      global.console.error(message);
    }
  }

  show(_message: string, _level: LogLevel): void {
    // TODO: implement a user notification service
  }
}

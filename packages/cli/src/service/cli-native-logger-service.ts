import { ILogger } from "@noovolari/leapp-core/interfaces/i-logger";
import { LogLevel } from "@noovolari/leapp-core/services/log-service";

export class CliNativeLoggerService implements ILogger {
  constructor() {}

  log(message: string, level: LogLevel) {
    if (level === LogLevel.info || level === LogLevel.success) {
      global.console.info(message);
    } else if (level === LogLevel.warn) {
      global.console.warn(message);
    } else {
      global.console.error(message);
    }
  }

  show(_message: string, _level: LogLevel) {
    // TODO: implement a user notification service
  }
}

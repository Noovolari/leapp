import { ILogger } from "../interfaces/i-logger";

export enum LogLevel {
  success,
  info,
  warn,
  error,
}

export class LoggedEntry extends Error {
  constructor(message: string, public context: any, public level: LogLevel, public display: boolean) {
    super(message);
  }
}

export class LoggedException extends LoggedEntry {}

export class LogService {
  constructor(private logger: ILogger) {}

  log(loggedEntry: LoggedEntry): void {
    const contextPart: string = loggedEntry.context ? `[${loggedEntry.context.constructor["name"]}]` : "";
    const finalMessage = [contextPart, loggedEntry.message, loggedEntry.stack].join(" ");
    this.logger.log(finalMessage, loggedEntry.level);
    if (loggedEntry.display) {
      this.logger.show(finalMessage, loggedEntry.level);
    }
  }
}

export class Context {
  logService = new LogService(null);

  method1() {
    this.logService.log(new LoggedEntry("something to log", this, LogLevel.warn, true));
  }

  method2() {
    throw new LoggedException("something to log", this, LogLevel.error, true);
  }
}

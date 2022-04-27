import { ILogger } from "../interfaces/i-logger";

export enum LogLevel {
  success,
  info,
  warn,
  error,
}

export class LoggedEntry extends Error {
  constructor(message: string, public context: any, public level: LogLevel, public display: boolean = true) {
    super(message);
  }
}

export class LoggedException extends LoggedEntry {}

export class LogService {
  constructor(private logger: ILogger) {}

  log(loggedEntry: LoggedEntry): void {
    const contextPart = loggedEntry.context ? [`[${loggedEntry.context.constructor["name"]}]`] : [];
    this.logger.log([...contextPart, loggedEntry.stack].join(" "), loggedEntry.level);
    if (loggedEntry.display) {
      this.logger.show(loggedEntry.message, loggedEntry.level);
    }
  }
}

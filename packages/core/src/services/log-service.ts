import { ILogger } from "../interfaces/i-logger";

/* istanbul ignore next */
export enum LogLevel {
  success,
  info,
  warn,
  error,
}

export class LoggedEntry extends Error {
  constructor(message: string, public context: any, public level: LogLevel, public display: boolean = false, public customStack?: string) {
    super(message);
  }
}

export class LoggedException extends LoggedEntry {
  constructor(message: string, public context: any, public level: LogLevel, public display: boolean = true, public customStack?: string) {
    super(message, context, level, display, customStack);
  }
}

export class LogService {
  constructor(private logger: ILogger) {}

  log(loggedEntry: LoggedEntry): void {
    const contextPart = loggedEntry.context ? [`[${loggedEntry.context.constructor["name"]}]`] : [];
    if (loggedEntry.level === LogLevel.error)
      this.logger.log([...contextPart, loggedEntry.customStack ?? loggedEntry.stack].join(" "), loggedEntry.level);
    else this.logger.log(loggedEntry.message, loggedEntry.level);
    if (loggedEntry.display) {
      this.logger.show(loggedEntry.message, loggedEntry.level);
    }
  }

  getCoreVersion(): string {
    return require("../../package.json").version;
  }
}

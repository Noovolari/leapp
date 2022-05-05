import { ILogger } from "../interfaces/i-logger";

/** Types of events that can be logged */
export enum LogLevel {
  /** an action that ended successfully */
  success,
  /** any event that is not a problem but is useful to keep track of */
  info,
  /** any event that could be potentially problematic but is not an error in this context */
  warn,
  /** any event that is an error in this context and should be handled */
  error,
}

/** Used to log something, an error, an event, optional showing it to the user */
export class LoggedEntry extends Error {
  /** Creates a new event which should be passed to the logService log() method
   *
   * @param message - message to log
   * @param context - instance of the context (class or service) where this log was called
   * @param level - type of the event
   * @param display - in addition to logging it, the message must be shown to the user
   * @param customStack - replace the default Error stack with a custom one
   * */
  constructor(message: string, public context: any, public level: LogLevel, public display: boolean = false, public customStack?: string) {
    super(message);
  }
}

/** Used to log something, an error, an event, optional showing it to the user */
export class LoggedException extends LoggedEntry {
  /** Creates a new exception which, once thrown, will be handled by the error handler
   *
   * @param message - message to log
   * @param context - instance of the context (class or service) where this log was called
   * @param level - type of the event
   * @param display - in addition to logging it, the message must be shown to the user
   * @param customStack - replace the default Error stack with a custom one
   * */
  constructor(message: string, public context: any, public level: LogLevel, public display: boolean = true, public customStack?: string) {
    super(message, context, level, display, customStack);
  }
}

/** A service to log events and optionally show them to the user */
export class LogService {
  /**
   * Create a new log service
   *
   * @param logger - a logger, each app has its own implementation
   * */
  constructor(private logger: ILogger) {}

  /** logs something -an error or an event- and optionally shows it to the user
   *
   * @param loggedEntry - the event or error to log
   * */
  log(loggedEntry: LoggedEntry): void {
    const contextPart = loggedEntry.context ? [`[${loggedEntry.context.constructor["name"]}]`] : [];
    this.logger.log([...contextPart, loggedEntry.customStack ?? loggedEntry.stack].join(" "), loggedEntry.level);
    if (loggedEntry.display) {
      this.logger.show(loggedEntry.message, loggedEntry.level);
    }
  }
}

import { LogLevel } from "../services/log-service";

/** Represents a logger, each leapp app has its own implementation adhering to this interface */
export interface ILogger {
  /** logs a message with custom log level
   *
   * @param message - the message to log
   * @param level - type of the event
   * */
  log(message: string, level: LogLevel): void;

  /** shows a message to the user (with a toast in the desktop app) with custom log level
   *
   * @param message - the message to show
   * @param level - type of the event
   * */
  show(message: string, level: LogLevel): void;
}

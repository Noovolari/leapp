import { LogLevel } from "../services/log-service";

export interface ILogger {
  log(message: string, level: LogLevel);
  show(message: string, level: LogLevel);
}

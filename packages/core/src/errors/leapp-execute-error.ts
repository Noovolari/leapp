import { LeappBaseError } from "./leapp-base-error";
import { LogLevel } from "../services/log-service";

export class LeappExecuteError extends LeappBaseError {
  constructor(context: any, message?: string) {
    super("Leapp Execute Error", context, LogLevel.warn, message);
  }
}

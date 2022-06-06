import { LeappBaseError } from "./leapp-base-error";
import { LogLevel } from "../services/log-service";

export class LeappParseError extends LeappBaseError {
  constructor(context: any, message?: string) {
    super("Leapp Parse Error", context, LogLevel.warn, message);
  }
}

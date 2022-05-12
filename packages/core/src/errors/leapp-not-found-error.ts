import { LeappBaseError } from "./leapp-base-error";
import { LogLevel } from "../services/log-service";

export class LeappNotFoundError extends LeappBaseError {
  constructor(context: any, message?: string) {
    super("Leapp Not Found Error", context, LogLevel.warn, message);
  }
}

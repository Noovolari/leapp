import { LeappBaseError } from "./leapp-base-error";
import { LoggerLevel } from "../services/logging-service";

export class LeappNotFoundError extends LeappBaseError {
  constructor(context: any, message?: string) {
    super("Leapp Not Found Error", context, LoggerLevel.warn, message);
  }
}

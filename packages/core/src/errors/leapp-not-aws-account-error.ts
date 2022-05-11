import { LeappBaseError } from "./leapp-base-error";
import { LogLevel } from "../services/log-service";

export class LeappNotAwsAccountError extends LeappBaseError {
  constructor(context: any, message?: string) {
    super("Leapp Not aws Account Error", context, LogLevel.warn, message);
  }
}

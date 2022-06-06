import { LeappBaseError } from "./leapp-base-error";
import { LogLevel } from "../services/log-service";

export class LeappMissingMfaTokenError extends LeappBaseError {
  constructor(context: any, message: string) {
    super("Leapp Missing Mfa Token Error", context, LogLevel.warn, message);
  }
}

import { LeappBaseError } from "./leapp-base-error";
import { LogLevel } from "../services/log-service";

export class LeappAwsStsError extends LeappBaseError {
  constructor(context: any, message?: string) {
    super("Leapp Aws Sts Error", context, LogLevel.warn, message);
  }
}

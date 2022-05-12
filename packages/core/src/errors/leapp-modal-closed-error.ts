import { LeappBaseError } from "./leapp-base-error";
import { LogLevel } from "../services/log-service";

export class LeappModalClosedError extends LeappBaseError {
  constructor(context: any, message?: string) {
    super("Leapp Modal Closed", context, LogLevel.info, message);
  }
}

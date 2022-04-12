import { LeappBaseError } from "./leapp-base-error";
import { LoggerLevel } from "../services/logging-service";

export class LeappModalClosedError extends LeappBaseError {
  constructor(context: any, message?: string) {
    super("Leapp Modal Closed", context, LoggerLevel.info, message);
  }
}

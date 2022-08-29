import { LogLevel } from "../services/log-service";
import { LeappBaseError } from "./leapp-base-error";

export class LeappLinkError extends LeappBaseError {
  link;
  constructor(link: string, context: any, message?: string) {
    super("Error", context, LogLevel.error, message);
    this.link = link;
  }
}

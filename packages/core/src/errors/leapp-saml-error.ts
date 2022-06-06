import { LeappBaseError } from "./leapp-base-error";
import { LogLevel } from "../services/log-service";

export class LeappSamlError extends LeappBaseError {
  constructor(context: any, message?: string) {
    super("Leapp Saml Error", context, LogLevel.warn, message);
  }
}

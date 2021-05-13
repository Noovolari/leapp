import {LeappBaseError} from "./leapp-base-error";
import {LoggerLevel} from "../services/app.service";

export class LeappNotFoundError extends LeappBaseError {
  constructor(context: any, ...params) {
    super('Leapp Not Found Error', context, LoggerLevel.WARN, ...params);
  }
}

import {LoggerLevel} from '../services/app.service';

export class LeappBaseError extends Error {
  context: any;
  severity: LoggerLevel;
  name: string;

  constructor(name: string, context: any, severity: LoggerLevel, message: string) {
    super(message);
    this.name = name;
    this.context = context;
    this.severity = severity;
  }
}

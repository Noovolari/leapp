import { LoggerLevel } from "../services/logging-service";

export class LeappBaseError extends Error {
  private readonly _context: any;
  private readonly _severity: LoggerLevel;

  constructor(name: string, context: any, severity: LoggerLevel, message?: string) {
    super(message);
    this.name = name;
    this._context = context;
    this._severity = severity;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public get severity(): LoggerLevel {
    return this._severity;
  }

  public get context(): any {
    return this._context;
  }
}

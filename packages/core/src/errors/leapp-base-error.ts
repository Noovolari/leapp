import { LogLevel } from "../services/log-service";

export class LeappBaseError extends Error {
  private readonly _context: any;
  private readonly _severity: LogLevel;

  constructor(name: string, context: any, severity: LogLevel, message?: string) {
    super(message);
    this.name = name;
    this._context = context;
    this._severity = severity;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public get severity(): LogLevel {
    return this._severity;
  }

  public get context(): any {
    return this._context;
  }
}

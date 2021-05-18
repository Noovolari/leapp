import {LoggerLevel} from '../services/app.service';

export class LeappBaseError extends Error {
  private _context: any;
  private _severity: LoggerLevel;
  private _name: string;

  constructor(name: string, context: any, severity: LoggerLevel, ...params) {
    super(...params);
    this._name = name;
    this._context = context;
    this._severity = severity;
  }

  get name(): string {
    return this._name;
  }

  get severity(): LoggerLevel {
    return this._severity;
  }

  get context(): any {
    return this._context;
  }
}

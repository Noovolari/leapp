import {LeappBaseError} from './leapp-base-error';
import {LoggerLevel} from '../services/app.service';

export class LeappParseError extends LeappBaseError {
  constructor(context: any, ...params) {
    super('Leapp Parse Error', context, LoggerLevel.warn, ...params);
  }
}

import {LeappBaseError} from './leapp-base-error';
import {LoggerLevel} from '../services/app.service';

export class LeappExecuteError extends LeappBaseError {
  constructor(context: any, message?: string) {
    super('Leapp Execute Error', context, LoggerLevel.warn, message);
  }
}

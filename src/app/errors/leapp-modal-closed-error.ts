import {LeappBaseError} from './leapp-base-error';
import {LoggerLevel} from '../services/app.service';

export class LeappModalClosedError extends LeappBaseError {
  constructor(context: any, message?: string) {
    super('Leapp Modal Closed', context, LoggerLevel.info, message);
  }
}

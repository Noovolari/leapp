import {LeappBaseError} from './leapp-base-error';
import {LoggerLevel} from '../services/app.service';

export class LeappSamlError extends LeappBaseError {
  constructor(context: any, message?: string) {
    super('Leapp Saml Error', context, LoggerLevel.warn, message);
  }
}

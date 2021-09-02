import {LeappBaseError} from './leapp-base-error';
import {LoggerLevel} from '../services/app.service';

export class LeappExtensionError extends LeappBaseError {
  //il tipo di browser selezionato dipende dalle opzioni "PREFERED BROWSER/YOUR BROWSER OF CHOICE
  constructor(context: any) {
    super('Leapp Extension Error: ', context, LoggerLevel.warn, "Be sure to have -BROWSER- open and/or the Leapp Browser Extension installed on it");
  }
}

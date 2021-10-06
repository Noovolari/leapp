import {ErrorHandler, Injectable, Injector} from '@angular/core';
import {LeappBaseError} from '../../errors/leapp-base-error';
import {LoggingService} from '../logging.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorService implements ErrorHandler {

  constructor(private injector: Injector) { }

  handleError(error: any): void {
    error = error.rejection ? error.rejection : error;
    const loggingService = this.injector.get(LoggingService);
    loggingService.logger((error as LeappBaseError).message, (error as LeappBaseError).severity, (error as LeappBaseError).context, (error as LeappBaseError).stack);
    loggingService.toast((error as LeappBaseError).message, (error as LeappBaseError).severity, (error as LeappBaseError).name);
  }
}

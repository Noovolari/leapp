import {ErrorHandler, Injectable, Injector} from '@angular/core';
<<<<<<< HEAD
import {AppService} from '../app.service';
import {LeappBaseError} from '../../errors/leapp-base-error';
=======
import {LeappBaseError} from '../../errors/leapp-base-error';
import {LoggingService} from '../logging.service';
>>>>>>> electron-update

@Injectable({
  providedIn: 'root'
})
export class ErrorService implements ErrorHandler {

  constructor(private injector: Injector) { }

  handleError(error: any): void {
    error = error.rejection ? error.rejection : error;
<<<<<<< HEAD
    const appService = this.injector.get(AppService);

    appService.logger((error as LeappBaseError).message, (error as LeappBaseError).severity, (error as LeappBaseError).context, (error as LeappBaseError).stack);
    appService.toast((error as LeappBaseError).message, (error as LeappBaseError).severity, (error as LeappBaseError).name);
=======
    const loggingService = this.injector.get(LoggingService);

    loggingService.logger((error as LeappBaseError).message, (error as LeappBaseError).severity, (error as LeappBaseError).context, (error as LeappBaseError).stack);
    loggingService.toast((error as LeappBaseError).message, (error as LeappBaseError).severity, (error as LeappBaseError).name);
>>>>>>> electron-update
  }
}

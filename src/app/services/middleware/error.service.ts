import {ErrorHandler, Injectable, Injector} from '@angular/core';
import {AppService} from '../app.service';
import {LeappBaseError} from '../../errors/leapp-base-error';

@Injectable({
  providedIn: 'root'
})
export class ErrorService implements ErrorHandler {

  constructor(private injector: Injector) { }

  handleError(error: any): void {
    error = error.rejection ? error.rejection : error;
    if(error instanceof LeappBaseError) {
      console.log("Leapp error");
      console.warn(error);
    }
    const appService = this.injector.get(AppService);
    appService.logger(error.message, error.severity, error.context, error.stack);
    appService.toast(error.message, error.severity, error.name);
  }
}

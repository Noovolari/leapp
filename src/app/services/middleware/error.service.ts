import {ErrorHandler, Injectable, Injector} from '@angular/core';
import {AppService} from '../app.service';
import {LeappBaseError} from '../../errors/leapp-base-error';

@Injectable({
  providedIn: 'root'
})
export class ErrorService implements ErrorHandler {

  constructor(private injector: Injector) { }

  handleError(error: LeappBaseError): void {
    const appService = this.injector.get(AppService);
    appService.logger(error.message, error.severity, error.context, error.stack);
    appService.toast(error.message, error.severity, error.name);
  }
}

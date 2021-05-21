import {ErrorHandler, Injectable, Injector} from '@angular/core';
import {AppService} from '../app.service';
import {LeappBaseError} from '../../errors/leapp-base-error';

@Injectable({
  providedIn: 'root'
})
export class ErrorService implements ErrorHandler {

  constructor(private injector: Injector) { }

  handleError(error: LeappBaseError): void {
    console.log('lkjklj', (error as LeappBaseError).severity);

    const appService = this.injector.get(AppService);
    appService.logger((error as LeappBaseError).message, (error as LeappBaseError).severity, (error as LeappBaseError).context, (error as LeappBaseError).stack);
    appService.toast((error as LeappBaseError).message, (error as LeappBaseError).severity, (error as LeappBaseError).name);
  }
}

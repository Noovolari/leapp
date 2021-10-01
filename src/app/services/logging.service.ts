import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {LoggerLevel, ToastLevel} from './app.service';
import {ElectronService} from './electron.service';
import {ToastrService} from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class LoggingService {

  constructor(
    private toastr: ToastrService,
    private electronService: ElectronService
  ) { }

  /**
   * Log the message to a file and also to console for development mode
   *
   * @param message - the message to log
   * @param type - the LoggerLevel type
   * @param instance - The structured data of the message
   * @param stackTrace - Stack trace in case of error log
   */
  logger(message: any, type: LoggerLevel, instance?: any, stackTrace?: string) {
    if (typeof message !== 'string') {
      message = JSON.stringify(message, null, 3);
    }

    if (instance) {
      message = `[${instance.constructor['name']}] ${message}`;
    }

    if (stackTrace) {
      message = `${message} ${stackTrace}`;
    }

    switch (type) {
      case LoggerLevel.info:
        if (!environment.production) {
          this.electronService.log.info(message);
        }
        break;
      case LoggerLevel.warn:
        if (!environment.production) {
          this.electronService.log.warn(message);
        }
        break;
      case LoggerLevel.error:
        this.electronService.log.error(message);
        break;
      default:
        if (!environment.production) {
          this.electronService.log.error(message);
        }
        break;
    }
  }

  /**
   * Show a toast message with different styles for different type of toast
   *
   * @param message - the message to show
   * @param type - the type of message from Toast Level
   * @param title - [optional]
   */
  toast(message: string, type: ToastLevel | LoggerLevel, title?: string): void {
    switch (type) {
      case ToastLevel.success: this.toastr.success(message, title); break;
      case ToastLevel.info || LoggerLevel.info: this.toastr.info(message, title); break;
      case ToastLevel.warn || LoggerLevel.warn: this.toastr.warning(message, title); break;
      case ToastLevel.error || LoggerLevel.error: this.toastr.error(message, title ? title : 'Invalid Action!'); break;
      default: this.toastr.error(message, title); break;
    }
  }
}

import { Injectable } from "@angular/core";
import { ILogger } from "@noovolari/leapp-core/interfaces/i-logger";
import { MessageToasterService, ToastLevel } from "./message-toaster.service";
import { AppNativeService } from "./app-native.service";
import { LogLevel } from "@noovolari/leapp-core/services/log-service";

const toastLevelMap = {
  [LogLevel.success]: ToastLevel.success,
  [LogLevel.info]: ToastLevel.info,
  [LogLevel.warn]: ToastLevel.warn,
  [LogLevel.error]: ToastLevel.error,
};

@Injectable({ providedIn: "root" })
export class AppNativeLoggerService implements ILogger {
  constructor(private nativeService: AppNativeService, private messageToasterService: MessageToasterService) {}

  log(message: string, level: LogLevel) {
    switch (level) {
      case LogLevel.info:
        this.nativeService.log.info(message);
        break;
      case LogLevel.warn:
        this.nativeService.log.warn(message);
        break;
      case LogLevel.error:
        this.nativeService.log.error(message);
        break;
      default:
        this.nativeService.log.error(message);
        break;
    }
  }

  show(message: string, level: LogLevel) {
    this.messageToasterService.toast(message, toastLevelMap[level]);
  }
}

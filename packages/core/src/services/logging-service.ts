import { INativeService } from "../interfaces/i-native-service";

export enum LoggerLevel {
  info,
  warn,
  error,
}

export class LoggingService {
  static instance: LoggingService;

  constructor(private nativeService: INativeService) {}

  /**
   * Log the message to a file and also to console for development mode
   *
   * @param message - the message to log
   * @param type - the LoggerLevel type
   * @param instance - The structured data of the message
   * @param stackTrace - Stack trace in case of error log
   */
  logger(message: any, type: LoggerLevel, instance?: any, stackTrace?: string): void {
    if (typeof message !== "string") {
      message = JSON.stringify(message, null, 3);
    }

    if (instance) {
      message = `[${instance.constructor["name"]}] ${message}`;
    }

    if (stackTrace) {
      message = `${message} ${stackTrace}`;
    }

    switch (type) {
      case LoggerLevel.info:
        this.nativeService.log.info(message);
        break;
      case LoggerLevel.warn:
        this.nativeService.log.warn(message);
        break;
      case LoggerLevel.error:
        this.nativeService.log.error(message);
        break;
      default:
        this.nativeService.log.error(message);
        break;
    }
  }
}

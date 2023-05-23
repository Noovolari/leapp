import { ErrorHandler, Injectable, Injector } from "@angular/core";
import { AppProviderService } from "../app-provider.service";
import { LoggedException, LoggedEntry, LogLevel } from "@noovolari/leapp-core/services/log-service";
import * as Sentry from "@sentry/angular-ivy";
import { SentryErrorHandler } from "@sentry/angular-ivy";

@Injectable({
  providedIn: "root",
})
export class ErrorService implements ErrorHandler {
  sentryErrorHandler: SentryErrorHandler;

  // Don't use regular dependency injection but instead use injector!
  constructor(private injector: Injector) {
    this.sentryErrorHandler = Sentry.createErrorHandler({
      showDialog: true,
    });
  }

  handleError(error: Error): void {
    error = (error as any).rejection ? (error as any).rejection : error;
    const logService = this.injector.get(AppProviderService).logService;

    if (error instanceof LoggedException) {
      logService.log(error);
      this.sentryErrorHandler.handleError(error);
    } else {
      const loggedEntry = new LoggedEntry(error.message, this, LogLevel.error, true, error.stack);
      logService.log(loggedEntry);
      this.sentryErrorHandler.handleError(error);
    }
  }
}

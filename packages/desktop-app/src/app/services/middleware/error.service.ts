import { ErrorHandler, Injectable, Injector } from "@angular/core";
import { AppProviderService } from "../app-provider.service";
import { LoggedException, LoggedEntry, LogLevel } from "@noovolari/leapp-core/services/log-service";

@Injectable({
  providedIn: "root",
})
export class ErrorService implements ErrorHandler {
  // Don't use regular dependency injection but instead use injector!
  constructor(private injector: Injector) {}

  handleError(error: Error): void {
    error = (error as any).rejection ? (error as any).rejection : error;
    const logService = this.injector.get(AppProviderService).logService;

    if (error instanceof LoggedException) {
      logService.log(error);
    } else {
      logService.log(new LoggedEntry(error.message, this, LogLevel.error, true, error.stack));
    }

    /**StackTrace.fromError(error).then((stackFrames: StackTrace.StackFrame[]) => {
      if (error instanceof LoggedException) {
        error.customStack = JSON.stringify(stackFrames, null, 2);
        logService.log(error);
      } else {
        logService.log(new LoggedEntry(error.message, this, LogLevel.error, true, JSON.stringify(stackFrames, null, 2)));
      }
    });*/
  }
}

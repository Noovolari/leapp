import { ErrorHandler, Injectable, Injector } from "@angular/core";
import { AppProviderService } from "../app-provider.service";
import { MessageToasterService } from "../message-toaster.service";
import { LeappBaseError } from "@noovolari/leapp-core/errors/leapp-base-error";

@Injectable({
  providedIn: "root",
})
export class ErrorService implements ErrorHandler {
  // Don't use regular dependency injection but instead use injector!
  constructor(private injector: Injector) {}

  handleError(error: any): void {
    error = error.rejection ? error.rejection : error;
    const loggingService = this.injector.get(AppProviderService).loggingService;
    const messageToasterService = this.injector.get(MessageToasterService);

    loggingService.logger(
      (error as LeappBaseError).message,
      (error as LeappBaseError).severity,
      (error as LeappBaseError).context,
      (error as LeappBaseError).stack
    );
    messageToasterService.toast((error as LeappBaseError).message, (error as LeappBaseError).severity, (error as LeappBaseError).name);
  }
}

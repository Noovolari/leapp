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

  handleError(error: LeappBaseError): void {
    error = (error as any).rejection ? (error as any).rejection : error;
    const loggingService = this.injector.get(AppProviderService).loggingService;
    const messageToasterService = this.injector.get(MessageToasterService);

    loggingService.logger(error.message, error.severity, error.context, error.stack);
    messageToasterService.toast(error.message, error.severity, error.name);
  }
}

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
    console.log("ERROREEE:", error);

    error = (error as any).rejection ? (error as any).rejection : error;

    try {
      const logService = this.injector.get(AppProviderService)?.logService;
      if (!logService || typeof logService.log !== "function") {
        console.error("[Leapp] ErrorService: logService unavailable; original error:", error);
        return;
      }

      if (error instanceof LoggedException) {
        logService.log(error);
      } else {
        logService.log(new LoggedEntry(error.message, this, LogLevel.error, true, error.stack));
      }
    } catch (secondaryError) {
      console.error("[Leapp] ErrorService.handleError failed; original error:", error, secondaryError);
    }
  }
}

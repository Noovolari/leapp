import { TestBed } from "@angular/core/testing";
import { ErrorService } from "./error.service";
import { mustInjected } from "../../../base-injectables";
import { ToastrModule } from "ngx-toastr";
import { ErrorHandler } from "@angular/core";
import { AppModule } from "../../app.module";
import { AppProviderService } from "../app-provider.service";
import { MessageToasterService } from "../message-toaster.service";
import { LoggedException, LogLevel } from "@noovolari/leapp-core/services/log-service";

describe("ErrorService", () => {
  let spyMessageToasterService;
  let spyLoggingService;
  let errorService;
  let handler;

  beforeEach(() => {
    spyLoggingService = jasmine.createSpyObj("LoggingService", ["logger"]);
    spyLoggingService.logger.and.returnValue(true);

    spyMessageToasterService = jasmine.createSpyObj("MessageToasterService", ["toast"]);
    spyMessageToasterService.toast.and.returnValue(true);

    const spyLeappCoreService = jasmine.createSpyObj("LeappCoreService", [], {
      loggingService: spyLoggingService,
    });

    handler = TestBed.configureTestingModule({
      imports: [AppModule, ToastrModule.forRoot()],
      providers: [{ provide: ErrorHandler, useClass: ErrorService }].concat(
        mustInjected().concat([
          { provide: MessageToasterService, useValue: spyMessageToasterService },
          { provide: AppProviderService, useValue: spyLeappCoreService },
        ])
      ),
    }).inject(ErrorHandler) as any;

    errorService = TestBed.inject(ErrorService);
  });

  it("Create Instance", () => {
    expect(errorService).toBeTruthy();
  });

  it("should call the Error Handler is an error is thrown in code", () => {
    const spyErrorHandler = spyOn(errorService, "handleError");
    const error = new LoggedException("custom test message", "testing", LogLevel.warn);
    errorService.handleError(error);
    expect(spyErrorHandler).toHaveBeenCalled();
  });

  it("should call logger and toast", () => {
    const error = new LoggedException("custom test message", "testing", LogLevel.warn);
    errorService.handleError(error);

    expect(spyLoggingService.logger).toHaveBeenCalled();
    expect(spyMessageToasterService.toast).toHaveBeenCalled();
  });

  it("should be registered on the AppModule", () => {
    expect(handler).toEqual(jasmine.any(ErrorService));
  });
});

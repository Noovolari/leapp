import { IntegrationBarComponent } from "./integration-bar.component";
import { LoggedException, LogLevel } from "@noovolari/leapp-core/services/log-service";
import { constants } from "@noovolari/leapp-core/models/constants";
import { ToastLevel } from "../../services/message-toaster.service";

describe("IntegrationBarComponent AWS SSO sync errors", () => {
  const integration: any = {
    id: "integration-1",
    alias: "Company SSO",
    portalUrl: "https://d-111.awsapps.com/start",
    region: "eu-west-1",
    browserOpening: constants.inApp,
    isOnline: false,
  };

  let component: IntegrationBarComponent;
  let appProviderService: any;
  let messageToasterService: any;

  beforeEach(() => {
    appProviderService = {
      awsSsoRoleService: {},
      behaviouralSubjectService: {},
      segmentService: {},
      awsSsoOidcService: { interrupt: jasmine.createSpy("interrupt") },
      logService: { log: jasmine.createSpy("log") },
      awsCoreService: { getRegions: () => [{ region: "eu-west-1" }] },
      azureIntegrationService: { getIntegrations: () => [] },
      awsSsoIntegrationService: {
        getIntegration: () => integration,
        getIntegrations: () => [integration],
        syncSessions: jasmine.createSpy("syncSessions"),
      },
      integrationFactory: { logout: jasmine.createSpy("logout").and.resolveTo() },
    };
    messageToasterService = { toast: jasmine.createSpy("toast") };
    const analyticsService: any = { captureEvent: jasmine.createSpy("captureEvent").and.resolveTo() };
    component = new IntegrationBarComponent(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      messageToasterService,
      appProviderService,
      {} as any,
      analyticsService
    );
    component.setValues(); // what ngOnInit does first: lists and per-integration loading flags
  });

  it("a sync interrupted by the user is a quiet cancel: no logout, no toast, no error log", async () => {
    appProviderService.awsSsoIntegrationService.syncSessions.and.rejectWith(new LoggedException("AWS SSO Interrupted.", this, LogLevel.info));

    await component.forceSyncAwsSso("integration-1");

    expect(appProviderService.integrationFactory.logout).not.toHaveBeenCalled();
    expect(messageToasterService.toast).not.toHaveBeenCalled();
    expect(appProviderService.logService.log).not.toHaveBeenCalled();
    expect(component.loadingInApp).toBeFalse();
  });

  it("any other sync error keeps today's path: interrupt, logout and the error toast", async () => {
    appProviderService.awsSsoIntegrationService.syncSessions.and.rejectWith(new Error("boom"));

    await component.forceSyncAwsSso("integration-1");

    expect(appProviderService.awsSsoOidcService.interrupt).toHaveBeenCalledTimes(1);
    expect(appProviderService.integrationFactory.logout).toHaveBeenCalledOnceWith("integration-1");
    expect(messageToasterService.toast).toHaveBeenCalledOnceWith("Error during SSO Login: Error: boom", ToastLevel.error);
    expect(component.loadingInApp).toBeFalse();
  });
});

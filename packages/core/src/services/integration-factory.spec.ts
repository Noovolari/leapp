import { beforeEach, describe, test, expect, jest } from "@jest/globals";
import { IntegrationFactory } from "./integration-factory";
import { IntegrationType } from "../models/integration-type";
import { AwsSsoIntegrationService } from "./integration/aws-sso-integration-service";
import { AzureIntegrationService } from "./integration/azure-integration-service";

describe("IntegrationFactory", () => {
  let factory;
  let awsSsoIntegrationService;
  let azureIntegrationService;

  beforeEach(() => {
    azureIntegrationService = new AzureIntegrationService(null, null, null, null, null, null, null);
    awsSsoIntegrationService = new AwsSsoIntegrationService(null, null, null, null, null, null, null);
    factory = new IntegrationFactory(null, null);
  });

  test("getIntegrationService", () => {
    factory = new IntegrationFactory(awsSsoIntegrationService, azureIntegrationService);
    let returnValue = factory.getIntegrationService(IntegrationType.awsSso);
    expect(returnValue).toBe(awsSsoIntegrationService);
    returnValue = factory.getIntegrationService(IntegrationType.azure);
    expect(returnValue).toBe(azureIntegrationService);
  });

  test("create", async () => {
    const fakeIntegrationService = {
      createIntegration: jest.fn(async () => {}),
    } as any;
    factory.getIntegrationService = jest.fn(() => fakeIntegrationService);
    await factory.create("fake-integration-type" as any, "fake-integration-params" as any);
    expect(factory.getIntegrationService).toHaveBeenCalledWith("fake-integration-type");
    expect(fakeIntegrationService.createIntegration).toHaveBeenCalledWith("fake-integration-params");
  });

  test("update", async () => {
    const fakeAzureIntegration = { id: "fake-id-azure", tenantId: "fake-tenant-1" };
    azureIntegrationService.getIntegration = jest.fn(() => fakeAzureIntegration);
    azureIntegrationService.logout = jest.fn();

    const fakeIntegrationService = {
      updateIntegration: jest.fn(async () => {}),
    } as any;

    (factory as any).azureIntegrationService = azureIntegrationService;
    factory.getIntegrationById = jest.fn(() => IntegrationType.awsSso);
    factory.getIntegrationService = jest.fn(() => fakeIntegrationService);
    await factory.update("fake-id", "fake-params");
    expect(factory.getIntegrationById).toHaveBeenCalledWith("fake-id");
    expect(factory.getIntegrationById).toHaveReturnedWith(IntegrationType.awsSso);
    expect(factory.getIntegrationService).toHaveReturnedWith(fakeIntegrationService);
    expect(fakeIntegrationService.updateIntegration).toHaveBeenCalledWith("fake-id", "fake-params");

    factory.getIntegrationById = jest.fn(() => ({ type: IntegrationType.azure }));
    await factory.update("fake-id-2", { id: "fake-params-2", tenantId: "fake-tenant-1" });
    expect(factory.getIntegrationById).toHaveBeenCalledWith("fake-id-2");
    expect(factory.getIntegrationById).toHaveReturnedWith({ type: IntegrationType.azure });
    expect(factory.getIntegrationService).toHaveReturnedWith(fakeIntegrationService);
    expect(fakeIntegrationService.updateIntegration).toHaveBeenNthCalledWith(2, "fake-id-2", { id: "fake-params-2", tenantId: "fake-tenant-1" });
    expect(azureIntegrationService.getIntegration).toHaveBeenCalledWith("fake-id-2");
    expect(azureIntegrationService.getIntegration).toHaveReturnedWith(fakeAzureIntegration);

    await factory.update("fake-id-3", { id: "fake-params-3", tenantId: "fake-tenant-2" });
    expect(factory.getIntegrationById).toHaveBeenCalledWith("fake-id-3");
    expect(factory.getIntegrationById).toHaveReturnedWith({ type: IntegrationType.azure });
    expect(factory.getIntegrationService).toHaveReturnedWith(fakeIntegrationService);
    expect(fakeIntegrationService.updateIntegration).toHaveBeenNthCalledWith(3, "fake-id-3", { id: "fake-params-3", tenantId: "fake-tenant-2" });
    expect(azureIntegrationService.getIntegration).toHaveBeenCalledWith("fake-id-3");
    expect(azureIntegrationService.getIntegration).toHaveReturnedWith(fakeAzureIntegration);
    expect(azureIntegrationService.logout).toHaveBeenCalledWith("fake-id-3");
  });

  test("delete", async () => {
    const fakeIntegrationService = {
      deleteIntegration: jest.fn(async () => {}),
    } as any;

    (factory as any).azureIntegrationService = azureIntegrationService;
    factory.getIntegrationById = jest.fn(() => ({ type: IntegrationType.awsSso }));
    factory.getIntegrationService = jest.fn(() => fakeIntegrationService);

    await factory.delete("fake-id");
    expect(factory.getIntegrationById).toHaveBeenCalledWith("fake-id");
    expect(factory.getIntegrationById).toHaveReturnedWith({ type: IntegrationType.awsSso });
    expect(factory.getIntegrationService).toHaveBeenCalledWith(IntegrationType.awsSso);
    expect(fakeIntegrationService.deleteIntegration).toHaveBeenCalledWith("fake-id");
  });

  test("syncSessions", async () => {
    const fakeIntegrationService = {
      syncSessions: jest.fn(async () => "fake-sync-output"),
    } as any;

    (factory as any).azureIntegrationService = azureIntegrationService;
    factory.getIntegrationById = jest.fn(() => ({ type: IntegrationType.awsSso }));
    factory.getIntegrationService = jest.fn(() => fakeIntegrationService);

    const syncOutput = await factory.syncSessions("fake-id");
    expect(factory.getIntegrationById).toHaveBeenCalledWith("fake-id");
    expect(factory.getIntegrationById).toHaveReturnedWith({ type: IntegrationType.awsSso });
    expect(factory.getIntegrationService).toHaveBeenCalledWith(IntegrationType.awsSso);
    expect(fakeIntegrationService.syncSessions).toHaveBeenCalledWith("fake-id");
    expect(syncOutput).toBe("fake-sync-output");
  });

  test("logout", async () => {
    const fakeIntegrationService = {
      logout: jest.fn(async () => {}),
    } as any;

    (factory as any).azureIntegrationService = azureIntegrationService;
    factory.getIntegrationById = jest.fn(() => ({ type: IntegrationType.awsSso }));
    factory.getIntegrationService = jest.fn(() => fakeIntegrationService);

    await factory.logout("fake-id");
    expect(factory.getIntegrationById).toHaveBeenCalledWith("fake-id");
    expect(factory.getIntegrationById).toHaveReturnedWith({ type: IntegrationType.awsSso });
    expect(factory.getIntegrationService).toHaveBeenCalledWith(IntegrationType.awsSso);
    expect(fakeIntegrationService.logout).toHaveBeenCalledWith("fake-id");
  });

  test("setOnline", async () => {
    const fakeIntegrationService = {
      setOnline: jest.fn(async () => {}),
    } as any;

    (factory as any).azureIntegrationService = azureIntegrationService;
    factory.getIntegrationById = jest.fn(() => ({ type: IntegrationType.awsSso }));
    factory.getIntegrationService = jest.fn(() => fakeIntegrationService);

    await factory.setOnline({ id: "fake-id" });
    expect(factory.getIntegrationById).toHaveBeenCalledWith("fake-id");
    expect(factory.getIntegrationById).toHaveReturnedWith({ type: IntegrationType.awsSso });
    expect(factory.getIntegrationService).toHaveBeenCalledWith(IntegrationType.awsSso);
    expect(fakeIntegrationService.setOnline).toHaveBeenCalledWith({ id: "fake-id" });
  });

  test("getRemainingHours", () => {
    const fakeIntegrationService = {
      remainingHours: jest.fn(async () => {}),
    } as any;

    (factory as any).azureIntegrationService = azureIntegrationService;
    factory.getIntegrationById = jest.fn(() => ({ type: IntegrationType.awsSso }));
    factory.getIntegrationService = jest.fn(() => fakeIntegrationService);

    factory.getRemainingHours({ id: "fake-id" });
    expect(factory.getIntegrationById).toHaveBeenCalledWith("fake-id");
    expect(factory.getIntegrationById).toHaveReturnedWith({ type: IntegrationType.awsSso });
    expect(factory.getIntegrationService).toHaveBeenCalledWith(IntegrationType.awsSso);
    expect(fakeIntegrationService.remainingHours).toHaveBeenCalledWith({ id: "fake-id" });
  });

  test("getIntegrations", () => {
    awsSsoIntegrationService.getIntegrations = jest.fn(() => ["1", "2"]);
    azureIntegrationService.getIntegrations = jest.fn(() => ["3", "4"]);
    (factory as any).awsSsoIntegrationService = awsSsoIntegrationService;
    (factory as any).azureIntegrationService = azureIntegrationService;
    const result = factory.getIntegrations();
    expect(result).toStrictEqual([...awsSsoIntegrationService.getIntegrations(), ...azureIntegrationService.getIntegrations()]);
  });

  test("getIntegrationById", () => {
    awsSsoIntegrationService.getIntegrations = jest.fn(() => [{ id: "1" }, { id: "2" }]);
    azureIntegrationService.getIntegrations = jest.fn(() => [{ id: "3" }, { id: "4" }]);
    (factory as any).awsSsoIntegrationService = awsSsoIntegrationService;
    (factory as any).azureIntegrationService = azureIntegrationService;

    const result = factory.getIntegrationById("1");
    expect(result).toStrictEqual({ id: "1" });
  });
});

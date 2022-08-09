import { beforeEach, describe, test, expect } from "@jest/globals";
import { IntegrationFactory } from "./integration-factory";
import { IntegrationType } from "../models/integration-type";
import { AwsSsoIntegrationService } from "./integration/aws-sso-integration-service";
import { AzureIntegrationService } from "./integration/azure-integration-service";

describe("IntegrationFactory", () => {
  // eslint-disable-next-line no-unused-vars
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

  test("update", async () => {});

  test("delete", async () => {});

  test("syncSessions", async () => {});

  test("logout", async () => {});

  test("setOnline", async () => {});

  test("getRemainingHours", () => {});

  test("getIntegrations", () => {});

  test("getIntegrationById", () => {});
});

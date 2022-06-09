import { describe, test } from "@jest/globals";
import { AzureIntegrationService } from "./azure-integration-service";
import { MsalPersistenceService } from "../msal-persistence-service";
import * as os from "os";
import * as fs from "fs";
import { AzureIntegration } from "../../models/azure/azure-integration";
import { IntegrationType } from "../../models/integration-type";

describe("AzureIntegrationService", () => {
  test("isOnline", async () => {
    const iNativeService: any = {
      os,
      fs,
    };

    const azureIntegrationService = new AzureIntegrationService(null, null, null, null, null, null, null, new MsalPersistenceService(iNativeService));
    const integration: AzureIntegration = {
      alias: "fake-alias",
      id: "fake-id",
      tenantId: "20f03cc3-841f-412b-8f24-16621d26a8cb",
      type: IntegrationType.azure,
    };
    const isOnline = await azureIntegrationService.isOnline(integration);
    console.log(isOnline);
    expect(isOnline).toBeTruthy();
  });
});

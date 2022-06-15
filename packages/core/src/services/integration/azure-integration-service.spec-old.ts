/*
import { describe, test, expect } from "@jest/globals";
import { AzureIntegrationService } from "./azure-integration-service";
import { AzurePersistenceService } from "../azure-persistence-service";
import * as os from "os";
import * as fs from "fs";
import { IntegrationType } from "../../models/integration-type";

describe("AzureIntegrationService", () => {
  test("isOnline", async () => {
    const iNativeService: any = {
      os,
      fs,
    };

    const azureIntegrationService = new AzureIntegrationService(
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      new AzurePersistenceService(iNativeService)
    );
    const integration = {
      alias: "fake-alias",
      id: "fake-id",
      tenantId: "20f03cc3-841f-412b-8f24-16621d26a8cb",
      type: IntegrationType.azure,
    };
    await azureIntegrationService.setOnline(integration);
    expect(integration.isOnline).not.toBeTruthy();
  });
});
*/

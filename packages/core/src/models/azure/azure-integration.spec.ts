import { describe, test, expect } from "@jest/globals";
import { AzureIntegration } from "./azure-integration";
import { IntegrationType } from "../integration-type";

describe("Azure Integration Model", () => {
  test("should create and be offline", () => {
    const azureIntegration = new AzureIntegration("fake-id", "fake-alias", "fake-tenant-id", "fake-region");

    expect(azureIntegration).toBeInstanceOf(AzureIntegration);
    expect(azureIntegration).toBeTruthy();
    expect(azureIntegration.type).toEqual(IntegrationType.azure);
    expect(azureIntegration.isOnline).toEqual(false);
    expect(azureIntegration.tokenExpiration).toBeUndefined();
  });

  test("set tokenExpiration", () => {
    const expirationToken = "fake-token-expiration";
    const azureIntegration = new AzureIntegration("fake-id", "fake-alias", "fake-tenant-id", "fake-region");
    azureIntegration.tokenExpiration = expirationToken;
    expect(azureIntegration.tokenExpiration).toBe(expirationToken);
  });

  test("get tokenExpiration", () => {
    const expirationToken = "fake-token-expiration";
    const azureIntegration = new AzureIntegration("fake-id", "fake-alias", "fake-tenant-id", "fake-region");
    azureIntegration.tokenExpiration = expirationToken;
    const expectedExpiration = azureIntegration.tokenExpiration;
    expect(expectedExpiration).toEqual(expirationToken);
  });
});

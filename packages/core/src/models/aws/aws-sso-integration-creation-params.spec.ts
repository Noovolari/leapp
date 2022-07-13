import { describe, test, expect } from "@jest/globals";
import { AwsSsoIntegrationCreationParams } from "./aws-sso-integration-creation-params";

describe("AWS SSO Integration Creation Params", () => {
  test("should create", () => {
    const awsSsoIntegrationParams: AwsSsoIntegrationCreationParams = {
      portalUrl: "fake-portal-url",
      region: "fake-region",
      browserOpening: "In-App",
      alias: "fake-alias",
    };
    expect(awsSsoIntegrationParams).toBeTruthy();
  });
});

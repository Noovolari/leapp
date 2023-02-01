import { describe, test, expect } from "@jest/globals";
import { AwsSsoIntegration } from "./aws-sso-integration";
import { IntegrationType } from "../integration-type";

describe("AWS SSO Integration", () => {
  test("should create with isOnline set to false", () => {
    const awsSsoIntegration = new AwsSsoIntegration("fake-id", "fake-alias", "fake-portal-url", "fake-region", "In-App", "fakeAccessTokenExpiration");
    expect(awsSsoIntegration).toBeInstanceOf(AwsSsoIntegration);
    expect(awsSsoIntegration).toBeTruthy();
    expect(awsSsoIntegration.type).toEqual(IntegrationType.awsSso);
    expect(awsSsoIntegration.isOnline).toEqual(false);
  });
});

import { describe, test, expect } from "@jest/globals";
import { AwsSsoIntegrationTokenInfo } from "./aws-sso-integration-token-info";

describe("AWS SSO Integration Token Info", () => {
  test("should create", () => {
    const awsSsoIntegrationTokenInfo: AwsSsoIntegrationTokenInfo = {
      accessToken: "fake-access-token",
      expiration: 1,
    };
    expect(awsSsoIntegrationTokenInfo).toBeTruthy();
  });
});

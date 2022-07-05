import { describe, test, expect } from "@jest/globals";
import { AwsSsoRoleSession } from "./aws-sso-role-session";

describe("AWS SSO Role Session", () => {
  test("should create", () => {
    const awsSsoRoleSessionWithEmail = new AwsSsoRoleSession(
      "fake-session-name-1",
      "fake-region-1",
      "fake-role-arn-1",
      "fake-profile-id-1",
      "fake-sso-configuration-1",
      "fake-email"
    );
    const awsSsoRoleSessionWithouEmail = new AwsSsoRoleSession(
      "fake-session-name-2",
      "fake-region-2",
      "fake-role-arn-2",
      "fake-profile-id-2",
      "fake-sso-configuration-2"
    );
    expect(awsSsoRoleSessionWithEmail).toBeInstanceOf(AwsSsoRoleSession);
    expect(awsSsoRoleSessionWithEmail).toBeTruthy();
    expect(awsSsoRoleSessionWithouEmail).toBeInstanceOf(AwsSsoRoleSession);
    expect(awsSsoRoleSessionWithouEmail).toBeTruthy();
    expect(awsSsoRoleSessionWithouEmail.email).toBeUndefined();
  });
});

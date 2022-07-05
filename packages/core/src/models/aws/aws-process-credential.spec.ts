import { AwsProcessCredentials } from "./aws-process-credential";

describe("AWS Process Credential", () => {
  it("should create", () => {
    const awsProcessCredentials = new AwsProcessCredentials(
      1,
      "fake-access-key-id",
      "fake-secret-access-key",
      "fake-session-token",
      "fake-expiration"
    );
    expect(awsProcessCredentials).toBeInstanceOf(AwsProcessCredentials);
    expect(awsProcessCredentials).toBeTruthy();
  });
});

import { describe, test, expect } from "@jest/globals";
import { AwsNamedProfile } from "./aws-named-profile";

describe("AWS Named Profile", () => {
  test("should create", () => {
    const awsNamedProfile = new AwsNamedProfile("fake-profile-id", "fake-profile-name");
    expect(awsNamedProfile).toBeInstanceOf(AwsNamedProfile);
    expect(awsNamedProfile).toBeTruthy();
  });
});

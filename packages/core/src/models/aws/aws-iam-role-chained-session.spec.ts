import { describe, test, expect } from "@jest/globals";
import { AwsIamRoleChainedSession } from "./aws-iam-role-chained-session";
import { SessionType } from "../session-type";

describe("AWS IAM Role Chained Session Model", () => {
  test("should create with a role session name", () => {
    const sessionName = "fake-chained-session";
    const region = "fake-region";
    const roleArn = "fake-role-arn";
    const profileId = "fake-profile-id";
    const parentSessionId = "fake-parent-session-id";
    const roleSessionName = "fake-role-session-name";
    const mockedChainedSession = new AwsIamRoleChainedSession(sessionName, region, roleArn, profileId, parentSessionId, roleSessionName);

    expect(mockedChainedSession).toBeInstanceOf(AwsIamRoleChainedSession);
    expect(mockedChainedSession.type).toEqual(SessionType.awsIamRoleChained);
    expect(mockedChainedSession.sessionName).toEqual(sessionName);
    expect(mockedChainedSession.region).toEqual(region);
    expect(mockedChainedSession.roleArn).toEqual(roleArn);
    expect(mockedChainedSession.profileId).toEqual(profileId);
    expect(mockedChainedSession.parentSessionId).toEqual(parentSessionId);
    expect(mockedChainedSession.roleSessionName).toEqual(roleSessionName);
  });

  test("should create without a role session name", () => {
    const mockedChainedSession = new AwsIamRoleChainedSession(null, null, null, null, null);
    expect(mockedChainedSession).toBeInstanceOf(AwsIamRoleChainedSession);
    expect(mockedChainedSession.roleSessionName).toEqual(`assumed-from-leapp`);
  });
});

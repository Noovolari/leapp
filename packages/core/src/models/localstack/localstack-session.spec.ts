import { describe, test, expect } from "@jest/globals";
import { SessionType } from "../session-type";
import { LocalstackSession } from "./localstack-session";

describe("AWS IAM User Session Model", () => {
  test("should create with MFA device", () => {
    const sessionName = "fake-iam-user-session";
    const region = "fake-region";
    const profileId = "fake-profile-id";
    const mockedIamUserSession = new LocalstackSession(sessionName, region, profileId);

    expect(mockedIamUserSession).toBeInstanceOf(LocalstackSession);
    expect(mockedIamUserSession.type).toEqual(SessionType.localstack);
    expect(mockedIamUserSession.sessionName).toEqual(sessionName);
    expect(mockedIamUserSession.region).toEqual(region);
    expect(mockedIamUserSession.profileId).toEqual(profileId);
  });
});

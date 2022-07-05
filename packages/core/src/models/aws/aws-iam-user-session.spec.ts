import { SessionType } from "../session-type";
import { AwsIamUserSession } from "./aws-iam-user-session";

describe("AWS IAM User Session Model", () => {
  it("should create with MFA device", () => {
    const sessionName = "fake-iam-user-session";
    const region = "fake-region";
    const profileId = "fake-profile-id";
    const mfaDevice = "fake-mfa-device";
    const mockedIamUserSession = new AwsIamUserSession(sessionName, region, profileId, mfaDevice);

    expect(mockedIamUserSession).toBeInstanceOf(AwsIamUserSession);
    expect(mockedIamUserSession.type).toEqual(SessionType.awsIamUser);
    expect(mockedIamUserSession.sessionName).toEqual(sessionName);
    expect(mockedIamUserSession.region).toEqual(region);
    expect(mockedIamUserSession.profileId).toEqual(profileId);
    expect(mockedIamUserSession.mfaDevice).toEqual(mfaDevice);
  });

  it("should create without MFA device", () => {
    const mockedIamUserSession = new AwsIamUserSession(null, null, null);
    expect(mockedIamUserSession.mfaDevice).toBe(undefined);
  });
});

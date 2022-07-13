import { describe, test, expect } from "@jest/globals";
import { SessionType } from "../session-type";
import { AwsIamRoleFederatedSession } from "./aws-iam-role-federated-session";

describe("AWS IAM Role Federated Session Model", () => {
  test("should create", () => {
    const sessionName = "fake-federated-session";
    const region = "fake-region";
    const idpUrlId = "fake-idp-url-id";
    const profileId = "fake-profile-id";
    const idpArn = "fake-idp-arn";
    const roleArn = "fake-role-arn";
    const mockedFederatedSession = new AwsIamRoleFederatedSession(sessionName, region, idpUrlId, idpArn, roleArn, profileId);

    expect(mockedFederatedSession).toBeInstanceOf(AwsIamRoleFederatedSession);
    expect(mockedFederatedSession.type).toEqual(SessionType.awsIamRoleFederated);
    expect(mockedFederatedSession.sessionName).toEqual(sessionName);
    expect(mockedFederatedSession.region).toEqual(region);
    expect(mockedFederatedSession.roleArn).toEqual(roleArn);
    expect(mockedFederatedSession.profileId).toEqual(profileId);
    expect(mockedFederatedSession.idpArn).toEqual(idpArn);
    expect(mockedFederatedSession.idpUrlId).toEqual(idpUrlId);
  });
});

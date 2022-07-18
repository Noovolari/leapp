import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { AwsIamRoleFederatedSession } from "../../../models/aws/aws-iam-role-federated-session";
import { AwsIamRoleFederatedService } from "./aws-iam-role-federated-service";
import { SessionType } from "../../../models/session-type";
import { AwsIamRoleFederatedSessionRequest } from "./aws-iam-role-federated-session-request";
import * as uuid from "uuid";
import { SessionStatus } from "../../../models/session-status";
import * as AWS from "aws-sdk";
import * as AWSMock from "aws-sdk-mock";
jest.mock("uuid");

describe("AwsIamRoleFederatedService", () => {
  beforeEach(() => {});

  test("getAccountNumberFromCallerIdentity", async () => {
    const session = {
      type: SessionType.awsIamRoleFederated,
      roleArn: "abcdefghijklmnopqrstuvwxyz/12345",
    } as any;
    const awsIamRoleFederatedService = new AwsIamRoleFederatedService(null, null, null, null, null, null);
    const accountNumber = await awsIamRoleFederatedService.getAccountNumberFromCallerIdentity(session);

    expect(accountNumber).toBe("nopqrstuvwxy");
  });

  test("getAccountNumberFromCallerIdentity - error", async () => {
    const session = {};
    const awsIamRoleFederatedService = new AwsIamRoleFederatedService(null, null, null, null, null, null);

    await expect(() => awsIamRoleFederatedService.getAccountNumberFromCallerIdentity(session as AwsIamRoleFederatedSession)).rejects.toThrow(
      new Error("AWS IAM Role Federated Session required")
    );
  });

  test("sessionTokenFromGetSessionTokenResponse", () => {
    const fakeAssumeRoleResponse = {
      ["Credentials"]: {
        ["AccessKeyId"]: "fake-access-key-id",
        ["SecretAccessKey"]: "fake-secret-access-key",
        ["SessionToken"]: "fake-session-token",
      },
    } as any;
    const result = AwsIamRoleFederatedService.sessionTokenFromGetSessionTokenResponse(fakeAssumeRoleResponse);
    expect(result).toStrictEqual({
      sessionToken: {
        ["aws_access_key_id"]: "fake-access-key-id",
        ["aws_secret_access_key"]: "fake-secret-access-key",
        ["aws_session_token"]: "fake-session-token",
      },
    });
  });

  test("create", async () => {
    jest.spyOn(uuid, "v4").mockImplementation(() => "mocked-uuid");
    const repository = {
      addSession: jest.fn(),
      getSessions: jest.fn(() => "fake-sessions"),
    } as any;
    const sessionNotifier = {
      setSessions: jest.fn(),
    } as any;
    const request: AwsIamRoleFederatedSessionRequest = {
      idpArn: "fake-idp-arn",
      idpUrl: "fake-idp-url",
      profileId: "fake-profile-id",
      region: "fake-region",
      roleArn: "fake-region",
      sessionName: "fake-session-name",
    };
    const awsIamRoleFederatedService = new AwsIamRoleFederatedService(sessionNotifier, repository, null, null, null, null);
    awsIamRoleFederatedService.create(request);
    expect(repository.addSession).toHaveBeenCalledWith({
      sessionName: request.sessionName,
      region: request.region,
      idpUrlId: request.idpUrl,
      idpArn: request.idpArn,
      roleArn: request.roleArn,
      profileId: request.profileId,
      sessionId: "mocked-uuid",
      sessionTokenExpiration: undefined,
      startDateTime: undefined,
      status: 0,
      type: SessionType.awsIamRoleFederated,
    });
    expect(repository.getSessions).toHaveBeenCalled();
    expect(sessionNotifier.setSessions).toHaveBeenCalledWith("fake-sessions");
  });

  test("applyCredentials", async () => {
    const profileId = "fake-profile-id";
    const session = { sessionId: "fake-sessions-id", profileId };
    const profileName = "fake-profile-name";
    const repository = {
      getSessionById: jest.fn(() => session),
      getProfileName: jest.fn(() => profileName),
    } as any;
    const fileService = {
      iniWriteSync: jest.fn(),
    } as any;
    const credentialPath = "fake-credential-path";
    const awsCoreService = {
      awsCredentialPath: jest.fn(() => credentialPath),
    } as any;
    const awsIamRoleFederatedService = new AwsIamRoleFederatedService(null, repository, fileService, awsCoreService, null, null);
    const credentialsInfo = {
      sessionToken: {
        ["aws_access_key_id"]: "fake-access-key-id",
        ["aws_secret_access_key"]: "fake-secret-access-key",
        ["aws_session_token"]: "fake-session-token",
      },
    };
    await awsIamRoleFederatedService.applyCredentials("fake-session-id", credentialsInfo);
    expect(repository.getSessionById).toHaveBeenCalledWith("fake-session-id");
    expect(repository.getProfileName).toHaveBeenCalledWith(profileId);
    expect(fileService.iniWriteSync).toHaveBeenCalledWith(credentialPath, {
      [profileName]: {
        ["aws_access_key_id"]: "fake-access-key-id",
        ["aws_secret_access_key"]: "fake-secret-access-key",
        ["aws_session_token"]: "fake-session-token",
      },
    });
  });

  test("deApplyCredentials", async () => {
    const profileId = "fake-profile-id";
    const session = { sessionId: "fake-sessions-id", profileId };
    const profileName = "fake-profile-name";
    const credentialPath = "fake-credential-path";
    const credentialsFile = { [profileName]: {}, anotherProfileName: {} };
    const repository = {
      getSessionById: jest.fn(() => session),
      getProfileName: jest.fn(() => profileName),
    } as any;
    const fileService = {
      iniParseSync: jest.fn(() => credentialsFile),
      replaceWriteSync: jest.fn(),
    } as any;
    const awsCoreService = {
      awsCredentialPath: jest.fn(() => credentialPath),
    } as any;
    const awsIamRoleFederatedService = new AwsIamRoleFederatedService(null, repository, fileService, awsCoreService, null, null);
    await awsIamRoleFederatedService.deApplyCredentials("fake-session-id");
    expect(repository.getSessionById).toHaveBeenCalledWith("fake-session-id");
    expect(repository.getProfileName).toHaveBeenCalledWith(profileId);
    expect(fileService.iniParseSync).toHaveBeenCalledWith(credentialPath);
    expect(credentialsFile).toStrictEqual({ anotherProfileName: {} });
    expect(credentialsFile).not.toContain({ [profileName]: {} });
    expect(fileService.replaceWriteSync).toHaveBeenCalledWith(credentialPath, credentialsFile);
  });

  test("generateCredentialsProxy", () => {
    const awsIamRoleFederatedService = new AwsIamRoleFederatedService(null, null, null, null, null, null);
    awsIamRoleFederatedService.generateCredentials = jest.fn();
    awsIamRoleFederatedService.generateCredentialsProxy("fake-session-id");
    expect(awsIamRoleFederatedService.generateCredentials).toHaveBeenCalledWith("fake-session-id");
  });

  test("generateCredentials - success", async () => {
    AWSMock.setSDKInstance(AWS);
    AWSMock.mock("STS", "assumeRoleWithSAML", () => {
      console.log("STS", "assumeRoleWithSAML", "mock called");
    });
    const idpUrl = "fake-idp-url";
    const idpUrlId = "fake-idp-url-id";
    const samlResponse = `aaaa`;
    const session = {
      sessionId: "fake-sessions-id",
      idpUrlId,
      idpArn: "arn:aws:iam::111111111111:saml-provider/FakeProvider",
      roleArn: "arn:aws:iam::111111111111:role/FakeRole",
    };
    const profileName = "fake-profile-name";
    const repository = {
      getSessionById: jest.fn(() => session),
      getProfileName: jest.fn(() => profileName),
      getIdpUrl: jest.fn(() => idpUrl),
    } as any;
    const needToAuthenticate = true;
    const awsAuthenticationService = {
      needAuthentication: jest.fn(async () => needToAuthenticate),
      awsSignIn: jest.fn(async () => samlResponse),
    } as any;
    const options = "fake-options";
    const awsCoreService = {
      stsOptions: jest.fn(() => options),
    } as any;

    const awsIamRoleFederatedService = new AwsIamRoleFederatedService(null, repository, null, awsCoreService, awsAuthenticationService, null);
    (awsIamRoleFederatedService as any).samlRoleSessionDuration = 1111;
    await awsIamRoleFederatedService.generateCredentials("fake-session-id");
    expect(repository.getSessionById).toHaveBeenCalledWith("fake-session-id");
    expect(repository.getIdpUrl).toHaveBeenCalledWith(idpUrlId);
    await expect(awsAuthenticationService.needAuthentication).toHaveBeenCalledWith(idpUrl);
    expect(awsAuthenticationService.awsSignIn).toHaveBeenCalledWith(idpUrl, needToAuthenticate);
    expect(awsCoreService.stsOptions).toHaveBeenCalledWith(session);
    //await expect(AWS.STS.assumeRoleWithSAML).toHaveBeenCalled;

    //AWSMock.restore("STS");
  });

  test("validateCredentials - verify credentials validity", async () => {
    const session = {
      sessionId: "1",
      type: SessionType.awsIamRoleFederated,
      roleArn: "abcdefghijklmnopqrstuvwxyz/12345",
    } as any;
    const awsIamRoleFederatedService = new AwsIamRoleFederatedService(null, null, null, null, null, null);
    jest.spyOn(awsIamRoleFederatedService, "generateCredentials").mockImplementation(() => Promise.resolve({} as any));
    let result = await awsIamRoleFederatedService.validateCredentials(session.sessionId);
    expect(result).toBeTruthy();

    jest.spyOn(awsIamRoleFederatedService, "generateCredentials").mockImplementation(() => Promise.reject({} as any));
    result = await awsIamRoleFederatedService.validateCredentials(session.sessionId);
    expect(result).not.toBeTruthy();
  });

  test("saveSessionTokenExpirationInTheSession - add token info in the session", () => {
    const sessionToModify: AwsIamRoleFederatedSession = {
      startDateTime: new Date().toISOString(),
      idpArn: "fake-idp-arn",
      idpUrlId: "fake-idp-url",
      profileId: "fake-profile-id",
      roleArn: "fake-role-arn",
      sessionId: "2",
      sessionTokenExpiration: "",
      status: SessionStatus.inactive,
      type: SessionType.awsIamRoleFederated,
      sessionName: "sessionName",
      region: "eu-west-1",
      expired: (): boolean => false,
    };

    const fakeCredentials = {
      ["Expiration"]: new Date(),
    };

    const repository = {
      updateSessions: jest.fn(),
      getSessions: jest.fn(() => [{ sessionId: "1" }, sessionToModify]),
    } as any;

    const sessionNotifier = {
      setSessions: jest.fn(),
    } as any;

    const awsIamRoleFederatedService = new AwsIamRoleFederatedService(sessionNotifier, repository, null, null, null, null);
    (awsIamRoleFederatedService as any).saveSessionTokenExpirationInTheSession(sessionToModify, fakeCredentials);
    expect(repository.getSessions).toHaveBeenCalled();
    expect(sessionToModify.sessionTokenExpiration).toBe(fakeCredentials.Expiration.toISOString());
    expect(repository.updateSessions).toHaveBeenCalledWith([{ sessionId: "1" }, sessionToModify]);
    expect(sessionNotifier.setSessions).toHaveBeenCalledWith([{ sessionId: "1" }, sessionToModify]);

    sessionToModify.sessionTokenExpiration = "";
    (awsIamRoleFederatedService as any).saveSessionTokenExpirationInTheSession(sessionToModify, undefined);
    expect(repository.getSessions).toHaveBeenCalled();
    expect(sessionToModify.sessionTokenExpiration).toBe("");
    expect(repository.updateSessions).toHaveBeenCalledWith([{ sessionId: "1" }, sessionToModify]);
    expect(sessionNotifier.setSessions).toHaveBeenCalledWith([{ sessionId: "1" }, sessionToModify]);
  });
});

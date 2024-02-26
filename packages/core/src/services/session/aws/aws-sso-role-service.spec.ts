import { jest, describe, test, expect } from "@jest/globals";
import { AwsSsoRoleSession } from "../../../models/aws/aws-sso-role-session";
import { AwsSsoRoleService } from "./aws-sso-role-service";
import { SessionType } from "../../../models/session-type";
import { IAwsIntegrationDelegate } from "../../../interfaces/i-aws-integration-delegate";
import * as uuid from "uuid";
import { AwsSsoRoleSessionRequest } from "./aws-sso-role-session-request";
import { AwsSessionService } from "./aws-session-service";
import { LoggedException, LogLevel } from "../../log-service";
jest.mock("uuid");

describe("AwsSsoRoleService", () => {
  test("sessionTokenFromGetSessionTokenResponse", () => {
    const roleCredentialResponse = {
      roleCredentials: {
        accessKeyId: "fake-access-key-id",
        secretAccessKey: "fake-secret-access-key",
        sessionToken: "fake-session-token",
      },
    } as any;
    const result = AwsSsoRoleService.sessionTokenFromGetSessionTokenResponse(roleCredentialResponse);
    expect(result).toStrictEqual({
      sessionToken: {
        ["aws_access_key_id"]: "fake-access-key-id",
        ["aws_secret_access_key"]: "fake-secret-access-key",
        ["aws_session_token"]: "fake-session-token",
      },
    });
  });

  test("setAwsIntegrationDelegate", () => {
    const delegate: IAwsIntegrationDelegate = {
      getAccessToken: () => {},
      getRoleCredentials: () => {},
    } as any;
    const awsSsoRoleService = new AwsSsoRoleService(null, null, null, null, null, null, { appendListener: jest.fn(() => {}) } as any);
    (awsSsoRoleService as any).awsIntegrationDelegate = undefined;
    awsSsoRoleService.setAwsIntegrationDelegate(delegate);
    expect((awsSsoRoleService as any).awsIntegrationDelegate).toStrictEqual(delegate);
  });

  test("catchClosingBrowserWindow", async () => {
    const sessions = [{ sessionId: "session-1" }, { sessionId: "session-2" }, { sessionId: "session-3" }];
    const repository = {
      listAwsSsoRoles: jest.fn(() => sessions),
    } as any;
    const awsSsoRoleService = new AwsSsoRoleService(null, repository, null, null, null, null, { appendListener: jest.fn(() => {}) } as any);
    (awsSsoRoleService.stop as any) = jest.fn(() => Promise.resolve(""));
    await awsSsoRoleService.catchClosingBrowserWindow();
    expect(repository.listAwsSsoRoles).toHaveBeenCalled();
    expect(awsSsoRoleService.stop).toHaveBeenCalledTimes(sessions.length);
    expect(awsSsoRoleService.stop).toHaveBeenNthCalledWith(1, sessions[0].sessionId);
    expect(awsSsoRoleService.stop).toHaveBeenNthCalledWith(2, sessions[1].sessionId);
    expect(awsSsoRoleService.stop).toHaveBeenNthCalledWith(3, sessions[2].sessionId);
  });

  test("create - with session notifier", async () => {
    jest.spyOn(uuid, "v4").mockImplementation(() => "mocked-uuid");
    const repository = {
      addSession: jest.fn(),
      getSessions: jest.fn(() => "fake-sessions"),
    } as any;
    const sessionNotifier = {
      setSessions: jest.fn(),
    } as any;
    const request: AwsSsoRoleSessionRequest = {
      sessionName: "fake-session-name",
      region: "fake-region",
      roleArn: "fake-role-arn",
      profileId: "fake-profile-id",
      email: "fake-email",
      awsSsoConfigurationId: "fake-aws-configuration-id",
    };
    const awsSsoRoleService = new AwsSsoRoleService(sessionNotifier, repository, null, null, null, null, {
      appendListener: jest.fn(() => {}),
    } as any);
    await awsSsoRoleService.create(request);
    expect(repository.addSession).toHaveBeenCalledWith({
      sessionName: request.sessionName,
      region: request.region,
      roleArn: request.roleArn,
      profileId: request.profileId,
      awsSsoConfigurationId: request.awsSsoConfigurationId,
      email: request.email,
      sessionId: "mocked-uuid",
      sessionTokenExpiration: undefined,
      startDateTime: undefined,
      status: 0,
      type: SessionType.awsSsoRole,
    });
    expect(repository.getSessions).toHaveBeenCalled();
    expect(sessionNotifier.setSessions).toHaveBeenCalledWith("fake-sessions");
  });

  test("create - no session notifier", async () => {
    jest.spyOn(uuid, "v4").mockImplementation(() => "mocked-uuid");
    const repository = {
      addSession: () => {},
      getSessions: () => "fake-sessions",
    } as any;
    const sessionNotifier = {
      setSessions: jest.fn(),
    } as any;
    const request: any = {};
    const awsSsoRoleService = new AwsSsoRoleService(null, repository, null, null, null, null, {
      appendListener: jest.fn(() => {}),
    } as any);
    await awsSsoRoleService.create(request);
    expect(sessionNotifier.setSessions).not.toHaveBeenCalled();
  });

  test("update", async () => {
    const awsSsoRoleService = new AwsSsoRoleService(null, null, null, null, null, null, {
      appendListener: jest.fn(() => {}),
    } as any);
    await expect(async () => awsSsoRoleService.update(null, null)).rejects.toThrow(
      new LoggedException(`Update is not supported for AWS SSO Role Session Type`, this, LogLevel.error, false)
    );
  });

  test("getCloneRequest", () => {
    const awsSsoRoleService = new AwsSsoRoleService(null, null, null, null, null, null, {
      appendListener: jest.fn(() => {}),
    } as any);
    expect(() => awsSsoRoleService.getCloneRequest({ type: SessionType.awsSsoRole } as any)).rejects.toThrow(
      new LoggedException(`Clone is not supported for sessionType ${SessionType.awsSsoRole}`, this, LogLevel.error, false)
    );
  });

  test("applyCredentials", async () => {
    const credentialInfo = {
      sessionToken: {
        ["aws_access_key_id"]: "fake-access-key-id",
        ["aws_secret_access_key"]: "fake-secret-access-key",
        ["aws_session_token"]: "fake-session-token",
      },
    };
    const profileId = "fake-profile-id";
    const session = { profileName: "fake-profile-name", region: "fake-region", profileId };
    const profileName = "fake-profile";
    const credentialPath = "fake-credential-path";
    const repository = {
      getSessionById: jest.fn(() => session),
      getProfileName: jest.fn(() => profileName),
    } as any;
    const fileService = {
      iniWriteSync: jest.fn(),
    } as any;
    const awsCore = {
      awsCredentialPath: jest.fn(() => credentialPath),
    } as any;
    const awsSsoRoleService = new AwsSsoRoleService(null, repository, fileService, null, awsCore, null, { appendListener: jest.fn(() => {}) } as any);
    await awsSsoRoleService.applyCredentials("fake-session-id", credentialInfo);
    expect(repository.getSessionById).toHaveBeenCalledWith("fake-session-id");
    expect(repository.getProfileName).toHaveBeenCalledWith(profileId);
    expect(awsCore.awsCredentialPath).toHaveBeenCalled();
    const expectedCredentialObject = {
      [profileName]: {
        ["aws_access_key_id"]: credentialInfo.sessionToken.aws_access_key_id,
        ["aws_secret_access_key"]: credentialInfo.sessionToken.aws_secret_access_key,
        ["aws_session_token"]: credentialInfo.sessionToken.aws_session_token,
        region: session.region,
      },
    };
    expect(fileService.iniWriteSync).toHaveBeenCalledWith(credentialPath, expectedCredentialObject);
  });

  test("deApplyCredentials", async () => {
    const profileName = "fake-profile";
    const credentialFile = {
      [profileName]: {
        fakeKey: "fake-value",
      },
      anotherNameProfile: {
        fakeKey: "fake-value",
      },
    };
    const profileId = "fake-profile-id";
    const session = { profileName: "fake-profile-name", region: "fake-region", profileId };
    const credentialPath = "fake-credential-path";
    const repository = {
      getSessionById: jest.fn(() => session),
      getProfileName: jest.fn(() => profileName),
    } as any;
    const fileService = {
      iniParseSync: jest.fn(async () => credentialFile),
      replaceWriteSync: jest.fn(),
    } as any;
    const awsCore = {
      awsCredentialPath: jest.fn(() => credentialPath),
    } as any;
    const awsSsoRoleService = new AwsSsoRoleService(null, repository, fileService, null, awsCore, null, { appendListener: jest.fn(() => {}) } as any);
    await awsSsoRoleService.deApplyCredentials("fake-session-id");
    expect(repository.getSessionById).toHaveBeenCalledWith("fake-session-id");
    expect(repository.getProfileName).toHaveBeenCalledWith(profileId);
    expect(awsCore.awsCredentialPath).toHaveBeenCalled();
    const expectedCredentialFile = {
      anotherNameProfile: {
        fakeKey: "fake-value",
      },
    };
    expect(fileService.iniParseSync).toHaveBeenCalledWith(credentialPath);
    expect(fileService.replaceWriteSync).toHaveBeenCalledWith(credentialPath, expectedCredentialFile);
  });

  test("generateCredentialsProxy", async () => {
    const awsSsoRoleService = new AwsSsoRoleService(null, null, null, null, null, null, { appendListener: jest.fn(() => {}) } as any);
    jest.spyOn(awsSsoRoleService, "generateCredentials").mockImplementation(jest.fn());
    await awsSsoRoleService.generateCredentialsProxy("fake-session-id");
    expect(awsSsoRoleService.generateCredentials).toHaveBeenCalledWith("fake-session-id");
  });

  test("generateCredentials", async () => {
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date());
    const credentials = {
      roleCredentials: {
        accessKeyId: "fake-access-key-id",
        secretAccessKey: "fake-secret-access-key",
        sessionToken: "fake-session-token",
        expiration: new Date(),
      },
    };
    const roleArn = "fake-role-arn";
    const awsSsoConfigurationId = "fake-aws-configuration-id";
    const session = { profileName: "fake-profile-name", roleArn, awsSsoConfigurationId };
    const awsSsoConfiguration = {
      region: "fake-region",
      portalUrl: "fake-portal-url",
    };
    const repository = {
      getSessionById: jest.fn(() => session),
      getAwsSsoIntegration: jest.fn(() => awsSsoConfiguration),
    } as any;
    const accessToken = "fake-access-token";
    const awsSsoRoleService = new AwsSsoRoleService(null, repository, null, null, null, null, { appendListener: jest.fn(() => {}) } as any);
    (awsSsoRoleService as any).awsIntegrationDelegate = {};
    (awsSsoRoleService as any).awsIntegrationDelegate.getAccessToken = jest.fn(async () => accessToken);
    (awsSsoRoleService as any).awsIntegrationDelegate.getRoleCredentials = jest.fn(async () => credentials);
    (awsSsoRoleService as any).saveSessionTokenExpirationInTheSession = jest.fn();
    jest.spyOn(AwsSsoRoleService, "sessionTokenFromGetSessionTokenResponse").mockImplementation(jest.fn());
    await awsSsoRoleService.generateCredentials("fake-session-id");

    expect(repository.getSessionById).toHaveBeenCalledWith("fake-session-id");
    expect(repository.getAwsSsoIntegration).toHaveBeenCalledWith(session.awsSsoConfigurationId);
    expect((awsSsoRoleService as any).awsIntegrationDelegate.getAccessToken).toHaveBeenCalledWith(
      session.awsSsoConfigurationId,
      awsSsoConfiguration.region,
      awsSsoConfiguration.portalUrl
    );
    expect((awsSsoRoleService as any).awsIntegrationDelegate.getRoleCredentials).toHaveBeenCalledWith(
      accessToken,
      awsSsoConfiguration.region,
      session.roleArn
    );
    const expectedAwsCredential: any = {
      ["accessKeyId"]: credentials.roleCredentials.accessKeyId,
      ["expiration"]: new Date(credentials.roleCredentials.expiration),
      ["secretAccessKey"]: credentials.roleCredentials.secretAccessKey,
      ["sessionToken"]: credentials.roleCredentials.sessionToken,
    };
    expect((awsSsoRoleService as any).saveSessionTokenExpirationInTheSession).toHaveBeenCalledWith(session, expectedAwsCredential);
    expect(AwsSsoRoleService.sessionTokenFromGetSessionTokenResponse).toHaveBeenCalledWith(credentials);
  });

  test("getAccountNumberFromCallerIdentity", async () => {
    const session = {
      type: SessionType.awsSsoRole,
      roleArn: "abcdefghijklmnopqrstuvwxyz/12345",
    } as any;
    const awsSsoRoleService = new AwsSsoRoleService(null, null, null, null, null, null, { appendListener: jest.fn(() => {}) } as any);
    const accountNumber = await awsSsoRoleService.getAccountNumberFromCallerIdentity(session);

    expect(accountNumber).toBe("nopqrstuvwxy");
  });

  test("getAccountNumberFromCallerIdentity - error", async () => {
    const session = {};
    const awsSsoRoleService = new AwsSsoRoleService(null, null, null, null, null, null, { appendListener: jest.fn(() => {}) } as any);

    await expect(() => awsSsoRoleService.getAccountNumberFromCallerIdentity(session as AwsSsoRoleSession)).rejects.toThrow(
      new Error("AWS SSO Role Session required")
    );
  });

  test("sessionDeactivated", () => {
    const awsSsoRoleService = new AwsSsoRoleService(null, null, null, null, null, null, { appendListener: jest.fn(() => {}) } as any);
    jest.spyOn(AwsSessionService.prototype, "sessionDeactivated").mockImplementation(() => Promise.resolve({} as any));
    awsSsoRoleService.sessionDeactivated("fake-session-id");
    expect(AwsSessionService.prototype.sessionDeactivated).toHaveBeenCalledWith("fake-session-id");
  });

  test("validateCredentials", async () => {
    const session = {
      sessionId: "1",
      type: SessionType.awsIamRoleFederated,
      roleArn: "abcdefghijklmnopqrstuvwxyz/12345",
    } as any;
    const awsSsoRoleService = new AwsSsoRoleService(null, null, null, null, null, null, { appendListener: jest.fn(() => {}) } as any);
    jest.spyOn(awsSsoRoleService, "generateCredentials").mockImplementation(() => Promise.resolve({} as any));
    let result = await awsSsoRoleService.validateCredentials(session.sessionId);
    expect(result).toBeTruthy();

    jest.spyOn(awsSsoRoleService, "generateCredentials").mockImplementation(() => Promise.reject({} as any));
    result = await awsSsoRoleService.validateCredentials(session.sessionId);
    expect(result).not.toBeTruthy();
  });

  test("saveSessionTokenExpirationInTheSession - credentials not undefined", () => {
    const session: any = { id: "fake-session-id", sessionTokenExpiration: undefined };
    const sessions = [{ id: "wrong-session-id" }, session];
    const repository = {
      getSessions: jest.fn(() => sessions),
      updateSessions: jest.fn(),
    } as any;
    const sessionNotifier = {
      setSessions: jest.fn(),
    } as any;
    const fakeCredentials = {
      ["expiration"]: new Date(),
    };
    const awsSsoRoleService = new AwsSsoRoleService(sessionNotifier, repository, null, null, null, null, { appendListener: () => {} } as any);
    (awsSsoRoleService as any).saveSessionTokenExpirationInTheSession(session, fakeCredentials);
    expect(repository.getSessions).toHaveBeenCalled();
    expect(session.sessionTokenExpiration).toBe(fakeCredentials.expiration.toISOString());
    expect(repository.updateSessions).toHaveBeenCalledWith([{ id: "wrong-session-id" }, session]);
    expect(sessionNotifier.setSessions).toHaveBeenCalledWith([{ id: "wrong-session-id" }, session]);

    session.sessionTokenExpiration = "";
    (awsSsoRoleService as any).saveSessionTokenExpirationInTheSession(session, undefined);
    expect(repository.getSessions).toHaveBeenCalled();
    expect(session.sessionTokenExpiration).toBe("");
    expect(repository.updateSessions).toHaveBeenCalledWith([{ id: "wrong-session-id" }, session]);
    expect(sessionNotifier.setSessions).toHaveBeenCalledWith([{ id: "wrong-session-id" }, session]);

    jest.spyOn(awsSsoRoleService as any, "removeSecrets");
    awsSsoRoleService.removeSecrets("");
    expect(awsSsoRoleService.removeSecrets).toHaveBeenCalled();
  });
});

import { jest, describe, test, expect } from "@jest/globals";
import { AwsSsoRoleSession } from "../../../models/aws/aws-sso-role-session";
import { AwsSsoRoleService } from "./aws-sso-role-service";
import { SessionType } from "../../../models/session-type";
import { IAwsIntegrationDelegate } from "../../../interfaces/i-aws-integration-delegate";
import * as uuid from "uuid";
import { AwsSsoRoleSessionRequest } from "./aws-sso-role-session-request";
import { AwsSessionService } from "./aws-session-service";
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
    const sessions = [{ sessionId: "1" }, { sessionId: "2" }, { sessionId: "3" }];
    const repository = {
      listAwsSsoRoles: jest.fn(() => sessions),
    } as any;
    const awsSsoRoleService = new AwsSsoRoleService(null, repository, null, null, null, null, {
      appendListener: jest.fn(() => ({
        then: () => Promise.resolve(""),
      })),
    } as any);
    awsSsoRoleService.stop = jest.fn();
    //await awsSsoRoleService.catchClosingBrowserWindow();
    //expect(repository.listAwsSsoRoles).toHaveBeenCalled();
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
});

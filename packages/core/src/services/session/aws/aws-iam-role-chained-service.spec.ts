import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { AwsIamRoleChainedSession } from "../../../models/aws/aws-iam-role-chained-session";
import { AwsIamRoleChainedService } from "./aws-iam-role-chained-service";
import { SessionType } from "../../../models/session-type";
import { LeappNotFoundError } from "../../../errors/leapp-not-found-error";
import { LeappAwsStsError } from "../../../errors/leapp-aws-sts-error";
import { constants } from "../../../models/constants";
import * as AWS from "aws-sdk";
import { AwsIamRoleChainedSessionRequest } from "./aws-iam-role-chained-session-request";
import { AssumeRoleCommand } from "@aws-sdk/client-sts";

describe("AwsIamRoleChainedService", () => {
  let sessionNotifier;
  let repository;
  let fileService;
  let awsCoreService;
  let session;
  let parentSession;
  let credentialFile;
  let generateSessionToken;
  let parentSessionServiceFactory;
  let parentSessionService;

  beforeEach(() => {
    session = {
      sessionId: "session1",
      type: SessionType.awsIamRoleChained,
      roleArn: "abcdefghijklmnopqrstuvwxyz/12345",
      region: "eu-west-1",
      profileId: "profileId",
      roleSessionName: "miao",
      parentSessionId: "sessionP",
      sessionName: "piao",
    } as any;
    parentSession = {
      sessionId: "sessionP",
      type: SessionType.awsIamRoleFederated,
      roleArn: "federated/12345",
      region: "eu-west-1",
      profileId: "profileIdP",
    } as any;
    credentialFile = {
      profile1: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: "",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: "",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_session_token: "",
        region: session.region,
      },
    } as any;
    sessionNotifier = {
      addSession: jest.fn(() => {}),
      setSessions: jest.fn(() => {}),
    };
    repository = {
      addSession: jest.fn(() => {}),
      getSessions: jest.fn(() => [session]),
      getSessionById: jest.fn((sessionId: string) => (sessionId === session.sessionId ? session : parentSession)),
      getProfileName: jest.fn(() => "profile1"),
      updateSessions: jest.fn(() => {}),
      workspace: {
        samlRoleSessionDuration: constants.samlRoleSessionDuration,
      },
    };
    fileService = {
      iniWriteSync: jest.fn((_: string, __: any) => {}),
      iniParseSync: jest.fn((_: string) => credentialFile),
      replaceWriteSync: jest.fn((_: string, __: any) => {}),
    };
    awsCoreService = {
      awsCredentialPath: jest.fn(() => "aws-path"),
      stsOptions: jest.fn(() => {}),
    };
    parentSessionService = {
      generateCredentials: jest.fn((_: string) => ({
        sessionToken: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_session_token: "",
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_access_key_id: "",
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_secret_access_key: "",
        },
      })),
      generateCredentialsProxy: jest.fn((_: string) => ({
        sessionToken: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_session_token: "",
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_access_key_id: "",
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_secret_access_key: "",
        },
      })),
    };
    parentSessionServiceFactory = {
      getSessionService: jest.fn(() => parentSessionService),
    };

    generateSessionToken = jest.fn((_: string, __: string, _2: string) => {});
  });

  test("getCloneRequest", async () => {
    const awsIamRoleChainedService = new AwsIamRoleChainedService(null, null, null, null, null, null);
    const result = await awsIamRoleChainedService.getCloneRequest(session);
    const mock = {
      parentSessionId: "sessionP",
      sessionName: "piao",
      profileId: "profileId",
      region: "eu-west-1",
      roleArn: "abcdefghijklmnopqrstuvwxyz/12345",
      roleSessionName: "miao",
    };
    expect(result).toStrictEqual(mock);
  });

  test("create - add a new role chained session", async () => {
    const awsIamRoleChainedService = new AwsIamRoleChainedService(sessionNotifier, repository, awsCoreService, null, null, null);
    await awsIamRoleChainedService.create(session);

    expect(sessionNotifier.setSessions).toHaveBeenCalled();
    expect(repository.addSession).toHaveBeenCalled();
  });

  test("update", async () => {
    const updateRequest = {
      sessionName: "a",
      region: "b",
      roleArn: "c",
      roleSessionName: "d",
      parentSessionId: "1",
      profileId: "2",
    } as AwsIamRoleChainedSessionRequest;
    const mockedSession = {};
    repository = {
      getSessions: jest.fn(() => [mockedSession]),
      getSessionById: jest.fn(() => mockedSession),
      updateSession: jest.fn(),
    } as any;
    const awsIamRoleChainedService = new AwsIamRoleChainedService(sessionNotifier, repository, awsCoreService, null, null, null);
    await awsIamRoleChainedService.update("session1", updateRequest);
    expect(repository.getSessionById).toHaveBeenCalledWith("session1");
    expect(repository.updateSession).toHaveBeenCalledWith("session1", updateRequest);
    expect(sessionNotifier.setSessions).toHaveBeenCalledWith([mockedSession]);
  });

  test("applyCredentials - apply a credential set by writing on the ini file", async () => {
    const credentialsInfo = {
      sessionToken: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: "access",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: "secret",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_session_token: "123456token",
      },
    } as any;

    const awsIamRoleChainedService = new AwsIamRoleChainedService(sessionNotifier, repository, awsCoreService, fileService, null, null);
    await awsIamRoleChainedService.applyCredentials(session.sessionId, credentialsInfo);

    expect(repository.getSessionById).toHaveBeenCalledWith("session1");
    expect(repository.getProfileName).toHaveBeenCalledWith("profileId");
    expect(fileService.iniWriteSync).toHaveBeenCalledWith("aws-path", {
      profile1: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: credentialsInfo.sessionToken.aws_access_key_id,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: credentialsInfo.sessionToken.aws_secret_access_key,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_session_token: credentialsInfo.sessionToken.aws_session_token,
        region: session.region,
      },
    });
  });

  test("deApplyCredentials - remove data from the credentials file", async () => {
    const awsIamRoleChainedService = new AwsIamRoleChainedService(sessionNotifier, repository, awsCoreService, fileService, null, null);
    await awsIamRoleChainedService.deApplyCredentials(session.sessionId);

    expect(repository.getSessionById).toHaveBeenCalledWith("session1");
    expect(repository.getProfileName).toHaveBeenCalledWith("profileId");
    expect(fileService.iniParseSync).toHaveBeenCalledWith("aws-path");
    expect(fileService.replaceWriteSync).toHaveBeenCalledWith("aws-path", {});
  });

  test("generateCredentialsProxy", async () => {
    const awsIamRoleChainedService = new AwsIamRoleChainedService(null, null, null, null, null, null);
    jest.spyOn(awsIamRoleChainedService, "generateCredentials").mockImplementation(jest.fn());
    await awsIamRoleChainedService.generateCredentialsProxy("fake-session-id");
    expect(awsIamRoleChainedService.generateCredentials).toHaveBeenCalledWith("fake-session-id");
  });

  test("generateCredentials - generate a credential set", async () => {
    const awsIamRoleChainedService = new AwsIamRoleChainedService(
      sessionNotifier,
      repository,
      awsCoreService,
      fileService,
      null,
      parentSessionServiceFactory
    );
    (awsIamRoleChainedService as any).generateSessionToken = generateSessionToken;

    await awsIamRoleChainedService.generateCredentials(session.sessionId);

    expect(repository.getSessionById).toHaveBeenCalledWith("session1");
    expect(repository.getSessionById).toHaveBeenCalledWith("sessionP");

    expect(generateSessionToken).toHaveBeenCalled();
  });

  test("generateCredentials - RoleSessionName undefined", async () => {
    const session2 = { sessionId: "fake-session-id", roleArn: "arn" };
    const repository2 = {
      getSessionById: () => session2,
      workspace: {
        samlRoleSessionDuration: constants.samlRoleSessionDuration,
      },
    } as any;
    const awsIamRoleChainedService = new AwsIamRoleChainedService(
      sessionNotifier,
      repository2,
      awsCoreService,
      fileService,
      null,
      parentSessionServiceFactory
    );
    (awsIamRoleChainedService as any).generateSessionToken = jest.fn();
    await awsIamRoleChainedService.generateCredentials("fake-session-id");
    const sts = new AWS.STS();
    (sts as any)._clientId = 2;
    expect((awsIamRoleChainedService as any).generateSessionToken.mock.calls[0][2]).toEqual({
      ["RoleSessionName"]: constants.roleSessionName,
      ["RoleArn"]: session2.roleArn,
      ["DurationSeconds"]: constants.samlRoleSessionDuration,
    });
  });

  test("generateCredentials - throws an error", async () => {
    const sessionId = "fake-session-id";
    const session2 = { sessionName: "fake-session-name", parentSessionId: "throw-exeption" };
    const repository2 = {
      getSessionById: jest.fn((_sessionId) => {
        if (_sessionId === "throw-exeption") {
          throw new Error("Error");
        } else {
          return session2;
        }
      }),
    } as any;
    const awsIamRoleChainedService = new AwsIamRoleChainedService(null, repository2, null, null, null, null);
    try {
      await awsIamRoleChainedService.generateCredentials(sessionId);
    } catch (err) {
      expect(err).toEqual(new LeappNotFoundError(this, `Parent Account Session  not found for Chained Account ${session2.sessionName}`));
    }
  });

  test("validateCredentials", async () => {
    const session2 = {
      sessionId: "1",
      type: SessionType.awsIamRoleChained,
      roleArn: "abcdefghijklmnopqrstuvwxyz/12345",
    } as any;
    const awsIamRoleChainedService = new AwsIamRoleChainedService(null, null, null, null, null, null);
    jest.spyOn(awsIamRoleChainedService, "generateCredentials").mockImplementation(() => Promise.resolve({} as any));
    let result = await awsIamRoleChainedService.validateCredentials(session2.sessionId);
    expect(result).toBeTruthy();

    jest.spyOn(awsIamRoleChainedService, "generateCredentials").mockImplementation(() => Promise.reject({} as any));
    result = await awsIamRoleChainedService.validateCredentials(session2.sessionId);
    expect(result).not.toBeTruthy();
  });

  test("removeSecret - exists", () => {
    const awsIamRoleChainedService = new AwsIamRoleChainedService(sessionNotifier, repository, awsCoreService, null, null, null);
    expect(awsIamRoleChainedService.removeSecrets).not.toBe(undefined);
  });

  test("getAccountNumberFromCallerIdentity", async () => {
    const awsIamRoleChainedService = new AwsIamRoleChainedService(null, null, null, null, null, null);
    const accountNumber = await awsIamRoleChainedService.getAccountNumberFromCallerIdentity(session);

    expect(accountNumber).toBe("nopqrstuvwxy");
  });

  test("getAccountNumberFromCallerIdentity - error", async () => {
    session = {};
    const awsIamRoleChainedService = new AwsIamRoleChainedService(null, null, null, null, null, null);

    await expect(() => awsIamRoleChainedService.getAccountNumberFromCallerIdentity(session as AwsIamRoleChainedSession)).rejects.toThrow(
      new Error("AWS IAM Role Chained Session required")
    );
  });

  test("generateSessionToken - create a session token given the credential information we need", async () => {
    const awsIamRoleChainedService = new AwsIamRoleChainedService(
      sessionNotifier,
      repository,
      awsCoreService,
      fileService,
      null,
      parentSessionServiceFactory
    );
    (awsIamRoleChainedService as any).saveSessionTokenExpirationInTheSession = jest.fn();
    const stsMock = {
      send: jest.fn(() => ({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Credentials: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          AccessKeyId: "",
          // eslint-disable-next-line @typescript-eslint/naming-convention
          SecretAccessKey: "",
          // eslint-disable-next-line @typescript-eslint/naming-convention
          SessionToken: "",
        },
      })),
    };

    await (awsIamRoleChainedService as any).generateSessionToken(session, stsMock, {});

    //console.log(stsMock.send.mock.calls[0]);
    expect((awsIamRoleChainedService as any).saveSessionTokenExpirationInTheSession).toHaveBeenCalled();
    expect(JSON.stringify(stsMock.send.mock.calls[0])).toBe(JSON.stringify([new AssumeRoleCommand({} as any)]));
  });

  test("generateSessionToken - throws error", async () => {
    const sts = {
      assumeRole: () => {
        throw new Error({ message: "Error" } as any);
      },
    };
    const awsIamRoleChainedService = new AwsIamRoleChainedService(null, null, null, null, null, null);
    try {
      await (awsIamRoleChainedService as any).generateSessionToken("fake-session", sts, "fake-params");
    } catch (err) {
      expect(err).toStrictEqual(new LeappAwsStsError(this, err.message));
    }
  });

  test("saveSessionTokenExpirationInTheSession - save a new token expiration in a specified session, with and without credentials", async () => {
    const awsIamRoleChainedService = new AwsIamRoleChainedService(
      sessionNotifier,
      repository,
      awsCoreService,
      fileService,
      null,
      parentSessionServiceFactory
    );

    await (awsIamRoleChainedService as any).saveSessionTokenExpirationInTheSession(session, undefined);
    expect(session.sessionTokenExpiration).toBe(undefined);

    await (awsIamRoleChainedService as any).saveSessionTokenExpirationInTheSession(session, { ["Expiration"]: new Date() });

    expect(session.sessionTokenExpiration).not.toBe(undefined);
    expect(repository.getSessions).toHaveBeenCalled();
    expect(repository.updateSessions).toHaveBeenCalledWith([session]);
    expect(sessionNotifier.setSessions).toHaveBeenCalledWith([session]);

    jest.spyOn(awsIamRoleChainedService as any, "removeSecrets");
    awsIamRoleChainedService.removeSecrets("");
    expect(awsIamRoleChainedService.removeSecrets).toHaveBeenCalled();
  });
});

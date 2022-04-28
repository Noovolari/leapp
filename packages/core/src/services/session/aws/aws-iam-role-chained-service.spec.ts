import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { AwsIamRoleChainedSession } from "../../../models/aws-iam-role-chained-session";
import { AwsIamRoleChainedService } from "./aws-iam-role-chained-service";
import { SessionType } from "../../../models/session-type";

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

  test("create - add a new role chained session", async () => {
    const awsIamRoleChainedService = new AwsIamRoleChainedService(sessionNotifier, repository, awsCoreService, null, null, null);
    await awsIamRoleChainedService.create(session);

    expect(sessionNotifier.addSession).toHaveBeenCalled();
    expect(repository.addSession).toHaveBeenCalled();
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
      assumeRole: jest.fn(() => ({
        promise: () => ({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Credentials: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            AccessKeyId: "",
            // eslint-disable-next-line @typescript-eslint/naming-convention
            SecretAccessKey: "",
            // eslint-disable-next-line @typescript-eslint/naming-convention
            SessionToken: "",
          },
        }),
      })),
    };

    await (awsIamRoleChainedService as any).generateSessionToken(session, stsMock, {});

    expect((awsIamRoleChainedService as any).saveSessionTokenExpirationInTheSession).toHaveBeenCalled();
    expect(stsMock.assumeRole).toHaveBeenCalled();
  });

  test("saveSessionTokenExpirationInTheSession - save a new token expiration in a specified session", async () => {
    const awsIamRoleChainedService = new AwsIamRoleChainedService(
      sessionNotifier,
      repository,
      awsCoreService,
      fileService,
      null,
      parentSessionServiceFactory
    );

    // eslint-disable-next-line @typescript-eslint/naming-convention
    await (awsIamRoleChainedService as any).saveSessionTokenExpirationInTheSession(session, { Expiration: new Date() });

    expect(session.sessionTokenExpiration).not.toBe(undefined);
    expect(repository.getSessions).toHaveBeenCalled();
    expect(repository.updateSessions).toHaveBeenCalledWith([session]);
    expect(sessionNotifier.setSessions).toHaveBeenCalledWith([session]);
  });
});

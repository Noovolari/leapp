import { describe, expect, jest, test } from "@jest/globals";
import { AwsProcessCredentials } from "../../../models/aws/aws-process-credential";
import { SessionType } from "../../../models/session-type";
import { AwsSessionService } from "./aws-session-service";
import { CredentialsInfo } from "../../../models/credentials-info";
import { SessionStatus } from "../../../models/session-status";
import { constants } from "../../../models/constants";
import { LoggedException, LogLevel } from "../../log-service";

describe("AwsSessionService", () => {
  test("should be created", () => {
    const repository = {
      listIamRoleChained: jest.fn(() => ["session1", "session2"]),
      getSessionById: jest.fn(() => "session1"),
    } as any;
    const sessionNotifier = {} as any;

    const awsSessionService = new (AwsSessionService as any)(sessionNotifier, repository);
    expect(awsSessionService).not.toBe(undefined);
  });

  test("getDependantSessions", () => {
    const repository = {
      listIamRoleChained: jest.fn(() => ["session1", "session2"]),
      getSessionById: jest.fn(() => "session1"),
    } as any;
    const sessionNotifier = {} as any;

    const awsSessionService = new (AwsSessionService as any)(sessionNotifier, repository);
    const sessionId = "sessionId";

    const dependantSessions = awsSessionService.getDependantSessions(sessionId);

    expect(awsSessionService.repository.listIamRoleChained).toHaveBeenCalledWith("session1");
    expect(awsSessionService.repository.getSessionById).toHaveBeenCalledWith(sessionId);
    expect(dependantSessions).toEqual(["session1", "session2"]);
  });

  test("start - fails if another session is in pending with the same name profile", async () => {
    const repository = {
      listIamRoleChained: jest.fn(() => ["session1", "session2"]),
      getSessionById: jest.fn(() => "session1"),
      getSessions: jest.fn(() => []),
    } as any;
    const sessionNotifier = {} as any;
    const isThereAnotherPendingSessionWithSameNameProfile = jest.fn((_: string) => true);

    const awsSessionService = new (AwsSessionService as any)(sessionNotifier, repository);
    (awsSessionService as any).isThereAnotherPendingSessionWithSameNamedProfile = isThereAnotherPendingSessionWithSameNameProfile;
    await expect(awsSessionService.start("sessionId")).rejects.toThrow(
      new LoggedException("Pending session with same named profile", this, LogLevel.info)
    );
  });

  test("start - calls sessionError if an error occurs during the process", async () => {
    const repository = {
      listIamRoleChained: jest.fn(() => ["session1", "session2"]),
      getSessionById: jest.fn(() => "session1"),
      getSessions: jest.fn(() => []),
    } as any;
    const sessionNotifier = {} as any;
    const error = new Error("testError");
    const isThereAnotherPendingSessionWithSameNameProfile = jest.fn((_: string) => false);
    const stopAllWithSameNameProfile = jest.fn((_: string): void => {
      throw error;
    });
    const sessionError = jest.fn(() => {});
    const awsSessionService = new (AwsSessionService as any)(sessionNotifier, repository);
    (awsSessionService as any).isThereAnotherPendingSessionWithSameNamedProfile = isThereAnotherPendingSessionWithSameNameProfile;
    (awsSessionService as any).stopAllWithSameNameProfile = stopAllWithSameNameProfile;
    (awsSessionService as any).sessionError = sessionError;

    await awsSessionService.start("sessionId");
    expect(sessionError).toHaveBeenCalledWith("sessionId", error);
  });

  test("start - will start your session", async () => {
    const repository = {
      getWorkspace: jest.fn(() => ({ credentialMethod: constants.credentialFile })),
    } as any;
    const sessionNotifier = {} as any;
    const credentialsInfo = {} as any;
    const isThereAnotherPendingSessionWithSameNameProfile = jest.fn((_: string) => false);
    const stopAllWithSameNameProfile = jest.fn((_: string): void => {});
    const sessionLoading = jest.fn((_: string): void => {});
    const sessionActivated = jest.fn((_: string): void => {});
    const generateCredentials = jest.fn((_: string): Promise<CredentialsInfo> => Promise.resolve(credentialsInfo));
    const applyCredentials = jest.fn((_: string, __: CredentialsInfo): void => {});
    const awsSessionService = new (AwsSessionService as any)(sessionNotifier, repository);
    (awsSessionService as any).isThereAnotherPendingSessionWithSameNamedProfile = isThereAnotherPendingSessionWithSameNameProfile;
    (awsSessionService as any).stopAllWithSameNameProfile = stopAllWithSameNameProfile;
    (awsSessionService as any).generateCredentials = generateCredentials;
    (awsSessionService as any).sessionLoading = sessionLoading;
    (awsSessionService as any).sessionActivated = sessionActivated;
    (awsSessionService as any).applyCredentials = applyCredentials;
    await awsSessionService.start("sessionId");

    expect(isThereAnotherPendingSessionWithSameNameProfile).toHaveBeenCalledWith("sessionId");
    expect(stopAllWithSameNameProfile).toHaveBeenCalledWith("sessionId");
    expect(sessionLoading).toHaveBeenCalledWith("sessionId");
    expect(sessionActivated).toHaveBeenCalledWith("sessionId");
    expect(generateCredentials).toHaveBeenCalledWith("sessionId");
    expect(applyCredentials).toHaveBeenCalledWith("sessionId", credentialsInfo);
  });

  test("start - using credentialProcess", async () => {
    const repository = {
      getWorkspace: () => ({ credentialMethod: constants.credentialProcess }),
    } as any;
    const awsSessionService: any = new (AwsSessionService as any)(null, repository);
    awsSessionService.isThereAnotherPendingSessionWithSameNamedProfile = () => false;
    awsSessionService.stopAllWithSameNameProfile = async () => {};
    awsSessionService.sessionLoading = () => {};
    awsSessionService.sessionActivated = () => {};
    awsSessionService.applyConfigProfileCommand = jest.fn(async () => {});
    await awsSessionService.start("fake-session-id");
    expect(await awsSessionService.applyConfigProfileCommand).toHaveBeenCalledWith("fake-session-id");
  });

  test("rotate - apply rotation by generating a new set of credentials", async () => {
    const repository = {
      listIamRoleChained: jest.fn(() => ["session1", "session2"]),
      getSessionById: jest.fn(() => "session1"),
      getSessions: jest.fn(() => []),
      getWorkspace: jest.fn(() => ({ credentialMethod: constants.credentialFile })),
    } as any;
    const sessionNotifier = {} as any;
    const credentialsInfo = {} as any;
    const sessionLoading = jest.fn((_: string): void => {});
    const sessionActivated = jest.fn((_: string): void => {});
    const generateCredentials = jest.fn((_: string): Promise<CredentialsInfo> => Promise.resolve(credentialsInfo));
    const applyCredentials = jest.fn((_: string, __: CredentialsInfo): void => {});
    const awsSessionService = new (AwsSessionService as any)(sessionNotifier, repository);
    (awsSessionService as any).generateCredentials = generateCredentials;
    (awsSessionService as any).sessionLoading = sessionLoading;
    (awsSessionService as any).sessionActivated = sessionActivated;
    (awsSessionService as any).applyCredentials = applyCredentials;
    await awsSessionService.rotate("sessionId");

    expect(sessionLoading).toHaveBeenCalledWith("sessionId");
    expect(sessionActivated).toHaveBeenCalledWith("sessionId");
    expect(generateCredentials).toHaveBeenCalledWith("sessionId");
    expect(applyCredentials).toHaveBeenCalledWith("sessionId", credentialsInfo);
  });

  test("rotate - in credential process mode, rotation is not used", async () => {
    const repository = {
      getWorkspace: jest.fn(() => ({ credentialMethod: constants.credentialProcess })),
    } as any;
    const awsSessionService: any = new (AwsSessionService as any)(null, repository);
    awsSessionService.sessionLoading = jest.fn();
    awsSessionService.applyCredentials = jest.fn();
    awsSessionService.sessionActivated = jest.fn();
    await awsSessionService.rotate("fake-session-id");
    expect(awsSessionService.sessionLoading).not.toHaveBeenCalled();
    expect(awsSessionService.applyCredentials).not.toHaveBeenCalled();
    expect(awsSessionService.sessionActivated).not.toHaveBeenCalled();
  });

  test("rotate - throw and catch error", async () => {
    const repository = {
      getWorkspace: jest.fn(() => ({ credentialMethod: constants.credentialFile })),
    } as any;
    const awsSessionService: any = new (AwsSessionService as any)(null, repository);
    awsSessionService.applyCredentials = () => {};
    awsSessionService.sessionActivated = () => {};
    awsSessionService.sessionLoading = () => {
      throw new Error("Error");
    };
    awsSessionService.sessionError = jest.fn();
    await awsSessionService.rotate("fake-session-id");
    expect(awsSessionService.sessionError).toHaveBeenCalled();
  });

  test("stop - stop an active session", async () => {
    const repository = {
      listIamRoleChained: jest.fn(() => ["session1", "session2"]),
      getSessionById: jest.fn(() => "session1"),
      getSessions: jest.fn(() => []),
      getWorkspace: jest.fn(() => ({ credentialMethod: constants.credentialFile })),
    } as any;
    const sessionNotifier = {} as any;
    const sessionDeactivated = jest.fn((_: string): void => {});
    const deApplyCredentials = jest.fn((_: string): void => {});
    const isInactive = jest.fn(() => false);
    const awsSessionService = new (AwsSessionService as any)(sessionNotifier, repository);
    (awsSessionService as any).deApplyCredentials = deApplyCredentials;
    (awsSessionService as any).sessionDeactivated = sessionDeactivated;
    (awsSessionService as any).isInactive = isInactive;
    await awsSessionService.stop("sessionId");

    expect(sessionDeactivated).toHaveBeenCalledWith("sessionId");
    expect(deApplyCredentials).toHaveBeenCalledWith("sessionId");
    expect(isInactive).toHaveBeenCalledWith("sessionId");
  });

  test("stop - stop an inactive session", async () => {
    const isInactive = jest.fn(() => true);
    const awsSessionService = new (AwsSessionService as any)(null, null);
    (awsSessionService as any).isInactive = isInactive;
    await awsSessionService.stop("sessionId");
    expect(isInactive).toHaveBeenCalledWith("sessionId");
  });

  test("stop - credential process method", async () => {
    const repository = {
      getWorkspace: jest.fn(() => ({ credentialMethod: constants.credentialProcess })),
    } as any;
    const awsSessionService: any = new (AwsSessionService as any)(null, repository);
    awsSessionService.deApplyConfigProfileCommand = jest.fn();
    awsSessionService.sessionDeactivated = jest.fn();
    awsSessionService.isInactive = () => false;
    await awsSessionService.stop("fake-session-id");
    expect(awsSessionService.deApplyConfigProfileCommand).toHaveBeenCalledWith("fake-session-id");
    expect(awsSessionService.sessionDeactivated).toHaveBeenCalledWith("fake-session-id");
  });

  test("stop - throw and catch error", async () => {
    const repository = {
      getWorkspace: jest.fn(() => ({ credentialMethod: constants.credentialFile })),
    } as any;
    const expectedError = new Error("Error");
    const awsSessionService: any = new (AwsSessionService as any)(null, repository);
    awsSessionService.isInactive = () => false;
    awsSessionService.deApplyCredentials = () => {};
    awsSessionService.sessionDeactivated = () => {
      throw expectedError;
    };
    awsSessionService.sessionError = jest.fn();
    await awsSessionService.stop("fake-session-id");
    expect(awsSessionService.sessionError).toHaveBeenCalledWith("fake-session-id", expectedError);
  });

  test("delete - delete an active session", async () => {
    const repository = {
      listIamRoleChained: jest.fn(() => ["session1", "session2"]),
      getSessionById: jest.fn(() => ({ sessionName: "session1", sessionId: "sessionId", status: SessionStatus.active })),
      getSessions: jest.fn(() => []),
      deleteSession: jest.fn(),
    } as any;
    const sessionNotifier = {
      setSessions: jest.fn(),
      deleteSession: jest.fn((_: string) => {}),
    } as any;
    const removeSecrets = jest.fn((_: string): void => {});
    const deApplyCredentials = jest.fn((_: string): void => {});
    const getDependantSessions = jest.fn(() => [{ sessionName: "dependant", sessionId: "1d", status: SessionStatus.active }]);
    const stop = jest.fn((_: string): void => {});
    const awsSessionService = new (AwsSessionService as any)(sessionNotifier, repository);
    (awsSessionService as any).deApplyCredentials = deApplyCredentials;
    (awsSessionService as any).removeSecrets = removeSecrets;
    (awsSessionService as any).getDependantSessions = getDependantSessions;
    (awsSessionService as any).stop = stop;

    await awsSessionService.delete("sessionId");

    expect(repository.deleteSession).toHaveBeenCalledWith("1d");
    expect(repository.deleteSession).toHaveBeenCalledWith("sessionId");
    expect(removeSecrets).toHaveBeenCalledWith("sessionId");
    expect(getDependantSessions).toHaveBeenCalledWith("sessionId");
    expect(stop).toHaveBeenCalledWith("sessionId");
    expect(stop).toHaveBeenCalledWith("1d");
  });

  test("delete - throw and catch error", async () => {
    const expectedError = new Error("Error");
    const repository = {
      getSessionById: () => ({
        status: SessionStatus.inactive,
      }),
      deleteSession: () => {
        throw expectedError;
      },
    } as any;
    const awsSessionService: any = new (AwsSessionService as any)(null, repository);
    awsSessionService.getDependantSessions = () => [];
    awsSessionService.sessionError = jest.fn();
    await awsSessionService.delete("fake-session-id");
    expect(awsSessionService.sessionError).toHaveBeenCalledWith("fake-session-id", expectedError);
  });

  test("delete - no dependante active sessions to be stop", async () => {
    const repository = {
      getSessionById: () => ({
        status: SessionStatus.active,
      }),
      deleteSession: () => {},
    } as any;
    const awsSessionService: any = new (AwsSessionService as any)(null, repository);
    awsSessionService.stop = jest.fn();
    awsSessionService.getDependantSessions = () => [{ sessionId: "fake-id", status: SessionStatus.inactive }];
    awsSessionService.sessionError = jest.fn();
    await awsSessionService.delete("fake-session-id");
    expect(awsSessionService.stop).not.toHaveBeenCalledWith("fake-id");
  });

  test("generateProcessCredentials - success", async () => {
    const repository = {
      getSessionById: jest.fn(() => ({
        type: SessionType.awsIamUser,
        sessionTokenExpiration: "aws_session_token_expiration",
      })),
    };
    const sessionToken = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_access_key_id: "aws_access_key_id",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_secret_access_key: "aws_secret_access_key",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_session_token: "aws_session_token",
    };
    const generateCredentials = jest.fn(() => ({ sessionToken }));

    const awsSessionService = new (AwsSessionService as any)();
    awsSessionService.repository = repository;
    awsSessionService.generateCredentials = generateCredentials;
    awsSessionService.generateCredentialsProxy = generateCredentials;

    const generateProcessCredentials = await awsSessionService.generateProcessCredentials("sessionId");

    expect(repository.getSessionById).toHaveBeenCalledWith("sessionId");
    expect(awsSessionService.generateCredentials).toHaveBeenCalledWith("sessionId");
    expect(generateProcessCredentials).toBeInstanceOf(AwsProcessCredentials);
    expect(generateProcessCredentials.Version).toBe(1);
    expect(generateProcessCredentials.AccessKeyId).toBe("aws_access_key_id");
    expect(generateProcessCredentials.SecretAccessKey).toBe("aws_secret_access_key");
    expect(generateProcessCredentials.SessionToken).toBe("aws_session_token");
    expect(generateProcessCredentials.Expiration).toBe("aws_session_token_expiration");
  });

  test("generateProcessCredentials - error if session is not an AWS one", async () => {
    const repository = {
      getSessionById: jest.fn(() => ({ type: SessionType.azure })),
    };

    const awsSessionService = new (AwsSessionService as any)();
    awsSessionService.repository = repository;

    await expect(awsSessionService.generateProcessCredentials("sessionId")).rejects.toThrow(new Error("only AWS sessions are supported"));
  });

  test("applyConfigProfileCommand - success", async () => {
    const repository = {
      getSessionById: () => ({ profileId: "fake-profile-id", region: "fake-region" }),
      getProfileName: () => "fake",
    } as any;
    const credentialProcess = { ["profile fake"]: { ["credential_process"]: "leapp session generate fake-session-id", region: "fake-region" } };
    const fileService = {
      iniWriteSync: jest.fn(async () => {}),
    } as any;
    const fakeConfigPath = "fake-config-path";
    const awsCoreService = {
      awsConfigPath: () => fakeConfigPath,
    } as any;
    const awsSessionService: any = new (AwsSessionService as any)(null, repository, awsCoreService, fileService);
    await awsSessionService.applyConfigProfileCommand("fake-session-id");
    expect(fileService.iniWriteSync).toHaveBeenCalledWith(fakeConfigPath, credentialProcess);
  });

  test("applyConfigProfileCommand - throw and catch error", async () => {
    const expectedError = new Error("Error");
    const repository = {
      getSessionById: () => ({ profileId: "fake-profile-id" }),
      getProfileName: () => {},
    } as any;
    const fileService = {
      iniWriteSync: () => {
        throw expectedError;
      },
    } as any;
    const awsCoreService = {
      awsConfigPath: () => {},
    } as any;
    const awsSessionService: any = new (AwsSessionService as any)(null, repository, awsCoreService, fileService);
    awsSessionService.sessionError = jest.fn();
    await awsSessionService.applyConfigProfileCommand("fake-session-id");
    expect(awsSessionService.sessionError).toHaveBeenCalledWith("fake-session-id", expectedError);
  });

  test("deApplyConfigProfileCommand - success", async () => {
    const repository = {
      getSessionById: () => ({ profileId: "fake-profile-id" }),
      getProfileName: () => "fake",
    } as any;
    const credentialProcess = { ["profile fake"]: "fake-value" };
    const fileService = {
      iniParseSync: jest.fn(async () => credentialProcess),
      replaceWriteSync: jest.fn(),
    } as any;
    const fakeConfigPath = "fake-config-path";
    const awsCoreService = {
      awsConfigPath: () => fakeConfigPath,
    } as any;
    const awsSessionService: any = new (AwsSessionService as any)(null, repository, awsCoreService, fileService);
    await awsSessionService.deApplyConfigProfileCommand("fake-session-id");
    expect(fileService.iniParseSync).toHaveBeenCalledWith(fakeConfigPath);
    expect(fileService.replaceWriteSync).toHaveBeenCalledWith(fakeConfigPath, credentialProcess);
    expect(credentialProcess["profile fake"]).toBeUndefined();
  });

  test("isThereAnotherPendingSessionWithSameNamedProfile - true if another session with the same name profile is pending", () => {
    const repository = {
      getSessionById: jest.fn(() => ({ sessionId: "session1", type: SessionType.awsIamUser, status: SessionStatus.pending, profileId: "xxx" })),
      listPending: jest.fn(() => [
        { sessionId: "session1", type: SessionType.awsIamUser, status: SessionStatus.pending, profileId: "xxx" },
        { sessionId: "session2", type: SessionType.awsIamUser, status: SessionStatus.pending, profileId: "xxx" },
      ]),
    };

    const awsSessionService = new (AwsSessionService as any)();
    awsSessionService.repository = repository;

    expect((awsSessionService as any).isThereAnotherPendingSessionWithSameNamedProfile("session1")).toBe(true);
  });

  test("isThereAnotherPendingSessionWithSameNamedProfile - false if another session with different name profile is pending", () => {
    const repository = {
      getSessionById: jest.fn(() => ({ sessionId: "session1", type: SessionType.awsIamUser, status: SessionStatus.pending, profileId: "xxx" })),
      listPending: jest.fn(() => [
        { sessionId: "session1", type: SessionType.awsIamUser, status: SessionStatus.pending, profileId: "xxx" },
        { sessionId: "session2", type: SessionType.awsIamUser, status: SessionStatus.pending, profileId: "111" },
      ]),
    };

    const awsSessionService = new (AwsSessionService as any)();
    awsSessionService.repository = repository;

    expect((awsSessionService as any).isThereAnotherPendingSessionWithSameNamedProfile("session1")).toBe(false);
  });

  test("stopAllWithSameNameProfile - stop active sessions with the same name profile", async () => {
    const sessionToCheck = { sessionId: "session2", type: SessionType.awsIamUser, status: SessionStatus.active, profileId: "xxx" };
    const repository = {
      getSessionById: jest.fn(() => ({ sessionId: "session1", type: SessionType.awsIamUser, status: SessionStatus.pending, profileId: "xxx" })),
      listActive: jest.fn(() => [sessionToCheck]),
    };
    const stop = jest.fn((_: string): void => {
      sessionToCheck.status = SessionStatus.inactive;
    });
    const awsSessionService = new (AwsSessionService as any)();
    awsSessionService.repository = repository;
    (awsSessionService as any).stop = stop;
    await (awsSessionService as any).stopAllWithSameNameProfile("session1");

    expect(stop).toHaveBeenCalledWith("session2");
    expect(sessionToCheck.status).toBe(SessionStatus.inactive);
  });
});

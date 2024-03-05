import { describe, expect, jest, test } from "@jest/globals";
import * as uuid from "uuid";
import { CredentialsInfo } from "../../../models/credentials-info";
import { SessionStatus } from "../../../models/session-status";
import { SessionType } from "../../../models/session-type";
import { LocalstackSessionRequest } from "./localstack-session-request";
import { LocalstackSessionService } from "./localstack-session-service";
import { LoggedException, LogLevel } from "../../log-service";
import { constants } from "../../../models/constants";
import { LocalstackSession } from "../../../models/localstack/localstack-session";

jest.mock("uuid");
jest.mock("console");

describe("LocalstackSessionService", () => {
  const mockedProfileId = "mocked-profile-id";
  const mockedSessionId = "mocked-id";
  const mockedSessionName = "mocked-name";
  const mockedRegion = "mocked-region";
  const localstackSession: any = {
    sessionId: mockedSessionId,
    status: SessionStatus.inactive,
    startDateTime: undefined,
    type: SessionType.localstack,
    sessionTokenExpiration: null,
    profileId: mockedProfileId,
    sessionName: mockedSessionName,
    region: mockedRegion,
  };

  test("create - sessionId undefined", async () => {
    const repository = {
      getSessions: () => "sessions",
      addSession: jest.fn((session: LocalstackSessionRequest) => {
        expect(session.sessionId).toBe("test-uuid");
        expect(session.sessionName).toBe("test-session-name");
        expect(session.profileId).toBe("test-profile-id");
        expect(session.region).toBe("test-region");
      }),
    };
    const sessionNotifier = {
      setSessions: jest.fn(),
    };

    jest.spyOn(uuid, "v4").mockImplementation(() => "test-uuid");
    const service = new LocalstackSessionService(sessionNotifier as any, repository as any, null, null);
    await service.create({
      sessionName: "test-session-name",
      region: "test-region",
      profileId: "test-profile-id",
    });
    expect(repository.addSession).toHaveBeenCalled();
    expect(sessionNotifier.setSessions).toHaveBeenCalledWith("sessions");
  });

  test("create - sessionId not undefined", async () => {
    const repository = {
      getSessions: () => "sessions",
      addSession: jest.fn((session: LocalstackSessionRequest) => {
        expect(session.sessionId).toBe("mocked-session-id");
        expect(session.sessionName).toBe("test-session-name");
        expect(session.profileId).toBe("test-profile-id");
        expect(session.region).toBe("test-region");
      }),
    };
    const sessionNotifier = {
      setSessions: jest.fn(),
    };

    jest.spyOn(uuid, "v4").mockImplementation(() => "test-uuid");
    const service = new LocalstackSessionService(sessionNotifier as any, repository as any, null, null);
    await service.create({
      sessionName: "test-session-name",
      region: "test-region",
      profileId: "test-profile-id",
      sessionId: "mocked-session-id",
    });
    expect(repository.addSession).toHaveBeenCalledWith(
      Object.assign(new LocalstackSession("test-session-name", "test-region", "test-profile-id"), { sessionId: "mocked-session-id" })
    );
    expect(sessionNotifier.setSessions).toHaveBeenCalledWith("sessions");
  });

  describe("update", () => {
    describe("repository.getSessionById", () => {
      test("has been called once with the expected parameter", async () => {
        const repository: any = {
          getSessionById: jest.fn((_sessionId) => undefined),
        };
        const service = new LocalstackSessionService(null, repository as any, null, null);
        const localstackSessionRequest: any = {
          region: "mocked-region",
          profileId: "mocked-profile-id",
        };
        await service.update(mockedSessionId, localstackSessionRequest);
        expect(repository.getSessionById).toHaveBeenCalledWith(mockedSessionId);
      });
    });

    describe("repository.updateSession", () => {
      test("has been called once with the expected parameters", async () => {
        const repository: any = {
          getSessionById: (_sessionId) => localstackSession,
          updateSession: jest.fn((_sessionId, _session) => {}),
        };
        const service = new LocalstackSessionService(null, repository as any, null, null);
        const localstackSessionRequest: any = {
          sessionName: "updated-mocked-session-name",
          region: "updated-mocked-region",
          profileId: "updated-mocked-profile-id",
        };

        await service.update(mockedSessionId, localstackSessionRequest);
        expect(repository.updateSession).toHaveBeenCalledWith(mockedSessionId, localstackSession);
      });
    });

    describe("sessionNotifier.setSessions", () => {
      test("has been called once with repository.getSessions result", async () => {
        const repository: any = {
          getSessionById: (_sessionId) => localstackSession,
          updateSession: (_sessionId, _session) => {},
          getSessions: () => [localstackSession],
        };
        const sessionNotifier: any = {
          setSessions: jest.fn((_sessions) => {}),
        };
        const service = new LocalstackSessionService(sessionNotifier, repository as any, null, null);
        const localstackSessionRequest: any = {
          sessionName: "updated-mocked-session-name",
          region: "updated-mocked-region",
          profileId: "updated-mocked-profile-id",
        };

        await service.update(mockedSessionId, localstackSessionRequest);
        expect(sessionNotifier.setSessions).toHaveBeenCalledWith(repository.getSessions());
      });
    });
  });

  test("applyCredentials", () => {
    const mockedProfileName = "mocked-profile-name";
    const mockedAccessKeyId = "test";
    const mockedSecretAccessKey = "test";
    const mockedSessionToken: any = {
      sessionToken: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: mockedAccessKeyId,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: mockedSecretAccessKey,
      },
    };
    const mockedCredentialObject = {};
    mockedCredentialObject[mockedProfileName] = {
      // eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/naming-convention
      aws_access_key_id: mockedSessionToken.sessionToken.aws_access_key_id,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_secret_access_key: mockedSessionToken.sessionToken.aws_secret_access_key,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_session_token: mockedSessionToken.sessionToken.aws_session_token,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      endpoint_url: undefined,
      region: localstackSession.region,
    };

    const repository: any = {
      getSessionById: jest.fn((_sessionId) => localstackSession),
      getProfileName: jest.fn((_session) => mockedProfileName),
    };
    const fileService: any = {
      iniWriteSync: jest.fn((_filePath, _content) => {}),
    };
    const awsCoreService: any = {
      awsCredentialPath: jest.fn(() => "mocked-aws-credentials-path"),
    };

    const service = new LocalstackSessionService(null, repository as any, awsCoreService, fileService);
    service.applyCredentials(localstackSession.sessionId, mockedSessionToken);

    expect(repository.getSessionById).toHaveBeenCalledWith(localstackSession.sessionId);
    expect(repository.getProfileName).toHaveBeenCalledWith(localstackSession.profileId);
    expect(fileService.iniWriteSync).toHaveBeenCalledWith(awsCoreService.awsCredentialPath(), mockedCredentialObject);
  });

  test("generateProcessCredentials", async () => {
    const service = new LocalstackSessionService(null, null, null, null);
    await expect(service.generateProcessCredentials(undefined)).rejects.toThrow(
      new Error("Localstack only support Credential file method, please switch back to it in the option panel.")
    );
  });

  test("deApplyCredentials", async () => {
    const mockedProfileName = "mocked-profile-name";
    const initialMockedCredentialsFile = {};
    const finalMockedCredentialsFile = {};
    initialMockedCredentialsFile[mockedProfileName] = {};

    const repository: any = {
      getSessions: jest.fn((_sessionId) => [localstackSession]),
      getProfileName: jest.fn((_session) => mockedProfileName),
    };
    const fileService: any = {
      iniParseSync: jest.fn((_filePath) => initialMockedCredentialsFile),
      replaceWriteSync: jest.fn((_filePath, _content) => {}),
    };
    const awsCoreService: any = {
      awsCredentialPath: jest.fn(() => "mocked-aws-credentials-path"),
    };

    const service = new LocalstackSessionService(null, repository as any, awsCoreService, fileService);
    await service.deApplyCredentials(localstackSession.sessionId);

    expect(repository.getSessions).toHaveBeenCalledTimes(1);
    expect(repository.getProfileName).toHaveBeenCalledWith(localstackSession.profileId);
    expect(fileService.iniParseSync).toHaveBeenCalledWith(awsCoreService.awsCredentialPath());
    expect(fileService.replaceWriteSync).toHaveBeenCalledWith(awsCoreService.awsCredentialPath(), finalMockedCredentialsFile);
  });

  test("getCloneRequest", async () => {
    const service = new LocalstackSessionService(null, null, null, null);
    const result = await service.getCloneRequest("fake-session" as any);
    expect(result).toBeUndefined();
  });

  test("getDependantSessions", async () => {
    const service = new LocalstackSessionService(null, null, null, null);
    const result = service.getDependantSessions("fake-session");
    expect(result).toEqual([]);
  });

  test("validateCredentials", async () => {
    const service = new LocalstackSessionService(null, null, null, null);
    const result = await service.validateCredentials("fake-session" as any);
    expect(result).toBeFalsy();
  });

  test("generateCredentials", async () => {
    const mockedCredentials: CredentialsInfo = {
      sessionToken: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: "test",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: "test",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        endpoint_url: "http://localhost:4566",
      },
    };
    const service = new LocalstackSessionService(null, null, null, null);
    const result = await service.generateCredentials();
    expect(result).toStrictEqual(mockedCredentials);
  });

  test("validateCredentials", async () => {
    const service = new LocalstackSessionService(null, null, null, null);
    const result = await service.validateCredentials("fake-session" as any);
    expect(result).toBeFalsy();
  });

  test("isThereAnotherPendingSessionWithSameNamedProfile - true if another session with the same name profile is pending", () => {
    const repository = {
      getSessionById: jest.fn(() => ({ sessionId: "session1", type: SessionType.localstack, status: SessionStatus.pending, profileId: "xxx" })),
      listPending: jest.fn(() => [
        { sessionId: "session1", type: SessionType.localstack, status: SessionStatus.pending, profileId: "xxx" },
        { sessionId: "session2", type: SessionType.localstack, status: SessionStatus.pending, profileId: "xxx" },
      ]),
    };

    const localstackSessionService = new (LocalstackSessionService as any)();
    localstackSessionService.repository = repository;

    expect((localstackSessionService as any).isThereAnotherPendingSessionWithSameNamedProfile("session1")).toBe(true);
  });

  test("isThereAnotherPendingSessionWithSameNamedProfile - false if another session with different name profile is pending", () => {
    const repository = {
      getSessionById: jest.fn(() => ({ sessionId: "session1", type: SessionType.localstack, status: SessionStatus.pending, profileId: "xxx" })),
      listPending: jest.fn(() => [
        { sessionId: "session1", type: SessionType.localstack, status: SessionStatus.pending, profileId: "xxx" },
        { sessionId: "session2", type: SessionType.localstack, status: SessionStatus.pending, profileId: "111" },
      ]),
    };

    const localstackSessionService = new (LocalstackSessionService as any)();
    localstackSessionService.repository = repository;

    expect((localstackSessionService as any).isThereAnotherPendingSessionWithSameNamedProfile("session1")).toBe(false);
  });

  test("stopAllWithSameNameProfile - stop active sessions with the same name profile", async () => {
    const sessionToCheck = { sessionId: "session2", type: SessionType.localstack, status: SessionStatus.active, profileId: "xxx" };
    const repository = {
      getSessionById: jest.fn(() => ({ sessionId: "session1", type: SessionType.localstack, status: SessionStatus.pending, profileId: "xxx" })),
      listActive: jest.fn(() => [sessionToCheck]),
    };
    const stop = jest.fn((_: string): void => {
      sessionToCheck.status = SessionStatus.inactive;
    });
    const localstackSessionService = new (LocalstackSessionService as any)();
    localstackSessionService.repository = repository;
    (localstackSessionService as any).stop = stop;
    await (localstackSessionService as any).stopAllWithSameNameProfile("session1");

    expect(stop).toHaveBeenCalledWith("session2");
    expect(sessionToCheck.status).toBe(SessionStatus.inactive);
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
    const localstackSessionService: any = new (LocalstackSessionService as any)(null, repository, awsCoreService, fileService);
    await localstackSessionService.deApplyConfigProfileCommand("fake-session-id");
    expect(fileService.iniParseSync).toHaveBeenCalledWith(fakeConfigPath);
    expect(fileService.replaceWriteSync).toHaveBeenCalledWith(fakeConfigPath, credentialProcess);
    expect(credentialProcess["profile fake"]).toBeUndefined();
  });

  test("start - credentials process not supported", async () => {
    const repository = {
      getWorkspace: () => ({ credentialMethod: constants.credentialProcess }),
    } as any;
    const localstackSessionService = new (LocalstackSessionService as any)(null, repository);
    (localstackSessionService as any).isThereAnotherPendingSessionWithSameNamedProfile = () => false;
    (localstackSessionService as any).stopAllWithSameNameProfile = async () => {};
    (localstackSessionService as any).sessionLoading = () => {};
    (localstackSessionService as any).generateProcessCredentials = jest.fn(() => {});
    (localstackSessionService as any).sessionActivated = () => {};

    await localstackSessionService.start("mocked-session-id");
    expect(localstackSessionService.generateProcessCredentials).toHaveBeenCalled();
  });

  test("start - fails if another session is in pending with the same name profile", async () => {
    const repository = {
      listIamRoleChained: jest.fn(() => ["session1", "session2"]),
      getSessionById: jest.fn(() => "session1"),
      getSessions: jest.fn(() => []),
    } as any;
    const sessionNotifier = {} as any;
    const isThereAnotherPendingSessionWithSameNameProfile = jest.fn((_: string) => true);

    const localstackSessionService = new (LocalstackSessionService as any)(sessionNotifier, repository);
    (localstackSessionService as any).isThereAnotherPendingSessionWithSameNamedProfile = isThereAnotherPendingSessionWithSameNameProfile;
    await expect(localstackSessionService.start("sessionId")).rejects.toThrow(
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
    const localstackSessionService = new (LocalstackSessionService as any)(sessionNotifier, repository);
    (localstackSessionService as any).isThereAnotherPendingSessionWithSameNamedProfile = isThereAnotherPendingSessionWithSameNameProfile;
    (localstackSessionService as any).stopAllWithSameNameProfile = stopAllWithSameNameProfile;
    (localstackSessionService as any).sessionError = sessionError;

    await localstackSessionService.start("sessionId");
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
    const localstackSessionService = new (LocalstackSessionService as any)(sessionNotifier, repository);
    (localstackSessionService as any).isThereAnotherPendingSessionWithSameNamedProfile = isThereAnotherPendingSessionWithSameNameProfile;
    (localstackSessionService as any).stopAllWithSameNameProfile = stopAllWithSameNameProfile;
    (localstackSessionService as any).generateCredentials = generateCredentials;
    (localstackSessionService as any).sessionLoading = sessionLoading;
    (localstackSessionService as any).sessionActivated = sessionActivated;
    (localstackSessionService as any).applyCredentials = applyCredentials;
    await localstackSessionService.start("sessionId");

    expect(isThereAnotherPendingSessionWithSameNameProfile).toHaveBeenCalledWith("sessionId");
    expect(stopAllWithSameNameProfile).toHaveBeenCalledWith("sessionId");
    expect(sessionLoading).toHaveBeenCalledWith("sessionId");
    expect(sessionActivated).toHaveBeenCalledWith("sessionId");
    expect(generateCredentials).toHaveBeenCalled();
    expect(applyCredentials).toHaveBeenCalledWith("sessionId", credentialsInfo);
  });

  test("rotate", async () => {
    const sessionId = "mocked-session-id";
    const log = jest.spyOn(console, "log").mockImplementation(() => {});

    const service = new LocalstackSessionService(null, null, null, null);
    await service.rotate(sessionId);
    expect(log).toHaveBeenCalledWith(`localstack session ${sessionId} opened not need to refresh`);
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
    const localstackSessionService = new (LocalstackSessionService as any)(sessionNotifier, repository);
    (localstackSessionService as any).deApplyCredentials = deApplyCredentials;
    (localstackSessionService as any).sessionDeactivated = sessionDeactivated;
    (localstackSessionService as any).isInactive = isInactive;
    await localstackSessionService.stop("sessionId");

    expect(sessionDeactivated).toHaveBeenCalledWith("sessionId");
    expect(deApplyCredentials).toHaveBeenCalledWith("sessionId");
    expect(isInactive).toHaveBeenCalledWith("sessionId");
  });

  test("stop - stop an inactive session", async () => {
    const isInactive = jest.fn(() => true);
    const localstackSessionService = new (LocalstackSessionService as any)(null, null);
    (localstackSessionService as any).isInactive = isInactive;
    await localstackSessionService.stop("sessionId");
    expect(isInactive).toHaveBeenCalledWith("sessionId");
  });

  test("stop - credential process method", async () => {
    const repository = {
      getWorkspace: jest.fn(() => ({ credentialMethod: constants.credentialProcess })),
    } as any;
    const localstackSessionService: any = new (LocalstackSessionService as any)(null, repository);
    localstackSessionService.deApplyConfigProfileCommand = jest.fn();
    localstackSessionService.sessionDeactivated = jest.fn();
    localstackSessionService.isInactive = () => false;
    await localstackSessionService.stop("fake-session-id");
    expect(localstackSessionService.deApplyConfigProfileCommand).toHaveBeenCalledWith("fake-session-id");
    expect(localstackSessionService.sessionDeactivated).toHaveBeenCalledWith("fake-session-id");
  });

  test("stop - throw and catch error", async () => {
    const repository = {
      getWorkspace: jest.fn(() => ({ credentialMethod: constants.credentialFile })),
    } as any;
    const expectedError = new Error("Error");
    const localstackSessionService: any = new (LocalstackSessionService as any)(null, repository);
    localstackSessionService.isInactive = () => false;
    localstackSessionService.deApplyCredentials = () => {};
    localstackSessionService.sessionDeactivated = () => {
      throw expectedError;
    };
    localstackSessionService.sessionError = jest.fn();
    await localstackSessionService.stop("fake-session-id");
    expect(localstackSessionService.sessionError).toHaveBeenCalledWith("fake-session-id", expectedError);
  });

  test("delete - delete an active session", async () => {
    const repository = {
      listIamRoleChained: jest.fn(() => ["session1", "session2"]),
      getSessionById: jest.fn(() => ({ sessionName: "session1", sessionId: "sessionId", status: SessionStatus.active })),
      getSessions: jest.fn(() => "sessions"),
      deleteSession: jest.fn(),
    } as any;
    const sessionNotifier = {
      setSessions: jest.fn(),
      deleteSession: jest.fn((_: string) => {}),
    } as any;
    const removeSecrets = jest.fn((_: string): void => {});
    const stop = jest.fn((_: string): void => {});
    const localstackSessionService = new (LocalstackSessionService as any)(sessionNotifier, repository);
    (localstackSessionService as any).removeSecrets = removeSecrets;
    (localstackSessionService as any).stop = stop;

    await localstackSessionService.delete("sessionId");

    expect(repository.getSessionById).toHaveBeenCalledWith("sessionId");
    expect(repository.deleteSession).toHaveBeenCalledWith("sessionId");
    expect(stop).toHaveBeenCalledWith("sessionId");
    expect(repository.getSessions).toHaveBeenCalled();
    expect(sessionNotifier.setSessions).toHaveBeenCalledWith("sessions");
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
    const localstackSessionService: any = new (LocalstackSessionService as any)(null, repository);
    localstackSessionService.sessionError = jest.fn();
    await localstackSessionService.delete("fake-session-id");
    expect(localstackSessionService.sessionError).toHaveBeenCalledWith("fake-session-id", expectedError);
  });
});

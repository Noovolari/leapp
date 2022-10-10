import { beforeAll, beforeEach, describe, expect, jest, test } from "@jest/globals";
import * as AWS from "aws-sdk";
import * as uuid from "uuid";
import { AwsIamUserSession } from "../../../models/aws/aws-iam-user-session";
import { constants } from "../../../models/constants";
import { CredentialsInfo } from "../../../models/credentials-info";
import { SessionStatus } from "../../../models/session-status";
import { SessionType } from "../../../models/session-type";
import { LoggedException, LogLevel } from "../../log-service";
import { AwsIamUserService } from "./aws-iam-user-service";

jest.mock("uuid");
jest.mock("console");
jest.mock("aws-sdk");

describe("AwsIamUserService", () => {
  const mockedDateString = "2022-02-24T10:00:00";
  const mockedProfileId = "mocked-profile-id";
  const mockedSessionId = "mocked-id";
  const mockedSessionName = "mocked-name";
  const mockedRegion = "mocked-region";
  const awsIamUserSession: any = {
    sessionId: mockedSessionId,
    status: SessionStatus.inactive,
    startDateTime: undefined,
    type: SessionType.awsIamUser,
    sessionTokenExpiration: new Date(mockedDateString).toISOString(),
    profileId: mockedProfileId,
    sessionName: mockedSessionName,
    region: mockedRegion,
  };

  test("isTokenExpired, returns true if current time is greater than the token expiration time", () => {
    const tokenExpiration = new Date(1999, 1, 1, 0, 0, 0, 0).toISOString();
    const result = AwsIamUserService.isTokenExpired(tokenExpiration);
    expect(result).toBeTruthy();
  });

  test("isTokenExpired, returns false if current time is less than the token expiration time", () => {
    const tokenExpiration = new Date(3000, 1, 1, 0, 0, 0, 0).toISOString();
    const result = AwsIamUserService.isTokenExpired(tokenExpiration);
    expect(result).toBeFalsy();
  });

  test("sessionTokenFromGetSessionTokenResponse, throws an exception if getSessionTokenResponse does not contain a Credentials key", () => {
    const getSessionTokenResponse = {};
    const t = () => {
      AwsIamUserService.sessionTokenFromGetSessionTokenResponse(getSessionTokenResponse);
    };
    expect(t).toThrow(new LoggedException("an error occurred during session token generation.", this, LogLevel.warn));
  });

  test("sessionTokenFromGetSessionTokenResponse, returns the expected session token if getSessionTokenResponse is a properly formatted Credentials object", () => {
    const getSessionTokenResponse = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Credentials: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        AccessKeyId: " access-key-id ",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        SecretAccessKey: " secret-access-key ",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        SessionToken: " session-token ",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Expiration: new Date(),
      },
    };
    const result = AwsIamUserService.sessionTokenFromGetSessionTokenResponse(getSessionTokenResponse);
    expect(result).toHaveProperty("sessionToken");
    expect(result["sessionToken"]).toHaveProperty("aws_access_key_id", "access-key-id");
    expect(result["sessionToken"]).toHaveProperty("aws_secret_access_key", "secret-access-key");
    expect(result["sessionToken"]).toHaveProperty("aws_session_token", "session-token");
  });

  test("create", async () => {
    const keychainService = { saveSecret: jest.fn(async () => {}) };
    const repository = {
      getSessions: () => "sessions",
      addSession: jest.fn((session: AwsIamUserSession) => {
        expect(session.sessionId).toBe("test-uuid");
        expect(session.sessionName).toBe("test-session-name");
        expect(session.profileId).toBe("test-profile-id");
        expect(session.mfaDevice).toBe("test-mfa-device");
        expect(session.region).toBe("test-region");
        expect(session.type).toBe(SessionType.awsIamUser);
      }),
    };
    const sessionNotifier = {
      setSessions: jest.fn(),
    };

    jest.spyOn(uuid, "v4").mockImplementation(() => "test-uuid");
    const service = new AwsIamUserService(sessionNotifier as any, repository as any, null, null, keychainService as any, null, null);
    await service.create({
      sessionName: "test-session-name",
      accessKey: "test-access-key",
      secretKey: "test-secret-key",
      region: "test-region",
      profileId: "test-profile-id",
      mfaDevice: "test-mfa-device",
    });
    expect(keychainService.saveSecret).toHaveBeenNthCalledWith(
      1,
      constants.appName,
      "test-uuid-iam-user-aws-session-access-key-id",
      "test-access-key"
    );
    expect(keychainService.saveSecret).toHaveBeenNthCalledWith(
      2,
      constants.appName,
      "test-uuid-iam-user-aws-session-secret-access-key",
      "test-secret-key"
    );
    expect(repository.addSession).toHaveBeenCalled();
    expect(sessionNotifier.setSessions).toHaveBeenCalledWith("sessions");
  });

  describe("update", () => {
    describe("repository.getSessionById", () => {
      test("has been called once with the expected parameter", async () => {
        const repository: any = {
          getSessionById: jest.fn((_sessionId) => undefined),
        };
        const service = new AwsIamUserService(null, repository as any, null, null, null, null, null);
        const awsIamUserSessionRequest: any = {
          accessKey: "mocked-access-key",
          secretKey: "mocked-secret-key",
          region: "mocked-region",
          profileId: "mocked-profile-id",
        };
        await service.update(mockedSessionId, awsIamUserSessionRequest);
        expect(repository.getSessionById).toHaveBeenCalledWith(mockedSessionId);
      });
    });

    describe("keychainService.saveSecret", () => {
      describe("if accessKey is provided in the awsIamUserSessionRequest", () => {
        test("is called once with the expected parameters", async () => {
          const repository: any = {
            getSessionById: (_sessionId) => awsIamUserSession,
            updateSession: (_sessionId, _session) => {},
          };
          const keychainService: any = {
            saveSecret: jest.fn((_service, _account, _password) => {}),
          };
          const service = new AwsIamUserService(null, repository as any, null, null, keychainService, null, null);
          const awsIamUserSessionRequest: any = {
            sessionName: "updated-mocked-session-name",
            accessKey: "mocked-access-key",
            region: "updated-mocked-region",
            profileId: "updated-mocked-profile-id",
          };
          await service.update(mockedSessionId, awsIamUserSessionRequest);
          expect(keychainService.saveSecret).toHaveBeenCalledWith(
            constants.appName,
            `${mockedSessionId}-iam-user-aws-session-access-key-id`,
            awsIamUserSessionRequest.accessKey
          );
        });
      });

      describe("if secretKey is provided in the awsIamUserSessionRequest", () => {
        test("is called once with the expected parameters", async () => {
          const repository: any = {
            getSessionById: (_sessionId) => awsIamUserSession,
            updateSession: (_sessionId, _session) => {},
          };
          const keychainService: any = {
            saveSecret: jest.fn((_service, _account, _password) => {}),
          };
          const service = new AwsIamUserService(null, repository as any, null, null, keychainService, null, null);
          const awsIamUserSessionRequest: any = {
            sessionName: "updated-mocked-session-name",
            secretKey: "mocked-secret-key",
            region: "updated-mocked-region",
            profileId: "updated-mocked-profile-id",
          };
          await service.update(mockedSessionId, awsIamUserSessionRequest);
          expect(keychainService.saveSecret).toHaveBeenCalledWith(
            constants.appName,
            `${mockedSessionId}-iam-user-aws-session-secret-access-key`,
            awsIamUserSessionRequest.secretKey
          );
        });
      });
    });

    describe("repository.updateSession", () => {
      test("has been called once with the expected parameters", async () => {
        const repository: any = {
          getSessionById: (_sessionId) => awsIamUserSession,
          updateSession: jest.fn((_sessionId, _session) => {}),
        };
        const keychainService: any = {
          saveSecret: (_service, _account, _password) => {},
        };
        const service = new AwsIamUserService(null, repository as any, null, null, keychainService, null, null);
        const awsIamUserSessionRequest: any = {
          sessionName: "updated-mocked-session-name",
          secretKey: "mocked-secret-key",
          region: "updated-mocked-region",
          profileId: "updated-mocked-profile-id",
        };

        await service.update(mockedSessionId, awsIamUserSessionRequest);
        expect(repository.updateSession).toHaveBeenCalledWith(mockedSessionId, awsIamUserSession);
      });
    });

    describe("sessionNotifier.setSessions", () => {
      test("has been called once with repository.getSessions result", async () => {
        const repository: any = {
          getSessionById: (_sessionId) => awsIamUserSession,
          updateSession: (_sessionId, _session) => {},
          getSessions: () => [awsIamUserSession],
        };
        const keychainService: any = {
          saveSecret: (_service, _account, _password) => {},
        };
        const sessionNotifier: any = {
          setSessions: jest.fn((_sessions) => {}),
        };
        const service = new AwsIamUserService(sessionNotifier, repository as any, null, null, keychainService, null, null);
        const awsIamUserSessionRequest: any = {
          sessionName: "updated-mocked-session-name",
          secretKey: "mocked-secret-key",
          region: "updated-mocked-region",
          profileId: "updated-mocked-profile-id",
        };

        await service.update(mockedSessionId, awsIamUserSessionRequest);
        expect(sessionNotifier.setSessions).toHaveBeenCalledWith(repository.getSessions());
      });
    });
  });

  test("applyCredentials", () => {
    const mockedProfileName = "mocked-profile-name";
    const mockedAccessKeyId = "mocked-access-key-id";
    const mockedSecretAccessKey = "mocked-secret-access-key";
    const mockedAwsSessionToken = "mocked-session-token";
    const mockedSessionToken: any = {
      sessionToken: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: mockedAccessKeyId,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: mockedSecretAccessKey,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_session_token: mockedAwsSessionToken,
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
      region: awsIamUserSession.region,
    };

    const repository: any = {
      getSessionById: jest.fn((_sessionId) => awsIamUserSession),
      getProfileName: jest.fn((_session) => mockedProfileName),
    };
    const fileService: any = {
      iniWriteSync: jest.fn((_filePath, _content) => {}),
    };
    const awsCoreService: any = {
      awsCredentialPath: jest.fn(() => "mocked-aws-credentials-path"),
    };

    const service = new AwsIamUserService(null, repository as any, null, null, null, fileService, awsCoreService);
    service.applyCredentials(awsIamUserSession.sessionId, mockedSessionToken);

    expect(repository.getSessionById).toHaveBeenCalledWith(awsIamUserSession.sessionId);
    expect(repository.getProfileName).toHaveBeenCalledWith(awsIamUserSession.profileId);
    expect(fileService.iniWriteSync).toHaveBeenCalledWith(awsCoreService.awsCredentialPath(), mockedCredentialObject);
  });

  test("deApplyCredentials", async () => {
    const mockedProfileName = "mocked-profile-name";
    const initialMockedCredentialsFile = {};
    const finalMockedCredentialsFile = {};
    initialMockedCredentialsFile[mockedProfileName] = {};

    const repository: any = {
      getSessions: jest.fn((_sessionId) => [awsIamUserSession]),
      getProfileName: jest.fn((_session) => mockedProfileName),
    };
    const fileService: any = {
      iniParseSync: jest.fn((_filePath) => initialMockedCredentialsFile),
      replaceWriteSync: jest.fn((_filePath, _content) => {}),
    };
    const awsCoreService: any = {
      awsCredentialPath: jest.fn(() => "mocked-aws-credentials-path"),
    };

    const service = new AwsIamUserService(null, repository as any, null, null, null, fileService, awsCoreService);
    await service.deApplyCredentials(awsIamUserSession.sessionId);

    expect(repository.getSessions).toHaveBeenCalledTimes(1);
    expect(repository.getProfileName).toHaveBeenCalledWith(awsIamUserSession.profileId);
    expect(fileService.iniParseSync).toHaveBeenCalledWith(awsCoreService.awsCredentialPath());
    expect(fileService.replaceWriteSync).toHaveBeenCalledWith(awsCoreService.awsCredentialPath(), finalMockedCredentialsFile);
  });

  describe("generateCredentialsProxy", () => {
    describe("if generateCredentials resolves", () => {
      test("that generateCredentialsProxy resolves mockedCredentialsInfo", async () => {
        const mockedAccessKeyId = "mocked-access-key-id";
        const mockedSecretAccessKey = "mocked-secret-access-key";
        const mockedAwsSessionToken = "mocked-session-token";
        const mockedCredentialsInfo: any = {
          sessionToken: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            aws_access_key_id: mockedAccessKeyId,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            aws_secret_access_key: mockedSecretAccessKey,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            aws_session_token: mockedAwsSessionToken,
          },
        };

        const localMfaCodePrompter: any = {};

        const service = new AwsIamUserService(null, null, localMfaCodePrompter, null, null, null, null);
        (service as any).generateCredentials = (_sessionId) =>
          new Promise<CredentialsInfo>((resolve, _reject) => {
            resolve(mockedCredentialsInfo);
          });

        await expect(service.generateCredentialsProxy(mockedSessionId)).resolves.toBe(mockedCredentialsInfo);
        expect((service as any).mfaCodePrompterProxy).toEqual(localMfaCodePrompter);
      });
    });

    describe("if generateCredentials rejects", () => {
      test("that generateCredentialsProxy resolves mockedCredentialsInfo", async () => {
        const mockedError = new Error("mocked-error");
        const localMfaCodePrompter: any = {};

        const service = new AwsIamUserService(null, null, localMfaCodePrompter, null, null, null, null);
        (service as any).generateCredentials = (_sessionId) =>
          new Promise<CredentialsInfo>((_resolve, reject) => {
            reject(mockedError);
          });

        await expect(service.generateCredentialsProxy(mockedSessionId)).rejects.toThrow(mockedError);
        expect((service as any).mfaCodePrompterProxy).toEqual(localMfaCodePrompter);
      });
    });
  });

  describe("generateCredentials", () => {
    describe("if session was not found", () => {
      test("it throws a LoggedException", async () => {
        const repository: any = {
          getSessions: jest.fn((_sessionId) => [awsIamUserSession]),
        };
        const keychainService: any = {
          getSecret: jest.fn((_service, _account) => "mocked-secret"),
        };

        const service = new AwsIamUserService(null, repository, null, null, keychainService, null, null);
        await expect(service.generateCredentials("another-mocked-session-id")).rejects.toThrow(
          new LoggedException(`session with id another-mocked-session-id not found.`, service, LogLevel.warn)
        );
      });
    });

    describe("if session.sessionTokenExpiration is not expired", () => {
      test("it invokes JSON.parse with the sessionToken retrieved by keychainService.getSecret", async () => {
        const mockedObject = {};
        const mockedSecret = "mocked-secret";

        awsIamUserSession.sessionTokenExpiration = new Date(3000, 1, 1, 0, 0, 0, 0).toISOString();

        const repository: any = {
          getSessions: jest.fn((_sessionId) => [awsIamUserSession]),
        };
        const keychainService: any = {
          getSecret: jest.fn((_service, _account) => mockedSecret),
        };

        JSON.parse = jest.fn().mockImplementationOnce((_text) => mockedObject);

        const service = new AwsIamUserService(null, repository, null, null, keychainService, null, null);
        const credentials = await service.generateCredentials(mockedSessionId);

        expect(JSON.parse).toHaveBeenCalledWith(mockedSecret);
        expect(credentials).toBe(mockedObject);
      });

      describe("if JSON.parse throws an Error", () => {
        test("it throws a new LoggedException", async () => {
          const mockedSecret = "mocked-secret";
          const mockedErrorMessage = "invalid JSON format";

          awsIamUserSession.sessionTokenExpiration = new Date(3000, 1, 1, 0, 0, 0, 0).toISOString();

          const repository: any = {
            getSessions: jest.fn((_sessionId) => [awsIamUserSession]),
          };
          const keychainService: any = {
            getSecret: jest.fn((_service, _account) => mockedSecret),
          };

          JSON.parse = jest.fn().mockImplementationOnce((_text) => {
            throw new Error(mockedErrorMessage);
          });

          const service = new AwsIamUserService(null, repository, null, null, keychainService, null, null);
          await expect(service.generateCredentials(mockedSessionId)).rejects.toThrow(new LoggedException(mockedErrorMessage, service, LogLevel.warn));
        });
      });
    });

    describe("if session.sessionTokenExpiration is expired", () => {
      let repository: any;
      let awsCoreService: any;
      let service: AwsIamUserService;
      const mockedSTSInstance = {};

      beforeAll(() => {
        awsIamUserSession.sessionTokenExpiration = new Date(1999, 1, 1, 0, 0, 0, 0).toISOString();
        repository = {
          getSessions: jest.fn((_sessionId) => [awsIamUserSession]),
        };
        awsCoreService = {
          stsOptions: jest.fn(() => {}),
        };
        service = new AwsIamUserService(null, repository, null, null, null, null, awsCoreService);
        (service as any).getAccessKeyFromKeychain = jest.fn(() => "mocked-access-key-id");
        (service as any).getSecretKeyFromKeychain = jest.fn(() => "mocked-secret-access-key");
        (service as any).generateSessionToken = jest.fn(() => ({ sessionToken: {} }));
        (service as any).generateSessionTokenCallingMfaModal = jest.fn((_session, _sts, _params) => {});
        jest.spyOn(AWS.config, "update").mockImplementation((_options) => {});
        (AWS as any).STS.mockImplementation((_options) => mockedSTSInstance);
      });

      test("AwsIamUserService.getAccessKeyFromKeychain has been called once with given sessionId", async () => {
        await service.generateCredentials(mockedSessionId);
        expect((service as any).getAccessKeyFromKeychain).toHaveBeenCalledWith(mockedSessionId);
      });

      test("AwsIamUserService.getSecretKeyFromKeychain has been called once with given sessionId", async () => {
        await service.generateCredentials(mockedSessionId);
        expect((service as any).getSecretKeyFromKeychain).toHaveBeenCalledWith(mockedSessionId);
      });

      test("AWS.config.update has been called once with awsCoreService.stsOptions result", async () => {
        await service.generateCredentials(mockedSessionId);
        expect((AWS as any).config.update).toHaveBeenCalledWith({ accessKeyId: "mocked-access-key-id", secretAccessKey: "mocked-secret-access-key" });
      });

      describe("if session mfaDevice attribute is set", () => {
        beforeAll(() => {
          awsIamUserSession.mfaDevice = "mocked-mfa-device";
        });

        test("generateSessionTokenCallingMfaModal has been called once with the expected parameters", async () => {
          await service.generateCredentials(mockedSessionId);
          expect((service as any).generateSessionTokenCallingMfaModal).toHaveBeenCalledWith(awsIamUserSession, mockedSTSInstance, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            DurationSeconds: constants.sessionTokenDuration,
          });
        });
      });

      describe("if session mfaDevice attribute is not set", () => {
        delete awsIamUserSession["mfaDevice"];

        test("generateSessionToken has been called once with the expected parameters", async () => {
          await service.generateCredentials(mockedSessionId);
          expect((service as any).generateSessionToken).toHaveBeenCalledWith(awsIamUserSession, mockedSTSInstance, {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            DurationSeconds: constants.sessionTokenDuration,
          });
        });
      });
    });
  });

  describe("getAccountNumberFromCallerIdentity", () => {
    let mockedSession;
    let awsCoreService;
    let mockedSTSInstance;
    let mockedCredentials;

    beforeEach(() => {
      mockedCredentials = {
        sessionToken: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_access_key_id: "mocked-access-key-id",
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_secret_access_key: "mocked-secret-access-key",
          // eslint-disable-next-line @typescript-eslint/naming-convention
          aws_session_token: "mocked-session-token",
        },
      };
      mockedSession = { sessionId: "mocked-session-id" };
      awsCoreService = {
        stsOptions: jest.fn(() => "mocked-sts-options"),
      };
      mockedSTSInstance = {
        getCallerIdentity: jest.fn(() =>
          // eslint-disable-next-line @typescript-eslint/naming-convention
          ({ promise: jest.fn(() => ({ Account: "mocked-account" })) })
        ),
      };
      jest.spyOn(AWS.config, "update").mockImplementation((_options) => {});
      (AWS as any).STS.mockImplementation((_options) => mockedSTSInstance);
    });

    test("Given a session it retrieves the account number", async () => {
      const awsIamUserService = new AwsIamUserService(null, null, null, null, null, null, awsCoreService);
      awsIamUserService.generateCredentials = jest.fn(() => mockedCredentials);
      const result = await awsIamUserService.getAccountNumberFromCallerIdentity(mockedSession);

      expect(result).toBe("mocked-account");
      expect(AWS.config.update).toHaveBeenCalledWith({
        accessKeyId: "mocked-access-key-id",
        secretAccessKey: "mocked-secret-access-key",
        sessionToken: "mocked-session-token",
      });
      expect(awsCoreService.stsOptions).toHaveBeenCalledWith(mockedSession);
      expect(AWS.STS).toHaveBeenCalledWith("mocked-sts-options");
      expect(mockedSTSInstance.getCallerIdentity).toHaveBeenCalledWith({});
    });

    test("Given a session it throws an error", async () => {
      (AWS as any).STS.mockImplementation((_options) => {
        throw new Error("mocked-error");
      });
      const awsIamUserService = new AwsIamUserService(null, null, null, null, null, null, awsCoreService);
      awsIamUserService.generateCredentials = jest.fn(() => mockedCredentials);

      await expect(awsIamUserService.getAccountNumberFromCallerIdentity(mockedSession)).rejects.toThrow(
        new LoggedException("mocked-error", awsIamUserService, LogLevel.warn)
      );

      expect(AWS.config.update).toHaveBeenCalledWith({
        accessKeyId: "mocked-access-key-id",
        secretAccessKey: "mocked-secret-access-key",
        sessionToken: "mocked-session-token",
      });
      expect(awsCoreService.stsOptions).toHaveBeenCalledWith(mockedSession);
      expect(AWS.STS).toHaveBeenCalledWith("mocked-sts-options");
      expect(mockedSTSInstance.getCallerIdentity).not.toHaveBeenCalled();
    });
  });

  describe("validateCredentials", () => {
    test("generateCredentials works as expected", async () => {
      const sessionId = "mocked-session-id";
      const awsIamUserService = new AwsIamUserService(null, null, null, null, null, null, null);
      (awsIamUserService as any).generateCredentials = jest.fn(() => Promise.resolve("fake-credentials-info"));

      const result = await awsIamUserService.validateCredentials(sessionId);

      expect(result).toBe(true);
    });

    test("generateCredentials fails", async () => {
      const sessionId = "mocked-session-id";
      const awsIamUserService = new AwsIamUserService(null, null, null, null, null, null, null);
      (awsIamUserService as any).generateCredentials = jest.fn(() => Promise.reject("fake-credentials-info"));

      const result = await awsIamUserService.validateCredentials(sessionId);

      expect(result).toBe(false);
    });
  });

  describe("removeSecrets", () => {});

  describe("getCloneRequest", () => {});

  describe("generateSessionTokenCallingMfaModal", () => {
    let mockedSTSInstance;
    let mockedSessionTokenResponse;
    let mockedSession;
    let params;

    beforeEach(() => {
      mockedSession = {
        sessionName: "fake-session-name",
        mfaDevice: "fake-device-id",
      };
      mockedSessionTokenResponse = { value: "ok" };
      mockedSTSInstance = {
        getSessionToken: jest.fn((_params) => ({ promise: () => Promise.resolve(mockedSessionTokenResponse) })),
      };
      // eslint-disable-next-line @typescript-eslint/naming-convention
      params = {};
    });

    test("It opens a modal and if the modal gives the corerect mfa code and closes itself, it returns a valid session token", async () => {
      const callbackValue = "43567";
      const mfaCodePrompterProxy = {
        promptForMFACode: jest.fn((_params, callback: any) => {
          callback(callbackValue);
          return Promise.resolve(mockedSessionTokenResponse);
        }),
      };
      const awsIamUserService = new AwsIamUserService(null, null, mfaCodePrompterProxy, null, null, null, null);
      (awsIamUserService as any).generateSessionToken = jest.fn();

      expect(params.SerialNumber).toBeUndefined();
      expect(params.TokenCode).toBeUndefined();

      await (awsIamUserService as any).generateSessionTokenCallingMfaModal(mockedSession, mockedSTSInstance, params);

      expect(mfaCodePrompterProxy.promptForMFACode).toHaveBeenCalled();
      expect(params.SerialNumber).toStrictEqual("fake-device-id");
      expect(params.TokenCode).toStrictEqual("43567");
      expect((awsIamUserService as any).generateSessionToken).toHaveBeenCalledWith(mockedSession, mockedSTSInstance, params);
    });

    test("It opens a modal and if the modal gives the close signal and closes itself, it rejects with a Logged Exceptions", async () => {
      const callbackValue = constants.confirmClosed;
      const mfaCodePrompterProxy = {
        promptForMFACode: jest.fn((_params, callback: any) => {
          callback(callbackValue);
        }),
      };
      const awsIamUserService = new AwsIamUserService(null, null, mfaCodePrompterProxy, null, null, null, null);

      expect(params.SerialNumber).toBeUndefined();
      expect(params.TokenCode).toBeUndefined();

      try {
        await (awsIamUserService as any).generateSessionTokenCallingMfaModal(mockedSession, mockedSTSInstance, params);
      } catch (error) {
        expect(error).toStrictEqual(new LoggedException("Missing Multi Factor Authentication code", this, LogLevel.warn));
      }

      expect(mfaCodePrompterProxy.promptForMFACode).toHaveBeenCalled();
      expect(params.SerialNumber).toBeUndefined();
      expect(params.TokenCode).toBeUndefined();
    });
  });

  describe("getAccessKeyFromKeychain", () => {
    test("If a session id is passed and the secret found, the access key is retrieved by calling get secret from keychain service", async () => {
      const resultString = "fake-secret";
      const keychainService = { getSecret: jest.fn(() => Promise.resolve(resultString)) };
      const awsIamUserService = new AwsIamUserService(null, null, null, null, keychainService as any, null, null);
      const result = await (awsIamUserService as any).getAccessKeyFromKeychain("fake-session-id");
      expect(keychainService.getSecret).toHaveBeenCalledWith(constants.appName, `fake-session-id-iam-user-aws-session-access-key-id`);
      expect(result).toStrictEqual(resultString);
    });
  });

  describe("getSecretKeyFromKeychain", () => {
    test("If a session id is passed and the secret found, the secret key is retrieved by calling get secret from keychain service", async () => {
      const resultString = "fake-secret";
      const keychainService = { getSecret: jest.fn(() => Promise.resolve(resultString)) };
      const awsIamUserService = new AwsIamUserService(null, null, null, null, keychainService as any, null, null);
      const result = await (awsIamUserService as any).getSecretKeyFromKeychain("fake-session-id");
      expect(keychainService.getSecret).toHaveBeenCalledWith(constants.appName, `fake-session-id-iam-user-aws-session-secret-access-key`);
      expect(result).toStrictEqual(resultString);
    });
  });

  describe("removeAccessKeyFromKeychain", () => {
    test("If a session id is passed and the secret found, the access key is removed by calling delete secret from keychain service", async () => {
      const keychainService = { deleteSecret: jest.fn() };
      const awsIamUserService = new AwsIamUserService(null, null, null, null, keychainService as any, null, null);
      await (awsIamUserService as any).removeAccessKeyFromKeychain("fake-session-id");
      expect(keychainService.deleteSecret).toHaveBeenCalledWith(constants.appName, `fake-session-id-iam-user-aws-session-access-key-id`);
    });
  });

  describe("removeSecretKeyFromKeychain", () => {
    test("If a session id is passed and the secret found, the secret key is removed by calling delete secret from keychain service", async () => {
      const keychainService = { deleteSecret: jest.fn() };
      const awsIamUserService = new AwsIamUserService(null, null, null, null, keychainService as any, null, null);
      await (awsIamUserService as any).removeSecretKeyFromKeychain("fake-session-id");
      expect(keychainService.deleteSecret).toHaveBeenCalledWith(constants.appName, `fake-session-id-iam-user-aws-session-secret-access-key`);
    });
  });

  describe("removeSessionTokenFromKeychain", () => {
    test("If a session id is passed and the secret found, it is removed by calling delete secret from keychain service", async () => {
      const keychainService = { deleteSecret: jest.fn() };
      const awsIamUserService = new AwsIamUserService(null, null, null, null, keychainService as any, null, null);
      await (awsIamUserService as any).removeSessionTokenFromKeychain("fake-session-id");
      expect(keychainService.deleteSecret).toHaveBeenCalledWith(constants.appName, `fake-session-id-iam-user-aws-session-token`);
    });
  });

  describe("generateSessionToken", () => {
    let mockedSession;
    let mockedSTSInstance;
    let mockedSessionTokenResponse;
    let mockedSessionToken;
    let params;
    let keychainService;

    beforeEach(() => {
      mockedSession = { sessionId: "mocked-session-id" };
      mockedSessionTokenResponse = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Credentials: "fake-credentials",
      };
      mockedSessionToken = { value: "fake-session-token" };
      mockedSTSInstance = {
        getSessionToken: jest.fn((_params) => ({ promise: () => Promise.resolve(mockedSessionTokenResponse) })),
      };
      params = { fakeParam: "fakeParam" };

      keychainService = {
        saveSecret: jest.fn(),
      };
      (AWS as any).STS.mockImplementation((_options) => mockedSTSInstance);
    });

    test("Given a valid session and an STS object, it retrieves the AWS Session Token", async () => {
      const awsIamUserService = new AwsIamUserService(null, null, null, null, keychainService as any, null, null);
      (awsIamUserService as any).saveSessionTokenExpirationInTheSession = jest.fn();
      AwsIamUserService.sessionTokenFromGetSessionTokenResponse = jest.fn(() => mockedSessionToken);

      const resultSessionToken = await (awsIamUserService as any).generateSessionToken(mockedSession, mockedSTSInstance, params);
      expect(mockedSTSInstance.getSessionToken).toHaveBeenCalledWith(params);
      expect((awsIamUserService as any).saveSessionTokenExpirationInTheSession).toHaveBeenCalledWith(mockedSession, "fake-credentials");
      expect(AwsIamUserService.sessionTokenFromGetSessionTokenResponse).toHaveBeenCalledWith(mockedSessionTokenResponse);
      expect(keychainService.saveSecret).toHaveBeenCalledWith(
        constants.appName,
        `mocked-session-id-iam-user-aws-session-token`,
        '{"value":"fake-session-token"}'
      );
      expect(resultSessionToken).toStrictEqual({ value: "fake-session-token" });
    });

    test("If an error occurs it throws a new Logged Exception", async () => {
      mockedSTSInstance.getSessionToken = jest.fn(() => {
        throw new Error("fake-error");
      });

      const awsIamUserService = new AwsIamUserService(null, null, null, null, keychainService, null, null);

      expect(async () => await (awsIamUserService as any).generateSessionToken(mockedSession, mockedSTSInstance, params)).rejects.toThrow(
        new LoggedException("fake-error", awsIamUserService, LogLevel.warn)
      );
    });
  });

  describe("saveSessionTokenExpirationInTheSession", () => {
    let mockedSession;
    let mockedSession2;
    let sessions;
    let credentials;
    let repository;
    let sessionNotifier;

    beforeEach(() => {
      mockedSession = {};
      mockedSession2 = {};
      sessions = [mockedSession, mockedSession2];
      credentials = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Expiration: {
          toISOString: jest.fn(() => "fake-expiration-string"),
        },
      };

      sessionNotifier = {
        setSessions: jest.fn(),
      };
      repository = {
        getSessions: jest.fn(() => sessions),
        updateSessions: jest.fn(),
      };
    });

    test("Given a session if credentials are set, it set them and then calls for session update on the UI", () => {
      const awsIamUserService = new AwsIamUserService(sessionNotifier as any, repository as any, null, null, null, null, null);

      expect(mockedSession.sessionTokenExpiration).toBe(undefined);
      expect(mockedSession2.sessionTokenExpiration).toBe(undefined);

      (awsIamUserService as any).saveSessionTokenExpirationInTheSession(mockedSession, credentials);

      expect(repository.getSessions).toHaveBeenCalled();
      expect(mockedSession.sessionTokenExpiration).toBe("fake-expiration-string");
      expect(mockedSession2.sessionTokenExpiration).toBe(undefined);
      expect(credentials.Expiration.toISOString).toHaveBeenCalled();
      expect(repository.updateSessions).toHaveBeenCalledWith(sessions);
      expect(sessionNotifier.setSessions).toHaveBeenCalledWith([...sessions]);
    });

    test("Given a session if credentials are not set, the expiration is skipped and then we call for session update on the UI", () => {
      const awsIamUserService = new AwsIamUserService(sessionNotifier as any, repository as any, null, null, null, null, null);

      expect(mockedSession.sessionTokenExpiration).toBe(undefined);
      expect(mockedSession2.sessionTokenExpiration).toBe(undefined);

      (awsIamUserService as any).saveSessionTokenExpirationInTheSession(mockedSession);

      expect(repository.getSessions).toHaveBeenCalled();
      expect(mockedSession.sessionTokenExpiration).toBe(undefined);
      expect(mockedSession2.sessionTokenExpiration).toBe(undefined);
      expect(credentials.Expiration.toISOString).not.toHaveBeenCalled();
      expect(repository.updateSessions).toHaveBeenCalledWith(sessions);
      expect(sessionNotifier.setSessions).toHaveBeenCalledWith([...sessions]);
    });
  });
});

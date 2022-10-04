import { describe, test, expect, jest } from "@jest/globals";
import { AwsIamUserService } from "./aws-iam-user-service";
import { LoggedException, LogLevel } from "../../log-service";
//import * as uuid from "uuid";
jest.mock("uuid");
jest.mock("console");

describe("AwsIamUserService", () => {
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

  /*
  test("create, invokes saveSecret with access key id", () => {
    const keychainService = {
      saveSecret: jest.fn((_service: string, _account: string, _password: string) => new Promise<void>((_resolve, _reject) => {})),
      getSecret: (_service: string, _account: string) =>
        new Promise<string>((resolve, _reject) => {
          resolve("");
        }),
      deleteSecret: (_service: string, _account: string) =>
        new Promise<boolean>((resolve, _reject) => {
          resolve(true);
        }),
    };
    const repository = {
      addSession: (_session: Session) => {},
    };
    jest.spyOn(uuid, "v4").mockImplementation(() => "mocked-uuid");
    const service = new AwsIamUserService(null, repository as any, null, null, keychainService, null, null);
    service.create({
      sessionName: "mocked-session-name",
      accessKey: "mocked-access-key-id",
      secretKey: "mocked-secret-access-key",
      region: "mocked-region",
      profileId: "mocked-profile-id",
      mfaDevice: "mocked-mfa-device",
    });
    expect(keychainService.saveSecret).toHaveBeenNthCalledWith(
      1,
      constants.appName,
      `mocked-uuid-iam-user-aws-session-access-key-id`,
      "mocked-access-key-id"
    );
  });

  test("create, invokes saveSecret with secret access key", async () => {
    const keychainService = {
      saveSecret: jest.fn(
        (_service: string, _account: string, _password: string) =>
          new Promise<void>((resolve, _reject) => {
            resolve();
          })
      ),
      getSecret: (_service: string, _account: string) =>
        new Promise<string>((resolve, _reject) => {
          resolve("");
        }),
      deleteSecret: (_service: string, _account: string) =>
        new Promise<boolean>((resolve, _reject) => {
          resolve(true);
        }),
    };
    const repository = {
      addSession: (_session: Session) => {},
    };
    jest.spyOn(uuid, "v4").mockImplementation(() => "mocked-uuid");
    const service = new AwsIamUserService(null, repository as any, null, null, keychainService, null, null);
    await service.create({
      sessionName: "mocked-session-name",
      accessKey: "mocked-access-key-id",
      secretKey: "mocked-secret-access-key",
      region: "mocked-region",
      profileId: "mocked-profile-id",
      mfaDevice: "mocked-mfa-device",
    });
    expect(keychainService.saveSecret).toHaveBeenCalledTimes(2);
    expect(keychainService.saveSecret.mock.calls).toEqual([
      [constants.appName, "mocked-uuid-iam-user-aws-session-access-key-id", "mocked-access-key-id"],
      [constants.appName, `mocked-uuid-iam-user-aws-session-secret-access-key`, "mocked-secret-access-key"],
    ]);
  });

  test("create, logs error if first saveSecret invocation throws an error", async () => {
    const keychainService = {
      saveSecret: (_service: string, _account: string, _password: string) =>
        new Promise<void>((_resolve, reject) => {
          reject(new Error("fake-error"));
        }),
      getSecret: (_service: string, _account: string) =>
        new Promise<string>((resolve, _reject) => {
          resolve("");
        }),
      deleteSecret: (_service: string, _account: string) =>
        new Promise<boolean>((resolve, _reject) => {
          resolve(true);
        }),
    };
    const repository = {
      addSession: (_session: Session) => {},
    };
    jest.spyOn(uuid, "v4").mockImplementation(() => "mocked-uuid");
    jest.spyOn(console, "error").mockImplementation(() => {});
    const service = new AwsIamUserService(null, repository as any, null, null, keychainService, null, null);
    try {
      await service.create({
        sessionName: "mocked-session-name",
        accessKey: "mocked-access-key-id",
        secretKey: "mocked-secret-access-key",
        region: "mocked-region",
        profileId: "mocked-profile-id",
        mfaDevice: "mocked-mfa-device",
      });
    } catch (err) {
      expect(console.error).toHaveBeenNthCalledWith(1, "fake-error");
    }
  });

  test("create, logs error if seconds saveSecret invocation throws an error", async () => {
    const keychainService = {
      saveSecret: jest.fn(),
      getSecret: (_service: string, _account: string) =>
        new Promise<string>((resolve, _reject) => {
          resolve("");
        }),
      deleteSecret: (_service: string, _account: string) =>
        new Promise<boolean>((resolve, _reject) => {
          resolve(true);
        }),
    };
    const repository = {
      addSession: (_session: Session) => {},
    };

    keychainService.saveSecret
      .mockReturnValueOnce(
        new Promise<void>((resolve, _reject) => {
          resolve();
        })
      )
      .mockReturnValueOnce(
        new Promise<void>((_resolve, reject) => {
          reject(new Error("fake-error"));
        })
      );

    jest.spyOn(uuid, "v4").mockImplementation(() => "mocked-uuid");
    jest.spyOn(console, "error").mockImplementation(() => {});
    const service = new AwsIamUserService(null, repository as any, null, null, keychainService as any, null, null);
    try {
      await service.create({
        sessionName: "mocked-session-name",
        accessKey: "mocked-access-key-id",
        secretKey: "mocked-secret-access-key",
        region: "mocked-region",
        profileId: "mocked-profile-id",
        mfaDevice: "mocked-mfa-device",
      });
    } catch (err) {
      expect(console.error).toHaveBeenNthCalledWith(1, "fake-error");
    }
  });
  */
});

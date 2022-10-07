import { describe, test, expect, jest } from "@jest/globals";
import { AwsIamUserService } from "./aws-iam-user-service";
import { LoggedException, LogLevel } from "../../log-service";
import * as uuid from "uuid";
import { constants } from "../../../models/constants";
import { AwsIamUserSession } from "../../../models/aws/aws-iam-user-session";
import { SessionType } from "../../../models/session-type";

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
});

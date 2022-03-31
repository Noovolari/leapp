import { jest, describe, test, expect } from "@jest/globals";
import { AwsProcessCredentials } from "../../../models/aws-process-credential";
import { SessionType } from "../../../models/session-type";
import { AwsSessionService } from "./aws-session-service";

describe("AwsSessionService", () => {
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
});

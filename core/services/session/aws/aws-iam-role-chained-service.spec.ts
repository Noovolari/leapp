import { describe, test, expect } from "@jest/globals";
import { AwsIamRoleChainedSession } from "../../../models/aws-iam-role-chained-session";
import { AwsIamRoleChainedService } from "./aws-iam-role-chained-service";
import { SessionType } from "../../../models/session-type";

describe("AwsIamRoleChainedService", () => {
  test("getAccountNumberFromCallerIdentity", async () => {
    const session = {
      type: SessionType.awsIamRoleChained,
      roleArn: "abcdefghijklmnopqrstuvwxyz/12345",
    } as any;
    const awsIamRoleChainedService = new AwsIamRoleChainedService(null, null, null, null, null, null);
    const accountNumber = await awsIamRoleChainedService.getAccountNumberFromCallerIdentity(session);

    expect(accountNumber).toBe("nopqrstuvwxy");
  });

  test("getAccountNumberFromCallerIdentity - error", async () => {
    const session = {};
    const awsIamRoleChainedService = new AwsIamRoleChainedService(null, null, null, null, null, null);

    await expect(() => awsIamRoleChainedService.getAccountNumberFromCallerIdentity(session as AwsIamRoleChainedSession)).rejects.toThrow(
      new Error("AWS IAM Role Chained Session required")
    );
  });
});

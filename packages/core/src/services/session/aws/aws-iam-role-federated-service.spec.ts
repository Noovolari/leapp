import { describe, test, expect } from "@jest/globals";
import { AwsIamRoleFederatedSession } from "../../../models/aws/aws-iam-role-federated-session";
import { AwsIamRoleFederatedService } from "./aws-iam-role-federated-service";
import { SessionType } from "../../../models/session-type";

describe("AwsIamRoleFederatedService", () => {
  test("getAccountNumberFromCallerIdentity", async () => {
    const session = {
      type: SessionType.awsIamRoleFederated,
      roleArn: "abcdefghijklmnopqrstuvwxyz/12345",
    } as any;
    const awsIamRoleFederatedService = new AwsIamRoleFederatedService(null, null, null, null, null, null);
    const accountNumber = await awsIamRoleFederatedService.getAccountNumberFromCallerIdentity(session);

    expect(accountNumber).toBe("nopqrstuvwxy");
  });

  test("getAccountNumberFromCallerIdentity - error", async () => {
    const session = {};
    const awsIamRoleFederatedService = new AwsIamRoleFederatedService(null, null, null, null, null, null);

    await expect(() => awsIamRoleFederatedService.getAccountNumberFromCallerIdentity(session as AwsIamRoleFederatedSession)).rejects.toThrow(
      new Error("AWS IAM Role Federated Session required")
    );
  });
});

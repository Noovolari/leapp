import { jest, describe, test, expect } from "@jest/globals";
import { AwsSsoRoleSession } from "../../../models/aws/aws-sso-role-session";
import { AwsSsoRoleService } from "./aws-sso-role-service";
import { SessionType } from "../../../models/session-type";

describe("AwsSsoRoleService", () => {
  test("getAccountNumberFromCallerIdentity", async () => {
    const session = {
      type: SessionType.awsSsoRole,
      roleArn: "abcdefghijklmnopqrstuvwxyz/12345",
    } as any;
    const awsSsoRoleService = new AwsSsoRoleService(null, null, null, null, null, null, { appendListener: jest.fn(() => {}) } as any);
    const accountNumber = await awsSsoRoleService.getAccountNumberFromCallerIdentity(session);

    expect(accountNumber).toBe("nopqrstuvwxy");
  });

  test("getAccountNumberFromCallerIdentity - error", async () => {
    const session = {};
    const awsSsoRoleService = new AwsSsoRoleService(null, null, null, null, null, null, { appendListener: jest.fn(() => {}) } as any);

    await expect(() => awsSsoRoleService.getAccountNumberFromCallerIdentity(session as AwsSsoRoleSession)).rejects.toThrow(
      new Error("AWS SSO Role Session required")
    );
  });
});

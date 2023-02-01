import { describe, test, expect } from "@jest/globals";
import { AWS_ASSUMER_SESSION_TYPES } from "./aws-assumer-session-types";
import { SessionType } from "../models/session-type";

describe("Aws Assumer Session Types", () => {
  test("Check that enum is as expected", () => {
    expect(AWS_ASSUMER_SESSION_TYPES).toStrictEqual([SessionType.awsIamUser, SessionType.awsIamRoleFederated, SessionType.awsSsoRole]);
  });
});

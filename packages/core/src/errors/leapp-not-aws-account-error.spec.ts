import { describe, test, expect } from "@jest/globals";
import { LeappBaseError } from "./leapp-base-error";
import { LogLevel } from "../services/log-service";
import { LeappNotAwsAccountError } from "./leapp-not-aws-account-error";

describe("LeappNotAwsAccountError", () => {
  test("validate existence and super parameters", () => {
    const error = new LeappNotAwsAccountError(this, "not aws error");

    expect(error).toBeInstanceOf(LeappNotAwsAccountError);
    expect(error).toBeInstanceOf(LeappBaseError);
    expect(error.message).toBe("not aws error");
    expect(error.name).toBe("Leapp Not aws Account Error");
    expect(error.severity).toBe(LogLevel.warn);
    expect(error.context).toBe(this);
  });
});

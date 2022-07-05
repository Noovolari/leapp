import { describe, test, expect } from "@jest/globals";
import { LeappBaseError } from "./leapp-base-error";
import { LogLevel } from "../services/log-service";
import { LeappMissingMfaTokenError } from "./leapp-missing-mfa-token-error";

describe("LeappMissingMfaTokenError", () => {
  test("validate existence and super parameters", () => {
    const error = new LeappMissingMfaTokenError(this, "mfa token error");

    expect(error).toBeInstanceOf(LeappMissingMfaTokenError);
    expect(error).toBeInstanceOf(LeappBaseError);
    expect(error.message).toBe("mfa token error");
    expect(error.name).toBe("Leapp Missing Mfa Token Error");
    expect(error.severity).toBe(LogLevel.warn);
    expect(error.context).toBe(this);
  });
});

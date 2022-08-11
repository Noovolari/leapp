import { describe, test, expect } from "@jest/globals";
import { LeappAwsStsError } from "./leapp-aws-sts-error";
import { LeappBaseError } from "./leapp-base-error";
import { LogLevel } from "../services/log-service";

describe("LeappAwsStsError", () => {
  test("validate existence and super parameters", () => {
    const error = new LeappAwsStsError(this, "sts error");

    expect(error).toBeInstanceOf(LeappAwsStsError);
    expect(error).toBeInstanceOf(LeappBaseError);
    expect(error.message).toBe("sts error");
    expect(error.name).toBe("Leapp Aws Sts Error");
    expect(error.severity).toBe(LogLevel.warn);
    expect(error.context).toBe(this);
  });
});

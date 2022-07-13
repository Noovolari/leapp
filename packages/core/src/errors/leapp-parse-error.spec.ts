import { describe, test, expect } from "@jest/globals";
import { LeappBaseError } from "./leapp-base-error";
import { LogLevel } from "../services/log-service";
import { LeappParseError } from "./leapp-parse-error";

describe("LeappParseError", () => {
  test("validate existence and super parameters", () => {
    const error = new LeappParseError(this, "parse error");

    expect(error).toBeInstanceOf(LeappParseError);
    expect(error).toBeInstanceOf(LeappBaseError);
    expect(error.message).toBe("parse error");
    expect(error.name).toBe("Leapp Parse Error");
    expect(error.severity).toBe(LogLevel.warn);
    expect(error.context).toBe(this);
  });
});

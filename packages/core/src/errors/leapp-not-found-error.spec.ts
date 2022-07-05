import { describe, test, expect } from "@jest/globals";
import { LeappBaseError } from "./leapp-base-error";
import { LogLevel } from "../services/log-service";
import { LeappNotFoundError } from "./leapp-not-found-error";

describe("LeappNotFoundError", () => {
  test("validate existence and super parameters", () => {
    const error = new LeappNotFoundError(this, "not found error");

    expect(error).toBeInstanceOf(LeappNotFoundError);
    expect(error).toBeInstanceOf(LeappBaseError);
    expect(error.message).toBe("not found error");
    expect(error.name).toBe("Leapp Not Found Error");
    expect(error.severity).toBe(LogLevel.warn);
    expect(error.context).toBe(this);
  });
});

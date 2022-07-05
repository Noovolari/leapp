import { describe, test, expect } from "@jest/globals";
import { LeappBaseError } from "./leapp-base-error";
import { LogLevel } from "../services/log-service";
import { LeappExecuteError } from "./leapp-execute-error";

describe("LeappExecuteError", () => {
  test("validate existence and super parameters", () => {
    const error = new LeappExecuteError(this, "exec error");

    expect(error).toBeInstanceOf(LeappExecuteError);
    expect(error).toBeInstanceOf(LeappBaseError);
    expect(error.message).toBe("exec error");
    expect(error.name).toBe("Leapp Execute Error");
    expect(error.severity).toBe(LogLevel.warn);
    expect(error.context).toBe(this);
  });
});

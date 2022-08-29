import { describe, test, expect } from "@jest/globals";
import { LeappBaseError } from "./leapp-base-error";
import { LogLevel } from "../services/log-service";
import { LeappLinkError } from "./leapp-link-error";

describe("LeappLinkError", () => {
  test("validate existence and super parameters", () => {
    const error = new LeappLinkError("", this, "link error");

    expect(error).toBeInstanceOf(LeappLinkError);
    expect(error).toBeInstanceOf(LeappBaseError);
    expect(error.message).toBe("link error");
    expect(error.name).toBe("Error");
    expect(error.severity).toBe(LogLevel.error);
    expect(error.context).toBe(this);
  });
});

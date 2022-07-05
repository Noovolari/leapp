import { describe, test, expect } from "@jest/globals";
import { LeappBaseError } from "./leapp-base-error";
import { LogLevel } from "../services/log-service";
import { LeappModalClosedError } from "./leapp-modal-closed-error";

describe("LeappModalClosedError", () => {
  test("validate existence and super parameters", () => {
    const error = new LeappModalClosedError(this, "modal closed error");

    expect(error).toBeInstanceOf(LeappModalClosedError);
    expect(error).toBeInstanceOf(LeappBaseError);
    expect(error.message).toBe("modal closed error");
    expect(error.name).toBe("Leapp Modal Closed");
    expect(error.severity).toBe(LogLevel.info);
    expect(error.context).toBe(this);
  });
});

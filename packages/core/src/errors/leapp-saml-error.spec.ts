import { describe, test, expect } from "@jest/globals";
import { LeappBaseError } from "./leapp-base-error";
import { LogLevel } from "../services/log-service";
import { LeappSamlError } from "./leapp-saml-error";

describe("LeappSamlError", () => {
  test("validate existence and super parameters", () => {
    const error = new LeappSamlError(this, "saml error");

    expect(error).toBeInstanceOf(LeappSamlError);
    expect(error).toBeInstanceOf(LeappBaseError);
    expect(error.message).toBe("saml error");
    expect(error.name).toBe("Leapp Saml Error");
    expect(error.severity).toBe(LogLevel.warn);
    expect(error.context).toBe(this);
  });
});

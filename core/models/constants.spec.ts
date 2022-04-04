import { describe, test, expect } from "@jest/globals";
import { constants } from "./constants";

describe("Constants", () => {
  test("constansts - samlRoleSessionDuration must be set at 3600", () => {
    expect(constants.samlRoleSessionDuration).toBe(3600);
  });

  test("constansts - sessionDuration must be set at 1200", () => {
    expect(constants.sessionDuration).toBe(1200);
  });

  test("constansts - sessionTokenDuration must be set at 36000", () => {
    expect(constants.sessionTokenDuration).toBe(36000);
  });

  test("constansts - timeout must be set at 10000", () => {
    expect(constants.timeout).toBe(10000);
  });
});

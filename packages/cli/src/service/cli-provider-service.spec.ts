import { describe, test, expect } from "@jest/globals";
import { CliProviderService } from "./cli-provider-service";

describe("CliProviderService", () => {
  test("services", async () => {
    for (const propertyName of Object.keys(Object.getOwnPropertyDescriptors(CliProviderService.prototype))) {
      const cliProviderService = new CliProviderService();

      let result;
      try {
        result = cliProviderService[propertyName];
      } catch (e) {
        throw new Error(`error getting: ${propertyName}`);
      }

      try {
        expect(result).not.toBeFalsy();
      } catch (e) {
        throw new Error(`${propertyName} is falsy`);
      }

      try {
        expect(cliProviderService[propertyName]).toBe(result);
      } catch (error) {
        throw new Error(`singleton not working for ${propertyName}`);
      }
    }
  });

  test("remoteProceduresClient", async () => {
    const cliProviderService = new CliProviderService();
    const cliNativeService = cliProviderService.cliNativeService;
    expect(cliNativeService.msalEncryptionService).toBeNull();

    const remoteProceduresClient = cliProviderService.remoteProceduresClient;
    expect(remoteProceduresClient).not.toBeFalsy();

    expect(cliNativeService.msalEncryptionService).not.toBeFalsy();
    expect(cliNativeService.msalEncryptionService.protectData).not.toBeFalsy();
    expect(cliNativeService.msalEncryptionService.unprotectData).not.toBeFalsy();
  });
});

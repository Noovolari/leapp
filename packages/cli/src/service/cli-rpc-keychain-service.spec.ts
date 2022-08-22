import { jest, describe, test, expect } from "@jest/globals";
import { CliRpcKeychainService } from "./cli-rpc-keychain-service";

describe("CliRpcKeychainService", () => {
  test("saveSecret", async () => {
    const remoteProceduresClient = {
      keychainSaveSecret: jest.fn(),
    } as any;
    const cliRpcKeychainService = new CliRpcKeychainService(remoteProceduresClient);
    await cliRpcKeychainService.saveSecret("fake-service", "fake-account", "fake-password");
    expect(remoteProceduresClient.keychainSaveSecret).toHaveBeenCalledWith("fake-service", "fake-account", "fake-password");
  });

  test("getSecret", async () => {
    const remoteProceduresClient = {
      keychainGetSecret: jest.fn(async () => "result"),
    } as any;
    const cliRpcKeychainService = new CliRpcKeychainService(remoteProceduresClient);
    const result = await cliRpcKeychainService.getSecret("fake-service", "fake-account");
    expect(remoteProceduresClient.keychainGetSecret).toHaveBeenCalledWith("fake-service", "fake-account");
    expect(result).toBe("result");
  });

  test("deleteSecret", async () => {
    const remoteProceduresClient = {
      keychainDeleteSecret: jest.fn(async () => "result"),
    } as any;
    const cliRpcKeychainService = new CliRpcKeychainService(remoteProceduresClient);
    const result = await cliRpcKeychainService.deleteSecret("fake-service", "fake-account");
    expect(remoteProceduresClient.keychainDeleteSecret).toHaveBeenCalledWith("fake-service", "fake-account");
    expect(result).toBe("result");
  });
});

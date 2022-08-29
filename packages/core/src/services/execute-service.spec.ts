import { jest, describe, test, expect } from "@jest/globals";
import { ExecuteService } from "./execute-service";

describe("ExecuteService", () => {
  test("execute, command without sudo, not darwin os", async () => {
    const nativeService = { exec: "fake-exec-fn", process: { platform: "win32" } } as any;
    const service = new ExecuteService(nativeService, null, null) as any;
    service.exec = jest.fn(async () => "fake-exec-result");

    const result = await service.execute("fake-command", "fake-env", "fake-maskOutputLog");

    expect(service.exec).toHaveBeenCalledWith("fake-exec-fn", "fake-command", "fake-env", "fake-maskOutputLog");
    expect(result).toBe("fake-exec-result");
  });

  test("execute, command with sudo, not darwin os", async () => {
    const nativeService = { exec: "fake-exec-fn", sudo: { exec: "fake-sudo-exec-fn" }, process: { platform: "win32" } } as any;
    const service = new ExecuteService(nativeService, null, null) as any;
    service.exec = jest.fn(async () => "fake-exec-result");

    const result = await service.execute("sudo fake-command", "fake-env", "fake-maskOutputLog");

    expect(service.exec).toHaveBeenCalledWith("fake-sudo-exec-fn", "fake-command", "fake-env", "fake-maskOutputLog");
    expect(result).toBe("fake-exec-result");
  });
});

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

  test("execute, darwin os, command with params, command found by which", async () => {
    const nativeService = { exec: "fake-exec-fn", process: { platform: "darwin" } } as any;
    const service = new ExecuteService(nativeService, null, null) as any;
    service.exec = jest.fn(async () => "/usr/bin/command\n");

    const result = await service.execute("fake-command par1 par2 ", "fake-env", "fake-maskOutputLog");

    expect(service.exec).toHaveBeenCalledTimes(2);
    expect(service.exec).toHaveBeenNthCalledWith(1, "fake-exec-fn", "which fake-command");
    expect(service.exec).toHaveBeenNthCalledWith(2, "fake-exec-fn", "/usr/bin/command par1 par2 ", "fake-env", "fake-maskOutputLog");
    expect(result).toBe("/usr/bin/command\n");
  });

  test("execute, darwin os, command without params, command found by which", async () => {
    const nativeService = { exec: "fake-exec-fn", process: { platform: "darwin" } } as any;
    const service = new ExecuteService(nativeService, null, null) as any;
    service.exec = jest.fn(async () => "/usr/bin/command");

    const result = await service.execute("fake-command", "fake-env", "fake-maskOutputLog");

    expect(service.exec).toHaveBeenCalledTimes(2);
    expect(service.exec).toHaveBeenNthCalledWith(1, "fake-exec-fn", "which fake-command");
    expect(service.exec).toHaveBeenNthCalledWith(2, "fake-exec-fn", "/usr/bin/command", "fake-env", "fake-maskOutputLog");
    expect(result).toBe("/usr/bin/command");
  });

  test("execute, darwin os, built-in command", async () => {
    const nativeService = { exec: "fake-exec-fn", process: { platform: "darwin" } } as any;
    const service = new ExecuteService(nativeService, null, null) as any;
    service.exec = jest.fn(async () => "command: shell built-in command");

    await service.execute("fake-command", "fake-env", "fake-maskOutputLog");

    expect(service.exec).toHaveBeenCalledTimes(2);
    expect(service.exec).toHaveBeenNthCalledWith(1, "fake-exec-fn", "which fake-command");
    expect(service.exec).toHaveBeenNthCalledWith(2, "fake-exec-fn", "fake-command", "fake-env", "fake-maskOutputLog");
  });
});

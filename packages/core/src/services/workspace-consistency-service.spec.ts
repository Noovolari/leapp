import { expect, beforeEach, jest, describe, test } from "@jest/globals";
import { WorkspaceConsistencyService } from "./workspace-consistency-service";
import { LoggedEntry, LogLevel } from "./log-service";

describe("WorkspaceConsistencyService", () => {
  let fileService;
  let nativeService;
  let logService;
  let service;

  beforeEach(() => {
    fileService = {} as any;
    nativeService = {} as any;
    logService = {} as any;
    service = new WorkspaceConsistencyService(fileService, nativeService, logService) as any;
  });

  test("fileLockPath", () => {
    nativeService.os = { homedir: () => "homedir" };
    const fileLockPath = service.fileLockPath;
    expect(fileLockPath).toBe("homedir/.Leapp/Leapp-lock.json");
  });

  test("fileLockBackupPath", () => {
    nativeService.os = { homedir: () => "homedir" };
    const fileLockBackupPath = service.fileLockBackupPath;
    expect(fileLockBackupPath).toBe("homedir/.Leapp/Leapp-lock.backup.bin");
  });

  test("getWorkspace, everything ok", () => {
    service.loadWorkspace = jest.fn(() => "workspace");
    service.checkConsistency = jest.fn();
    service.saveBackup = jest.fn();

    const workspace = service.getWorkspace();

    expect(workspace).toBe("workspace");
    expect(service.loadWorkspace).toHaveBeenCalled();
    expect(service.checkConsistency).toHaveBeenCalledWith("workspace");
    expect(service.saveBackup).toHaveBeenCalledWith("workspace");
  });

  test("getWorkspace, something wrong, backup existing", () => {
    logService.log = jest.fn();
    fileService.existsSync = jest.fn(() => true);
    const error = new Error("something wrong");
    service.loadWorkspace = () => {
      throw error;
    };
    const fileLockBackupPathSpy = jest.spyOn(service, "fileLockBackupPath", "get").mockImplementation(() => "backup/path");
    service.restoreBackup = jest.fn(() => "workspace");

    const workspace = service.getWorkspace();

    expect(workspace).toBe("workspace");
    expect(logService.log).toHaveBeenCalledWith(new LoggedEntry(error.message, service, LogLevel.error, false, error.stack));
    expect(fileLockBackupPathSpy).toHaveBeenCalled();
    expect(fileService.existsSync).toHaveBeenCalledWith("backup/path");
    expect(service.restoreBackup).toHaveBeenCalled();
  });

  test("getWorkspace, something wrong, backup existing but corrupted", () => {
    logService.log = jest.fn();
    fileService.existsSync = jest.fn(() => true);
    const error = new Error("something wrong");
    service.loadWorkspace = () => {
      throw error;
    };
    const fileLockBackupPathSpy = jest.spyOn(service, "fileLockBackupPath", "get").mockImplementation(() => "backup/path");
    const backupError = new Error("backup corrupted");
    service.restoreBackup = jest.fn(() => {
      throw backupError;
    });
    service.cleanWorkspace = jest.fn(() => "workspace");

    const workspace = service.getWorkspace();

    expect(workspace).toBe("workspace");
    expect(logService.log).toHaveBeenNthCalledWith(1, new LoggedEntry(error.message, service, LogLevel.error, false, error.stack));
    expect(logService.log).toHaveBeenNthCalledWith(2, new LoggedEntry(backupError.message, service, LogLevel.error, false, backupError.stack));
    expect(fileLockBackupPathSpy).toHaveBeenCalled();
    expect(fileService.existsSync).toHaveBeenCalledWith("backup/path");
    expect(service.restoreBackup).toHaveBeenCalled();
    expect(service.cleanWorkspace).toHaveBeenCalled();
  });

  test("getWorkspace, something wrong, backup not existing", () => {
    logService.log = jest.fn();
    fileService.existsSync = jest.fn(() => false);
    const error = new Error("something wrong");
    service.loadWorkspace = () => {
      throw error;
    };
    const fileLockBackupPathSpy = jest.spyOn(service, "fileLockBackupPath", "get").mockImplementation(() => "backup/path");
    service.cleanWorkspace = jest.fn(() => "workspace");

    const workspace = service.getWorkspace();

    expect(workspace).toBe("workspace");
    expect(logService.log).toHaveBeenCalledWith(new LoggedEntry(error.message, service, LogLevel.error, false, error.stack));
    expect(fileLockBackupPathSpy).toHaveBeenCalled();
    expect(fileService.existsSync).toHaveBeenCalledWith("backup/path");
    expect(service.cleanWorkspace).toHaveBeenCalled();
  });
});

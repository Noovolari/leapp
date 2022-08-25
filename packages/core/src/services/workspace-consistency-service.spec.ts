import { expect, beforeEach, jest, describe, test } from "@jest/globals";
import { WorkspaceConsistencyService } from "./workspace-consistency-service";
import { LoggedEntry, LogLevel } from "./log-service";
import { Workspace } from "../models/workspace";
import { deserialize, serialize } from "class-transformer";

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

  test("createNewWorkspace", () => {
    const result = service.createNewWorkspace();
    expect(result).toBeInstanceOf(Workspace);
    expect((result as any)._workspaceVersion).not.toBe(undefined);
  });

  test("checkConsistency, success", () => {
    const workspace = new Workspace();
    workspace.awsSsoIntegrations = [{ id: "aws-sso-integration-id" } as any];
    workspace.azureIntegrations = [{ id: "azure-integration-id" } as any];
    workspace.profiles = [{ id: "profile-id" } as any];
    workspace.idpUrls = [{ id: "idpurl-id" } as any];
    workspace.sessions.push(
      { sessionId: "id-1", profileId: "profile-id" } as any,
      { sessionId: "id-2", idpUrlId: "idpurl-id" } as any,
      { sessionId: "id-3", awsSsoConfigurationId: "aws-sso-integration-id" } as any,
      { sessionId: "id-4", azureIntegrationId: "azure-integration-id" } as any,
      { sessionId: "id-5", parentSessionId: "id-1" } as any
    );
    service.checkConsistency(workspace);
  });

  test("checkConsistency, duplicated ids", () => {
    const assertions = [
      { arrayFieldName: "sessions", idFieldName: "sessionId", expectError: "Sessions with duplicated ids" },
      { arrayFieldName: "awsSsoIntegrations", idFieldName: "id", expectError: "AWS SSO integrations with duplicated ids" },
      { arrayFieldName: "azureIntegrations", idFieldName: "id", expectError: "Azure integrations with duplicated ids" },
      { arrayFieldName: "profiles", idFieldName: "id", expectError: "AWS named profiles with duplicated ids" },
      { arrayFieldName: "idpUrls", idFieldName: "id", expectError: "AWS IdP URLs with duplicated ids" },
    ];
    for (const assertion of assertions) {
      const workspace = new Workspace();
      workspace[assertion.arrayFieldName].push({ [assertion.idFieldName]: "id" }, { [assertion.idFieldName]: "id" });
      expect(() => service.checkConsistency(workspace)).toThrow(assertion.expectError);
    }
  });

  test("checkConsistency, invalid/missing ids", () => {
    const sessionName = "fake-session-name";
    const assertions = [
      { sessionFieldName: "profileId", expectError: `Session ${sessionName} has an invalid profileId` },
      { sessionFieldName: "idpUrlId", expectError: `Session ${sessionName} has an invalid idpUrlId` },
      { sessionFieldName: "awsSsoConfigurationId", expectError: `Session ${sessionName} has an invalid awsSsoConfigurationId` },
      { sessionFieldName: "azureIntegrationId", expectError: `Session ${sessionName} has an invalid azureIntegrationId` },
      { sessionFieldName: "parentSessionId", expectError: `Session ${sessionName} has an invalid parentSessionId` },
    ];
    for (const assertion of assertions) {
      console.log(assertion.sessionFieldName);
      const workspace = new Workspace();
      workspace.sessions.push(
        { sessionId: "session-1" } as any,
        { sessionId: "session-2", sessionName, [assertion.sessionFieldName]: "invalid-id" } as any
      );
      expect(() => service.checkConsistency(workspace)).toThrow(assertion.expectError);
    }
  });

  test("saveBackup", () => {
    const mockedWorkspace = new Workspace();
    mockedWorkspace.sessions = [{ name: "testName" } as any];
    const fileLockBackupPathSpy = jest.spyOn(service, "fileLockBackupPath", "get").mockImplementation(() => "backup/path");
    fileService.encryptText = jest.fn(() => "encryptedText");
    fileService.writeFileSync = jest.fn();

    service.saveBackup(mockedWorkspace);

    expect(fileService.encryptText).toHaveBeenCalledWith(serialize(mockedWorkspace));
    expect(fileLockBackupPathSpy).toHaveBeenCalled();
    expect(fileService.writeFileSync).toHaveBeenCalledWith("backup/path", "encryptedText");
  });

  test("loadWorkspace", () => {
    const decryptedWorkspace = serialize(new Workspace());
    const fileLockPathSpy = jest.spyOn(service, "fileLockPath", "get").mockImplementation(() => "actual/path");
    fileService.decryptText = jest.fn(() => decryptedWorkspace);
    fileService.readFileSync = jest.fn(() => "content");

    const resultWorkspace = service.loadWorkspace();

    expect(fileLockPathSpy).toHaveBeenCalled();
    expect(fileService.readFileSync).toHaveBeenCalledWith("actual/path");
    expect(fileService.decryptText).toHaveBeenCalledWith("content");
    expect(resultWorkspace).toStrictEqual(deserialize(Workspace, decryptedWorkspace));
  });

  test("restoreBackup", () => {
    const workspace = deserialize(Workspace, serialize(new Workspace()));
    workspace.defaultRegion = "fake-region";
    const serializedWorkspace = serialize(workspace);

    fileService.readFileSync = jest.fn(() => "backup-content");
    fileService.writeFileSync = jest.fn();
    fileService.decryptText = jest.fn(() => serializedWorkspace);
    logService.log = jest.fn();
    service.checkConsistency = jest.fn();
    const fileLockBackupPath = jest.spyOn(service, "fileLockBackupPath", "get").mockImplementation(() => "backup/path");
    const fileLockPath = jest.spyOn(service, "fileLockPath", "get").mockImplementation(() => "actual/path");

    const resultWorkspace = service.restoreBackup();

    expect(fileLockBackupPath).toHaveBeenCalled();
    expect(fileService.readFileSync).toHaveBeenCalledWith("backup/path");
    expect(fileLockPath).toHaveBeenCalled();
    expect(fileService.writeFileSync).toHaveBeenCalledWith("actual/path", "backup-content");
    expect(fileService.decryptText).toHaveBeenCalledWith("backup-content");
    expect(service.checkConsistency).toHaveBeenCalledWith(workspace);
    expect(logService.log).toHaveBeenCalledWith(
      new LoggedEntry("Leapp-lock.json was corrupted and has been restored from the latest backup.", service, LogLevel.error, true)
    );
    expect(resultWorkspace).toStrictEqual(workspace);
  });

  test("cleanWorkspace", () => {
    const newWorkspace = new Workspace();
    fileService.writeFileSync = jest.fn();
    fileService.encryptText = jest.fn(() => "encrypted-workspace");
    logService.log = jest.fn();
    service.createNewWorkspace = jest.fn(() => newWorkspace);
    const fileLockBackupPath = jest.spyOn(service, "fileLockBackupPath", "get").mockImplementation(() => "backup/path");
    const fileLockPath = jest.spyOn(service, "fileLockPath", "get").mockImplementation(() => "actual/path");

    const resultWorkspace = service.cleanWorkspace();

    expect(service.createNewWorkspace).toHaveBeenCalled();
    expect(fileLockBackupPath).toHaveBeenCalled();
    expect(fileLockPath).toHaveBeenCalled();
    expect(fileService.encryptText).toHaveBeenCalledWith(serialize(newWorkspace));
    expect(fileService.writeFileSync).toHaveBeenCalledTimes(2);
    expect(fileService.writeFileSync).toHaveBeenNthCalledWith(1, "actual/path", "encrypted-workspace");
    expect(fileService.writeFileSync).toHaveBeenNthCalledWith(2, "backup/path", "encrypted-workspace");
    expect(logService.log).toHaveBeenCalledWith(
      new LoggedEntry("Leapp failed to restore the latest Leapp-lock.json backup. Leapp-lock.json was reinitialized.", service, LogLevel.error, true)
    );
    expect(resultWorkspace).toBe(newWorkspace);
  });
});

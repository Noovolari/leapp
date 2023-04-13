import { expect, beforeEach, jest, describe, test } from "@jest/globals";
import { WorkspaceConsistencyService } from "./workspace-consistency-service";
import { LoggedEntry, LogLevel } from "./log-service";
import { Workspace } from "../models/workspace";
import { deserialize, serialize } from "class-transformer";
import * as uuid from "uuid";
import { IntegrationType } from "../models/integration-type";
import { constants } from "../models/constants";

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
    service.workspaceFileName = constants.lockFileDestination;
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
    service.workspaceFileName = constants.lockFileDestination;
    service.nativeService = { os: { homedir: jest.fn(() => "homedir-mock") } };
    logService.log = jest.fn();
    fileService.existsSync = jest.fn(() => true);
    const error = new Error("something wrong");
    service.loadWorkspace = () => {
      throw error;
    };
    service.restoreBackup = jest.fn(() => "workspace");

    const workspace = service.getWorkspace();

    expect(workspace).toBe("workspace");
    expect(logService.log).toHaveBeenCalledWith(new LoggedEntry(error.message, service, LogLevel.error, false, error.stack));
    expect(fileService.existsSync).toHaveBeenCalledWith("homedir-mock/" + constants.lockFileDestination);
    expect(service.restoreBackup).toHaveBeenCalled();
  });

  test("getWorkspace, something wrong, backup existing but corrupted", () => {
    service.nativeService = { os: { homedir: jest.fn(() => "homedir-mock") } };
    logService.log = jest.fn();
    fileService.existsSync = jest.fn(() => true);
    const error = new Error("something wrong");
    service.loadWorkspace = () => {
      throw error;
    };
    const backupError = new Error("backup corrupted");
    service.restoreBackup = jest.fn(() => {
      throw backupError;
    });
    service.cleanWorkspace = jest.fn(() => "workspace");

    const workspace = service.getWorkspace();

    expect(workspace).toBe("workspace");
    expect(logService.log).toHaveBeenNthCalledWith(1, new LoggedEntry(error.message, service, LogLevel.error, false, error.stack));
    expect(service.cleanWorkspace).toHaveBeenCalled();
  });

  test("getWorkspace, something wrong, backup not existing", () => {
    service.nativeService = { os: { homedir: jest.fn(() => "homedir-mock") } };
    logService.log = jest.fn();
    fileService.existsSync = jest.fn(() => false);
    const error = new Error("something wrong");
    service.loadWorkspace = () => {
      throw error;
    };
    service.cleanWorkspace = jest.fn(() => "workspace");

    const workspace = service.getWorkspace();

    expect(workspace).toBe("workspace");
    expect(logService.log).toHaveBeenCalledWith(new LoggedEntry(error.message, service, LogLevel.error, false, error.stack));
    expect(fileService.existsSync).not.toHaveBeenCalledWith("homedir-mock/" + constants.lockFileDestination);
    expect(service.cleanWorkspace).toHaveBeenCalled();
  });

  test("getWorkspace - restoreBackup throws an error", () => {
    service.loadWorkspace = jest.fn(() => {
      throw new Error("error-mock-1");
    });
    service.logService = { log: jest.fn() };
    service.workspaceFileName = constants.lockFileDestination;
    service.nativeService = { os: { homedir: jest.fn(() => "homedir-mock") } };
    service.fileService = { existsSync: jest.fn(() => true) };
    service.restoreBackup = jest.fn(() => {
      throw new Error("error-mock-2");
    });
    service.cleanWorkspace = jest.fn();

    service.getWorkspace();

    expect(service.loadWorkspace).toHaveBeenCalled();
    expect(service.logService.log).toHaveBeenNthCalledWith(1, new LoggedEntry("error-mock-1", this, LogLevel.error, false, null));
    expect(service.nativeService.os.homedir).toHaveBeenCalled();
    expect(service.fileService.existsSync).toHaveBeenCalledWith("homedir-mock/" + constants.lockFileDestination);
    expect(service.restoreBackup).toHaveBeenCalled();
    expect(service.logService.log).toHaveBeenNthCalledWith(2, new LoggedEntry("error-mock-2", this, LogLevel.error, false, null));
    expect(service.cleanWorkspace).toHaveBeenCalled();
  });

  test("createNewWorkspace", () => {
    const result = service.createNewWorkspace();
    expect(result).toBeInstanceOf(Workspace);
    expect((result as any)._workspaceVersion).not.toBe(undefined);
  });

  test("checkConsistency, success", () => {
    const workspace = new Workspace();
    service.save = jest.fn();

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
    expect(service.save).toHaveBeenCalledWith(workspace);
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

  test("checkConsistency, missing integration types", () => {
    const workspace = new Workspace();
    service.save = jest.fn();

    const assertion = { arrayFieldName: "awsSsoIntegrations", idFieldName: "id" };
    workspace[assertion.arrayFieldName].push({ [assertion.idFieldName]: uuid.v4() }, { [assertion.idFieldName]: uuid.v4() });
    service.checkConsistency(workspace);

    expect(workspace.awsSsoIntegrations[0].type).toBe(IntegrationType.awsSso);
    expect(workspace.awsSsoIntegrations[1].type).toBe(IntegrationType.awsSso);
    expect(service.save).toHaveBeenCalledWith(workspace);
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

  test("save", () => {
    service.workspaceFileName = "workspace-file-name-mock";
    service.fileService = { homeDir: jest.fn(() => "homedir-mock"), encryptText: jest.fn(() => "encrypted-text-mock"), writeFileSync: jest.fn() };
    const mockedWorkspace = { mockedObject: "mocked-object", sessions: [] };
    mockedWorkspace.sessions = [{ name: "testName" } as any];
    fileService.encryptText = jest.fn(() => "encryptedText");
    fileService.writeFileSync = jest.fn();

    service.save(mockedWorkspace);

    expect(service.fileService.encryptText).toHaveBeenCalledWith(serialize(mockedWorkspace));
    expect(service.fileService.writeFileSync).toHaveBeenCalledWith("homedir-mock/" + "workspace-file-name-mock", "encrypted-text-mock");
  });

  test("loadWorkspace", () => {
    service.workspaceFileName = "workspace-file-name-mock";
    const decryptedWorkspace = serialize({ mockedObject: "Mocked-object" });
    service.fileService = {
      homeDir: jest.fn(() => "homedir-mock"),
      encryptText: jest.fn(() => "encrypted-text-mock"),
      writeFileSync: jest.fn(),
      decryptText: jest.fn(() => decryptedWorkspace),
      readFileSync: jest.fn(() => "content"),
    };

    service.loadWorkspace();

    expect(service.fileService.readFileSync).toHaveBeenCalledWith("homedir-mock/workspace-file-name-mock");
    expect(service.fileService.decryptText).toHaveBeenCalledWith("content");
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
    service.workspaceFileName = constants.lockFileDestination;
    const decryptedWorkspace = serialize({ mockedObject: "mocked-object" });
    service.fileService = {
      homeDir: jest.fn(() => "homedir-mock"),
      encryptText: jest.fn(() => "encrypted-text-mock"),
      writeFileSync: jest.fn(),
      decryptText: jest.fn(() => decryptedWorkspace),
      readFileSync: jest.fn(() => "content"),
    };
    service.nativeService = { os: { homedir: jest.fn(() => "homedir-mock") } };
    const newWorkspace = { mockedObject: "mocked-object" };
    fileService.writeFileSync = jest.fn();
    fileService.encryptText = jest.fn(() => "encrypted-workspace");
    logService.log = jest.fn();
    service.createNewWorkspace = jest.fn(() => newWorkspace);

    const resultWorkspace = service.cleanWorkspace();

    expect(service.createNewWorkspace).toHaveBeenCalled();
    expect(service.fileService.encryptText).toHaveBeenCalledWith(serialize(newWorkspace));
    expect(service.fileService.writeFileSync).toHaveBeenCalledTimes(2);
    expect(service.fileService.writeFileSync).toHaveBeenNthCalledWith(1, "homedir-mock/" + constants.lockFileDestination, "encrypted-text-mock");
    expect(service.fileService.writeFileSync).toHaveBeenNthCalledWith(2, "homedir-mock/" + constants.lockFileBackupPath, "encrypted-text-mock");
    expect(logService.log).toHaveBeenCalledWith(
      new LoggedEntry("Leapp failed to restore the latest Leapp-lock.json backup. Leapp-lock.json was reinitialized.", service, LogLevel.error, true)
    );
    expect(resultWorkspace).toBe(newWorkspace);
  });
});

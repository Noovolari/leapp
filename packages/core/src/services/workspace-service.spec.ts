import { jest, describe, expect, test } from "@jest/globals";
import { WorkspaceService } from "./workspace-service";
import { Workspace } from "../models/workspace";
import { LoggedException, LogLevel } from "./log-service";

describe("WorkspaceService", () => {
  test("getWorkspace - return an instance of the workspace model", () => {
    const repository = {
      getWorkspace: jest.fn(() => new Workspace()),
    };
    const workspaceService = new WorkspaceService(repository as any);
    expect(workspaceService.getWorkspace()).toBeInstanceOf(Workspace);
    expect(repository.getWorkspace).toHaveBeenCalled();
  });

  test("persistsWorkspace - persist the changes in the workspace", () => {
    let modifiedWorkspace;
    const repository = {
      getWorkspace: jest.fn(() => new Workspace()),
      persistWorkspace: jest.fn((workspace: Workspace) => {
        modifiedWorkspace = Object.assign(workspace, {});
      }),
    };
    const workspaceService = new WorkspaceService(repository as any);
    const newWorkspace = workspaceService.getWorkspace();
    newWorkspace.colorTheme = "testValue";
    workspaceService.persistWorkspace(newWorkspace);
    expect(newWorkspace).toStrictEqual(modifiedWorkspace);
    expect(repository.persistWorkspace).toHaveBeenCalled();
  });

  test("workspaceExists - verify if the workspace exists or not", () => {
    const repository = {
      getWorkspace: jest.fn(() => new Workspace()),
    };
    const workspaceService = new WorkspaceService(repository as any);
    expect(workspaceService.workspaceExists()).toStrictEqual(true);
    expect(repository.getWorkspace).toHaveBeenCalled();
  });

  test("getDefaultProfileId", () => {
    const profiles = [
      { id: "1", name: "10" },
      { id: "2", name: "default" },
      { id: "3", name: "30" },
    ];
    const repository = {
      getDefaultProfileId: jest.fn(() => {
        const name = profiles.find((p) => p.name === "default")?.id;
        if (name) {
          return name;
        } else {
          throw new LoggedException(`no default named profile found.`, this, LogLevel.warn);
        }
      }),
    } as any;
    const workspaceService = new WorkspaceService(repository);
    expect(workspaceService.getDefaultProfileId()).toBe("2");

    profiles.splice(1, 1);
    expect(() => workspaceService.getDefaultProfileId()).toThrow(new LoggedException(`no default named profile found.`, this, LogLevel.warn));
    expect(repository.getDefaultProfileId).toHaveBeenCalled();
  });

  test("createWorkspace", () => {
    const repository = {
      createWorkspace: jest.fn(() => {}),
    };
    const workspaceService = new WorkspaceService(repository as any);
    workspaceService.createWorkspace();
    expect(repository.createWorkspace).toHaveBeenCalled();
  });

  test("removeWorkspace", () => {
    const repository = {
      removeWorkspace: jest.fn(() => {}),
    };
    const workspaceService = new WorkspaceService(repository as any);
    workspaceService.removeWorkspace();
    expect(repository.removeWorkspace).toHaveBeenCalled();
  });

  test("reloadWorkspace", () => {
    const repository = {
      reloadWorkspace: jest.fn(() => {}),
    };
    const workspaceService = new WorkspaceService(repository as any);
    workspaceService.reloadWorkspace();
    expect(repository.reloadWorkspace).toHaveBeenCalled();
  });

  test("setWorkspaceFileName", () => {
    const repository = {
      workspaceFileName: "",
    };
    const workspaceService = new WorkspaceService(repository as any);
    workspaceService.setWorkspaceFileName("mock-name");
    expect(repository.workspaceFileName).toEqual("mock-name");
  });

  test("getWorkspaceFileName", () => {
    const repository = {
      workspaceFileName: "mock-name",
    };
    const workspaceService = new WorkspaceService(repository as any);
    const result = workspaceService.getWorkspaceFileName();
    expect(result).toEqual("mock-name");
  });

  test("extractGlobalSettings", () => {
    const repository = {
      globalSettings: "mock-global-settings",
    };
    const workspaceService = new WorkspaceService(repository as any);
    const result = workspaceService.extractGlobalSettings();
    expect(result).toEqual("mock-global-settings");
  });

  test("extractGlobalSettings, by passing parameters", () => {
    const repository = {
      globalSettings: { remoteWorkspacesSettingsMap: {} },
      getProfiles: jest.fn(() => [{ id: "mocked-profile-id", name: "mocked-profile-name" }]),
    };
    const workspaceService = new WorkspaceService(repository as any);
    const result = workspaceService.extractGlobalSettings("mocked-user-id", "mocked-team-id", [
      { sessionId: "mocked-session-id", profileId: "mocked-profile-id", region: "mocked-region" },
    ] as any);
    expect(result).toEqual({
      remoteWorkspacesSettingsMap: {
        "mocked-team-id-mocked-user-id": { "mocked-session-id": { profileName: "mocked-profile-name", region: "mocked-region" } },
      },
    });
  });

  test("applyGlobalSettings, without purging any remote pinned sessions", () => {
    const repository = {
      globalSettings: "",
    };
    const workspaceService = new WorkspaceService(repository as any);
    workspaceService.applyGlobalSettings("mock-global-settings" as any, []);
    expect(repository.globalSettings).toEqual("mock-global-settings");
  });

  test("applyGlobalSettings, purge remote pinned sessions which are no longer available after syncing", () => {
    const mockedGlobalSettings = {
      pinned: ["id1", "id2", "id3", "id4"],
    } as any;
    const localSessions = [{ sessionId: "id1" }] as any;
    const remoteSessionIds = ["id2", "id3"];
    const repository = {
      globalSettings: {},
    };
    const workspaceService = new WorkspaceService(repository as any);
    workspaceService.applyGlobalSettings(mockedGlobalSettings, localSessions, remoteSessionIds);
    expect(repository.globalSettings).toEqual({ pinned: ["id1", "id2", "id3"] });
  });
});

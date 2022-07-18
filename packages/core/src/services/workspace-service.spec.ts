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
});

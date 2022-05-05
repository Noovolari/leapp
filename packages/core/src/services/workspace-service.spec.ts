import { jest, describe, expect, test } from "@jest/globals";
import { WorkspaceService } from "./workspace-service";
import { Workspace } from "../models/workspace";

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
});

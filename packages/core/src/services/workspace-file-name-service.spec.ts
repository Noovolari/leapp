import { WorkspaceFileNameService } from "./workspace-file-name-service";
import { constants } from "../models/constants";
import { describe, test, expect, jest } from "@jest/globals";

describe("WorkspaceFileNameService", () => {
  test("constructor", () => {
    const workspaceFileNameService = new WorkspaceFileNameService();
    expect(workspaceFileNameService.workspaceFileName).toBe(constants.lockFileDestination);
  });

  test("workspaceFileName - get", () => {
    jest.spyOn(WorkspaceFileNameService.prototype, "workspaceFileName", "get").mockReturnValue("workspace-file-name-mock");
    const workspaceFileNameService = new WorkspaceFileNameService();
    const result = workspaceFileNameService.workspaceFileName;
    expect(result).toBe("workspace-file-name-mock");
  });

  test("workspaceFileName - set", () => {
    const workspaceFileNameService = new WorkspaceFileNameService();
    jest.spyOn(WorkspaceFileNameService.prototype, "workspaceFileName", "set").mockImplementation((fileName) => {
      (workspaceFileNameService as any)._workspaceFileName = fileName;
    });
    workspaceFileNameService.workspaceFileNameBehaviouralSubject.next = jest.fn(async () => {});
    workspaceFileNameService.workspaceFileName = "workspace-file-name-mock";
    expect((workspaceFileNameService as any)._workspaceFileName).toBe("workspace-file-name-mock");
    //TODO: verify if it's possible to test the workspaceFileNameService.workspaceFileNameBehaviouralSubject.next mock call
    //expect(workspaceFileNameService.workspaceFileNameBehaviouralSubject.next).toHaveBeenCalledWith("workspace-file-name-mock");
  });

  test("getWorkspaceName - workspaceFileName === constants.lockFileDestination", () => {
    const workspaceFileNameService = new WorkspaceFileNameService();
    jest.spyOn(WorkspaceFileNameService.prototype, "workspaceFileName", "get").mockReturnValue(constants.lockFileDestination);
    const result = workspaceFileNameService.getWorkspaceName();
    expect(result).toBe("My Workspace");
  });

  test("getWorkspaceName - workspaceFileName !== constants.lockFileDestination", () => {
    const workspaceFileNameService = new WorkspaceFileNameService();
    jest.spyOn(WorkspaceFileNameService.prototype, "workspaceFileName", "get").mockReturnValue(".Leapp/Leapp-some-value-mock-lock.json");
    const result = workspaceFileNameService.getWorkspaceName();
    expect(result).toBe("some-value-mock");
  });
});

import { describe, test } from "@jest/globals";
import { WorkspaceConsistencyService } from "./workspace-consistency-service";

describe("WorkspaceConsistencyService", () => {
  test("getWorkspace", () => {
    new WorkspaceConsistencyService(null, null, null);
  });
});

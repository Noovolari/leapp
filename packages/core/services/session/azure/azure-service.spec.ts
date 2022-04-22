import { AzureService } from "./azure-service";

describe("AzureService", () => {
  test("getDependantSessions", () => {
    const azureService = new AzureService(null, null, null, null, null);
    const dependantSessions = azureService.getDependantSessions("sessionId");

    expect(dependantSessions).toEqual([]);
  });
});

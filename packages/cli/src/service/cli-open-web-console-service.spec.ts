import { describe, test, jest, expect } from "@jest/globals";

describe("CliOpenWebConsoleService", () => {
  test("openExternalUrl", async () => {
    const mockOpenFunction = jest.fn();
    jest.mock("open", () => mockOpenFunction);
    const { CliOpenWebConsoleService: serviceClass } = await import("./cli-open-web-console-service");

    const cliOpenWebConsoleService = new serviceClass();
    const url = "http://www.url.com";
    await cliOpenWebConsoleService.openExternalUrl(url);
    expect(mockOpenFunction).toHaveBeenCalledWith(url);
  });
});

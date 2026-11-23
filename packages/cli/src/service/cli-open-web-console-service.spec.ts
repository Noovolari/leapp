import { describe, test, jest, expect, beforeEach } from "@jest/globals";
import { LoggedException } from "@noovolari/leapp-core/services/log-service";

const mockOpenFunction = jest.fn();
jest.mock("open", () => mockOpenFunction);

describe("CliOpenWebConsoleService", () => {
  beforeEach(() => mockOpenFunction.mockClear());

  test("openExternalUrl", async () => {
    const { CliOpenWebConsoleService: serviceClass } = await import("./cli-open-web-console-service");

    const cliOpenWebConsoleService = new serviceClass();
    const url = "https://www.url.com";
    await cliOpenWebConsoleService.openExternalUrl(url);
    expect(mockOpenFunction).toHaveBeenCalledWith(url);
  });

  test("the CLI opens https and mailto links", async () => {
    const { CliOpenWebConsoleService: serviceClass } = await import("./cli-open-web-console-service");
    const service = new serviceClass();
    await service.openExternalUrl("https://us-east-1.signin.aws.amazon.com/oauth?Action=logout");
    await service.openExternalUrl("mailto:support@example.com");
    expect(mockOpenFunction.mock.calls).toEqual([["https://us-east-1.signin.aws.amazon.com/oauth?Action=logout"], ["mailto:support@example.com"]]);
  });

  test.each(["file:///etc/passwd", "javascript:alert(1)", "smb://host/share", "http://plain.example/", "not a url"])(
    "the CLI refuses %s and opens nothing",
    async (url) => {
      const { CliOpenWebConsoleService: serviceClass } = await import("./cli-open-web-console-service");
      const service = new serviceClass();
      await expect(service.openExternalUrl(url)).rejects.toEqual(expect.any(LoggedException));
      await expect(service.openExternalUrl(url)).rejects.toThrow("Leapp can only open https and mailto links");
      expect(mockOpenFunction).not.toHaveBeenCalled();
    }
  );
});

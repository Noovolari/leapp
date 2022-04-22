import { describe, jest, expect, test } from "@jest/globals";
import { CliAwsSsoOidcVerificationWindowService } from "./cli-aws-sso-oidc-verification-window-service";
import * as process from "process";

describe("CliAwsSsoOidcVerificationWindowService", () => {
  if (process.env["SKIP_INTEGRATION_TESTS"]) {
    test("Skipping integration tests", () => {});
    return;
  }

  test("openVerificationWindow", async () => {
    const registerClientResponse = { clientId: "clientId", clientSecret: "clientSecret" } as any;
    const startDeviceAuthorizationResponse = { verificationUriComplete: "verUri", deviceCode: "deviceCode" } as any;

    const cliAwsSsoOidcVerificationWindowService = new CliAwsSsoOidcVerificationWindowService();
    const page = { goto: jest.fn() };
    (cliAwsSsoOidcVerificationWindowService as any).getNavigationPage = async () => page;

    const verificationResponse = await cliAwsSsoOidcVerificationWindowService.openVerificationWindow(
      registerClientResponse,
      startDeviceAuthorizationResponse
    );

    expect(verificationResponse).toEqual({
      clientId: "clientId",
      clientSecret: "clientSecret",
      deviceCode: "deviceCode",
    });
    expect(page.goto).toHaveBeenCalledWith("verUri");
  });

  test("getNavigationPage and closeBrowser", async () => {
    const cliAwsSsoOidcVerificationWindowService = new CliAwsSsoOidcVerificationWindowService();
    const page = await (cliAwsSsoOidcVerificationWindowService as any).getNavigationPage(false);

    const browserProcess = page.browser().process();
    expect(browserProcess).toBeDefined();
    expect(browserProcess?.killed).toBeFalsy();
    expect(browserProcess?.signalCode).toBeNull();

    await cliAwsSsoOidcVerificationWindowService.closeBrowser();
    expect(browserProcess?.killed).toBeTruthy();
    expect(browserProcess?.signalCode).toEqual("SIGKILL");
  });

  test("closeBrowser, no opened browser", async () => {
    const cliAwsSsoOidcVerificationWindowService = new CliAwsSsoOidcVerificationWindowService();
    await cliAwsSsoOidcVerificationWindowService.closeBrowser();
  });
});

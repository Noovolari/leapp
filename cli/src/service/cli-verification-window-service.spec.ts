import { describe, jest, expect, test } from "@jest/globals";
import { CliAwsSsoOidcVerificationWindowService } from "./cli-aws-sso-oidc-verification-window-service";

describe("CliVerificationWindowService", () => {
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

    const process = page.browser().process();
    expect(process).toBeDefined();
    expect(process?.killed).toBeFalsy();
    expect(process?.signalCode).toBeNull();

    await cliAwsSsoOidcVerificationWindowService.closeBrowser();
    expect(process?.killed).toBeTruthy();
    expect(process?.signalCode).toEqual("SIGKILL");
  });

  test("closeBrowser, no opened browser", async () => {
    const cliAwsSsoOidcVerificationWindowService = new CliAwsSsoOidcVerificationWindowService();
    await cliAwsSsoOidcVerificationWindowService.closeBrowser();
  });
});

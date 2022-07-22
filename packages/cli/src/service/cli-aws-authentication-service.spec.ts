import { jest, describe, expect, test } from "@jest/globals";
import { CliAwsSamlAuthenticationService } from "./cli-aws-saml-authentication-service";
import { of } from "rxjs";
import { Page, HTTPRequest } from "puppeteer";
import { CloudProviderType } from "@hesketh-racing/leapp-core/models/cloud-provider-type";
import * as process from "process";

class PageStub {
  public onPageCalled;
  public gotoPageCalled;
  public onEventCalledTimes;
  private callback: Map<string, (request: HTTPRequest) => Promise<void>>;

  constructor(public expectedIdpUrl: string, public requestStub: any) {
    this.onPageCalled = false;
    this.gotoPageCalled = false;
    this.onEventCalledTimes = 0;
    this.callback = new Map<string, (request: HTTPRequest) => Promise<void>>();
  }

  on(param: string, callback: any) {
    this.onPageCalled = true;
    if (this.onEventCalledTimes === 0) {
      expect(param).toEqual("request");
    } else {
      expect(param).toEqual("close");
    }

    expect(callback).toBeDefined();
    this.callback.set(param, callback);
    this.onEventCalledTimes++;
  }

  async goto(url: string) {
    this.gotoPageCalled = true;
    expect(url).toEqual(this.expectedIdpUrl);
    await this.callback.get("request")(this.requestStub);
    return Promise.reject(new Error("errors in goto must be handled"));
  }
}

describe("CliAwsAuthenticationService", () => {
  if (process.env["SKIP_INTEGRATION_TESTS"]) {
    test("Skipping integration tests", () => {});
    return;
  }

  const cases = [true, false];
  test.each(cases)("needAuthentication: %p", async (needAuthentication) => {
    const idpUrl = "https://idpUrl";
    const page = new PageStub(idpUrl, {
      url: () => idpUrl,
      isInterceptResolutionHandled: () => false,
      continue: async () => Promise.resolve(),
    });
    const authenticationService = {
      isAuthenticationUrl: jest.fn(() => needAuthentication),
      isSamlAssertionUrl: jest.fn(() => !needAuthentication),
    };

    const cliAwsAuthenticationService = new CliAwsSamlAuthenticationService(authenticationService as any);
    cliAwsAuthenticationService.getNavigationPage = async (headlessMode: boolean) => {
      expect(headlessMode).toBeTruthy();
      return of(page as unknown as Page).toPromise();
    };

    expect(await cliAwsAuthenticationService.needAuthentication(idpUrl)).toBe(needAuthentication);
    expect(authenticationService.isAuthenticationUrl).toHaveBeenCalledWith(CloudProviderType.aws, idpUrl);
    expect(authenticationService.isSamlAssertionUrl).toHaveBeenCalledWith(CloudProviderType.aws, idpUrl);
    expect(page.onPageCalled).toBeTruthy();
    expect(page.gotoPageCalled).toBeTruthy();
  });

  test("awsSignIn - saml assertion true", async () => {
    const idpUrl = "https://idpUrl";
    const needToAuthenticate = false;
    const page = new PageStub(idpUrl, {
      url: () => "samlUrl",
      isInterceptResolutionHandled: () => false,
      postData: () => "postData",
      continue: async () => Promise.resolve(),
    });

    const authenticationService = {
      isSamlAssertionUrl: jest.fn(() => true),
      extractAwsSamlResponse: (responseHookDetails: any) => {
        expect(responseHookDetails.uploadData[0].bytes.toString()).toBe("postData");

        return "samlResponse";
      },
    };
    const cliAwsAuthenticationService = new CliAwsSamlAuthenticationService(authenticationService as any);
    cliAwsAuthenticationService.getNavigationPage = async (headlessMode: boolean) => {
      expect(headlessMode).toEqual(!needToAuthenticate);
      return of(page as unknown as Page).toPromise();
    };

    const result = await cliAwsAuthenticationService.awsSignIn(idpUrl, needToAuthenticate);
    expect(result).toBe("samlResponse");
    expect(page.onPageCalled).toBeTruthy();
    expect(page.gotoPageCalled).toBeTruthy();
    expect(authenticationService.isSamlAssertionUrl).toHaveBeenCalledWith(CloudProviderType.aws, "samlUrl");
  });

  test("awsSignIn - saml assertion false", async () => {
    const idpUrl = "https://idpUrl";
    const needToAuthenticate = false;
    const page = new PageStub(idpUrl, {
      url: () => "wrongSamlUrl",
      isInterceptResolutionHandled: () => false,
      postData: () => "postData",
      continue: async () => Promise.resolve(),
    });

    let requestCounter = 0;
    const authenticationService = {
      isSamlAssertionUrl: jest.fn(() => {
        requestCounter++;
        if (requestCounter === 1) {
          page.goto(idpUrl).catch(() => null);
          return false;
        } else {
          return true;
        }
      }),
      extractAwsSamlResponse: (responseHookDetails: any) => {
        expect(responseHookDetails.uploadData[0].bytes.toString()).toBe("postData");

        return "samlResponse";
      },
    };

    const cliAwsAuthenticationService = new CliAwsSamlAuthenticationService(authenticationService as any);
    cliAwsAuthenticationService.getNavigationPage = async (headlessMode: boolean) => {
      expect(headlessMode).toEqual(!needToAuthenticate);
      return of(page as unknown as Page).toPromise();
    };

    const result = await cliAwsAuthenticationService.awsSignIn(idpUrl, needToAuthenticate);
    expect(result).toBe("samlResponse");
    expect(page.onPageCalled).toBeTruthy();
    expect(page.gotoPageCalled).toBeTruthy();
    expect(authenticationService.isSamlAssertionUrl).toHaveBeenCalledWith(CloudProviderType.aws, "wrongSamlUrl");
    expect(requestCounter).toBe(2);
  });

  test("getNavigationPage and closeAuthenticationWindow", async () => {
    const cliAwsAuthenticationService = new CliAwsSamlAuthenticationService(null);

    const page = await cliAwsAuthenticationService.getNavigationPage(false);
    const browserProcess = page.browser().process();
    expect(browserProcess).toBeDefined();
    expect(browserProcess?.killed).toBeFalsy();
    expect(browserProcess?.signalCode).toBeNull();

    await cliAwsAuthenticationService.closeAuthenticationWindow();
    expect(browserProcess?.killed).toBeTruthy();
    expect(browserProcess?.signalCode).toEqual("SIGKILL");
  });
});

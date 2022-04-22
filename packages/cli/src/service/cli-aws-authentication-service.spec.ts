import { jest, describe, expect, test } from "@jest/globals";
import { CliAwsAuthenticationService } from "./cli-aws-authentication-service";
import { of } from "rxjs";
import { Page, HTTPRequest } from "puppeteer";
import { CloudProviderType } from "@noovolari/leapp-core/models/cloud-provider-type";

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

    const cliAwsAuthenticationService = new CliAwsAuthenticationService(authenticationService as any);
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
    const cliAwsAuthenticationService = new CliAwsAuthenticationService(authenticationService as any);
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

    const cliAwsAuthenticationService = new CliAwsAuthenticationService(authenticationService as any);
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
    const cliAwsAuthenticationService = new CliAwsAuthenticationService(null);

    const page = await cliAwsAuthenticationService.getNavigationPage(false);
    const process = page.browser().process();
    expect(process).toBeDefined();
    expect(process?.killed).toBeFalsy();
    expect(process?.signalCode).toBeNull();

    await cliAwsAuthenticationService.closeAuthenticationWindow();
    expect(process?.killed).toBeTruthy();
    expect(process?.signalCode).toEqual("SIGKILL");
  });
});

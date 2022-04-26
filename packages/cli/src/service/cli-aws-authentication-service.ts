import puppeteer from "puppeteer";
import { IAwsSamlAuthenticationService } from "@noovolari/leapp-core/interfaces/i-aws-saml-authentication-service";
import { LeappModalClosedError } from "@noovolari/leapp-core/errors/leapp-modal-closed-error";
import { AwsSamlAssertionExtractionService } from "@noovolari/leapp-core/services/aws-saml-assertion-extraction-service";
import { CloudProviderType } from "@noovolari/leapp-core/models/cloud-provider-type";

export class CliAwsSamlAuthenticationService implements IAwsSamlAuthenticationService {
  private browser: puppeteer.Browser;

  constructor(private awsSamlAssertionExtractionService: AwsSamlAssertionExtractionService) {}

  async needAuthentication(idpUrl: string): Promise<boolean> {
    // eslint-disable-next-line
    return new Promise(async (resolve, reject) => {
      const page = await this.getNavigationPage(true);

      page.on("request", async (request) => {
        if (request.isInterceptResolutionHandled()) {
          reject("request unexpectedly already handled");
          return;
        }

        const requestUrl = request.url().toString();
        if (this.awsSamlAssertionExtractionService.isAuthenticationUrl(CloudProviderType.aws, requestUrl)) {
          resolve(true);
        }
        if (this.awsSamlAssertionExtractionService.isSamlAssertionUrl(CloudProviderType.aws, requestUrl)) {
          resolve(false);
        }
        await request.continue();
      });

      try {
        await page.goto(idpUrl);
      } catch (e) {}
    });
  }

  async awsSignIn(idpUrl: string, needToAuthenticate: boolean): Promise<string> {
    // eslint-disable-next-line
    return new Promise(async (resolve, reject) => {
      const page = await this.getNavigationPage(!needToAuthenticate);

      page.on("request", async (request) => {
        if (request.isInterceptResolutionHandled()) {
          reject("request unexpectedly already handled");
          return;
        }

        const requestUrl = request.url().toString();
        if (this.awsSamlAssertionExtractionService.isSamlAssertionUrl(CloudProviderType.aws, requestUrl)) {
          const responseHookDetails = { uploadData: [{ bytes: { toString: () => request.postData() } } as any] };
          resolve(this.awsSamlAssertionExtractionService.extractAwsSamlResponse(responseHookDetails));
          return;
        }

        await request.continue();
      });

      page.on("close", () => {
        reject(new LeappModalClosedError(this, "request window closed by user"));
      });

      try {
        await page.goto(idpUrl);
      } catch (e) {}
    });
  }

  async closeAuthenticationWindow(): Promise<void> {
    if (this.browser) {
      for (const page of await this.browser.pages()) {
        page.removeAllListeners();
        await page.close();
      }

      await this.browser.close();
    }
  }

  async getNavigationPage(headlessMode: boolean): Promise<puppeteer.Page> {
    this.browser = await puppeteer.launch({ headless: headlessMode, devtools: false });
    const pages = await this.browser.pages();
    const page = pages.length > 0 ? pages[0] : await this.browser.newPage();

    await page.setDefaultNavigationTimeout(180000);
    await page.setRequestInterception(true);

    return page;
  }
}

import { beforeAll, afterAll, beforeEach, afterEach, expect, describe, test } from "@jest/globals";
import { env } from "./.env";
import chromedriver from "chromedriver";
import { ThenableWebDriver, WebElement, Builder, By, until } from "selenium-webdriver";
import * as path from "path";
import * as os from "os";
// import { STSClient, GetCallerIdentityCommand, GetCallerIdentityCommandInput } from "@aws-sdk/client-sts";

const linuxPath = path.resolve(".", "node_modules/electron/dist/electron");
const macPath = path.resolve(".", "node_modules/electron/dist/Electron.app/Contents/MacOS/Electron");
const winPath = path.resolve(".", "node_modules\\electron\\dist\\electron.exe");
const electronBinaryPaths = {
  darwin: macPath,
  linux: linuxPath,
  win32: winPath,
};
const electronBinaryPath = electronBinaryPaths[os.platform()];

export const generateDriver = async (): Promise<any> => {
  const serverHost = `http://localhost:9515`;
  return new Builder()
    .usingServer(serverHost)
    .withCapabilities({
      "goog:chromeOptions": {
        binary: electronBinaryPath,
        args: [`app=${path.resolve(".")}`],
      },
    })
    .forBrowser("chrome")
    .build();
};

export const selectElementByCss = async (selector: string, driver: ThenableWebDriver): Promise<WebElement> =>
  driver.wait(until.elementLocated(By.css(selector)), 60000);

export const clickOnAddSessionButton = async (driver: ThenableWebDriver): Promise<void> => {
  const addSessionButton = await selectElementByCss('button[mattooltip="Add a new Session"]', driver);
  await addSessionButton.click();
};

export const selectElementWithInnerText = async (text: string, selector: By, driver: ThenableWebDriver): Promise<WebElement> => {
  const elements = await driver.findElements(selector);
  const element = await Promise.all(elements.map((el) => (async () => ({ el, text: await el.getText() }))()));
  return element.find((el) => el.text.includes(text)).el;
};

export const clickOnStrategyButton = async (strategy: string, driver: ThenableWebDriver): Promise<void> => {
  const strategyButtonSelector = By.css(".strategy-list button");
  await driver.wait(until.elementLocated(strategyButtonSelector), 20000);
  const awsButton = await selectElementWithInnerText(strategy, strategyButtonSelector, driver);
  await awsButton.click();
};

export const pause = (timeout: number): Promise<boolean> =>
  new Promise((resolve, _) => {
    const timeoutId = setTimeout(() => {
      clearTimeout(timeoutId);
      resolve(true);
    }, timeout);
  });

export const waitUntilDisplayed = (selector: string, expectDisplayToBe: boolean, driver: ThenableWebDriver): Promise<boolean> =>
  new Promise((resolve, _) => {
    let intervalId = null;
    const timeoutId = setTimeout(() => {
      // Resolve in case of unexpected errors that would make the method run endlessly
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      resolve(false);
    }, 20000);

    intervalId = setInterval(async () => {
      if (expectDisplayToBe === false) {
        // Resolve when the element is not present in the page anymore throwing a not such element exception
        try {
          await driver.findElement(By.css(selector));
        } catch (err) {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          resolve(true);
        }
      } else {
        try {
          await driver.findElement(By.css(selector));
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          resolve(true);
        } catch (err) {}
      }
    }, 500);
  });

describe("Leapp integration tests", () => {
  const testTimeout = 60000;
  let driver;

  beforeAll(async () => {
    await chromedriver.start(undefined, true);
  }, testTimeout);

  afterAll(async () => {
    chromedriver.stop();
    await pause(5000);
  }, testTimeout);

  beforeEach(async () => {
    try {
      await pause(5000);
      driver = await generateDriver();
    } catch (err) {
      console.error(err);
    }
  }, testTimeout);

  afterEach(async () => {
    await driver.quit();
  }, testTimeout);

  test(
    "Integration test 1",
    async () => {
      await clickOnAddSessionButton(driver);

      const strategyButtonSelector = By.css(".strategy-list button");
      await driver.wait(until.elementLocated(strategyButtonSelector));
      const strategyButtons = await driver.findElements(strategyButtonSelector);
      expect(strategyButtons.length).toBe(4);

      const buttons = await Promise.all(strategyButtons.map((button) => (async () => ({ button, text: await button.getText() }))()));
      const awsButton = buttons.find((button) => button.text.includes("AWS")).button;

      await awsButton.click();
    },
    testTimeout
  );

  test(
    "Integration test 2",
    async () => {
      await clickOnAddSessionButton(driver);
      await clickOnStrategyButton("AWS", driver);
      const sessionTypeOption = await selectElementByCss('ng-select[placeholder="Select Session Strategy"]', driver);
      await sessionTypeOption.click();

      const selectedSessionType = await selectElementWithInnerText("AWS IAM User", By.css("div span.ng-option-label"), driver);
      await selectedSessionType.click();

      const sessionAlias = await selectElementByCss('input[placeholder="Session Alias *"]', driver);
      await sessionAlias.sendKeys("selenium-session");

      const sessionAccessKey = await selectElementByCss('input[placeholder="Access Key ID *"]', driver);
      await sessionAccessKey.sendKeys(env.awsIamUserTest.accessKeyId);

      const sessionSecretAccessKey = await selectElementByCss('input[placeholder="Secret Access Key *"]', driver);
      await sessionSecretAccessKey.sendKeys(env.awsIamUserTest.secretAccessKey);

      const createButton = await selectElementWithInnerText("Create Session", By.css("button"), driver);
      await createButton.click();

      const seleniumSession = await selectElementWithInnerText("selenium-session", By.css("td div.session-name-td"), driver);
      await seleniumSession.click();

      const playButton = await selectElementByCss("a.start-session", driver);
      await waitUntilDisplayed("div.holder", false, driver);
      await playButton.click();

      await seleniumSession.click();

      // const stopButton = await selectElementByCss("a.stop-session", driver);
      //
      // const client = new STSClient({});
      // const command = new GetCallerIdentityCommand({});
      // const validResponse = await client.send(command);
      // expect(validResponse).toMatchObject({
      //   ["UserId"]: "xxx",
      //   ["Account"]: "xxx",
      //   ["Arn"]: "xxx",
      // });
      //
      // await stopButton.click();
      //
      // await seleniumSession.click();
      // await selectElementByCss("a.start-session", driver);
      //
      // const client2 = new STSClient({});
      // const invalidResponse = await client2.send(command);
      // console.log(invalidResponse);
    },
    testTimeout
  );
});

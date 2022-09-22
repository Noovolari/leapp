import { describe, test } from "@jest/globals";
import { Builder, By, ThenableWebDriver, until, WebElement } from "selenium-webdriver";
import path from "path";
import os from "os";
import { env } from "./.env";

const serverHost = "http://localhost:9515";
const linuxPath = path.resolve(".", "node_modules/electron/dist/electron");
const macPath = path.resolve(".", "node_modules/electron/dist/Electron.app/Contents/MacOS/Electron");
const winPath = path.resolve(".", "node_modules\\electron\\dist\\electron.exe");
const electronBinaryPath = {
  darwin: macPath,
  linux: linuxPath,
  win32: winPath,
};

export const generateDriver = async (): Promise<any> =>
  new Builder()
    .usingServer(serverHost)
    .withCapabilities({
      "goog:chromeOptions": {
        binary: electronBinaryPath[os.platform()],
        args: [`app=${path.resolve(".")}`],
      },
    })
    .forBrowser("chrome")
    .build();

export const selectElementByCss = async (selector: string, driver: ThenableWebDriver): Promise<WebElement> => {
  console.log("waiting 60 seconds - driver wait");
  return driver.wait(until.elementLocated(By.css(selector)), 60000);
};

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
    console.log("in wait until displayed...");
    const timeoutId = setTimeout(() => {
      // Resolve in case of unexpected errors that would make the method run endlessly
      clearTimeout(timeoutId);
      resolve(false);
    }, 20000);

    const intervalId = setInterval(async () => {
      if (expectDisplayToBe === false) {
        // Resolve when the element is not present in the page anymore throwing a not such element exception
        try {
          console.log("executing set interval callback...");
          await driver.findElement(By.css(selector));
        } catch (err) {
          clearInterval(intervalId);
          resolve(true);
        }
      } else {
        try {
          await driver.findElement(By.css(selector));
          clearInterval(intervalId);
          resolve(true);
        } catch (err) {}
      }
    }, 500);
  });

describe("Integration test 1", () => {
  const testTimeout = 60000;
  let driver;

  beforeEach(async () => {
    console.log("in before each...");
    driver = await generateDriver();
    console.log("created succesfully");
  }, testTimeout);

  afterEach(async () => {
    console.log("in after each...");
    await driver.quit();
    console.log("quit succesfully");
  }, testTimeout);

  test(
    "my integration test 1",
    async () => {
      console.log("in integration test 1...");
      console.log(driver);
      await clickOnAddSessionButton(driver);

      const strategyButtonSelector = By.css(".strategy-list button");
      await driver.wait(until.elementLocated(strategyButtonSelector));
      const strategyButtons = await driver.findElements(strategyButtonSelector);
      expect(strategyButtons.length).toBe(3);

      console.log("expect executed correctly...");

      const buttons = await Promise.all(strategyButtons.map((button) => (async () => ({ button, text: await button.getText() }))()));
      const awsButton = buttons.find((button) => button.text.includes("AWS")).button;

      await awsButton.click();
    },
    testTimeout
  );

  test(
    "create session",
    async () => {
      console.log("in integration test 2...");
      console.log(driver);

      console.log("before clickOnAddSessionButton...");
      await clickOnAddSessionButton(driver);
      console.log("before clickOnStrategyButton...");
      await clickOnStrategyButton("AWS", driver);
      console.log("before selectElementByCss...");
      const sessionTypeOption = await selectElementByCss('ng-select[placeholder="Select Session Strategy"]', driver);
      console.log("before click...");
      await sessionTypeOption.click();

      console.log("before selectElementWithInnerText...");
      const selectedSessionType = await selectElementWithInnerText("AWS IAM User", By.css("div span.ng-option-label"), driver);
      console.log("before click 2...");
      await selectedSessionType.click();

      console.log("about to create a session...");

      const sessionAlias = await selectElementByCss('input[placeholder="Session Alias *"]', driver);
      await sessionAlias.sendKeys("selenium-session");

      const sessionAccessKey = await selectElementByCss('input[placeholder="Access Key ID *"]', driver);
      await sessionAccessKey.sendKeys(env.awsIamUserTest.accessKeyId);

      const sessionSecretAccessKey = await selectElementByCss('input[placeholder="Secret Access Key *"]', driver);
      await sessionSecretAccessKey.sendKeys(env.awsIamUserTest.secretAccessKey);

      console.log("pressing the button...");

      const createButton = await selectElementWithInnerText("Create Session", By.css("button"), driver);
      await createButton.click();

      const seleniumSession = await selectElementWithInnerText("selenium-session", By.css("td div.session-name-td"), driver);
      await seleniumSession.click();

      const playButton = await selectElementByCss("a.start-session", driver);

      console.log("before wait until displayed..");

      await waitUntilDisplayed("div.holder", false, driver);

      await playButton.click();
    },
    testTimeout
  );
});

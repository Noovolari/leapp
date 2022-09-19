import { describe, test, expect } from "@jest/globals";
import { Builder, By, until, WebElement } from "selenium-webdriver";
import * as path from "path";
import * as os from "os";

describe("Integration test 1", () => {
  const testTimeout = 60000;
  let driver;
  const linuxPath = path.resolve(".", "node_modules/electron/dist/electron");
  const macPath = path.resolve(".", "node_modules/electron/dist/Electron.app/Contents/MacOS/Electron");
  const winPath = path.resolve(".", "node_modules\\electron\\dist\\electron.exe");
  const electronBinaryPath = {
    darwin: macPath,
    linux: linuxPath,
    win32: winPath,
  };

  const pause = (timeout) =>
    new Promise((resolve, _) => {
      setTimeout(() => {
        resolve(true);
      }, timeout);
    });

  beforeEach(async () => {
    driver = await new Builder()
      .usingServer("http://localhost:9515")
      .withCapabilities({
        "goog:chromeOptions": {
          binary: electronBinaryPath[os.platform()],
          args: [`app=${path.resolve(".")}`],
        },
      })
      .forBrowser("chrome")
      .build();
  }, testTimeout);

  afterEach(async () => {
    await driver.quit();
  }, testTimeout);

  const selectElementByCss = async (selector: string): Promise<WebElement> => await driver.wait(until.elementLocated(By.css(selector)), 10000);

  const clickOnAddSessionButton = async () => {
    const addSessionButton = await selectElementByCss('button[mattooltip="Add a new Session"]');
    await addSessionButton.click();
  };

  const selectElementWithInnerText = async (text: string, selector: By) => {
    const elements = await driver.findElements(selector);
    const element = await Promise.all(elements.map((el) => (async () => ({ el, text: await el.getText() }))()));
    return element.find((el) => el.text.includes(text)).el;
  };

  const clickOnStrategyButton = async (strategy: string) => {
    const strategyButtonSelector = By.css(".strategy-list button");
    await driver.wait(until.elementLocated(strategyButtonSelector));
    const awsButton = await selectElementWithInnerText(strategy, strategyButtonSelector);
    await awsButton.click();
  };

  test(
    "my integration test 1",
    async () => {
      await clickOnAddSessionButton();

      const strategyButtonSelector = By.css(".strategy-list button");
      await driver.wait(until.elementLocated(strategyButtonSelector));
      const strategyButtons = await driver.findElements(strategyButtonSelector);
      expect(strategyButtons.length).toBe(3);

      const buttons = await Promise.all(strategyButtons.map((button) => (async () => ({ button, text: await button.getText() }))()));
      const awsButton = buttons.find((button) => button.text.includes("AWS")).button;

      await awsButton.click();
    },
    testTimeout
  );

  test(
    "create session",
    async () => {
      await clickOnAddSessionButton();
      await clickOnStrategyButton("AWS");
      const sessionTypeOption = await selectElementByCss('ng-select[placeholder="Select Session Strategy"]');
      await sessionTypeOption.click();

      const selectedSessionType = await selectElementWithInnerText("AWS IAM User", By.css("div span.ng-option-label"));
      await selectedSessionType.click();

      const sessionAlias = await selectElementByCss('input[placeholder="Session Alias *"]');
      await sessionAlias.sendKeys("selenium-session");

      const sessionAccessKey = await selectElementByCss('input[placeholder="Access Key ID *"]');
      await sessionAccessKey.sendKeys("a");

      const sessionSecretAccessKey = await selectElementByCss('input[placeholder="Secret Access Key *"]');
      await sessionSecretAccessKey.sendKeys("a");

      const createButton = await selectElementWithInnerText("Create Session", By.css("button"));
      await createButton.click();

      const seleniumSession = await selectElementWithInnerText("selenium-session", By.css("td div.session-name-td"));
      await seleniumSession.click();

      const playButton = await selectElementByCss("a.start-session");

      await pause(2000);

      await playButton.click();
    },
    testTimeout
  );
});

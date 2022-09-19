import { describe, test, expect } from "@jest/globals";
import { By, until } from "selenium-webdriver";
import {
  clickOnAddSessionButton,
  clickOnStrategyButton,
  generateDriver,
  pause,
  selectElementByCss,
  selectElementWithInnerText,
  waitUntilDisplayed,
} from "./integration-helpers";
import { env } from "./.env";

describe("Integration test 1", () => {
  const testTimeout = 60000;
  let driver;

  beforeEach(async () => {
    driver = await generateDriver();
  }, testTimeout);

  afterEach(async () => {
    await driver.quit();
  }, testTimeout);

  test(
    "my integration test 1",
    async () => {
      await clickOnAddSessionButton(driver);

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

      await pause(5000);
    },
    testTimeout
  );
});

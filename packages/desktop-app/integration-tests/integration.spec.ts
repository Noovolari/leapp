import { describe, test } from "@jest/globals";
import { By } from "selenium-webdriver";
import {
  clickOnAddSessionButton,
  clickOnStrategyButton,
  generateDriver,
  selectElementByCss,
  selectElementWithInnerText,
  waitUntilDisplayed,
} from "./integration-helpers";
import { env } from "./.env";

describe("Integration test 1", () => {
  const testTimeout = 60000;
  let driver;

  beforeEach(async () => {
    console.log("in before each...");
    driver = await generateDriver();
  }, testTimeout);

  afterEach(async () => {
    console.log("in after each...");
    await driver.quit();
  }, testTimeout);

  /*test(
    "my integration test 1",
    async () => {
      console.log("in integration test 1...");
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
  );*/

  test(
    "create session",
    async () => {
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

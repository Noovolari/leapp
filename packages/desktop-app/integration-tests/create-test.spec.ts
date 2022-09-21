import { describe, test } from "@jest/globals";
import { By } from "selenium-webdriver";
import { env } from "./.env";
import {
  clickOnAddSessionButton,
  clickOnStrategyButton,
  generateDriver,
  pause,
  selectElementByCss,
  selectElementWithInnerText,
  waitUntilDisplayed,
} from "./integration.spec";

describe("Integration test 2", () => {
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
    "create session",
    async () => {
      console.log("waiting 8 seconds...");
      await pause(8000);
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

      await pause(2000);
    },
    testTimeout
  );
});

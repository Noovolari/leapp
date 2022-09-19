import { describe, test, expect } from "@jest/globals";
import { Builder, By, until } from "selenium-webdriver";
import * as path from "path";
import * as os from "os";

describe("Integration test 1", () => {
  let driver;
  const linuxPath = path.resolve(".", "node_modules/electron/dist/electron");
  const macPath = path.resolve(".", "node_modules/electron/dist/Electron.app/Contents/MacOS/Electron");
  const winPath = path.resolve(".", "node_modules\\electron\\dist\\electron.exe");
  const electronBinaryPath = {
    darwin: macPath,
    linux: linuxPath,
    win32: winPath,
  };

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
  });

  afterEach(async () => {
    await driver.quit();
  });

  test("my integration test 1", async () => {
    const addSessionButton = await driver.wait(until.elementLocated(By.css('button[mattooltip="Add a new Session"]')), 10000);
    await addSessionButton.click();

    const strategyButtonSelector = By.css(".strategy-list button");
    await driver.wait(until.elementLocated(strategyButtonSelector));
    const strategyButtons = await driver.findElements(strategyButtonSelector);
    expect(strategyButtons.length).toBe(3);

    const buttons = await Promise.all(strategyButtons.map((button) => (async () => ({ button, text: await button.getText() }))()));
    const awsButton = buttons.find((button) => button.text.includes("AWS")).button;

    await awsButton.click();
  }, 500000);
});

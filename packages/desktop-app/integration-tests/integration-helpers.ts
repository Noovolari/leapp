import { Builder, By, ThenableWebDriver, until, WebElement } from "selenium-webdriver";
import os from "os";
import path from "path";

const serverHost = "http://localhost:9515";
const linuxPath = path.resolve(".", "node_modules/electron/dist/electron");
const macPath = path.resolve(".", "node_modules/electron/dist/Electron.app/Contents/MacOS/Electron");
const winPath = path.resolve(".", "node_modules\\electron\\dist\\electron.exe");
const electronBinaryPath = {
  darwin: macPath,
  linux: linuxPath,
  win32: winPath,
};

export const generateDriver = async (): Promise<ThenableWebDriver> =>
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

export const selectElementByCss = async (selector: string, driver: ThenableWebDriver): Promise<WebElement> =>
  await driver.wait(until.elementLocated(By.css(selector)), 10000);

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
  await driver.wait(until.elementLocated(strategyButtonSelector));
  const awsButton = await selectElementWithInnerText(strategy, strategyButtonSelector, driver);
  await awsButton.click();
};

export const pause = (timeout: number): Promise<boolean> =>
  new Promise((resolve, _) => {
    setTimeout(() => {
      resolve(true);
    }, timeout);
  });

export const waitUntilDisplayed = (selector: string, expectDisplayToBe: boolean, driver: ThenableWebDriver): Promise<boolean> =>
  new Promise((resolve, _) => {
    const timeoutId = setTimeout(() => {
      // Resolve in case of unexpected errors that would make the method run endlessly
      clearTimeout(timeoutId);
      resolve(false);
    }, 20000);

    const intervalId = setInterval(async () => {
      if (expectDisplayToBe === false) {
        // Resolve when the element is not present in the page anymore throwing a not such element exception
        try {
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

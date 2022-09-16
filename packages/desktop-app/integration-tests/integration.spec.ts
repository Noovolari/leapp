import { describe, test } from "@jest/globals";
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

  // beforeAll(async () => {
  //   await new Promise<void>((resolve, reject) => {
  //     try {
  //       chromeDriver = spawn("../node_modules/.bin/chromedriver");
  //
  //       chromeDriver.on("close", (code, signal) => {
  //         console.log(`child process terminated due to receipt of signal ${signal}`);
  //       });
  //
  //       chromeDriver.stdout.on("data", (data) => {
  //         if (data.includes("ChromeDriver was started successfully.")) {
  //           resolve();
  //         }
  //       });
  //
  //       chromeDriver.stderr.on("data", (data) => {
  //         reject(data);
  //       });
  //     } catch (error) {
  //       reject(error);
  //     }
  //   });
  // }, 5000000);

  beforeEach(async () => {
    // chrome_options = Options()
    // chrome_options.add_argument("--headless")
    // driver = webdriver.Chrome(options=chrome_options)
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

  // afterAll(() => {
  //   chromeDriver.kill("SIGTERM");
  // });

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

import * as path from "path";
import { Builder, WebDriver } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import { appConfig } from "../config/appConfig";

export async function createDriver(): Promise<WebDriver> {
  const chromeDriverPath: string = path.resolve(
    process.cwd(),
    "node_modules",
    "chromedriver",
    "lib",
    "chromedriver",
    "chromedriver.exe"
  );

  console.log(`[driverFactory] using chromedriver path: ${chromeDriverPath}`);

  const service = new chrome.ServiceBuilder(chromeDriverPath);
  return new Builder().forBrowser(appConfig.browser).setChromeService(service).build();
}

import * as fs from "fs";
import * as path from "path";
import { WebDriver } from "selenium-webdriver";
import { appConfig } from "../config/appConfig";
import { LoginPage } from "../pages/loginPage";
import { NavigationPage } from "../pages/navigationPage";
import { TestCase, TestResult } from "../types/testCase";
import { ensureDirectoryExists } from "./fileSystem";

export async function runCase(driver: WebDriver, testCase: TestCase): Promise<TestResult> {
  const startedAt: number = Date.now();
  const page = new LoginPage(driver);
  const navigation = new NavigationPage(driver);

  try {
    await page.open();
    await page.login(testCase.input.username, testCase.input.password);

    let actualMessage: string;
    if (testCase.expected.shouldPass) {
      actualMessage = await page.getSuccessMessage();

      if (testCase.expected.shouldLogout) {
        await page.logout();

        const returnedToLogin = await page.isLoginPageVisible();

        if (!returnedToLogin) {
          throw new Error("Expected to return to login page after logout");
        }

        if (testCase.expected.shouldStayLoggedOutAfterBack) {
          await driver.navigate().back();

          const stayedOnLogin = await page.isLoginPageVisible();

          if (!stayedOnLogin) {
            throw new Error("Expected to stay on login page after browser back");
          }
        }
      }

      if (testCase.expected.navigationFlow === "marketsToLocations") {
        await navigation.openSideMenu();
        await navigation.openMarkets();
        await navigation.closeCurrentTab();
        await navigation.openLocations();
      }

      if (testCase.expected.navigationFlow === "noDuplicateMarketsTab") {
        await navigation.openSideMenu();
        await navigation.openMarkets();
        await navigation.openMarketsAgainWithoutDuplicate();
      }

      if (testCase.expected.navigationFlow === "switchMarketsAndLocationsTabs") {
        await navigation.openSideMenu();
        await navigation.openMarkets();
        await navigation.openLocations();
        await navigation.switchBetweenMarketsAndLocations();
      }

      if (testCase.expected.navigationFlow === "logoutWithOpenTabs") {
        await navigation.openSideMenu();
        await navigation.openMarkets();
        await navigation.openLocations();
        await navigation.expectMarketsAndLocationsTabsVisible();
        await page.logout();

        const returnedToLogin = await page.isLoginPageVisible();

        if (!returnedToLogin) {
          throw new Error("Expected to return to login page after logout with open tabs");
        }
      }

      if (testCase.expected.navigationFlow === "marketsTableLoads") {
        await navigation.openSideMenu();
        await navigation.openMarkets();
        await navigation.expectWesternEuropeVisible();
      }

      if (testCase.expected.navigationFlow === "refreshMarketsTable") {
        await navigation.openSideMenu();
        await navigation.openMarkets();
        await navigation.refreshMarketsTable();
      }

      if (testCase.expected.navigationFlow === "editWesternEuropeMarket") {
        await navigation.openSideMenu();
        await navigation.openMarkets();
        await navigation.openWesternEuropeEditTab();
      }

      if (testCase.expected.navigationFlow === "locationsTableLoads") {
        await navigation.openSideMenu();
        await navigation.openLocations();
        await navigation.expectPortoMarselhaVisible();
      }

      if (testCase.expected.navigationFlow === "refreshLocationsTable") {
        await navigation.openSideMenu();
        await navigation.openLocations();
        await navigation.refreshLocationsTable();
      }

      if (testCase.expected.navigationFlow === "editPortoMarselhaLocation") {
        await navigation.openSideMenu();
        await navigation.openLocations();
        await navigation.openPortoMarselhaEditTab();
      }

      if (testCase.expected.navigationFlow === "createEditDeleteMarket") {
        const marketName = testCase.input.marketName;
        const marketRename = testCase.input.marketRename;

        if (!marketName || !marketRename) {
          throw new Error("TC createEditDeleteMarket requer marketName e marketRename no input");
        }

        await navigation.openSideMenu();
        await navigation.openMarkets();
        await navigation.createMarket(marketName);
        await navigation.expectMarketVisible(marketName);
        await navigation.editMarketName(marketName, marketRename);
        await navigation.expectMarketVisible(marketRename);
        await navigation.deleteMarket(marketRename);
        await navigation.expectMarketNotVisible(marketRename);
        await page.logout();

        const returnedToLogin = await page.isLoginPageVisible();
        if (!returnedToLogin) {
          throw new Error("Esperava regressar à página de login após logout");
        }
      }

      if (testCase.expected.navigationFlow === "createEditDeleteTransportType") {
        const transportTypeName = testCase.input.transportTypeName;
        const transportTypeRename = testCase.input.transportTypeRename;

        if (!transportTypeName || !transportTypeRename) {
          throw new Error("TC createEditDeleteTransportType requer transportTypeName e transportTypeRename no input");
        }

        await navigation.openSideMenu();
        await navigation.openTransportTypes();
        await navigation.createTransportType(transportTypeName);
        await navigation.expectTransportTypeVisible(transportTypeName);
        await navigation.editTransportTypeName(transportTypeName, transportTypeRename);
        await navigation.expectTransportTypeVisible(transportTypeRename);
        await navigation.deleteTransportType(transportTypeRename);
        await navigation.expectTransportTypeNotVisible(transportTypeRename);
        await page.logout();

        const returnedToLogin = await page.isLoginPageVisible();
        if (!returnedToLogin) {
          throw new Error("Esperava regressar à página de login após logout");
        }
      }
    } else {
      actualMessage = testCase.expected.expectedAlertType === "error"
        ? await page.getErrorMessage()
        : await page.getSuccessMessage();
    }

    if (actualMessage.trim() !== testCase.expected.expectedMessage.trim()) {
      throw new Error(`Expected "${testCase.expected.expectedMessage}" but got "${actualMessage}"`);
    }

    return {
      id: testCase.id,
      title: testCase.title,
      status: "PASS",
      durationMs: Date.now() - startedAt,
      details: `${testCase.processArea} validated successfully.`
    };
  } catch (error) {
    let screenshotPath: string | undefined;
    try {
      screenshotPath = await captureScreenshot(driver, testCase.id);
    } catch (screenshotError) {
      console.error(`Failed to capture screenshot for ${testCase.id}:`, screenshotError);
    }

    const message: string = error instanceof Error ? error.message : "Unknown execution failure";
    return {
      id: testCase.id,
      title: testCase.title,
      status: "FAIL",
      durationMs: Date.now() - startedAt,
      details: `${testCase.processArea} failed. ${message}`,
      screenshotPath
    };
  }
}

async function captureScreenshot(driver: WebDriver, caseId: string): Promise<string> {
  const absoluteFolder: string = ensureDirectoryExists(appConfig.screenshotFolder);
  const fileName: string = `${caseId}_${Date.now()}.png`;
  const absolutePath: string = path.join(absoluteFolder, fileName);
  const imageBase64: string = await driver.takeScreenshot();
  fs.writeFileSync(absolutePath, imageBase64, "base64");
  return path.join(appConfig.screenshotFolder, fileName);
}

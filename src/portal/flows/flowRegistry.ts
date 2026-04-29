import { WebDriver } from "selenium-webdriver";
import { TestCase } from "../../engine/types/testCase";
import { LoginPage } from "../pages/loginPage";
import { NavigationPage } from "../pages/navigationPage";

/**
 * Executa o fluxo completo de um caso de teste: login, navegaÃ§Ã£o e logout.
 * Esta funÃ§Ã£o Ã© passada ao motor (testRunner) via injeÃ§Ã£o de dependÃªncia.
 * Para adicionar novos flows, basta adicionar um bloco if/else aqui.
 */
export async function executeFlow(driver: WebDriver, testCase: TestCase): Promise<void> {
  const page = new LoginPage(driver);
  const navigation = new NavigationPage(driver);

  await page.open();
  await page.login(testCase.input.username, testCase.input.password);

  let actualMessage: string;

  if (testCase.expected.shouldPass) {
    actualMessage = await page.getSuccessMessage();

    if (testCase.expected.shouldLogout) {
      await page.logout();
      const returnedToLogin = await page.isLoginPageVisible();
      if (!returnedToLogin) throw new Error("Expected to return to login page after logout");

      if (testCase.expected.shouldStayLoggedOutAfterBack) {
        await driver.navigate().back();
        const stayedOnLogin = await page.isLoginPageVisible();
        if (!stayedOnLogin) throw new Error("Expected to stay on login page after browser back");
      }
    }

    const flow = testCase.expected.navigationFlow;

    if (flow === "marketsToLocations") {
      await navigation.openSideMenu();
      await navigation.openMarkets();
      await navigation.closeCurrentTab();
      await navigation.openLocations();
    }

    if (flow === "noDuplicateMarketsTab") {
      await navigation.openSideMenu();
      await navigation.openMarkets();
      await navigation.openMarketsAgainWithoutDuplicate();
    }

    if (flow === "switchMarketsAndLocationsTabs") {
      await navigation.openSideMenu();
      await navigation.openMarkets();
      await navigation.openLocations();
      await navigation.switchBetweenMarketsAndLocations();
    }

    if (flow === "logoutWithOpenTabs") {
      await navigation.openSideMenu();
      await navigation.openMarkets();
      await navigation.openLocations();
      await navigation.expectMarketsAndLocationsTabsVisible();
      await page.logout();
      const returnedToLogin = await page.isLoginPageVisible();
      if (!returnedToLogin) throw new Error("Expected to return to login page after logout with open tabs");
    }

    if (flow === "marketsTableLoads") {
      await navigation.openSideMenu();
      await navigation.openMarkets();
      await navigation.expectWesternEuropeVisible();
    }

    if (flow === "refreshMarketsTable") {
      await navigation.openSideMenu();
      await navigation.openMarkets();
      await navigation.refreshMarketsTable();
    }

    if (flow === "editWesternEuropeMarket") {
      await navigation.openSideMenu();
      await navigation.openMarkets();
      await navigation.openWesternEuropeEditTab();
    }

    if (flow === "locationsTableLoads") {
      await navigation.openSideMenu();
      await navigation.openLocations();
      await navigation.expectPortoMarselhaVisible();
    }

    if (flow === "refreshLocationsTable") {
      await navigation.openSideMenu();
      await navigation.openLocations();
      await navigation.refreshLocationsTable();
    }

    if (flow === "editPortoMarselhaLocation") {
      await navigation.openSideMenu();
      await navigation.openLocations();
      await navigation.openPortoMarselhaEditTab();
    }

    if (flow === "createEditDeleteMarket") {
      const { marketName, marketRename } = testCase.input;
      if (!marketName || !marketRename) throw new Error("createEditDeleteMarket requer marketName e marketRename");

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
      if (!returnedToLogin) throw new Error("Esperava regressar Ã  pÃ¡gina de login apÃ³s logout");
    }

    if (flow === "createEditDeleteTransportType") {
      const { transportTypeName, transportTypeRename } = testCase.input;
      if (!transportTypeName || !transportTypeRename) throw new Error("createEditDeleteTransportType requer transportTypeName e transportTypeRename");

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
      if (!returnedToLogin) throw new Error("Esperava regressar Ã  pÃ¡gina de login apÃ³s logout");
    }
    if (flow === "createSpotTender") {
      const tenderName = testCase.input.tenderNamePrefix
        ? `${testCase.input.tenderNamePrefix} ${Date.now()}`
        : (testCase.input.tenderName ?? `Tender Auto ${Date.now()}`);

      const responseDeadline = testCase.input.responseDeadline ?? "2026-05-20";
      const shipmentStartDate = testCase.input.shipmentStartDate ?? "2026-05-25";
      const shipmentEndDate = testCase.input.shipmentEndDate ?? "2026-05-30";
      const pickupAddress = testCase.input.pickupAddress ?? "Porto";
      const deliveryAddress = testCase.input.deliveryAddress ?? "Rotterdam";
      const deliverTo = testCase.input.deliverTo ?? "QA Carrier";

      await navigation.createSpotTender(
        tenderName,
        responseDeadline,
        shipmentStartDate,
        shipmentEndDate,
        pickupAddress,
        deliveryAddress,
        deliverTo
      );
      await navigation.expectSpotTenderVisible(tenderName);
      await navigation.editSpotTender(tenderName);
      await navigation.expectSpotTenderVisible(tenderName);
      await navigation.deleteSpotTender(tenderName);
      await navigation.expectSpotTenderNotVisible(tenderName);
      await page.logout();
      const returnedToLogin = await page.isLoginPageVisible();
      if (!returnedToLogin) throw new Error("Esperava regressar Ã  pÃ¡gina de login apÃ³s logout");
    }

  } else {
    actualMessage = testCase.expected.expectedAlertType === "error"
      ? await page.getErrorMessage()
      : await page.getSuccessMessage();
  }

  if (actualMessage!.trim() !== testCase.expected.expectedMessage.trim()) {
    throw new Error(`Expected "${testCase.expected.expectedMessage}" but got "${actualMessage!}"`);
  }
}


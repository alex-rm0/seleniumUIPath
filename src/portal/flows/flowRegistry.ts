import { WebDriver } from "selenium-webdriver";
import { TestCase } from "../../engine/types/testCase";
import { LoginPage } from "../pages/loginPage";
import { NavigationPage } from "../pages/navigationPage";
import { CarrierPage } from "../pages/carrierPage";

/**
 * Executa o fluxo completo de um caso de teste: login, navegação e logout.
 * Esta função é passada ao motor (testRunner) via injeção de dependência.
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
      if (!returnedToLogin) throw new Error("Esperava regressar à página de login após logout");
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
      if (!returnedToLogin) throw new Error("Esperava regressar à página de login após logout");
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
      if (!returnedToLogin) throw new Error("Esperava regressar à página de login após logout");
    }

    if (flow === "createSpotTenderOnly") {
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
        deliverTo,
        "100",
        "1",
        true  // seleciona todos os carriers disponíveis
      );
      await navigation.expectSpotTenderVisible(tenderName);
      await page.logout();
      const returnedToLogin = await page.isLoginPageVisible();
      if (!returnedToLogin) throw new Error("Esperava regressar à página de login após logout");

      // Parte 2 — validar tender no portal de carrier
      const carrierUrl      = testCase.input.carrierUrl;
      const carrierUsername = testCase.input.carrierUsername;
      const carrierPassword = testCase.input.carrierPassword;

      if (!carrierUrl || !carrierUsername || !carrierPassword) {
        throw new Error(
          `TC "${testCase.id}" usa o flow "createSpotTenderOnly" mas faltam campos obrigatórios: ` +
          [
            !carrierUrl      ? "carrierUrl"      : null,
            !carrierUsername ? "carrierUsername" : null,
            !carrierPassword ? "carrierPassword" : null,
          ].filter(Boolean).join(", ")
        );
      }

      const carrier = new CarrierPage(driver);
      await carrier.openAndLogin(carrierUrl, carrierUsername, carrierPassword);
      await carrier.openSideMenu();
      await carrier.openTendersSectionDropdown();
      await carrier.navigateToSpotTenders();
      await carrier.expectSpotTenderVisible(tenderName);
      await carrier.logout();
      const carrierReturnedToLogin = await carrier.isLoginPageVisible();
      if (!carrierReturnedToLogin) throw new Error("Esperava regressar ao login do carrier após logout");
    }

    // ── TC022: shipper cria tender → carrier faz bid ────────────────────────
    if (flow === "bidSpotTenderAsCarrier") {
      const tenderName = testCase.input.tenderNamePrefix
        ? `${testCase.input.tenderNamePrefix} ${Date.now()}`
        : (testCase.input.tenderName ?? `Tender Auto ${Date.now()}`);

      const responseDeadline  = testCase.input.responseDeadline  ?? "2026-05-20";
      const shipmentStartDate = testCase.input.shipmentStartDate ?? "2026-05-25";
      const shipmentEndDate   = testCase.input.shipmentEndDate   ?? "2026-05-30";
      const pickupAddress     = testCase.input.pickupAddress     ?? "Porto";
      const deliveryAddress   = testCase.input.deliveryAddress   ?? "Rotterdam";
      const deliverTo         = testCase.input.deliverTo         ?? "QA Carrier";

      // Parte 1 — shipper: cria tender e valida na tabela
      await navigation.createSpotTender(
        tenderName,
        responseDeadline,
        shipmentStartDate,
        shipmentEndDate,
        pickupAddress,
        deliveryAddress,
        deliverTo,
        "100",
        "1",
        true
      );
      await navigation.expectSpotTenderVisible(tenderName);
      await page.logout();
      const shipperReturned = await page.isLoginPageVisible();
      if (!shipperReturned) throw new Error("Esperava regressar à página de login do shipper após logout");

      // Parte 2 — carrier: valida tender e submete bid
      const carrierUrl      = testCase.input.carrierUrl;
      const carrierUsername = testCase.input.carrierUsername;
      const carrierPassword = testCase.input.carrierPassword;

      if (!carrierUrl || !carrierUsername || !carrierPassword) {
        throw new Error(
          `TC "${testCase.id}" usa o flow "bidSpotTenderAsCarrier" mas faltam campos: ` +
          [
            !carrierUrl      ? "carrierUrl"      : null,
            !carrierUsername ? "carrierUsername" : null,
            !carrierPassword ? "carrierPassword" : null,
          ].filter(Boolean).join(", ")
        );
      }

      const bidPrice = testCase.input.bidPrice ?? "150";
      const bidLoads = testCase.input.bidLoads ?? "1";
      const bidDays  = testCase.input.bidDays  ?? "5";

      const carrier = new CarrierPage(driver);
      await carrier.openAndLogin(carrierUrl, carrierUsername, carrierPassword);
      await carrier.openSideMenu();
      await carrier.openTendersSectionDropdown();
      await carrier.navigateToSpotTenders();
      await carrier.expectSpotTenderVisible(tenderName);
      await carrier.rightClickAndViewTender(tenderName);
      await carrier.clickOfertaButton();
      await carrier.fillBidTable(bidPrice, bidLoads, bidDays);
      await carrier.submitBid();
      await carrier.logout();
      const carrierReturned = await carrier.isLoginPageVisible();
      if (!carrierReturned) throw new Error("Esperava regressar ao login do carrier após logout");

      // Parte 3 — shipper: aceita quotes e fecha o tender
      await page.open();
      await page.login(testCase.input.username, testCase.input.password);
      await page.getSuccessMessage();

      await navigation.openSpotTenders();
      await navigation.clickSpotTendersInQuotation();
      await navigation.rightClickAndViewSpotTender(tenderName);
      await navigation.clickCarriersView();
      await navigation.selectFirstCarrierInDropdown();
      await navigation.selectAllQuotesInTable();
      await navigation.clickLanesView();
      await navigation.clickSummaryView();
      await navigation.clickFinishTender();

      // Navega de volta à lista e verifica que o tender está marcado como finalizado
      await navigation.openSpotTenders();
      await navigation.clickSpotTendersFinished();
      await navigation.expectTenderIsFinishedInTable(tenderName);

      await page.logout();
      const shipperReturned3 = await page.isLoginPageVisible();
      if (!shipperReturned3) throw new Error("Esperava regressar ao login do shipper após logout final");
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

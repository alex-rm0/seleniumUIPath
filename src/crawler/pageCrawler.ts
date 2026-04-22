import { By, until, WebDriver } from "selenium-webdriver";
import { appConfig } from "../config/appConfig";
import { extractElements } from "./elementExtractor";
import { CrawledPage } from "./types";

const TIMEOUT = appConfig.timeoutMs;

// ─── Page registry ───────────────────────────────────────────────────────────

export type PageKey =
  | "login"
  | "dashboard"
  | "markets"
  | "markets-edit"
  | "locations"
  | "locations-edit"
  | "transport-types"
  | "transport-types-edit";

export const PAGE_KEYS: PageKey[] = [
  "login",
  "dashboard",
  "markets",
  "markets-edit",
  "locations",
  "locations-edit",
  "transport-types",
  "transport-types-edit",
];

export const PAGE_LABELS: Record<PageKey, string> = {
  "login":                "Login",
  "dashboard":            "Dashboard",
  "markets":              "Markets",
  "markets-edit":         "Markets - Edit (Western Europe)",
  "locations":            "Locations",
  "locations-edit":       "Locations - Edit (Porto de Marselha)",
  "transport-types":      "Tipos de Transporte",
  "transport-types-edit": "Tipos de Transporte - Edit (1ª entrada)",
};

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Crawl the portal and return only the pages whose keys are in `requested`.
 * Navigation for intermediate steps always runs (to reach the target pages),
 * but only requested pages are snapshotted and returned.
 */
export async function crawlPages(
  driver: WebDriver,
  requested: Set<PageKey>
): Promise<CrawledPage[]> {
  const results: CrawledPage[] = [];
  const needsLogin = PAGE_KEYS.filter((k) => k !== "login").some((k) => requested.has(k));
  const needsMarkets =
    requested.has("markets") || requested.has("markets-edit");
  const needsLocations =
    requested.has("locations") || requested.has("locations-edit");
  const needsTransportTypes =
    requested.has("transport-types") || requested.has("transport-types-edit");

  // 1. Login page
  await navigateToLogin(driver);
  if (requested.has("login")) results.push(await snapshot(driver, "login"));

  // 2. Authenticate
  if (needsLogin) await login(driver);

  // 3. Dashboard
  if (needsLogin) {
    await driver.sleep(1000);
    if (requested.has("dashboard")) results.push(await snapshot(driver, "dashboard"));
  }

  // 4. Markets
  if (needsMarkets) {
    await openSideMenu(driver);
    await navigateToMarkets(driver);
    if (requested.has("markets")) results.push(await snapshot(driver, "markets"));

    if (requested.has("markets-edit")) {
      await navigateToMarketsEdit(driver);
      results.push(await snapshot(driver, "markets-edit"));
      await closeLastTab(driver);
    }
  }

  // 5. Locations
  if (needsLocations) {
    await openSideMenu(driver);
    await navigateToLocations(driver);
    if (requested.has("locations")) results.push(await snapshot(driver, "locations"));

    if (requested.has("locations-edit")) {
      await navigateToLocationsEdit(driver);
      results.push(await snapshot(driver, "locations-edit"));
    }
  }

  // 6. Transport Types
  if (needsTransportTypes) {
    await openSideMenu(driver);
    await navigateToTransportTypes(driver);
    if (requested.has("transport-types")) results.push(await snapshot(driver, "transport-types"));

    if (requested.has("transport-types-edit")) {
      await navigateToTransportTypesEdit(driver);
      results.push(await snapshot(driver, "transport-types-edit"));
      await closeLastTab(driver);
    }
  }

  return results;
}

// ─── Snapshot ─────────────────────────────────────────────────────────────────

async function snapshot(driver: WebDriver, key: PageKey): Promise<CrawledPage> {
  const label = PAGE_LABELS[key];
  const url = await driver.getCurrentUrl();
  console.log(`  [crawl] extracting: ${label} (${url})`);
  const elements = await extractElements(driver);
  console.log(`  [crawl] found ${elements.length} element(s) on "${label}"`);
  return { name: label, key, url, extractedAt: new Date().toISOString(), elements };
}

// ─── Navigation helpers ───────────────────────────────────────────────────────

async function navigateToLogin(driver: WebDriver): Promise<void> {
  await driver.get(appConfig.baseUrl);
  await driver.wait(until.elementLocated(By.css('input[type="text"]')), TIMEOUT);
}

async function login(driver: WebDriver): Promise<void> {
  console.log("  [crawl] logging in...");
  const username = await driver.findElement(By.css('input[type="text"]'));
  const password = await driver.findElement(By.css('input[type="password"]'));
  const submit   = await driver.findElement(By.css("button.buttonClass.buttonClassHover"));
  await username.clear();
  await username.sendKeys("sandrodev");
  await password.clear();
  await password.sendKeys("Sandrodev-123");
  await submit.click();
  await driver.wait(
    until.elementLocated(By.css("div.MuiAlert-root.MuiAlert-colorSuccess.MuiAlert-filledSuccess")),
    TIMEOUT
  );
  console.log("  [crawl] login successful");
}

async function openSideMenu(driver: WebDriver): Promise<void> {
  const menuBtn     = By.css('button[aria-label="Menu"][aria-haspopup="true"]');
  const visibleItem = By.xpath("//div[@role='button'][.//span[normalize-space()='Mercados']]");

  const isOpen = await driver.findElements(visibleItem).then((els) =>
    Promise.all(els.map((el) => el.isDisplayed())).then((r) => r.some(Boolean))
  );
  if (isOpen) return;

  const btn = await driver.wait(until.elementLocated(menuBtn), TIMEOUT);
  await driver.wait(until.elementIsVisible(btn), TIMEOUT);
  await btn.click();
  await driver.wait(
    async () => {
      const els = await driver.findElements(visibleItem);
      return Promise.all(els.map((el) => el.isDisplayed())).then((r) => r.some(Boolean));
    },
    TIMEOUT,
    "Side menu did not open"
  );
}

async function navigateToMarkets(driver: WebDriver): Promise<void> {
  const marketsBtn = By.xpath("//div[@role='button'][.//span[normalize-space()='Mercados']]");
  const btn = await driver.wait(until.elementLocated(marketsBtn), TIMEOUT);
  await driver.wait(until.elementIsVisible(btn), TIMEOUT);
  await btn.click();
  await waitForSuccessAlert(driver, "Tab criado com sucesso");
  await driver.wait(
    until.elementLocated(By.xpath("//tr[@role='row'][.//td[normalize-space()='Western Europe']]")),
    TIMEOUT
  );
  await driver.sleep(500);
}

async function navigateToMarketsEdit(driver: WebDriver): Promise<void> {
  const row      = By.xpath("//tr[@role='row'][.//td[normalize-space()='Western Europe']]");
  const editIcon = By.css("button i.pi.pi-pencil.iconTable");
  const infoTitle = By.xpath("//*[normalize-space()='Informações do Mercado']");

  const rowEl = await driver.wait(until.elementLocated(row), TIMEOUT);
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", rowEl);
  await rowEl.click();
  const editEl = await driver.wait(until.elementLocated(editIcon), TIMEOUT);
  await driver.wait(until.elementIsVisible(editEl), TIMEOUT);
  await editEl.click();
  await driver.wait(until.urlContains("marketConfigCrud"), TIMEOUT);
  await driver.wait(until.elementLocated(infoTitle), TIMEOUT);
  await driver.sleep(500);
}

async function navigateToLocations(driver: WebDriver): Promise<void> {
  const locationsBtn = By.xpath("//div[@role='button'][.//span[contains(normalize-space(), 'Localiza')]]");
  const btn = await driver.wait(until.elementLocated(locationsBtn), TIMEOUT);
  await driver.wait(until.elementIsVisible(btn), TIMEOUT);
  await btn.click();
  await waitForSuccessAlert(driver, "Tab criado com sucesso");
  await driver.wait(
    until.elementLocated(By.xpath("//tr[@role='row'][.//td[normalize-space()='Porto de Marselha']]")),
    TIMEOUT
  );
  await driver.sleep(500);
}

async function navigateToLocationsEdit(driver: WebDriver): Promise<void> {
  const row      = By.xpath("//tr[@role='row'][.//td[normalize-space()='Porto de Marselha']]");
  const editIcon = By.css("button i.pi.pi-pencil.iconTable");

  const rowEl = await driver.wait(until.elementLocated(row), TIMEOUT);
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", rowEl);
  await rowEl.click();
  const editEl = await driver.wait(until.elementLocated(editIcon), TIMEOUT);
  await driver.wait(until.elementIsVisible(editEl), TIMEOUT);
  await editEl.click();
  await driver.wait(until.urlContains("locationConfigCrud"), TIMEOUT);
  await driver.sleep(500);
}

async function navigateToTransportTypes(driver: WebDriver): Promise<void> {
  const btn = By.xpath("//div[@role='button'][.//span[contains(normalize-space(),'Tipos de Transporte')]]");
  const el = await driver.wait(until.elementLocated(btn), TIMEOUT);
  await driver.wait(until.elementIsVisible(el), TIMEOUT);
  await el.click();
  await waitForSuccessAlert(driver, "Tab criado com sucesso");
  // aguardar que a tabela carregue pelo menos uma linha
  await driver.wait(
    until.elementLocated(By.css("tr.p-selectable-row")),
    TIMEOUT
  );
  await driver.sleep(500);
}

async function navigateToTransportTypesEdit(driver: WebDriver): Promise<void> {
  const firstRow = By.css("tr.p-selectable-row");
  const editIcon = By.css("button i.pi.pi-pencil.iconTable");

  const rowEl = await driver.wait(until.elementLocated(firstRow), TIMEOUT);
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", rowEl);
  await rowEl.click();
  const editEl = await driver.wait(until.elementLocated(editIcon), TIMEOUT);
  await driver.wait(until.elementIsVisible(editEl), TIMEOUT);
  await editEl.click();
  // aguardar que o formulário carregue (URL muda e aparece algum input)
  await driver.wait(
    until.elementLocated(By.css("input.MuiInputBase-input[type='text']")),
    TIMEOUT
  );
  await driver.sleep(500);
}

async function closeLastTab(driver: WebDriver): Promise<void> {
  const closeIcons = By.css('svg.tabCloseIcon[data-testid="CloseIcon"]');
  await driver.wait(until.elementLocated(closeIcons), TIMEOUT);
  const icons = await driver.findElements(closeIcons);
  const last  = icons[icons.length - 1];
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", last);
  await last.click();
  await waitForSuccessAlert(driver, "Tab fechado com sucesso");
  await driver.sleep(300);
}

async function waitForSuccessAlert(driver: WebDriver, message: string): Promise<void> {
  const locator = By.xpath(
    `//div[contains(@class,'MuiAlert-colorSuccess') and contains(.,'${message}')]`
  );
  await driver.wait(
    async () => {
      const alerts = await driver.findElements(locator);
      for (const alert of alerts) {
        try { if (await alert.isDisplayed()) return true; } catch { /* stale */ }
      }
      return false;
    },
    TIMEOUT,
    `Expected success alert: "${message}"`
  );
}

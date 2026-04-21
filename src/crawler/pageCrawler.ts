import { By, until, WebDriver } from "selenium-webdriver";
import { appConfig } from "../config/appConfig";
import { extractElements } from "./elementExtractor";
import { CrawledPage } from "./types";

const TIMEOUT = appConfig.timeoutMs;

export async function crawlPortal(driver: WebDriver): Promise<CrawledPage[]> {
  const pages: CrawledPage[] = [];

  pages.push(await crawlLoginPage(driver));
  await login(driver);
  pages.push(await crawlDashboard(driver));
  await openSideMenu(driver);
  pages.push(await crawlMarketsPage(driver));
  pages.push(await crawlMarketsEditPage(driver));
  await closeLastTab(driver);
  pages.push(await crawlLocationsPage(driver));
  pages.push(await crawlLocationsEditPage(driver));

  return pages;
}

async function snapshot(driver: WebDriver, name: string): Promise<CrawledPage> {
  const url = await driver.getCurrentUrl();
  console.log(`  [crawl] extracting: ${name} (${url})`);
  const elements = await extractElements(driver);
  console.log(`  [crawl] found ${elements.length} element(s) on "${name}"`);
  return {
    name,
    url,
    extractedAt: new Date().toISOString(),
    elements,
  };
}

async function crawlLoginPage(driver: WebDriver): Promise<CrawledPage> {
  await driver.get(appConfig.baseUrl);
  await driver.wait(
    until.elementLocated(By.css('input[type="text"]')),
    TIMEOUT
  );
  return snapshot(driver, "Login");
}

async function login(driver: WebDriver): Promise<void> {
  console.log("  [crawl] logging in...");
  const usernameInput = await driver.findElement(By.css('input[type="text"]'));
  const passwordInput = await driver.findElement(By.css('input[type="password"]'));
  const submitButton = await driver.findElement(By.css("button.buttonClass.buttonClassHover"));

  await usernameInput.clear();
  await usernameInput.sendKeys("sandrodev");
  await passwordInput.clear();
  await passwordInput.sendKeys("Sandrodev-123");
  await submitButton.click();

  await driver.wait(
    until.elementLocated(By.css("div.MuiAlert-root.MuiAlert-colorSuccess.MuiAlert-filledSuccess")),
    TIMEOUT
  );
  console.log("  [crawl] login successful");
}

async function crawlDashboard(driver: WebDriver): Promise<CrawledPage> {
  await driver.sleep(1000);
  return snapshot(driver, "Dashboard");
}

async function openSideMenu(driver: WebDriver): Promise<void> {
  const menuSelector = By.css('button[aria-label="Menu"][aria-haspopup="true"]');
  const visibleItem = By.xpath("//div[@role='button'][.//span[normalize-space()='Mercados']]");

  const isOpen = await driver.findElements(visibleItem).then((els) =>
    Promise.all(els.map((el) => el.isDisplayed())).then((r) => r.some(Boolean))
  );

  if (!isOpen) {
    const btn = await driver.wait(until.elementLocated(menuSelector), TIMEOUT);
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
}

async function crawlMarketsPage(driver: WebDriver): Promise<CrawledPage> {
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
  return snapshot(driver, "Markets");
}

async function crawlMarketsEditPage(driver: WebDriver): Promise<CrawledPage> {
  const westernEuropeRow = By.xpath("//tr[@role='row'][.//td[normalize-space()='Western Europe']]");
  const editButton = By.css("button i.pi.pi-pencil.iconTable");
  const marketInfoTitle = By.xpath("//*[normalize-space()='Informações do Mercado']");

  const row = await driver.wait(until.elementLocated(westernEuropeRow), TIMEOUT);
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", row);
  await row.click();

  const editIcon = await driver.wait(until.elementLocated(editButton), TIMEOUT);
  await driver.wait(until.elementIsVisible(editIcon), TIMEOUT);
  await editIcon.click();

  await driver.wait(until.urlContains("marketConfigCrud"), TIMEOUT);
  await driver.wait(until.elementLocated(marketInfoTitle), TIMEOUT);
  await driver.sleep(500);
  return snapshot(driver, "Markets - Edit (Western Europe)");
}

async function closeLastTab(driver: WebDriver): Promise<void> {
  const closeIcons = By.css('svg.tabCloseIcon[data-testid="CloseIcon"]');
  await driver.wait(until.elementLocated(closeIcons), TIMEOUT);
  const icons = await driver.findElements(closeIcons);
  const last = icons[icons.length - 1];
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", last);
  await last.click();
  await waitForSuccessAlert(driver, "Tab fechado com sucesso");
  await driver.sleep(300);
}

async function crawlLocationsPage(driver: WebDriver): Promise<CrawledPage> {
  await openSideMenu(driver);
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
  return snapshot(driver, "Locations");
}

async function crawlLocationsEditPage(driver: WebDriver): Promise<CrawledPage> {
  const portoRow = By.xpath("//tr[@role='row'][.//td[normalize-space()='Porto de Marselha']]");
  const editButton = By.css("button i.pi.pi-pencil.iconTable");

  const row = await driver.wait(until.elementLocated(portoRow), TIMEOUT);
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", row);
  await row.click();

  const editIcon = await driver.wait(until.elementLocated(editButton), TIMEOUT);
  await driver.wait(until.elementIsVisible(editIcon), TIMEOUT);
  await editIcon.click();

  await waitForSuccessAlert(driver, "Tab criado com sucesso");
  await driver.wait(until.urlContains("locationConfigCrud"), TIMEOUT);
  await driver.sleep(500);
  return snapshot(driver, "Locations - Edit (Porto de Marselha)");
}

async function waitForSuccessAlert(driver: WebDriver, message: string): Promise<void> {
  const locator = By.xpath(
    `//div[contains(@class,'MuiAlert-colorSuccess') and contains(.,'${message}')]`
  );
  await driver.wait(
    async () => {
      const alerts = await driver.findElements(locator);
      for (const alert of alerts) {
        try {
          if (await alert.isDisplayed()) return true;
        } catch {
          /* stale */
        }
      }
      return false;
    },
    TIMEOUT,
    `Expected success alert: "${message}"`
  );
}

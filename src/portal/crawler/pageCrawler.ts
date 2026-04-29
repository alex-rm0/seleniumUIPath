import * as fs from "fs";
import * as path from "path";
import { By, until, WebDriver, WebElement } from "selenium-webdriver";
import { portalConfig } from "../config/portalConfig";
import { NavigationPage } from "../pages/navigationPage";
import { ensureDirectoryExists } from "../../engine/core/fileSystem";
import { ExtractMode, extractElements } from "../../engine/crawler/elementExtractor";
import { CrawledPage, ElementMap } from "../../engine/crawler/types";

export type PageKey =
  | "login"
  | "sidemenu"
  | "dashboard"
  | "markets"
  | "markets-edit"
  | "locations"
  | "locations-edit"
  | "transport-types"
  | "transport-types-edit"
  | "tenders"
  | "tenders-create"
  | "tenders-create-expanded"
  | "tenders-carriers"
  | "tenders-non-spot";

export const PAGE_KEYS: PageKey[] = [
  "login",
  "sidemenu",
  "dashboard",
  "markets",
  "markets-edit",
  "locations",
  "locations-edit",
  "transport-types",
  "transport-types-edit",
  "tenders",
  "tenders-create",
  "tenders-create-expanded",
  "tenders-carriers",
  "tenders-non-spot",
];

export const PAGE_LABELS: Record<PageKey, string> = {
  "login": "Login",
  "sidemenu": "Side Menu",
  "dashboard": "Dashboard",
  "markets": "Markets",
  "markets-edit": "Markets - Edit (Western Europe)",
  "locations": "Locations",
  "locations-edit": "Locations - Edit (Porto de Marselha)",
  "transport-types": "Tipos de Transporte",
  "transport-types-edit": "Tipos de Transporte - Edit (1a entrada)",
  "tenders": "Spot Tenders",
  "tenders-create": "Create Tender",
  "tenders-create-expanded": "Create Tender - Expanded",
  "tenders-carriers": "Create Tender - Carriers",
  "tenders-non-spot": "Non-Spot Tenders",
};

const TIMEOUT = portalConfig.timeoutMs;

export async function crawlPages(
  driver: WebDriver,
  requested: Set<PageKey>
): Promise<CrawledPage[]> {
  const results: CrawledPage[] = [];
  const needsLogin = PAGE_KEYS.filter((k) => k !== "login").some((k) => requested.has(k));
  const needsMarkets = requested.has("markets") || requested.has("markets-edit");
  const needsLocations = requested.has("locations") || requested.has("locations-edit");
  const needsTransportTypes = requested.has("transport-types") || requested.has("transport-types-edit");
  const needsTenders =
    requested.has("tenders") ||
    requested.has("tenders-create") ||
    requested.has("tenders-create-expanded") ||
    requested.has("tenders-carriers") ||
    requested.has("tenders-non-spot");

  await navigateToLogin(driver);
  if (requested.has("login")) await addSnapshot(results, await snapshot(driver, "login"));

  if (needsLogin) {
    await login(driver);
    await trySwitchPortalToEnglish(driver);
  }

  if (needsLogin) {
    await driver.sleep(1000);
    if (requested.has("sidemenu")) {
      await openSideMenu(driver);
      await addSnapshot(results, await snapshotSideMenu(driver));
    }
    if (requested.has("dashboard")) {
      await addSnapshot(results, await snapshot(driver, "dashboard"));
    }
  }

  if (needsMarkets) {
    await openSideMenu(driver);
    await navigateToMarkets(driver);
    if (requested.has("markets")) {
      await addSnapshot(results, await snapshot(driver, "markets"));
    }
    if (requested.has("markets-edit")) {
      await navigateToMarketsEdit(driver);
      await addSnapshot(results, await snapshot(driver, "markets-edit"));
      await closeLastTab(driver);
    }
  }

  if (needsLocations) {
    await openSideMenu(driver);
    await navigateToLocations(driver);
    if (requested.has("locations")) {
      await addSnapshot(results, await snapshot(driver, "locations"));
    }
    if (requested.has("locations-edit")) {
      await navigateToLocationsEdit(driver);
      await addSnapshot(results, await snapshot(driver, "locations-edit"));
    }
  }

  if (needsTransportTypes) {
    await openSideMenu(driver);
    await navigateToTransportTypes(driver);
    if (requested.has("transport-types")) {
      await addSnapshot(results, await snapshot(driver, "transport-types"));
    }
    if (requested.has("transport-types-edit")) {
      await navigateToTransportTypesEdit(driver);
      await addSnapshot(results, await snapshot(driver, "transport-types-edit"));
      await closeLastTab(driver);
    }
  }

  if (needsTenders) {
    await openSideMenu(driver);
    await openTendersSection(driver);
    await navigateToSpotTenders(driver);
    if (requested.has("tenders")) {
      await addSnapshot(results, await snapshot(driver, "tenders", "detailed"));
    }

    if (requested.has("tenders-create") || requested.has("tenders-create-expanded") || requested.has("tenders-carriers")) {
      await openSideMenu(driver);
      await openTendersSection(driver);
      await navigateToCreateTender(driver);
      if (requested.has("tenders-create")) {
        await addSnapshot(results, await snapshot(driver, "tenders-create", "detailed"));
      }
      if (requested.has("tenders-create-expanded")) {
        await expandCreateTenderForDetailedSnapshot(driver);
        await addSnapshot(results, await snapshot(driver, "tenders-create-expanded", "detailed"));
      }
      if (requested.has("tenders-carriers")) {
        await navigateToTenderCarriersStep(driver);
        await addSnapshot(results, await snapshot(driver, "tenders-carriers", "detailed"));
      }
    }

    if (requested.has("tenders-non-spot")) {
      await openSideMenu(driver);
      await openTendersSection(driver);
      await navigateToNonSpotTenders(driver);
      await addSnapshot(results, await snapshot(driver, "tenders-non-spot", "detailed"));
    }
  }

  return results;
}

async function snapshot(
  driver: WebDriver,
  key: PageKey,
  mode: ExtractMode = "interactive"
): Promise<CrawledPage> {
  const label = PAGE_LABELS[key];
  const url = await driver.getCurrentUrl();
  console.log(`  [crawl] extracting: ${label} (${url})`);
  const elements = await extractElements(driver, mode);
  console.log(`  [crawl] found ${elements.length} element(s) on "${label}"`);
  return { name: label, key, url, extractedAt: new Date().toISOString(), elements };
}

async function snapshotSideMenu(driver: WebDriver): Promise<CrawledPage> {
  const key: PageKey = "sidemenu";
  const label = PAGE_LABELS[key];
  const url = await driver.getCurrentUrl();
  console.log(`  [crawl] extracting: ${label} (${url})`);

  const merged = new Map<string, Awaited<ReturnType<typeof extractElements>>[number]>();

  for (let step = 0; step < 10; step++) {
    await maybeExpandTendersInSidebar(driver);
    const elements = await extractElements(driver, "detailed");
    for (const element of elements) {
      const dedupeKey = [
        element.tag,
        element.role ?? "",
        element.text ?? "",
        element.ariaLabel ?? "",
        element.testId ?? "",
        element.cssSelector ?? "",
      ].join("|");
      if (!merged.has(dedupeKey)) merged.set(dedupeKey, element);
    }

    const moved = await driver.executeScript<boolean>(`
      const candidates = Array.from(document.querySelectorAll("*"))
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.left < 320 && el.scrollHeight > el.clientHeight + 40;
        })
        .sort((a, b) => b.scrollHeight - a.scrollHeight);
      const target = candidates[0];
      if (!target) return false;
      const before = target.scrollTop;
      target.scrollTop += 260;
      return target.scrollTop !== before;
    `);

    if (!moved) break;
    await driver.sleep(250);
  }

  const elements = [...merged.values()];
  console.log(`  [crawl] found ${elements.length} aggregated element(s) on "${label}"`);
  return { name: label, key, url, extractedAt: new Date().toISOString(), elements };
}

async function addSnapshot(results: CrawledPage[], page: CrawledPage): Promise<void> {
  results.push(page);
  persistPartialResults(results);
}

function persistPartialResults(pages: CrawledPage[]): void {
  const pagesFolder = ensureDirectoryExists("element-map/pages");
  for (const page of pages) {
    const filePath = path.join(pagesFolder, `${page.key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(page, null, 2), "utf8");
  }

  const elementMapFolder = ensureDirectoryExists("element-map");
  const elementMap: ElementMap = {
    generatedAt: new Date().toISOString(),
    baseUrl: portalConfig.baseUrl,
    pages,
  };
  fs.writeFileSync(
    path.join(elementMapFolder, "latest.partial.json"),
    JSON.stringify(elementMap, null, 2),
    "utf8"
  );
}

async function navigateToLogin(driver: WebDriver): Promise<void> {
  await driver.get(portalConfig.baseUrl);
  await driver.wait(until.elementLocated(By.css('input[type="text"]')), TIMEOUT);
}

async function login(driver: WebDriver): Promise<void> {
  console.log("  [crawl] logging in...");
  const username = await driver.findElement(By.css('input[type="text"]'));
  const password = await driver.findElement(By.css('input[type="password"]'));
  const submit = await driver.findElement(By.css("button.buttonClass.buttonClassHover"));
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
  const menuBtn = By.css('button[aria-label="Menu"][aria-haspopup="true"]');
  const visibleItem = By.xpath("//div[@role='button'][.//span[normalize-space()='Mercados' or normalize-space()='Markets' or normalize-space()='Ubicaciones' or normalize-space()='Locations']]");

  const isOpen = await driver.findElements(visibleItem).then((els) =>
    Promise.all(els.map((el) => el.isDisplayed())).then((results) => results.some(Boolean))
  );
  if (isOpen) return;

  const btn = await driver.wait(until.elementLocated(menuBtn), TIMEOUT);
  await driver.wait(until.elementIsVisible(btn), TIMEOUT);
  await btn.click();
  await driver.wait(async () => {
    const els = await driver.findElements(visibleItem);
    return Promise.all(els.map((el) => el.isDisplayed())).then((results) => results.some(Boolean));
  }, TIMEOUT, "Side menu did not open");
}

async function trySwitchPortalToEnglish(driver: WebDriver): Promise<void> {
  await openSideMenu(driver);

  const isAlreadyEnglish = await driver.findElements(
    By.xpath("//*[normalize-space()='Markets' or normalize-space()='Tenders' or normalize-space()='Settings' or normalize-space()='Mercados' or normalize-space()='Licitaciones' or normalize-space()='Definiciones']")
  ).then((els) => Promise.all(els.map((el) => el.isDisplayed().catch(() => false))).then((results) => results.some(Boolean)));

  if (isAlreadyEnglish) return;

  const clicked = await driver.executeScript<boolean>(`
    const clickableAncestor = (el) => {
      let current = el;
      while (current) {
        if (current.matches?.("button, div, a")) return current;
        current = current.parentElement;
      }
      return null;
    };

    const candidates = Array.from(document.querySelectorAll("img"))
      .map((img) => {
        const clickable = clickableAncestor(img);
        if (!clickable) return null;
        const rect = clickable.getBoundingClientRect();
        return { clickable, rect };
      })
      .filter((entry) =>
        entry &&
        entry.rect.left >= 0 &&
        entry.rect.left < 260 &&
        entry.rect.bottom > window.innerHeight - 140 &&
        entry.rect.width >= 20 &&
        entry.rect.width <= 120 &&
        entry.rect.height >= 20 &&
        entry.rect.height <= 120
      )
      .sort((a, b) => a.rect.left - b.rect.left);

    const english = candidates[0]?.clickable;
    if (!english) return false;
    english.click();
    return true;
  `);

  if (!clicked) {
    console.warn("  [crawl] could not locate English flag, continuing with current language");
    return;
  }

  try {
    await driver.wait(async () => {
      const englishLabels = await driver.findElements(
        By.xpath("//*[normalize-space()='Markets' or normalize-space()='Settings' or normalize-space()='Logout']")
      );
      return Promise.all(englishLabels.map((el) => el.isDisplayed().catch(() => false))).then((results) => results.some(Boolean));
    }, 4000);
  } catch {
    console.warn("  [crawl] language did not switch to English in time, continuing with current language");
  }
}

async function maybeExpandTendersInSidebar(driver: WebDriver): Promise<void> {
  await driver.executeScript(`
    const normalized = (text) => (text || "").trim().replace(/\\s+/g, " ").toLowerCase();
    const submenuTexts = [
      "spot tenders",
      "non-spot tenders",
      "concursos diretos",
      "concursos faseados",
      "licitaciones inmediatas",
      "licitaciones no inmediatas",
      "licitaciones spot",
      "licitaciones non-spot"
    ];
    const hasSubmenu = Array.from(document.querySelectorAll("span, div, a, li"))
      .some((el) => submenuTexts.includes(normalized(el.textContent)));
    if (hasSubmenu) return;

    const targets = ["tenders", "concursos", "cotaÃ§Ãµes", "cotaÃƒÂ§ÃƒÂµes", "cotaciones", "licitaciones"];
    const elements = Array.from(document.querySelectorAll("span, div, a, li, button"));
    for (const el of elements) {
      const text = normalized(el.textContent);
      if (!targets.some((target) => text === target || text.includes(target))) continue;

      let row = el;
      while (row) {
        const className = typeof row.className === "string" ? row.className : "";
        const role = row.getAttribute?.("role");
        const isClickable =
          ["BUTTON", "A", "LI", "DIV"].includes(row.tagName) &&
          (role === "button" ||
            className.includes("MuiButtonBase-root") ||
            className.includes("MuiListItemButton-root") ||
            className.includes("mainMenuItem") ||
            className.includes("menuItem"));
        if (isClickable) {
          const arrowButton =
            row.querySelector?.('[data-testid="KeyboardArrowDownIcon"]')?.closest("button") ||
            row.querySelector?.('[data-testid="KeyboardArrowUpIcon"]')?.closest("button") ||
            row.parentElement?.querySelector?.('[data-testid="KeyboardArrowDownIcon"]')?.closest("button") ||
            row.parentElement?.querySelector?.('[data-testid="KeyboardArrowUpIcon"]')?.closest("button");
          if (arrowButton) {
            arrowButton.click();
            return;
          }
          row.click();
          return;
        }
        row = row.parentElement;
      }
    }
  `);
  await driver.sleep(150);
}

async function navigateToMarkets(driver: WebDriver): Promise<void> {
  const btn = await driver.wait(
    until.elementLocated(By.xpath("//div[@role='button'][.//span[normalize-space()='Mercados' or normalize-space()='Markets']]")),
    TIMEOUT
  );
  await driver.wait(until.elementIsVisible(btn), TIMEOUT);
  await btn.click();
  await waitForSuccessAlert(driver, "Tab criado com sucesso");
  await driver.wait(until.elementLocated(By.xpath("//tr[@role='row'][.//td[normalize-space()='Western Europe']]")), TIMEOUT);
  await driver.sleep(500);
}

async function navigateToMarketsEdit(driver: WebDriver): Promise<void> {
  const row = await driver.wait(
    until.elementLocated(By.xpath("//tr[@role='row'][.//td[normalize-space()='Western Europe']]")),
    TIMEOUT
  );
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", row);
  await row.click();
  const editEl = await driver.wait(until.elementLocated(By.css("button i.pi.pi-pencil.iconTable")), TIMEOUT);
  await driver.wait(until.elementIsVisible(editEl), TIMEOUT);
  await editEl.click();
  await driver.wait(until.urlContains("marketConfigCrud"), TIMEOUT);
  await driver.wait(until.elementLocated(By.xpath("//*[normalize-space()='InformaÃ§Ãµes do Mercado']")), TIMEOUT);
  await driver.sleep(500);
}

async function navigateToLocations(driver: WebDriver): Promise<void> {
  const btn = await driver.wait(
    until.elementLocated(By.xpath("//div[@role='button'][.//span[contains(normalize-space(),'Localiza') or contains(normalize-space(),'Ubicac')]]")),
    TIMEOUT
  );
  await driver.wait(until.elementIsVisible(btn), TIMEOUT);
  await btn.click();
  await waitForSuccessAlert(driver, "Tab criado com sucesso");
  await driver.wait(until.elementLocated(By.xpath("//tr[@role='row'][.//td[normalize-space()='Porto de Marselha']]")), TIMEOUT);
  await driver.sleep(500);
}

async function navigateToLocationsEdit(driver: WebDriver): Promise<void> {
  const row = await driver.wait(
    until.elementLocated(By.xpath("//tr[@role='row'][.//td[normalize-space()='Porto de Marselha']]")),
    TIMEOUT
  );
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", row);
  await row.click();
  const editEl = await driver.wait(until.elementLocated(By.css("button i.pi.pi-pencil.iconTable")), TIMEOUT);
  await driver.wait(until.elementIsVisible(editEl), TIMEOUT);
  await editEl.click();
  await driver.wait(until.urlContains("locationConfigCrud"), TIMEOUT);
  await driver.sleep(500);
}

async function navigateToTransportTypes(driver: WebDriver): Promise<void> {
  const btn = await driver.wait(
    until.elementLocated(By.xpath("//div[@role='button'][.//span[contains(normalize-space(),'Tipos de Transporte') or contains(normalize-space(),'Transport Types')]]")),
    TIMEOUT
  );
  await driver.wait(until.elementIsVisible(btn), TIMEOUT);
  await btn.click();
  await waitForSuccessAlert(driver, "Tab criado com sucesso");
  await driver.wait(until.elementLocated(By.css("tr.p-selectable-row")), TIMEOUT);
  await driver.sleep(500);
}

async function navigateToTransportTypesEdit(driver: WebDriver): Promise<void> {
  const row = await driver.wait(until.elementLocated(By.css("tr.p-selectable-row")), TIMEOUT);
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", row);
  await row.click();
  const editEl = await driver.wait(until.elementLocated(By.css("button i.pi.pi-pencil.iconTable")), TIMEOUT);
  await driver.wait(until.elementIsVisible(editEl), TIMEOUT);
  await editEl.click();
  await driver.wait(until.elementLocated(By.css("input.MuiInputBase-input[type='text']")), TIMEOUT);
  await driver.sleep(500);
}

async function openTendersSection(driver: WebDriver): Promise<void> {
  const section = await findMenuItemWithScroll(driver, ["Tenders", "Concursos", "CotaÃ§Ãµes", "Cotaciones", "Licitaciones"]);

  const submenuLocator = By.xpath(
    "//*[normalize-space()='Spot Tenders' or normalize-space()='Non-Spot Tenders' or normalize-space()='Concursos Diretos' or normalize-space()='Concursos Faseados' or normalize-space()='Licitaciones Inmediatas' or normalize-space()='Licitaciones No Inmediatas' or normalize-space()='Crear Licitación']"
  );

  const submenuVisible = await driver.findElements(submenuLocator).then((els) =>
    Promise.all(els.map((el) => el.isDisplayed())).then((results) => results.some(Boolean))
  );

  if (!submenuVisible) {
    await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", section);
    await clickElement(driver, section);
    await maybeExpandTendersInSidebar(driver);
    await driver.wait(async () => {
      const els = await driver.findElements(submenuLocator);
      return Promise.all(els.map((el) => el.isDisplayed())).then((results) => results.some(Boolean));
    }, TIMEOUT, "Tenders section did not expand");
  }
}

async function navigateToSpotTenders(driver: WebDriver): Promise<void> {
  const btn = await driver.wait(
    until.elementLocated(
      By.xpath("//div[@aria-label='Spot Tenders' or @aria-label='Concursos Diretos' or @aria-label='Concursos Inmediatos' or @aria-label='Licitaciones Inmediatas']")
    ),
    TIMEOUT
  );
  await driver.wait(until.elementIsVisible(btn), TIMEOUT);
  await clickElement(driver, btn);
  try {
    await waitForSuccessAlert(driver, "Tab created successfully");
  } catch {
    try {
      await waitForSuccessAlert(driver, "Tab criado com sucesso");
    } catch {
      // toast opcional
    }
  }
  await driver.wait(async () => {
    const currentUrl = await driver.getCurrentUrl();
    if (!currentUrl.endsWith("#/home")) return true;
    const actions = await driver.findElements(
      By.xpath(
        "//*[normalize-space()='Refresh table' or normalize-space()='Edit' or normalize-space()='Delete' or normalize-space()='Default' or normalize-space()='Views' or normalize-space()='Filters' or normalize-space()='Edit Columns']"
      )
    );
    const visible = await Promise.all(actions.map((el) => el.isDisplayed().catch(() => false)));
    return visible.some(Boolean);
  }, TIMEOUT, "Expected Spot Tenders page to load");
  await driver.sleep(500);
}

async function navigateToCreateTender(driver: WebDriver): Promise<void> {
  const previousUrl = await driver.getCurrentUrl();
  const btn = await driver.wait(
    until.elementLocated(
      By.xpath(
        "//div[@role='button'][.//*[@data-testid='AddchartIcon'] or .//span[normalize-space()='Create Tender' or normalize-space()='Criar Concurso' or normalize-space()='Crear Licitación']]"
      )
    ),
    TIMEOUT
  );
  await driver.wait(until.elementIsVisible(btn), TIMEOUT);
  await clickElement(driver, btn);
  await driver.wait(async () => {
    const currentUrl = await driver.getCurrentUrl();
    const candidates = await driver.findElements(
      By.xpath(
        "//*[normalize-space()='Tender Information' or normalize-space()='InformaÃ§Ãµes do Concurso' or normalize-space()='Pickup Address' or normalize-space()='Delivery Address' or normalize-space()='Deliver To' or normalize-space()='Container Type' or normalize-space()='Maximum of Carriers' or normalize-space()='Max. Carriers at Origin' or normalize-space()='Max. Carriers for Destination' or normalize-space()='Next' or normalize-space()='Back']"
      )
    );
    const visible = await Promise.all(candidates.map((el) => el.isDisplayed().catch(() => false)));
    return currentUrl !== previousUrl || visible.some(Boolean);
  }, TIMEOUT, "Expected Create Tender to open its form");
  await driver.sleep(500);
}

async function navigateToNonSpotTenders(driver: WebDriver): Promise<void> {
  const btn = await driver.wait(
    until.elementLocated(
      By.xpath("//div[@aria-label='Non-Spot Tenders' or @aria-label='Concursos Faseados' or @aria-label='Licitaciones No Inmediatas']")
    ),
    TIMEOUT
  );
  await driver.wait(until.elementIsVisible(btn), TIMEOUT);
  await clickElement(driver, btn);
  try {
    await waitForSuccessAlert(driver, "Tab created successfully");
  } catch {
    try {
      await waitForSuccessAlert(driver, "Tab criado com sucesso");
    } catch {
      // toast opcional
    }
  }
  await driver.wait(async () => {
    const currentUrl = await driver.getCurrentUrl();
    if (!currentUrl.endsWith("#/home")) return true;
    const actions = await driver.findElements(
      By.xpath(
        "//*[normalize-space()='Refresh table' or normalize-space()='Edit' or normalize-space()='Delete' or normalize-space()='Default' or normalize-space()='Views' or normalize-space()='Filters' or normalize-space()='Edit Columns']"
      )
    );
    const visible = await Promise.all(actions.map((el) => el.isDisplayed().catch(() => false)));
    return visible.some(Boolean);
  }, TIMEOUT, "Expected Non-Spot Tenders page to load");
  await driver.sleep(500);
}

async function expandCreateTenderForDetailedSnapshot(driver: WebDriver): Promise<void> {
  const addRowButton = By.xpath(
    "//button[.//*[contains(normalize-space(),'Add a Row') or contains(normalize-space(),'Adicionar Linha')] or .//i[contains(@class,'pi-plus-circle')]]"
  );
  const addRow = await driver.wait(until.elementLocated(addRowButton), TIMEOUT);
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", addRow);
  await clickElement(driver, addRow);

  const packageInputs = By.xpath(
    "//*[normalize-space()='FCL Packages' or normalize-space()='Pacotes FCL']/ancestor::*[self::div or self::section][1]//input | //*[normalize-space()='FCL Packages' or normalize-space()='Pacotes FCL']/ancestor::*[self::div or self::section][1]//*[@role='combobox']"
  );
  await driver.wait(async () => {
    const elements = await driver.findElements(packageInputs);
    return Promise.all(elements.map((el) => el.isDisplayed().catch(() => false))).then((results) => results.some(Boolean));
  }, TIMEOUT, "Expected FCL Packages fields to appear after Add a Row");

  const maybeEquipmentTrigger = await driver.findElements(
    By.xpath(
      "//*[normalize-space()='Equipments' or normalize-space()='Equipamentos']/ancestor::*[self::div or self::section][1]//*[@role='combobox' or self::input]"
    )
  );

  if (maybeEquipmentTrigger.length > 0) {
    try {
      const trigger = maybeEquipmentTrigger[0];
      await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", trigger);
      await clickElement(driver, trigger);
      await driver.sleep(350);
    } catch {
      // keep snapshotting even if the dropdown does not open
    }
  }

  await driver.sleep(500);
}

async function navigateToTenderCarriersStep(driver: WebDriver): Promise<void> {
  await openSideMenu(driver);
  await openTendersSection(driver);
  await navigateToCreateTender(driver);
  const navigation = new NavigationPage(driver);
  await navigation.completeCreateTenderAndReachCarriersStep(
    `Crawler Tender ${Date.now()}`,
    "2026-05-20",
    "2026-05-25",
    "2026-05-30",
    "Porto",
    "Rotterdam",
    "QA Carrier"
  );
  await driver.sleep(500);
}

async function fillCreateTenderStepOneForCrawler(driver: WebDriver): Promise<void> {
  const allInputs = await driver.findElements(By.css("input"));
  const filtered = await sortElementsByPosition(await filterVisibleElements(driver, allInputs));

  const eligible: WebElement[] = [];
  for (const input of filtered) {
    const placeholder = ((await input.getAttribute("placeholder")) ?? "").trim().toLowerCase();
    const type = ((await input.getAttribute("type")) ?? "").trim().toLowerCase();
    const role = ((await input.getAttribute("role")) ?? "").trim().toLowerCase();
    const value = ((await input.getAttribute("value")) ?? "").trim().toLowerCase();
    if (placeholder === "pesquisar" || placeholder === "search") continue;
    if (role === "combobox") continue;
    if (!["text", "date"].includes(type)) continue;
    if (value === "spot" || value === "fcl") continue;
    eligible.push(input);
  }

  if (eligible.length < 7) {
    throw new Error(`Expected 7 Create Tender inputs, found ${eligible.length}`);
  }

  await replaceInputValue(driver, eligible[0], `Crawler Tender ${Date.now()}`);
  await replaceDateInputValue(driver, eligible[1], "20052026");
  await replaceDateInputValue(driver, eligible[2], "25052026");
  await replaceDateInputValue(driver, eligible[3], "30052026");
  await replaceInputValue(driver, eligible[4], "Porto");
  await replaceInputValue(driver, eligible[5], "Rotterdam");
  await replaceInputValue(driver, eligible[6], "QA Carrier");

  await expandCreateTenderForDetailedSnapshot(driver);

  const equipmentTrigger = await driver.wait(
    until.elementLocated(
      By.xpath(
        "//*[normalize-space()='FCL Packages' or normalize-space()='Pacotes FCL']/ancestor::*[self::div or self::section][1]//*[@role='combobox' or self::input][ancestor::*[.//*[normalize-space()='Equipments' or normalize-space()='Equipamentos']]]"
      )
    ),
    TIMEOUT
  );
  await clickElement(driver, equipmentTrigger);
  const option = await driver.wait(until.elementLocated(By.xpath("//li[@role='option' or @data-option-index]")), TIMEOUT);
  await clickElement(driver, option);

  const weightInput = await driver.wait(
    until.elementLocated(
      By.xpath(
        "//*[normalize-space()='FCL Packages' or normalize-space()='Pacotes FCL']/ancestor::*[self::div or self::section][1]//input[ancestor::*[.//*[normalize-space()='Weight (KG)' or normalize-space()='Peso (KG)']]]"
      )
    ),
    TIMEOUT
  );
  const quantityInput = await driver.wait(
    until.elementLocated(
      By.xpath(
        "//*[normalize-space()='FCL Packages' or normalize-space()='Pacotes FCL']/ancestor::*[self::div or self::section][1]//input[ancestor::*[.//*[normalize-space()='Quantity' or normalize-space()='Quantidade']]]"
      )
    ),
    TIMEOUT
  );
  await replaceInputValue(driver, weightInput, "100");
  await replaceInputValue(driver, quantityInput, "1");

  const searchInputs = await driver.findElements(By.xpath("//input[@placeholder='Pesquisar' or @placeholder='Search']"));
  const visibleSearchInputs = await sortElementsByPosition(await filterVisibleElements(driver, searchInputs));
  if (visibleSearchInputs.length >= 2) {
    await replaceInputValue(driver, visibleSearchInputs[0], "Europe");
    await clickFirstCheckboxInSection(driver, ["Mercados", "Markets"]);
    await clickTenderTileCheckboxInPage(driver, "Air");
  }
}

async function clickWizardNext(driver: WebDriver, expectedMarkerText: string): Promise<void> {
  await driver.executeScript("window.scrollTo({ top: 0, behavior: 'instant' });");
  await driver.sleep(250);
  const nextButton = await driver.wait(
    until.elementLocated(By.xpath("//button[.//i[contains(@class,'pi-arrow-right')] or contains(normalize-space(),'Next') or contains(normalize-space(),'Seguinte')]")),
    TIMEOUT
  );
  await clickElement(driver, nextButton);

  let markerLocator: By;
  if (expectedMarkerText === "Selecionar Rota") {
    markerLocator = By.xpath("//*[normalize-space()='Selecionar Rota' or normalize-space()='Select Route' or normalize-space()='Rota *' or normalize-space()='Route *']");
  } else {
    markerLocator = By.xpath("//*[normalize-space()='Convidar Transportadoras' or normalize-space()='Carriers Invitation' or normalize-space()='Carriers']");
  }

  await driver.wait(until.elementLocated(markerLocator), TIMEOUT);
}

async function clickFirstCheckboxInSection(driver: WebDriver, sectionNames: string[]): Promise<void> {
  const clicked = await driver.executeScript<boolean>(
    `
      const titles = arguments[0];
      const normalize = (value) => (value || "").replace(/\\s+/g, " ").trim().toLowerCase();
      const isVisible = (element) => {
        if (!(element instanceof HTMLElement)) return false;
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      };

      const section = Array.from(document.querySelectorAll("div")).find((element) => {
        const text = normalize(element.textContent);
        return titles.some((title) => text.includes(normalize(title)));
      });
      if (!section) return false;

      const candidates = Array.from(section.querySelectorAll("span.MuiCheckbox-root, span.MuiButtonBase-root.MuiCheckbox-root, input[type='checkbox']"));
      for (const candidate of candidates) {
        if (!isVisible(candidate)) continue;
        if (candidate instanceof HTMLInputElement) {
          candidate.click();
          candidate.dispatchEvent(new Event("input", { bubbles: true }));
          candidate.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }
        if (candidate instanceof HTMLElement) {
          candidate.click();
          return true;
        }
      }
      return false;
    `,
    sectionNames
  );

  if (!clicked) {
    throw new Error(`Could not click first checkbox in section ${sectionNames.join("/")}`);
  }
}

async function clickTenderTileCheckboxInPage(driver: WebDriver, tileText: string): Promise<void> {
  const clicked = await driver.executeScript<boolean>(
    `
      const targetText = arguments[0];
      const normalize = (value) => (value || "").replace(/\\s+/g, " ").trim();
      const isVisible = (element) => {
        if (!(element instanceof HTMLElement)) return false;
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      };

      const tiles = Array.from(document.querySelectorAll("div.stg-tile, span.stg-tile-label"));
      for (const tile of tiles) {
        if (!isVisible(tile)) continue;
        if (normalize(tile.textContent) !== normalize(targetText)) continue;
        const tileContainer = tile.closest("div.stg-tile") || tile.parentElement;
        const sibling = tileContainer?.nextElementSibling;
        const checkbox = sibling?.querySelector?.("input[type='checkbox']");
        if (checkbox instanceof HTMLInputElement && isVisible(checkbox)) {
          checkbox.click();
          checkbox.dispatchEvent(new Event("input", { bubbles: true }));
          checkbox.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }
        const checkboxRoot = sibling?.querySelector?.("span.MuiCheckbox-root, span.MuiButtonBase-root.MuiCheckbox-root");
        if (checkboxRoot instanceof HTMLElement && isVisible(checkboxRoot)) {
          checkboxRoot.click();
          return true;
        }
      }
      return false;
    `,
    tileText
  );

  if (!clicked) {
    throw new Error(`Could not click tender tile checkbox for ${tileText}`);
  }
}

async function filterVisibleElements(_driver: WebDriver, elements: WebElement[]): Promise<WebElement[]> {
  const visible: WebElement[] = [];
  for (const element of elements) {
    if (await element.isDisplayed().catch(() => false) && await element.isEnabled().catch(() => false)) {
      const rect = await element.getRect().catch(() => null);
      if (rect && rect.width > 0 && rect.height > 0) visible.push(element);
    }
  }
  return visible;
}

async function sortElementsByPosition(elements: WebElement[]): Promise<WebElement[]> {
  const withRects = await Promise.all(
    elements.map(async (element) => ({ element, rect: await element.getRect() }))
  );
  return withRects
    .sort((a, b) => {
      if (Math.abs(a.rect.y - b.rect.y) > 8) return a.rect.y - b.rect.y;
      return a.rect.x - b.rect.x;
    })
    .map((entry) => entry.element);
}

async function replaceInputValue(driver: WebDriver, input: WebElement, value: string): Promise<void> {
  await clickElement(driver, input);
  await input.clear().catch(() => undefined);
  await driver.executeScript(
    `
      const input = arguments[0];
      const desired = arguments[1];
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      if (setter) setter.call(input, "");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    `,
    input,
    value
  );
  await input.sendKeys(value);
}

async function replaceDateInputValue(driver: WebDriver, input: WebElement, typedValue: string): Promise<void> {
  await clickElement(driver, input);
  await input.clear().catch(() => undefined);
  await input.sendKeys(typedValue);
}

async function findMenuItemWithScroll(driver: WebDriver, texts: string[]): Promise<WebElement> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const found = await driver.executeScript<WebElement | null>(
      `
        const targets = arguments[0];
        const isVisible = (el) => {
          if (!el) return false;
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style.visibility !== "hidden" &&
            style.display !== "none" &&
            rect.width > 0 &&
            rect.height > 0;
        };

        const clickableAncestor = (el) => {
          let current = el;
          while (current) {
            if (
              current.matches?.("button, a, li, div") &&
              (
                current.getAttribute("role") === "button" ||
                current.className?.includes("MuiButtonBase-root") ||
                current.className?.includes("MuiListItemButton-root") ||
                current.className?.includes("mainMenuItem") ||
                current.className?.includes("menuItem")
              )
            ) {
              return current;
            }
            current = current.parentElement;
          }
          return el;
        };

        const elements = Array.from(document.querySelectorAll("span, div, a, li, button"));
        for (const target of targets) {
          const normalizedTarget = target.trim().toLowerCase();
          for (const el of elements) {
            const text = (el.textContent || "").trim().replace(/\\s+/g, " ").toLowerCase();
            if (!text) continue;
            if ((text === normalizedTarget || text.includes(normalizedTarget)) && isVisible(el)) {
              return clickableAncestor(el);
            }
          }
        }
        return null;
      `,
      texts
    );

    if (found) {
      await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", found);
      return found;
    }

    await driver.executeScript(`
      const candidates = Array.from(document.querySelectorAll("*"))
        .filter((el) => el.scrollHeight > el.clientHeight + 40);
      for (const el of candidates) {
        el.scrollTop += 250;
      }
    `);
    await driver.sleep(250);
  }

  throw new Error(`Expected to find menu item "${texts.join('" or "')}" after scrolling`);
}

async function clickElement(driver: WebDriver, element: WebElement): Promise<void> {
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", element);
  try {
    await element.click();
  } catch {
    await driver.executeScript("arguments[0].click();", element);
  }
}

async function closeLastTab(driver: WebDriver): Promise<void> {
  const icons = await driver.findElements(By.css('svg.tabCloseIcon[data-testid="CloseIcon"]'));
  const last = icons[icons.length - 1];
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", last);
  await clickElement(driver, last);
  await waitForSuccessAlert(driver, "Tab fechado com sucesso");
  await driver.sleep(300);
}

async function waitForSuccessAlert(driver: WebDriver, message: string): Promise<void> {
  const locator = By.xpath(`//div[contains(@class,'MuiAlert-colorSuccess') and contains(.,'${message}')]`);
  await driver.wait(async () => {
    const alerts = await driver.findElements(locator);
    for (const alert of alerts) {
      try {
        if (await alert.isDisplayed()) return true;
      } catch {
        // stale alert, keep polling
      }
    }
    return false;
  }, TIMEOUT, `Expected success alert: "${message}"`);
}


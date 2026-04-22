import { By, Key, until, WebDriver, WebElement } from "selenium-webdriver";
import { portalConfig } from "../config/portalConfig";

export class NavigationPage {
  private readonly menuButton = By.css('button[aria-label="Menu"][aria-haspopup="true"]');
  private readonly visibleMenuItem = By.xpath("//div[@role='button'][.//span[normalize-space()='Mercados' or contains(normalize-space(), 'Localiza')]]");
  private readonly marketsButton = By.xpath("//div[@role='button'][.//span[normalize-space()='Mercados']]");
  private readonly locationsButton = By.xpath("//div[@role='button'][.//span[contains(normalize-space(), 'Localiza')]]");
  private readonly marketsTab = By.xpath("//button[@role='tab'][.//span[contains(@class, 'tabLabelText') and normalize-space()='Mercados']]");
  private readonly locationsTab = By.xpath("//button[@role='tab'][.//span[contains(@class, 'tabLabelText') and contains(normalize-space(), 'Localiza')]]");
  private readonly tabCloseIcons = By.css('svg.tabCloseIcon[data-testid="CloseIcon"]');
  private readonly westernEuropeRow = By.xpath("//tr[@role='row'][.//td[normalize-space()='Western Europe']]");
  private readonly refreshButton = By.css("button i.pi.pi-refresh");
  private readonly editButton = By.css("button i.pi.pi-pencil.iconTable");
  private readonly marketInfoTitle = By.xpath("//*[normalize-space()='Informações do Mercado']");
  private readonly westernEuropeInput = By.xpath("//input[@value='Western Europe']");
  private readonly portoMarselhaRow = By.xpath("//tr[@role='row'][.//td[normalize-space()='Porto de Marselha']]");
  private readonly newMarketButton = By.xpath("//button[.//*[contains(@class,'pi-plus') or contains(@data-testid,'Add') or contains(@data-testid,'AddCircle')]]");
  private readonly deleteMarketButton = By.xpath("//button[.//*[contains(@class,'pi-trash') or contains(@data-testid,'Delete')]]");
  private readonly marketNameInput = By.css("input.MuiInputBase-input[type='text']");
  private readonly saveMarketButton = By.xpath("//button[contains(@class,'buttonClass') and contains(normalize-space(),'Guardar')]");
  private readonly confirmDeleteButton = By.xpath("//button[contains(@class,'buttonClass') and (contains(normalize-space(),'Sim') or contains(normalize-space(),'Confirmar') or contains(normalize-space(),'Eliminar'))]");
  private readonly locationInfoTitle = By.xpath("//*[contains(normalize-space(), 'Inform') and contains(normalize-space(), 'Localiza')]");
  private readonly portoMarselhaInput = By.xpath("//input[@value='Porto de Marselha']");
  private readonly transportTypesButton = By.xpath("//div[@role='button'][.//span[contains(normalize-space(),'Tipos de Transporte')]]");
  private readonly newTransportTypeButton = By.xpath("//button[.//*[@data-testid='AddCircleOutlineOutlinedIcon']]");
  private readonly saveTransportTypeButton = By.css("button i.pi-save");
  private readonly transportTypeNameInput = By.css("input.MuiInputBase-input[type='text']");
  private readonly anyTableRow = By.css("tr.p-selectable-row");

  constructor(private readonly driver: WebDriver) {}

  public async openSideMenu(): Promise<void> {
    if (await this.hasVisibleElement(this.visibleMenuItem)) return;

    const menu = await this.driver.wait(until.elementLocated(this.menuButton), portalConfig.timeoutMs);
    await this.driver.wait(until.elementIsVisible(menu), portalConfig.timeoutMs);
    await this.driver.wait(until.elementIsEnabled(menu), portalConfig.timeoutMs);
    await menu.click();

    if (await this.waitForMenuToOpen()) return;

    await this.driver.executeScript("arguments[0].click();", menu);

    if (await this.waitForMenuToOpen()) return;

    throw new Error("Expected side menu to open");
  }

  public async openMarkets(): Promise<void> {
    await this.ensureMenuItemInteractable(this.marketsButton);
    await this.clickMenuItem(this.marketsButton);
    await this.driver.wait(until.urlContains("markets"), portalConfig.timeoutMs);
    await this.expectWesternEuropeVisible();
  }

  public async openLocations(): Promise<void> {
    await this.ensureMenuItemInteractable(this.locationsButton);
    await this.clickMenuItem(this.locationsButton);
    await this.driver.wait(until.urlContains("locations"), portalConfig.timeoutMs);
    await this.expectPortoMarselhaVisible();
  }

  public async openMarketsAgainWithoutDuplicate(): Promise<void> {
    const countBefore = await this.countInteractableElements(this.marketsTab);
    await this.ensureMenuItemInteractable(this.marketsButton);
    await this.clickMenuItem(this.marketsButton);
    const countAfter = await this.countInteractableElements(this.marketsTab);

    if (countAfter !== countBefore) {
      throw new Error(`Expected ${countBefore} Markets tab(s), but found ${countAfter}`);
    }
  }

  public async switchBetweenMarketsAndLocations(): Promise<void> {
    await this.selectTab(this.marketsTab, "Markets");
    await this.selectTab(this.locationsTab, "Locations");
  }

  public async expectMarketsAndLocationsTabsVisible(): Promise<void> {
    await this.findInteractableElement(this.marketsTab);
    await this.findInteractableElement(this.locationsTab);
  }

  public async expectWesternEuropeVisible(): Promise<void> {
    await this.findInteractableElement(this.westernEuropeRow);
  }

  public async refreshMarketsTable(): Promise<void> {
    const refreshIcon = await this.findInteractableElement(this.refreshButton);
    await this.clickElement(refreshIcon);
    await this.expectWesternEuropeVisible();
  }

  public async openWesternEuropeEditTab(): Promise<void> {
    const row = await this.findInteractableElement(this.westernEuropeRow);
    await this.clickElement(row);

    const editIcon = await this.findInteractableElement(this.editButton);
    await this.clickElement(editIcon);

    await this.driver.wait(until.urlContains("marketConfigCrud"), portalConfig.timeoutMs);
    await this.findInteractableElement(this.marketInfoTitle);
    await this.findInteractableElement(this.westernEuropeInput);
  }

  public async expectPortoMarselhaVisible(): Promise<void> {
    await this.findInteractableElement(this.portoMarselhaRow);
  }

  public async refreshLocationsTable(): Promise<void> {
    const refreshIcon = await this.findInteractableElement(this.refreshButton);
    await this.clickElement(refreshIcon);
    await this.expectPortoMarselhaVisible();
  }

  public async openPortoMarselhaEditTab(): Promise<void> {
    const row = await this.findInteractableElement(this.portoMarselhaRow);
    await this.clickElement(row);

    const editIcon = await this.findInteractableElement(this.editButton);
    await this.clickElement(editIcon);

    await this.driver.wait(until.urlContains("locationConfigCrud"), portalConfig.timeoutMs);
    await this.findInteractableElement(this.locationInfoTitle);
    await this.findInteractableElement(this.portoMarselhaInput);
  }

  public async createMarket(name: string): Promise<void> {
    const newBtn = await this.findInteractableElement(this.newMarketButton);
    await this.clickElement(newBtn);

    await this.driver.wait(until.urlContains("marketConfigCrud"), portalConfig.timeoutMs);
    await this.findInteractableElement(this.marketInfoTitle);

    const nameInput = await this.findInteractableElement(this.marketNameInput);
    await this.replaceInputValue(nameInput, name);

    const saveBtn = await this.findInteractableElement(this.saveMarketButton);
    await this.clickElement(saveBtn);

    await this.waitAfterSave();
    await this.openMarketsPageDirectly();
    await this.refreshMarketsTable();
  }

  public async editMarketName(name: string, newName: string): Promise<void> {
    const rowLocator = By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`);
    const row = await this.findInteractableElement(rowLocator);
    await this.clickElement(row);

    const editIcon = await this.findInteractableElement(this.editButton);
    await this.clickElement(editIcon);

    await this.driver.wait(until.urlContains("marketConfigCrud"), portalConfig.timeoutMs);
    await this.findInteractableElement(this.marketInfoTitle);

    const nameInput = await this.findInteractableElement(this.marketNameInput);
    await this.replaceInputValue(nameInput, newName);

    const saveBtn = await this.findInteractableElement(this.saveMarketButton);
    await this.clickElement(saveBtn);

    await this.waitAfterSave();
    await this.openMarketsPageDirectly();
    await this.refreshMarketsTable();
  }

  public async deleteMarket(name: string): Promise<void> {
    const rowLocator = By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`);
    const row = await this.findInteractableElement(rowLocator);
    await this.clickElement(row);

    const deleteBtn = await this.findInteractableElement(this.deleteMarketButton);
    await this.clickElement(deleteBtn);

    try {
      const confirmBtn = await this.driver.wait(until.elementLocated(this.confirmDeleteButton), 3000);
      await this.driver.wait(until.elementIsVisible(confirmBtn), 3000);
      await this.clickElement(confirmBtn);
    } catch {
      // sem diálogo de confirmação — delete imediato
    }

    await this.waitAfterSave();
    await this.refreshMarketsTable();
  }

  public async expectMarketVisible(name: string): Promise<void> {
    await this.findInteractableElement(By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`));
  }

  public async expectMarketNotVisible(name: string): Promise<void> {
    await this.driver.sleep(1000);
    const rows = await this.driver.findElements(By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`));
    for (const row of rows) {
      if (await row.isDisplayed()) {
        throw new Error(`Mercado "${name}" devia ter sido eliminado mas ainda está visível`);
      }
    }
  }

  public async openTransportTypes(): Promise<void> {
    await this.ensureMenuItemInteractable(this.transportTypesButton);
    await this.clickMenuItem(this.transportTypesButton);
    await this.driver.wait(until.urlContains("transport-types"), portalConfig.timeoutMs);
    await this.findInteractableElement(this.anyTableRow);
  }

  public async createTransportType(name: string): Promise<void> {
    const newBtn = await this.findInteractableElement(this.newTransportTypeButton);
    await this.clickElement(newBtn);

    await this.driver.wait(until.urlContains("transportTypeConfigCrud"), portalConfig.timeoutMs);
    const nameInput = await this.findInteractableElement(this.transportTypeNameInput);
    await this.replaceInputValue(nameInput, name);

    const saveBtn = await this.findInteractableElement(this.saveTransportTypeButton);
    await this.clickElement(saveBtn);

    await this.waitAfterSave();
    await this.openTransportTypesPageDirectly();
    await this.refreshTransportTypesTable();
  }

  public async editTransportTypeName(name: string, newName: string): Promise<void> {
    const row = await this.findInteractableElement(By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`));
    await this.clickElement(row);

    const editIcon = await this.findInteractableElement(this.editButton);
    await this.clickElement(editIcon);

    await this.driver.wait(until.urlContains("transportTypeConfigCrud"), portalConfig.timeoutMs);
    const nameInput = await this.findInteractableElement(this.transportTypeNameInput);
    await this.replaceInputValue(nameInput, newName);

    const saveBtn = await this.findInteractableElement(this.saveTransportTypeButton);
    await this.clickElement(saveBtn);

    await this.waitAfterSave();
    await this.openTransportTypesPageDirectly();
    await this.refreshTransportTypesTable();
  }

  public async deleteTransportType(name: string): Promise<void> {
    const row = await this.findInteractableElement(By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`));
    await this.clickElement(row);

    const deleteBtn = await this.findInteractableElement(this.deleteMarketButton);
    await this.clickElement(deleteBtn);

    try {
      const confirmBtn = await this.driver.wait(until.elementLocated(this.confirmDeleteButton), 3000);
      await this.driver.wait(until.elementIsVisible(confirmBtn), 3000);
      await this.clickElement(confirmBtn);
    } catch {
      // delete imediato
    }

    await this.waitAfterSave();
    await this.refreshTransportTypesTable();
  }

  public async expectTransportTypeVisible(name: string): Promise<void> {
    await this.findInteractableElement(By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`));
  }

  public async expectTransportTypeNotVisible(name: string): Promise<void> {
    await this.driver.sleep(1000);
    const rows = await this.driver.findElements(By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`));
    for (const row of rows) {
      if (await row.isDisplayed()) {
        throw new Error(`Tipo de Transporte "${name}" devia ter sido eliminado mas ainda está visível`);
      }
    }
  }

  public async closeCurrentTab(): Promise<void> {
    const closeIcon = await this.findLastInteractableElement(this.tabCloseIcons);
    await this.clickElement(closeIcon);
    await this.waitForSuccessAlert("Tab fechado com sucesso");
  }

  private async clickMenuItem(locator: By): Promise<void> {
    const item = await this.findInteractableElement(locator);
    await this.clickElement(item);
  }

  private async openMarketsPageDirectly(): Promise<void> {
    const baseUrl = (await this.driver.getCurrentUrl()).split("#")[0];
    await this.driver.get(`${baseUrl}#/home/markets`);
    await this.driver.wait(until.urlContains("markets"), portalConfig.timeoutMs);
    await this.expectWesternEuropeVisible();
  }

  private async openTransportTypesPageDirectly(): Promise<void> {
    const baseUrl = (await this.driver.getCurrentUrl()).split("#")[0];
    await this.driver.get(`${baseUrl}#/home/transport-types`);
    await this.driver.wait(until.urlContains("transport-types"), portalConfig.timeoutMs);
    await this.findInteractableElement(this.anyTableRow);
  }

  private async refreshTransportTypesTable(): Promise<void> {
    const refreshIcon = await this.findInteractableElement(this.refreshButton);
    await this.clickElement(refreshIcon);
    await this.findInteractableElement(this.anyTableRow);
  }

  private async ensureMenuItemInteractable(locator: By): Promise<void> {
    if (await this.hasInteractableElement(locator)) return;
    await this.openSideMenu();
    await this.findInteractableElement(locator);
  }

  private async selectTab(locator: By, tabName: string): Promise<void> {
    const tab = await this.findInteractableElement(locator);
    await this.clickElement(tab);
    await this.driver.wait(async () => {
      const selected = await tab.getAttribute("aria-selected");
      return selected === "true";
    }, portalConfig.timeoutMs, `Expected ${tabName} tab to be selected`);
  }

  private async waitForSuccessAlert(message: string): Promise<void> {
    const normalized = message.toLowerCase();
    const locator = By.xpath(`//div[contains(@class,'MuiAlert-colorSuccess') and contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'${normalized}')]`);
    await this.driver.wait(async () => {
      const alerts = await this.driver.findElements(locator);
      for (const alert of alerts) {
        try { if (await alert.isDisplayed()) return true; } catch { /* stale */ }
      }
      return false;
    }, portalConfig.timeoutMs, `Expected success alert: ${message}`);
  }

  private async waitAfterSave(): Promise<void> {
    try {
      await this.waitForSuccessAlert("sucesso");
    } catch {
      await this.driver.sleep(1000);
    }
  }

  private async findInteractableElement(locator: By): Promise<WebElement> {
    await this.driver.wait(until.elementLocated(locator), portalConfig.timeoutMs);
    const element = await this.driver.wait(async () => {
      const elements = await this.driver.findElements(locator);
      for (const el of elements) {
        if (await this.isInteractable(el)) return el;
      }
      return false;
    }, portalConfig.timeoutMs);
    if (!element) throw new Error(`Expected to find an interactable element for ${locator}`);
    return element;
  }

  private async findLastInteractableElement(locator: By): Promise<WebElement> {
    await this.driver.wait(until.elementLocated(locator), portalConfig.timeoutMs);
    const element = await this.driver.wait(async () => {
      const elements = await this.driver.findElements(locator);
      for (const el of elements.reverse()) {
        if (await this.isInteractable(el)) return el;
      }
      return false;
    }, portalConfig.timeoutMs);
    if (!element) throw new Error(`Expected to find an interactable element for ${locator}`);
    return element;
  }

  private async hasInteractableElement(locator: By): Promise<boolean> {
    const elements = await this.driver.findElements(locator);
    for (const el of elements) {
      if (await this.isInteractable(el)) return true;
    }
    return false;
  }

  private async hasVisibleElement(locator: By): Promise<boolean> {
    const elements = await this.driver.findElements(locator);
    for (const el of elements) {
      if (await el.isDisplayed()) return true;
    }
    return false;
  }

  private async waitForMenuToOpen(): Promise<boolean> {
    try {
      await this.driver.wait(async () => this.hasVisibleElement(this.visibleMenuItem), 2000);
      return true;
    } catch {
      return false;
    }
  }

  private async countInteractableElements(locator: By): Promise<number> {
    const elements = await this.driver.findElements(locator);
    let count = 0;
    for (const el of elements) {
      if (await this.isInteractable(el)) count++;
    }
    return count;
  }

  private async isInteractable(element: WebElement): Promise<boolean> {
    if (!(await element.isDisplayed()) || !(await element.isEnabled())) return false;
    const rect = await element.getRect();
    return rect.width > 0 && rect.height > 0 && rect.x + rect.width > 0 && rect.y + rect.height > 0;
  }

  private async clickElement(element: WebElement): Promise<void> {
    await this.driver.executeScript("arguments[0].scrollIntoView({block:'center',inline:'center'});", element);
    try {
      await element.click();
    } catch {
      await this.driver.executeScript("arguments[0].click();", element);
    }
  }

  private async replaceInputValue(input: WebElement, value: string): Promise<void> {
    await this.clickElement(input);
    await input.sendKeys(Key.chord(Key.CONTROL, "a"));
    await input.sendKeys(Key.DELETE);
    await this.driver.wait(async () => {
      const current = await input.getAttribute("value");
      return current === "";
    }, portalConfig.timeoutMs, "Expected input to be cleared");
    await input.sendKeys(value);
    await this.driver.wait(async () => {
      const current = await input.getAttribute("value");
      return current === value;
    }, portalConfig.timeoutMs, `Expected input value to be "${value}"`);
  }
}

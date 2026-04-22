import { By, until, WebDriver, WebElement } from "selenium-webdriver";
import { appConfig } from "../config/appConfig";

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
  private readonly newMarketButton = By.css("button i.pi.pi-plus");
  private readonly deleteMarketButton = By.css("button i.pi.pi-trash");
  private readonly marketNameInput = By.css("input.MuiInputBase-input[type='text']");
  private readonly saveMarketButton = By.xpath("//button[contains(@class,'buttonClass') and contains(normalize-space(),'Guardar')]");
  private readonly confirmDeleteButton = By.xpath("//button[contains(@class,'buttonClass') and (contains(normalize-space(),'Sim') or contains(normalize-space(),'Confirmar'))]");

  constructor(private readonly driver: WebDriver) {}

  public async openSideMenu(): Promise<void> {
    if (await this.hasVisibleElement(this.visibleMenuItem)) {
      return;
    }

    const menu = await this.driver.wait(until.elementLocated(this.menuButton), appConfig.timeoutMs);
    await this.driver.wait(until.elementIsVisible(menu), appConfig.timeoutMs);
    await this.driver.wait(until.elementIsEnabled(menu), appConfig.timeoutMs);

    await menu.click();

    if (await this.waitForMenuToOpen()) {
      return;
    }

    await this.driver.executeScript("arguments[0].click();", menu);

    if (await this.waitForMenuToOpen()) {
      return;
    }

    throw new Error("Expected side menu to open");
  }

  public async openMarkets(): Promise<void> {
    await this.ensureMenuItemInteractable(this.marketsButton);
    await this.clickMenuItem(this.marketsButton);
    await this.waitForSuccessAlert("Tab criado com sucesso");
  }

  public async openLocations(): Promise<void> {
    await this.ensureMenuItemInteractable(this.locationsButton);
    await this.clickMenuItem(this.locationsButton);
    await this.waitForSuccessAlert("Tab criado com sucesso");
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

    await this.driver.wait(until.urlContains("marketConfigCrud"), appConfig.timeoutMs);
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

    await this.waitForSuccessAlert("Tab criado com sucesso");
    await this.driver.wait(until.urlContains("locationConfigCrud"), appConfig.timeoutMs);
  }

  public async createMarket(name: string): Promise<void> {
    const newBtn = await this.findInteractableElement(this.newMarketButton);
    await this.clickElement(newBtn);

    await this.driver.wait(until.urlContains("marketConfigCrud"), appConfig.timeoutMs);
    await this.findInteractableElement(this.marketInfoTitle);

    const nameInput = await this.findInteractableElement(this.marketNameInput);
    await nameInput.clear();
    await nameInput.sendKeys(name);

    const saveBtn = await this.findInteractableElement(this.saveMarketButton);
    await this.clickElement(saveBtn);

    await this.waitForSuccessAlert("sucesso");
    await this.closeCurrentTab();
  }

  public async editMarketName(name: string, newName: string): Promise<void> {
    const rowLocator = By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`);
    const row = await this.findInteractableElement(rowLocator);
    await this.clickElement(row);

    const editIcon = await this.findInteractableElement(this.editButton);
    await this.clickElement(editIcon);

    await this.driver.wait(until.urlContains("marketConfigCrud"), appConfig.timeoutMs);
    await this.findInteractableElement(this.marketInfoTitle);

    const nameInput = await this.findInteractableElement(this.marketNameInput);
    await this.driver.executeScript("arguments[0].value = '';", nameInput);
    await nameInput.clear();
    await nameInput.sendKeys(newName);

    const saveBtn = await this.findInteractableElement(this.saveMarketButton);
    await this.clickElement(saveBtn);

    await this.waitForSuccessAlert("sucesso");
    await this.closeCurrentTab();
  }

  public async deleteMarket(name: string): Promise<void> {
    const rowLocator = By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`);
    const row = await this.findInteractableElement(rowLocator);
    await this.clickElement(row);

    const deleteBtn = await this.findInteractableElement(this.deleteMarketButton);
    await this.clickElement(deleteBtn);

    try {
      const confirmBtn = await this.driver.wait(
        until.elementLocated(this.confirmDeleteButton),
        3000
      );
      await this.driver.wait(until.elementIsVisible(confirmBtn), 3000);
      await this.clickElement(confirmBtn);
    } catch {
      // sem diálogo de confirmação — o delete foi imediato
    }

    await this.waitForSuccessAlert("sucesso");
  }

  public async expectMarketVisible(name: string): Promise<void> {
    const rowLocator = By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`);
    await this.findInteractableElement(rowLocator);
  }

  public async expectMarketNotVisible(name: string): Promise<void> {
    await this.driver.sleep(1000);
    const rowLocator = By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`);
    const rows = await this.driver.findElements(rowLocator);
    for (const row of rows) {
      if (await row.isDisplayed()) {
        throw new Error(`Mercado "${name}" devia ter sido eliminado mas ainda está visível`);
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

  private async ensureMenuItemInteractable(locator: By): Promise<void> {
    if (await this.hasInteractableElement(locator)) {
      return;
    }

    await this.openSideMenu();
    await this.findInteractableElement(locator);
  }

  private async selectTab(locator: By, tabName: string): Promise<void> {
    const tab = await this.findInteractableElement(locator);
    await this.clickElement(tab);

    await this.driver.wait(async () => {
      const selected = await tab.getAttribute("aria-selected");
      return selected === "true";
    }, appConfig.timeoutMs, `Expected ${tabName} tab to be selected`);
  }

  private async waitForSuccessAlert(message: string): Promise<string> {
    const locator = By.xpath(`//div[contains(@class, 'MuiAlert-colorSuccess') and contains(., '${message}')]`);

    await this.driver.wait(async () => {
      const alerts = await this.driver.findElements(locator);

      for (const alert of alerts) {
        try {
          if (await alert.isDisplayed()) {
            return true;
          }
        } catch {
          return false;
        }
      }

      return false;
    }, appConfig.timeoutMs, `Expected success alert: ${message}`);

    return message;
  }

  private async findInteractableElement(locator: By): Promise<WebElement> {
    await this.driver.wait(until.elementLocated(locator), appConfig.timeoutMs);

    const element = await this.driver.wait(async () => {
      const elements = await this.driver.findElements(locator);

      for (const element of elements) {
        if (await this.isInteractable(element)) {
          return element;
        }
      }

      return false;
    }, appConfig.timeoutMs);

    if (!element) {
      throw new Error(`Expected to find an interactable element for ${locator}`);
    }

    return element;
  }

  private async findLastInteractableElement(locator: By): Promise<WebElement> {
    await this.driver.wait(until.elementLocated(locator), appConfig.timeoutMs);

    const element = await this.driver.wait(async () => {
      const elements = await this.driver.findElements(locator);

      for (const element of elements.reverse()) {
        if (await this.isInteractable(element)) {
          return element;
        }
      }

      return false;
    }, appConfig.timeoutMs);

    if (!element) {
      throw new Error(`Expected to find an interactable element for ${locator}`);
    }

    return element;
  }

  private async hasInteractableElement(locator: By): Promise<boolean> {
    const elements = await this.driver.findElements(locator);

    for (const element of elements) {
      if (await this.isInteractable(element)) {
        return true;
      }
    }

    return false;
  }

  private async hasVisibleElement(locator: By): Promise<boolean> {
    const elements = await this.driver.findElements(locator);

    for (const element of elements) {
      if (await element.isDisplayed()) {
        return true;
      }
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

    for (const element of elements) {
      if (await this.isInteractable(element)) {
        count++;
      }
    }

    return count;
  }

  private async isInteractable(element: WebElement): Promise<boolean> {
    if (!(await element.isDisplayed()) || !(await element.isEnabled())) {
      return false;
    }

    const rect = await element.getRect();
    return rect.width > 0 && rect.height > 0 && rect.x + rect.width > 0 && rect.y + rect.height > 0;
  }

  private async clickElement(element: WebElement): Promise<void> {
    await this.driver.executeScript("arguments[0].scrollIntoView({block: 'center', inline: 'center'});", element);

    try {
      await element.click();
    } catch {
      await this.driver.executeScript("arguments[0].click();", element);
    }
  }
}

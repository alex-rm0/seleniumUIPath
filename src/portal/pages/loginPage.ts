import { By, until, WebDriver } from "selenium-webdriver";
import { portalConfig } from "../config/portalConfig";

export class LoginPage {
  private readonly usernameInput = By.css('input[type="text"]');
  private readonly passwordInput = By.css('input[type="password"]');
  private readonly submitButton = By.css("button.buttonClass.buttonClassHover");
  private readonly menuButton = By.css('button[aria-label="Menu"][aria-haspopup="true"]');
  // Padrão antigo: dropdown (shipper portal — menu colapsado)
  private readonly logoutButtonDropdown = By.xpath("//div[@role='button'][.//span[contains(normalize-space(), 'Terminar Sess')]]");
  // Padrão directo: botão sempre visível na sidebar (TenderInQuotation, spot-tenders-finished, EN/PT)
  private readonly logoutButtonDirect = By.xpath(
    "//button[@aria-label='Terminar Sessão' or @aria-label='Logout']" +
    "[contains(@class,'userSettingsIconButton')]"
  );
  private readonly successTitle = By.css("div.MuiAlert-root.MuiAlert-colorSuccess.MuiAlert-filledSuccess");
  private readonly errorMessage = By.css("div.MuiAlert-root.MuiAlert-colorError.MuiAlert-filledError");

  constructor(private readonly driver: WebDriver) {}

  public async open(): Promise<void> {
    await this.driver.get(portalConfig.baseUrl);
    await this.driver.wait(until.elementLocated(this.usernameInput), portalConfig.timeoutMs);
  }

  public async login(username: string, password: string): Promise<void> {
    await this.driver.findElement(this.usernameInput).clear();
    await this.driver.findElement(this.usernameInput).sendKeys(username);
    await this.driver.findElement(this.passwordInput).clear();
    await this.driver.findElement(this.passwordInput).sendKeys(password);
    await this.driver.findElement(this.submitButton).click();
  }

  public async logout(): Promise<void> {
    // 1. Tenta o botão directo na sidebar (TenderInQuotation e páginas com sidebar expandida)
    if (await this.isVisible(this.logoutButtonDirect)) {
      const btn = await this.driver.findElement(this.logoutButtonDirect);
      await this.driver.wait(until.elementIsEnabled(btn), portalConfig.timeoutMs);
      await btn.click();
      return;
    }

    // 2. Padrão antigo: dropdown (abre menu → clica "Terminar Sessão")
    if (!(await this.isVisible(this.logoutButtonDropdown))) {
      const menus = await this.driver.findElements(this.menuButton);
      for (const m of menus) {
        if (await m.isDisplayed().catch(() => false)) {
          await m.click();
          break;
        }
      }
    }

    const button = await this.driver.wait(
      until.elementLocated(this.logoutButtonDropdown),
      portalConfig.timeoutMs,
      "Logout button not found (tried both direct and dropdown patterns)"
    );
    await this.driver.wait(until.elementIsVisible(button), portalConfig.timeoutMs);
    await this.driver.wait(until.elementIsEnabled(button), portalConfig.timeoutMs);
    await button.click();
  }

  private async isVisible(locator: By): Promise<boolean> {
    const els = await this.driver.findElements(locator);
    for (const el of els) {
      if (await el.isDisplayed().catch(() => false)) return true;
    }
    return false;
  }

  public async isLoginPageVisible(): Promise<boolean> {
    const username = await this.driver.wait(until.elementLocated(this.usernameInput), portalConfig.timeoutMs);
    const password = await this.driver.wait(until.elementLocated(this.passwordInput), portalConfig.timeoutMs);
    const submit   = await this.driver.wait(until.elementLocated(this.submitButton), portalConfig.timeoutMs);

    await this.driver.wait(until.elementIsVisible(username), portalConfig.timeoutMs);
    await this.driver.wait(until.elementIsVisible(password), portalConfig.timeoutMs);
    await this.driver.wait(until.elementIsVisible(submit), portalConfig.timeoutMs);

    return true;
  }

  public async getSuccessMessage(): Promise<string> {
    return this.getAlertText(this.successTitle);
  }

  public async getErrorMessage(): Promise<string> {
    return this.getAlertText(this.errorMessage);
  }

  private async getAlertText(locator: By): Promise<string> {
    const element = await this.driver.wait(until.elementLocated(locator), portalConfig.timeoutMs);
    await this.driver.wait(until.elementIsVisible(element), portalConfig.timeoutMs);

    const text = await this.driver.wait(async () => {
      const t = await element.getText();
      return t.trim().length > 0 ? t : false;
    }, portalConfig.timeoutMs);

    if (!text) throw new Error("Expected alert text to be visible");
    return text;
  }
}

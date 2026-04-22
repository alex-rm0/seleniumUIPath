import { By, until, WebDriver } from "selenium-webdriver";
import { portalConfig } from "../config/portalConfig";

export class LoginPage {
  private readonly usernameInput = By.css('input[type="text"]');
  private readonly passwordInput = By.css('input[type="password"]');
  private readonly submitButton = By.css("button.buttonClass.buttonClassHover");
  private readonly menuButton = By.css('button[aria-label="Menu"][aria-haspopup="true"]');
  private readonly logoutButton = By.xpath("//div[@role='button'][.//span[contains(normalize-space(), 'Terminar Sess')]]");
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
    if (!(await this.isLogoutButtonVisible())) {
      const menu = await this.driver.wait(
        until.elementLocated(this.menuButton),
        portalConfig.timeoutMs
      );
      await menu.click();
    }

    const button = await this.driver.wait(
      until.elementLocated(this.logoutButton),
      portalConfig.timeoutMs
    );
    await this.driver.wait(until.elementIsVisible(button), portalConfig.timeoutMs);
    await this.driver.wait(until.elementIsEnabled(button), portalConfig.timeoutMs);
    await button.click();
  }

  private async isLogoutButtonVisible(): Promise<boolean> {
    const buttons = await this.driver.findElements(this.logoutButton);
    for (const button of buttons) {
      if (await button.isDisplayed()) return true;
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

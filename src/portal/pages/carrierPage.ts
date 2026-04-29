import { By, until, WebDriver } from "selenium-webdriver";
import { portalConfig } from "../config/portalConfig";

/**
 * Página do portal de carrier.
 * Utiliza os mesmos seletores CSS/XPath que o portal do shipper
 * porque ambos são a mesma aplicação com roles diferentes.
 *
 * Seletores validados via crawl do portal do shipper (sidemenu.json, tenders.json).
 * Para regenerar o crawl do portal de carrier executar:
 *   npm run crawl -- --pages=carrier-login,carrier-sidemenu,carrier-spot-tenders
 */
export class CarrierPage {
  private readonly usernameInput   = By.css('input[type="text"]');
  private readonly passwordInput   = By.css('input[type="password"]');
  private readonly submitButton    = By.css("button.buttonClass.buttonClassHover");
  private readonly successAlert    = By.css("div.MuiAlert-root.MuiAlert-colorSuccess.MuiAlert-filledSuccess");

  private readonly menuButton      = By.css('button[aria-label="Menu"]');

  private readonly tendersSectionButton = By.xpath(
    "//div[@role='button'][.//span[" +
      "normalize-space()='Tenders' or " +
      "contains(normalize-space(),'Concursos') or " +
      "contains(normalize-space(),'Licitaci') or " +
      "contains(normalize-space(),'Cotaç')" +
    "]]"
  );

  private readonly spotTendersButton = By.xpath(
    "//div[@role='button'][" +
      "@aria-label='Spot Tenders' or " +
      "@aria-label='Concursos Diretos' or " +
      "@aria-label='Concursos Inmediatos' or " +
      "@aria-label='Licitaciones Inmediatas' or " +
      ".//span[normalize-space()='Spot Tenders']" +
    "]"
  );

  private readonly logoutButton = By.xpath(
    "//div[@role='button'][.//span[contains(normalize-space(),'Terminar Sess')]]"
  );

  private readonly successAlertColorSuccess = By.css(
    "div.MuiAlert-root.MuiAlert-colorSuccess.MuiAlert-filledSuccess"
  );

  constructor(private readonly driver: WebDriver) {}

  public async openAndLogin(url: string, username: string, password: string): Promise<void> {
    await this.driver.get(url);
    await this.driver.wait(
      until.elementLocated(this.usernameInput),
      portalConfig.timeoutMs,
      `Carrier login form did not appear at ${url}`
    );

    const user = await this.driver.findElement(this.usernameInput);
    const pass = await this.driver.findElement(this.passwordInput);
    const btn  = await this.driver.findElement(this.submitButton);

    await user.clear();
    await user.sendKeys(username);
    await pass.clear();
    await pass.sendKeys(password);
    await btn.click();

    await this.driver.wait(
      until.elementLocated(this.successAlert),
      portalConfig.timeoutMs,
      `Carrier login success alert did not appear for user "${username}"`
    );
  }

  public async openSideMenu(): Promise<void> {
    const isSideMenuOpen = await this.driver.findElements(this.tendersSectionButton).then(
      async (els) => {
        for (const el of els) {
          if (await el.isDisplayed().catch(() => false)) return true;
        }
        return false;
      }
    );
    if (isSideMenuOpen) return;

    const menu = await this.driver.wait(
      until.elementLocated(this.menuButton),
      portalConfig.timeoutMs,
      "Carrier portal menu button not found"
    );
    await this.driver.wait(until.elementIsVisible(menu), portalConfig.timeoutMs);
    await this.driver.wait(until.elementIsEnabled(menu), portalConfig.timeoutMs);
    await menu.click();

    // Fallback: JS click if Selenium click doesn't open the menu
    const opened = await this.waitForDrawerOpen();
    if (!opened) {
      await this.driver.executeScript("arguments[0].click();", menu);
      const openedFallback = await this.waitForDrawerOpen();
      if (!openedFallback) {
        throw new Error("Carrier portal side menu did not open after clicking Menu button");
      }
    }
  }

  private async waitForDrawerOpen(): Promise<boolean> {
    try {
      await this.driver.wait(async () => {
        const els = await this.driver.findElements(this.tendersSectionButton);
        for (const el of els) {
          if (await el.isDisplayed().catch(() => false)) return true;
        }
        return false;
      }, 5000);
      return true;
    } catch {
      return false;
    }
  }

  public async openTendersSectionDropdown(): Promise<void> {
    await this.openSideMenu();

    const isSpotTendersVisible = await this.driver.findElements(this.spotTendersButton).then(
      async (els) => {
        for (const el of els) {
          if (await el.isDisplayed().catch(() => false)) return true;
        }
        return false;
      }
    );
    if (isSpotTendersVisible) return;

    const section = await this.driver.wait(
      until.elementLocated(this.tendersSectionButton),
      portalConfig.timeoutMs,
      "Carrier portal Tenders section button not found in side menu"
    );
    await this.driver.wait(until.elementIsVisible(section), portalConfig.timeoutMs);
    await this.driver.executeScript("arguments[0].scrollIntoView({block:'center'});", section);

    try {
      await section.click();
    } catch {
      await this.driver.executeScript("arguments[0].click();", section);
    }

    await this.driver.wait(async () => {
      const els = await this.driver.findElements(this.spotTendersButton);
      for (const el of els) {
        if (await el.isDisplayed().catch(() => false)) return true;
      }
      return false;
    }, portalConfig.timeoutMs, "Carrier Tenders dropdown did not expand (Spot Tenders button never appeared)");
  }

  public async navigateToSpotTenders(): Promise<void> {
    await this.openTendersSectionDropdown();

    const btn = await this.driver.wait(
      until.elementLocated(this.spotTendersButton),
      portalConfig.timeoutMs,
      "Carrier Spot Tenders button not found"
    );
    await this.driver.wait(until.elementIsVisible(btn), portalConfig.timeoutMs);
    await this.driver.executeScript("arguments[0].scrollIntoView({block:'center'});", btn);

    try {
      await btn.click();
    } catch {
      await this.driver.executeScript("arguments[0].click();", btn);
    }

    // Toast de abertura de tab (opcional — pode não aparecer no carrier)
    await this.driver.sleep(500);

    // Aguarda que a página de spot tenders carregue: URL muda OU aparece uma tabela/título
    await this.driver.wait(async () => {
      const url = await this.driver.getCurrentUrl();
      if (url.includes("spot-tenders") || url.includes("spotTenders")) return true;

      const rows = await this.driver.findElements(By.css("tr[role='row'], tr.p-selectable-row"));
      const emptyMsg = await this.driver.findElements(
        By.xpath("//*[contains(normalize-space(),'No records') or contains(normalize-space(),'Sem registos') or contains(normalize-space(),'empty')]")
      );
      const title = await this.driver.findElements(
        By.xpath("//*[normalize-space()='Spot Tenders' or normalize-space()='Concursos Diretos']")
      );

      const rowVisible = await Promise.all(rows.map((el) => el.isDisplayed().catch(() => false)));
      const emptyVisible = await Promise.all(emptyMsg.map((el) => el.isDisplayed().catch(() => false)));
      const titleVisible = await Promise.all(title.map((el) => el.isDisplayed().catch(() => false)));

      return rowVisible.some(Boolean) || emptyVisible.some(Boolean) || titleVisible.some(Boolean);
    }, portalConfig.timeoutMs, "Carrier Spot Tenders page did not load after clicking the button");
  }

  public async expectSpotTenderVisible(name: string): Promise<void> {
    await this.driver.wait(
      until.elementLocated(
        By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`)
      ),
      portalConfig.timeoutMs,
      `Expected tender "${name}" to be visible in the carrier spot tenders table`
    );
  }

  public async logout(): Promise<void> {
    const menuBtn = By.css('button[aria-label="Menu"][aria-haspopup="true"]');
    const logoutVisible = await this.driver.findElements(this.logoutButton).then(
      async (els) => {
        for (const el of els) {
          if (await el.isDisplayed().catch(() => false)) return true;
        }
        return false;
      }
    );

    if (!logoutVisible) {
      const menu = await this.driver.wait(
        until.elementLocated(menuBtn),
        portalConfig.timeoutMs,
        "Carrier portal profile/menu button not found for logout"
      );
      await menu.click();
    }

    const button = await this.driver.wait(
      until.elementLocated(this.logoutButton),
      portalConfig.timeoutMs,
      "Carrier portal logout button not found"
    );
    await this.driver.wait(until.elementIsVisible(button), portalConfig.timeoutMs);
    await this.driver.wait(until.elementIsEnabled(button), portalConfig.timeoutMs);
    await button.click();
  }

  public async isLoginPageVisible(): Promise<boolean> {
    const username = await this.driver.wait(until.elementLocated(this.usernameInput), portalConfig.timeoutMs);
    const password = await this.driver.wait(until.elementLocated(this.passwordInput), portalConfig.timeoutMs);
    const submit   = await this.driver.wait(until.elementLocated(this.submitButton),   portalConfig.timeoutMs);

    await this.driver.wait(until.elementIsVisible(username), portalConfig.timeoutMs);
    await this.driver.wait(until.elementIsVisible(password), portalConfig.timeoutMs);
    await this.driver.wait(until.elementIsVisible(submit),   portalConfig.timeoutMs);

    return true;
  }
}

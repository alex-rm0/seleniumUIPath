import { By, until, WebDriver } from "selenium-webdriver";
import { portalConfig } from "../config/portalConfig";

/**
 * Página do portal de carrier.
 * Seletores validados via crawl manual:
 *   element-map/pages/menu_lateral.json
 *   element-map/pages/spot_tenders.json
 *   element-map/pages/spot_tenders_view.json
 *   element-map/pages/spot_tenders_view_bid.json
 *
 * URL base do carrier: https://dev.nexus.shipperform.devlop.systems/#/carrier/...
 *
 * Estrutura da tabela de bid (spot_tenders_view_bid.json):
 *   Colunas: Origem | Destino | Valor da proposta | Cargas (Máx:1) | Dias de transporte previstos
 *   Por linha: input(preço) + input(cargas, placeholder="Máx: 1") + input(dias)
 */
export class CarrierPage {
  private readonly usernameInput = By.css('input[type="text"]');
  private readonly passwordInput = By.css('input[type="password"]');
  private readonly submitButton  = By.css("button.buttonClass.buttonClassHover");
  private readonly successAlert  = By.css("div.MuiAlert-root.MuiAlert-colorSuccess.MuiAlert-filledSuccess");

  // Menu lateral — botão de hambúrguer (mesmo seletor que o shipper)
  private readonly menuButton = By.css('button[aria-label="Menu"]');

  // "Concursos" é o item de secção no carrier (equivalente a "Tenders" no shipper)
  // Tem role=button + texto "Concursos" no span interno + classe mainMenuItem
  private readonly concursosSectionButton = By.xpath(
    "//div[@role='button'][contains(@class,'mainMenuItem')][.//span[" +
      "normalize-space()='Concursos' or normalize-space()='Tenders'" +
    "]]"
  );

  // Submenu após expandir "Concursos"
  private readonly concursosDiretosButton = By.xpath(
    "//div[@role='button'][" +
      "@aria-label='Concursos Diretos' or " +
      "@aria-label='Spot Tenders' or " +
      ".//span[normalize-space()='Concursos Diretos' or normalize-space()='Spot Tenders']" +
    "]"
  );

  private readonly concursosFaseadosButton = By.xpath(
    "//div[@role='button'][" +
      "@aria-label='Concursos Faseados' or " +
      "@aria-label='Non-Spot Tenders' or " +
      ".//span[normalize-space()='Concursos Faseados' or normalize-space()='Non-Spot Tenders']" +
    "]"
  );

  // Logout: no carrier é um button directo com aria-label (não está dentro de um dropdown)
  private readonly logoutButton = By.css('button[aria-label="Terminar Sessão"]');

  // Bid flow
  private readonly ofertaButton = By.xpath(
    "//button[contains(normalize-space(),'Oferta') or contains(normalize-space(),'Bid')]" +
    "[contains(@class,'buttonClass')]"
  );
  private readonly submeterButton = By.xpath(
    "//button[contains(normalize-space(),'Submeter') or contains(normalize-space(),'Submit')]" +
    "[contains(@class,'buttonClass')]"
  );

  constructor(private readonly driver: WebDriver) {}

  // ─── Autenticação ──────────────────────────────────────────────────────────

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

  public async logout(): Promise<void> {
    // O botão "Terminar Sessão" só é visível quando o menu lateral está aberto
    await this.openSideMenu();

    const btn = await this.driver.wait(
      until.elementLocated(this.logoutButton),
      portalConfig.timeoutMs,
      "Carrier logout button (Terminar Sessão) not found"
    );
    await this.driver.wait(until.elementIsVisible(btn), portalConfig.timeoutMs);
    await this.driver.wait(until.elementIsEnabled(btn), portalConfig.timeoutMs);
    await btn.click();
  }

  public async isLoginPageVisible(): Promise<boolean> {
    const username = await this.driver.wait(until.elementLocated(this.usernameInput), portalConfig.timeoutMs);
    const password = await this.driver.wait(until.elementLocated(this.passwordInput), portalConfig.timeoutMs);
    const submit   = await this.driver.wait(until.elementLocated(this.submitButton),  portalConfig.timeoutMs);
    await this.driver.wait(until.elementIsVisible(username), portalConfig.timeoutMs);
    await this.driver.wait(until.elementIsVisible(password), portalConfig.timeoutMs);
    await this.driver.wait(until.elementIsVisible(submit),   portalConfig.timeoutMs);
    return true;
  }

  // ─── Navegação no menu lateral ─────────────────────────────────────────────

  public async openSideMenu(): Promise<void> {
    // Se "Concursos" (secção do menu) já for visível, o menu já está aberto
    if (await this.isVisible(this.concursosSectionButton)) return;

    const menu = await this.driver.wait(
      until.elementLocated(this.menuButton),
      portalConfig.timeoutMs,
      "Carrier portal menu button not found"
    );
    await this.driver.wait(until.elementIsVisible(menu), portalConfig.timeoutMs);
    await menu.click();

    if (!(await this.waitFor(this.concursosSectionButton, 5000))) {
      await this.driver.executeScript("arguments[0].click();", menu);
      if (!(await this.waitFor(this.concursosSectionButton, 5000))) {
        throw new Error("Carrier portal side menu did not open");
      }
    }
  }

  public async openTendersSectionDropdown(): Promise<void> {
    await this.openSideMenu();
    if (await this.isVisible(this.concursosDiretosButton)) return;

    const section = await this.driver.wait(
      until.elementLocated(this.concursosSectionButton),
      portalConfig.timeoutMs,
      "Carrier Concursos section button not found"
    );
    await this.driver.executeScript("arguments[0].scrollIntoView({block:'center'});", section);
    try { await section.click(); } catch { await this.driver.executeScript("arguments[0].click();", section); }

    await this.driver.wait(
      async () => this.isVisible(this.concursosDiretosButton),
      portalConfig.timeoutMs,
      "Carrier Concursos section did not expand (Concursos Diretos never appeared)"
    );
  }

  public async navigateToSpotTenders(): Promise<void> {
    await this.openTendersSectionDropdown();

    const btn = await this.driver.wait(
      until.elementLocated(this.concursosDiretosButton),
      portalConfig.timeoutMs,
      "Carrier Concursos Diretos button not found"
    );
    await this.driver.wait(until.elementIsVisible(btn), portalConfig.timeoutMs);
    await this.driver.executeScript("arguments[0].scrollIntoView({block:'center'});", btn);
    try { await btn.click(); } catch { await this.driver.executeScript("arguments[0].click();", btn); }

    await this.driver.sleep(500);

    // Aguarda que a página carregue: URL muda para spot-tenders OU tabela aparece
    await this.driver.wait(async () => {
      const url = await this.driver.getCurrentUrl();
      if (url.includes("spot-tenders") || url.includes("spotTenders")) return true;
      const rows  = await this.driver.findElements(By.css("tr[role='row']"));
      const title = await this.driver.findElements(
        By.xpath("//*[normalize-space()='Concursos Diretos' or normalize-space()='Spot Tenders']")
      );
      const rOk = await Promise.all(rows.map( (e) => e.isDisplayed().catch(() => false)));
      const tOk = await Promise.all(title.map((e) => e.isDisplayed().catch(() => false)));
      return rOk.some(Boolean) || tOk.some(Boolean);
    }, portalConfig.timeoutMs, "Carrier Spot Tenders page did not load");
  }

  // ─── Validação na tabela ───────────────────────────────────────────────────

  public async expectSpotTenderVisible(name: string): Promise<void> {
    await this.driver.wait(
      until.elementLocated(By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`)),
      portalConfig.timeoutMs,
      `Expected tender "${name}" to appear in the carrier spot tenders table`
    );
  }

  // ─── Non-Spot (Concursos Faseados) — TC023 ────────────────────────────────

  /**
   * Navega para a secção de Concursos Faseados no portal do carrier.
   * URL: #/carrier/home/tenders/non-spot-tenders
   * Seletores: nonspot_carrier_invited.json → div[aria-label="Concursos Faseados"]
   */
  public async navigateToNonSpotTenders(): Promise<void> {
    await this.openTendersSectionDropdown();

    const btn = await this.driver.wait(
      until.elementLocated(this.concursosFaseadosButton),
      portalConfig.timeoutMs,
      "Carrier Concursos Faseados button not found"
    );
    await this.driver.wait(until.elementIsVisible(btn), portalConfig.timeoutMs);
    await this.driver.executeScript("arguments[0].scrollIntoView({block:'center'});", btn);
    try { await btn.click(); } catch { await this.driver.executeScript("arguments[0].click();", btn); }

    await this.driver.sleep(500);

    await this.driver.wait(async () => {
      const url = await this.driver.getCurrentUrl();
      if (url.includes("non-spot-tenders") || url.includes("nonSpotTenders")) return true;
      const rows  = await this.driver.findElements(By.css("tr[role='row']"));
      const title = await this.driver.findElements(
        By.xpath("//*[normalize-space()='Concursos Faseados' or normalize-space()='Non-Spot Tenders']")
      );
      const rOk = await Promise.all(rows.map( (e) => e.isDisplayed().catch(() => false)));
      const tOk = await Promise.all(title.map((e) => e.isDisplayed().catch(() => false)));
      return rOk.some(Boolean) || tOk.some(Boolean);
    }, portalConfig.timeoutMs, "Carrier Non-Spot Tenders page did not load");
  }

  /**
   * Clica no item "Concursos Faseados em Cotação" no menu lateral do carrier.
   * Seletores: nonspot_carrier_quotation.json → div.mtip__item "Concursos Faseados em Cotação"
   */
  public async clickNonSpotTendersInQuotation(): Promise<void> {
    const item = await this.driver.wait(
      until.elementLocated(By.xpath(
        "//div[contains(@class,'mtip__item') and " +
        "contains(normalize-space(),'Faseado') and " +
        "contains(normalize-space(),'em Cotação')]"
      )),
      portalConfig.timeoutMs,
      "Carrier sidebar item 'Concursos Faseados em Cotação' not found"
    );
    await this.driver.wait(until.elementIsVisible(item), portalConfig.timeoutMs);
    await item.click();

    await this.driver.wait(
      until.elementLocated(By.xpath("//tr[@role='row'] | //td[contains(@class,'p-datatable')]")),
      portalConfig.timeoutMs,
      "Non-Spot Tenders in Quotation table did not load on carrier side"
    );
    await this.driver.sleep(300);
  }

  public async expectNonSpotTenderVisible(name: string): Promise<void> {
    await this.driver.wait(
      until.elementLocated(By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`)),
      portalConfig.timeoutMs,
      `Expected tender "${name}" to appear in the carrier non-spot tenders table`
    );
  }

  // ─── Bid flow ──────────────────────────────────────────────────────────────

  /**
   * Clica com o botão direito na linha do tender e clica em "Ver" / "View"
   * no menu de contexto que aparece.
   */
  public async rightClickAndViewTender(name: string): Promise<void> {
    const rowLocator = By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`);
    const row = await this.driver.wait(
      until.elementLocated(rowLocator),
      portalConfig.timeoutMs,
      `Row for tender "${name}" not found for right-click`
    );
    await this.driver.wait(until.elementIsVisible(row), portalConfig.timeoutMs);

    // Right-click na linha
    const actions = this.driver.actions({ async: true });
    await actions.contextClick(row).perform();

    // Aguarda o menu de contexto e clica em "Ver" / "View"
    const viewItemLocator = By.xpath(
      "//*[@role='menuitem' or contains(@class,'context-menu') or contains(@class,'p-menuitem')]" +
      "[contains(normalize-space(),'Ver') or contains(normalize-space(),'View')]"
    );
    const viewItem = await this.driver.wait(
      until.elementLocated(viewItemLocator),
      portalConfig.timeoutMs,
      "Context menu 'Ver/View' option did not appear after right-click"
    );
    await this.driver.wait(until.elementIsVisible(viewItem), portalConfig.timeoutMs);
    await viewItem.click();

    // Aguarda URL da página de view
    await this.driver.wait(
      async () => {
        const url = await this.driver.getCurrentUrl();
        return url.includes("CarrierInviteViewBid") || url.includes("carrierInvite") || url.includes("view");
      },
      portalConfig.timeoutMs,
      "Carrier tender view page did not load after clicking 'Ver'"
    );
    await this.driver.sleep(500);
  }

  /**
   * Clica no botão "Oferta" (bid) na página de view do tender.
   */
  public async clickOfertaButton(): Promise<void> {
    const btn = await this.driver.wait(
      until.elementLocated(this.ofertaButton),
      portalConfig.timeoutMs,
      "Carrier 'Oferta' (bid) button not found"
    );
    await this.driver.wait(until.elementIsVisible(btn), portalConfig.timeoutMs);
    await this.driver.wait(until.elementIsEnabled(btn), portalConfig.timeoutMs);
    await btn.click();

    // Aguarda que os inputs da tabela fiquem activos (deixam de estar disabled)
    await this.driver.wait(async () => {
      const inputs = await this.driver.findElements(
        By.css("input.MuiInputBase-input:not([disabled]):not(.Mui-disabled)")
      );
      for (const input of inputs) {
        if (await input.isDisplayed().catch(() => false)) return true;
      }
      return false;
    }, portalConfig.timeoutMs, "Bid table inputs did not become active after clicking 'Oferta'");
  }

  /**
   * Preenche a tabela de bid.
   * Estrutura por linha: input(Valor da proposta) | input(Cargas, placeholder="Máx: 1") | input(Dias)
   *
   * @param priceValue    Valor da proposta para todas as linhas (ex: "150")
   * @param loadsValue    Número de cargas para todas as linhas (ex: "1")
   * @param daysValue     Dias de transporte previstos para todas as linhas (ex: "5")
   */
  public async fillBidTable(
    priceValue: string = "150",
    loadsValue: string = "1",
    daysValue:  string = "5"
  ): Promise<void> {
    // Inputs habilitados na tabela de bid (excluindo checkboxes e inputs disabled)
    const enabledInputs = await this.driver.findElements(
      By.css("input.MuiInputBase-input:not([disabled]):not(.Mui-disabled)")
    );

    const visible: typeof enabledInputs = [];
    for (const input of enabledInputs) {
      if (await input.isDisplayed().catch(() => false)) visible.push(input);
    }

    // Padrão por linha: [Valor da proposta, Cargas (Máx:1), Dias de transporte]
    // Detectado via crawl spot_tenders_view_bid.json
    for (let i = 0; i < visible.length; i++) {
      const input = visible[i];
      const placeholder = await input.getAttribute("placeholder").catch(() => "");
      const value = placeholder === "Máx: 1" ? loadsValue
                  : (i % 3 === 0)            ? priceValue
                  :                            daysValue;

      await this.driver.executeScript("arguments[0].scrollIntoView({block:'center'});", input);
      await input.clear();
      await this.driver.executeScript(
        "arguments[0].value = ''; arguments[0].dispatchEvent(new Event('input', {bubbles:true}));",
        input
      );
      await input.sendKeys(value);
      await this.driver.executeScript(
        "arguments[0].dispatchEvent(new Event('change', {bubbles:true}));",
        input
      );
    }

    await this.driver.sleep(300);
  }

  /**
   * Clica em "Submeter" e aguarda o toast de sucesso.
   */
  public async submitBid(): Promise<void> {
    const btn = await this.driver.wait(
      until.elementLocated(this.submeterButton),
      portalConfig.timeoutMs,
      "Carrier 'Submeter' button not found"
    );
    await this.driver.wait(until.elementIsVisible(btn), portalConfig.timeoutMs);
    await this.driver.wait(until.elementIsEnabled(btn), portalConfig.timeoutMs);
    await btn.click();

    // Aguarda toast de sucesso
    await this.driver.wait(
      until.elementLocated(this.successAlert),
      portalConfig.timeoutMs,
      "Success alert did not appear after submitting bid"
    );

    // Aguarda que o toast desapareça antes de continuar
    await this.driver.wait(async () => {
      const alerts = await this.driver.findElements(
        By.css("div.MuiSnackbar-root, div.MuiAlert-root")
      );
      for (const alert of alerts) {
        if (await alert.isDisplayed().catch(() => false)) return false;
      }
      return true;
    }, portalConfig.timeoutMs).catch(() => { /* toast pode ter desaparecido rapidamente */ });
  }

  // ─── Utilitários privados ──────────────────────────────────────────────────

  private async isVisible(locator: By): Promise<boolean> {
    const els = await this.driver.findElements(locator);
    for (const el of els) {
      if (await el.isDisplayed().catch(() => false)) return true;
    }
    return false;
  }

  private async waitFor(locator: By, timeoutMs: number): Promise<boolean> {
    try {
      await this.driver.wait(async () => this.isVisible(locator), timeoutMs);
      return true;
    } catch {
      return false;
    }
  }
}

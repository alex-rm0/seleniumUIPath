import { By, Key, until, WebDriver, WebElement } from "selenium-webdriver";
import * as fs from "fs";
import * as path from "path";
import { ensureDirectoryExists, timestampForFileName } from "../../engine/core/fileSystem";
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
  private readonly marketInfoTitle = By.xpath("//*[normalize-space()='InformaÃ§Ãµes do Mercado']");
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
  private readonly tendersSectionButton = By.xpath("//div[@role='button'][.//span[normalize-space()='Tenders' or contains(normalize-space(),'Concursos') or contains(normalize-space(),'Concurs')]]");
  private readonly spotTendersButton = By.xpath("//div[@role='button'][@aria-label='Spot Tenders' or @aria-label='Concursos Diretos' or @aria-label='Concursos Inmediatos' or .//span[normalize-space()='Spot Tenders']]");
  private readonly nonSpotTendersButton = By.xpath("//div[@role='button'][@aria-label='Concursos Faseados' or @aria-label='Non-Spot Tenders' or .//span[normalize-space()='Concursos Faseados' or normalize-space()='Non-Spot Tenders']]");
  private readonly createTenderButton = By.xpath("//div[@aria-label='Criar Concurso' or @aria-label='Create Tender' or @aria-label='Crear Licitación' or @aria-label='Crear Concurso']");
  private readonly spotTendersPageTitle = By.xpath("//*[normalize-space()='Spot Tenders' or normalize-space()='Concursos Diretos' or normalize-space()='Concursos Inmediatos']");
  private readonly nonSpotTendersPageTitle = By.xpath("//*[normalize-space()='Concursos Faseados' or normalize-space()='Non-Spot Tenders']");
  private readonly createTenderFormMarker = By.xpath("//*[normalize-space()='Create Tender' or normalize-space()='Criar Concurso' or normalize-space()='Tender Information' or normalize-space()='InformaÃ§Ãµes do Concurso' or normalize-space()='Pickup Address' or normalize-space()='EndereÃ§o de recolha' or normalize-space()='Delivery Address' or normalize-space()='EndereÃ§o de Entrega' or normalize-space()='Deliver To' or normalize-space()='Entregar a']");
  private readonly tenderInformationSectionInputs = By.xpath("//*[contains(normalize-space(),'Concurso') or contains(normalize-space(),'Tender Information')]/ancestor::*[self::div or self::section][1]//input");
  private readonly nextWizardButton = By.xpath("//button[.//i[contains(@class,'pi-arrow-right')] or contains(normalize-space(),'Next') or contains(normalize-space(),'Seguinte')]");
  private readonly finishTenderButton = By.xpath("//button[contains(normalize-space(),'Send') or contains(normalize-space(),'Submit') or contains(normalize-space(),'Create') or contains(normalize-space(),'Guardar') or contains(normalize-space(),'Finish') or contains(normalize-space(),'Concluir')]");
  private readonly tenderRowCheckbox = By.xpath("//input[@type='checkbox' and @aria-label='Row Selected null']");
  private readonly tenderAddRowButton = By.xpath("//button[.//i[contains(@class,'pi-plus-circle')] or contains(normalize-space(),'Add a Row') or contains(normalize-space(),'Adicionar Linha')]");
  private readonly tenderPackagesSection = By.xpath("//*[normalize-space()='Pacotes FCL' or normalize-space()='FCL Packages']/ancestor::div[contains(@class,'packages-panel-root')][1]");
  private readonly tenderPackagesRow = By.css("div.packages-fcl-row");
  private readonly tenderDropdownOption = By.xpath("//li[@role='option' or @data-option-index]");
  private readonly tenderSearchInputs = By.xpath("//input[@placeholder='Pesquisar' or @placeholder='Search']");
  private readonly tenderErrorAlert = By.xpath("//div[contains(@class,'MuiAlert-colorError') or @role='alert']");
  private readonly wizardStepTwoMarker = By.xpath("//*[normalize-space()='Percursos' or normalize-space()='Lanes']");
  private readonly wizardStepThreeMarker = By.xpath("//*[normalize-space()='Transportadores' or normalize-space()='Carriers']");
  private readonly wizardStepFourMarker = By.xpath("//*[normalize-space()='Mensagem' or normalize-space()='Message']");
  private readonly routeSelectionMarker = By.xpath("//*[normalize-space()='Selecionar Rota' or normalize-space()='Select Route' or normalize-space()='Rota *' or normalize-space()='Route *']");
  private readonly carriersInvitationMarker = By.xpath("//*[normalize-space()='Carriers Invitation' or normalize-space()='Convite a Transportadores' or normalize-space()='Carriers' or normalize-space()='Convidar Transportadoras' or normalize-space()='Transportadoras' or normalize-space()='Transportadores']");
  private readonly carriersStgTitle = By.xpath("//span[contains(@class,'stg-title') and (contains(normalize-space(),'Transportador') or contains(normalize-space(),'Carrier'))]");
  private readonly anyStgTileCheckbox = By.xpath("//div[contains(@class,'stg-tile')]//input[@type='checkbox']");
  private readonly submitMessageMarker = By.xpath("//*[normalize-space()='Submit Message' or normalize-space()='Submeter Mensagem' or normalize-space()='Message']");
  private readonly tenderMessageTextarea = By.css("textarea:not([aria-hidden='true']):not([tabindex='-1'])");
  private readonly tenderEnviarButton = By.xpath("//button[contains(normalize-space(),'Enviar') or contains(normalize-space(),'Send') or contains(normalize-space(),'Submit')]");
  private readonly carrierInvitationCheckboxRoot = By.css("label .MuiCheckbox-root");
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
      // sem diÃ¡logo de confirmaÃ§Ã£o â€” delete imediato
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
        throw new Error(`Mercado "${name}" devia ter sido eliminado mas ainda estÃ¡ visÃ­vel`);
      }
    }
  }

  public async openTransportTypes(): Promise<void> {
    await this.ensureMenuItemInteractable(this.transportTypesButton);
    await this.clickMenuItem(this.transportTypesButton);
    await this.driver.wait(until.urlContains("transport-types"), portalConfig.timeoutMs);
    await this.findInteractableElement(this.anyTableRow);
  }

  public async openSpotTenders(): Promise<void> {
    await this.openTendersSection();
    await this.ensureMenuItemInteractable(this.spotTendersButton);
    await this.clickMenuItem(this.spotTendersButton);
    await this.driver.wait(until.urlContains("spot-tenders"), portalConfig.timeoutMs);
    await this.findInteractableElement(this.spotTendersPageTitle);
  }

  /**
   * Clica no item "Concursos Diretos em Cotação" / "Spot Tenders in Quotation"
   * no menu lateral esquerdo da página de Spot Tenders.
   * Seletores: tender_spot_em_cotacao.json → div.mtip__item "Concursos Diretos em Cotação"
   */
  public async clickSpotTendersInQuotation(): Promise<void> {
    const item = await this.driver.wait(
      until.elementLocated(By.xpath(
        "//div[contains(@class,'mtip__item') and (" +
        "contains(normalize-space(),'em Cotação') or " +
        "contains(normalize-space(),'in Quotation') or " +
        "contains(normalize-space(),'In Quotation'))]"
      )),
      portalConfig.timeoutMs,
      "Sidebar item 'Spot Tenders in Quotation / em Cotação' not found"
    );
    await this.driver.wait(until.elementIsVisible(item), portalConfig.timeoutMs);
    await item.click();

    // Aguarda que a tabela de tenders em cotação apareça
    await this.driver.wait(
      until.elementLocated(By.xpath(
        "//tr[@role='row'] | //td[contains(@class,'p-datatable')]"
      )),
      portalConfig.timeoutMs,
      "Spot Tenders in Quotation table did not load"
    );
    await this.driver.sleep(300);
  }

  /**
   * Clica no item "Spot Tenders Finished / Concursos Diretos Finalizados"
   * no menu lateral esquerdo da página de Spot Tenders.
   * Seletores: spot_tenders_finished.json → div.mtip__item "Spot Tenders Finished"
   */
  public async clickSpotTendersFinished(): Promise<void> {
    const item = await this.driver.wait(
      until.elementLocated(By.xpath(
        "//div[contains(@class,'mtip__item') and (" +
        "contains(normalize-space(),'Finished') or " +
        "contains(normalize-space(),'Finalizad') or " +
        "contains(normalize-space(),'terminado') or " +
        "contains(normalize-space(),'Terminado'))]"
      )),
      portalConfig.timeoutMs,
      "Sidebar item 'Spot Tenders Finished / terminados' not found"
    );
    await this.driver.wait(until.elementIsVisible(item), portalConfig.timeoutMs);
    await item.click();

    // Aguarda que a tabela de tenders finalizados apareça
    await this.driver.wait(
      until.elementLocated(By.xpath(
        "//tr[@role='row'] | //td[contains(@class,'p-datatable')]"
      )),
      portalConfig.timeoutMs,
      "Spot Tenders Finished table did not load"
    );
    await this.driver.sleep(300);
  }

  public async openNonSpotTenders(): Promise<void> {
    await this.openTendersSection();
    await this.ensureMenuItemInteractable(this.nonSpotTendersButton);
    await this.clickMenuItem(this.nonSpotTendersButton);
    await this.driver.wait(until.urlContains("non-spot-tenders"), portalConfig.timeoutMs);
    await this.findInteractableElement(this.nonSpotTendersPageTitle);
  }

  /**
   * Clica no item "Concursos Faseados em Cotação" no menu lateral da página de Non-Spot Tenders.
   * Seletores: nonspot_quotation.json → div.mtip__item "Concursos Faseados em Cotação"
   */
  public async clickNonSpotTendersInQuotation(): Promise<void> {
    const item = await this.driver.wait(
      until.elementLocated(By.xpath(
        "//div[contains(@class,'mtip__item') and " +
        "contains(normalize-space(),'Faseado') and " +
        "contains(normalize-space(),'em Cotação')]"
      )),
      portalConfig.timeoutMs,
      "Sidebar item 'Concursos Faseados em Cotação' not found"
    );
    await this.driver.wait(until.elementIsVisible(item), portalConfig.timeoutMs);
    await item.click();

    await this.driver.wait(
      until.elementLocated(By.xpath("//tr[@role='row'] | //td[contains(@class,'p-datatable')]")),
      portalConfig.timeoutMs,
      "Non-Spot Tenders in Quotation table did not load"
    );
    await this.driver.sleep(300);
  }

  /**
   * Clica no item "Concursos Faseados terminados" no menu lateral da página de Non-Spot Tenders.
   * Seletores: nonspot_finished.json → div.mtip__item "Concursos Faseados terminados"
   */
  public async clickNonSpotTendersFinished(): Promise<void> {
    const item = await this.driver.wait(
      until.elementLocated(By.xpath(
        "//div[contains(@class,'mtip__item') and " +
        "contains(normalize-space(),'Faseado') and " +
        "(contains(normalize-space(),'terminado') or contains(normalize-space(),'Finished') or contains(normalize-space(),'Finalizad'))]"
      )),
      portalConfig.timeoutMs,
      "Sidebar item 'Concursos Faseados terminados' not found"
    );
    await this.driver.wait(until.elementIsVisible(item), portalConfig.timeoutMs);
    await item.click();

    await this.driver.wait(
      until.elementLocated(By.xpath("//tr[@role='row'] | //td[contains(@class,'p-datatable')]")),
      portalConfig.timeoutMs,
      "Non-Spot Tenders Finished table did not load"
    );
    await this.driver.sleep(300);
  }

  public async openCreateTender(): Promise<void> {
    await this.openTendersSection();
    await this.ensureMenuItemInteractable(this.createTenderButton);
    await this.clickMenuItem(this.createTenderButton);
    // Aguarda que pelo menos um input do formulário esteja interactável.
    // Não usa texto (que aparece também no tab/menu) nem URL (que pode variar).
    await this.driver.wait(
      async () => {
        const inputs = await this.driver.findElements(this.tenderInformationSectionInputs);
        for (const el of inputs) {
          if (await el.isDisplayed().catch(() => false)) return true;
        }
        return false;
      },
      portalConfig.timeoutMs,
      "Esperava que os inputs do formulário de criação de concurso ficassem visíveis"
    );
  }

  public async createSpotTender(
    name: string,
    responseDeadline: string,
    shipmentStartDate: string,
    shipmentEndDate: string,
    pickupAddress: string,
    deliveryAddress: string,
    deliverTo: string,
    packageWeight: string = "100",
    packageQuantity: string = "1",
    selectAllCarriers: boolean = false
  ): Promise<void> {
    await this.navigateToSpotTenderCarriersStep(
      name,
      responseDeadline,
      shipmentStartDate,
      shipmentEndDate,
      pickupAddress,
      deliveryAddress,
      deliverTo,
      packageWeight,
      packageQuantity
    );

    if (selectAllCarriers) {
      await this.selectAllCarrierInvitations();
    } else {
      await this.selectFirstCarrierInvitation();
    }
    // O marcador mais fiável para a etapa de mensagem é a própria textarea visível
    await this.clickTenderNext(this.tenderMessageTextarea);
    await this.fillTenderMessage(`Mensagem automática para o tender ${name}`);
    // O botão final é "Enviar" (toolbar do topo), não "Seguinte" — submete o concurso
    const enviarBtn = await this.findInteractableElement(this.tenderEnviarButton);
    await this.clickElement(enviarBtn);
    await this.waitAfterSave();

    await this.openSpotTendersPageDirectly();
  }

  public async expectSpotTenderVisible(name: string): Promise<void> {
    await this.findInteractableElement(By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`));
  }

  // ─── Fluxo Non-Spot (Concursos Faseados) — TC023 ────────────────────────────

  /**
   * Cria um concurso faseado (non-spot) e termina na lista de concursos faseados.
   * Idêntico a createSpotTender() mas define "Tipo de Concurso" = "Faseado"
   * antes de preencher o formulário.
   * Seletores base: nonspot_config.json, tenders-create.json
   */
  public async createNonSpotTender(
    name: string,
    responseDeadline: string,
    shipmentStartDate: string,
    shipmentEndDate: string,
    pickupAddress: string,
    deliveryAddress: string,
    deliverTo: string,
    packageWeight: string = "100",
    packageQuantity: string = "1",
    selectAllCarriers: boolean = false
  ): Promise<void> {
    await this.openCreateTender();
    await this.setTenderType("Non Spot");
    await this.completeCreateTenderAndReachCarriersStep(
      name,
      responseDeadline,
      shipmentStartDate,
      shipmentEndDate,
      pickupAddress,
      deliveryAddress,
      deliverTo,
      packageWeight,
      packageQuantity
    );

    if (selectAllCarriers) {
      await this.selectAllCarrierInvitations();
    } else {
      await this.selectFirstCarrierInvitation();
    }
    await this.clickTenderNext(this.tenderMessageTextarea);
    await this.fillTenderMessage(`Mensagem automática para o tender ${name}`);
    const enviarBtn = await this.findInteractableElement(this.tenderEnviarButton);
    await this.clickElement(enviarBtn);
    await this.waitAfterSave();

    await this.openNonSpotTendersPageDirectly();
  }

  public async expectNonSpotTenderVisible(name: string): Promise<void> {
    await this.findInteractableElement(By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`));
  }

  // ─── Fluxo de aceitação de quotes e fecho de tender (TC022 Parte 3) ────────

  /**
   * Clica com o botão direito no tender da tabela e clica em "Ver" / "View"
   * no menu de contexto → navega para TenderInQuotation.
   * Seletores validados via: tender_spot_em_cotacao.json, tender_spot_em_cotacao_depoisdebotaodireito.json
   */
  public async rightClickAndViewSpotTender(name: string): Promise<void> {
    const rowLocator = By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`);
    const row = await this.driver.wait(
      until.elementLocated(rowLocator),
      portalConfig.timeoutMs,
      `Tender row "${name}" not found for right-click`
    );
    await this.driver.wait(until.elementIsVisible(row), portalConfig.timeoutMs);

    // Right-click abre o menu de contexto; "Ver" abre a ficha de detalhes
    // e define o tender activo no estado da aplicação React
    const actions = this.driver.actions({ async: true });
    await actions.contextClick(row).perform();

    const viewItemLocator = By.xpath(
      "//*[@role='menuitem' or contains(@class,'context-menu') or contains(@class,'p-menuitem')]" +
      "[contains(normalize-space(),'Ver') or contains(normalize-space(),'View')]"
    );
    const viewItem = await this.driver.wait(
      until.elementLocated(viewItemLocator),
      portalConfig.timeoutMs,
      "Context menu 'Ver/View' option did not appear"
    );
    await this.driver.wait(until.elementIsVisible(viewItem), portalConfig.timeoutMs);
    await viewItem.click();
    await this.driver.sleep(800);

    // O "Ver" abre a ficha de detalhes (não o TenderInQuotation directamente).
    // Usamos window.location.hash (sem reload) para o React Router navegar para
    // TenderInQuotation mantendo o estado do tender activo na memória da app.
    // driver.get() causaria um reload completo que limpa o estado React.
    await this.driver.executeScript(
      `window.location.hash = '/home/tenders/TenderInQuotation';`
    );

    await this.driver.wait(
      async () => (await this.driver.getCurrentUrl()).includes("TenderInQuotation"),
      portalConfig.timeoutMs,
      "TenderInQuotation page did not load"
    );

    // Aguarda que os botões de vista carreguem (confirmam que o tender está carregado)
    await this.driver.wait(
      until.elementLocated(By.xpath(
        "//button[contains(normalize-space(),'Vista por Transportadoras') or " +
        "contains(normalize-space(),'Carriers View') or " +
        "contains(normalize-space(),'Em Cotação') or " +
        "contains(normalize-space(),'In Quotation')]"
      )),
      portalConfig.timeoutMs,
      "TenderInQuotation view buttons did not appear — tender may not be in Em Cotação state"
    );
    await this.driver.sleep(300);
  }

  /**
   * Clica no botão "Vista por Transportadoras" / "Carriers View".
   * Seletores: tenders_carriers_view.json → button "Carriers View" pi pi-truck
   */
  public async clickCarriersView(): Promise<void> {
    const btn = await this.driver.wait(
      until.elementLocated(By.xpath(
        "//button[contains(normalize-space(),'Vista por Transportadoras') or " +
        "contains(normalize-space(),'Carriers View')]"
      )),
      portalConfig.timeoutMs,
      "Carriers View button not found"
    );
    await this.driver.wait(until.elementIsVisible(btn), portalConfig.timeoutMs);
    await btn.click();

    // Aguarda que o dropdown "Transportador / Carrier" apareça (tabela pode estar vazia até seleccionar carrier)
    await this.driver.wait(
      until.elementLocated(By.xpath(
        "//input[@role='combobox']"
      )),
      portalConfig.timeoutMs,
      "Carriers View dropdowns did not appear"
    );
    await this.driver.sleep(300);
  }

  /**
   * Selecciona o primeiro carrier disponível no dropdown "Transportador / Carrier *"
   * da Vista por Transportadoras. A tabela só mostra dados depois de um carrier estar seleccionado.
   * Seletores: tenders_carriers_view.json → label "Transportador/Carrier" → input[role='combobox']
   * Nota: não usamos índice numérico porque o dropdown "Fase" pode ou não estar presente.
   */
  public async selectFirstCarrierInDropdown(): Promise<void> {
    // Localiza o combobox pelo label "Transportador *" / "Carrier *" — robusto ao número de dropdowns
    const carrierInput = await this.driver.wait(
      until.elementLocated(By.xpath(
        "//div[.//label[contains(normalize-space(),'Transportador') or contains(normalize-space(),'Carrier')]]" +
        "//input[@role='combobox']"
      )),
      portalConfig.timeoutMs,
      "Carrier/Transportador combobox not found in Carriers View"
    );
    await this.driver.wait(until.elementIsVisible(carrierInput), portalConfig.timeoutMs);
    await carrierInput.click();

    // Aguarda as opções do dropdown (listbox)
    const firstOption = await this.driver.wait(
      until.elementLocated(By.xpath(
        "//ul[@role='listbox']/li[1] | " +
        "//*[@role='option'][1]"
      )),
      portalConfig.timeoutMs,
      "No carrier options appeared in dropdown"
    );
    await this.driver.wait(until.elementIsVisible(firstOption), portalConfig.timeoutMs);
    await firstOption.click();

    // Aguarda que a tabela carregue com dados (coluna "Select quote" / "Selecionar Cotação")
    await this.driver.wait(
      until.elementLocated(By.xpath(
        "//th[contains(normalize-space(),'Select quote')] | " +
        "//th[contains(normalize-space(),'Selecionar')] | " +
        "//label[@aria-label='No quote found for this lane.'] | " +
        "//input[contains(@class,'PrivateSwitchBase')]"
      )),
      portalConfig.timeoutMs,
      "Carriers View table did not load after selecting carrier"
    );
    await this.driver.sleep(300);
  }

  /**
   * Selecciona todas as quotes não seleccionadas na tabela activa (coluna "Selecionar Cotação" / "Select quote").
   * Usado nas vistas Carriers View e Lanes View.
   * Seletores: tenders_carriers_view.json → input[type="checkbox"] (MUI Checkbox, coluna "Select quote")
   * Nota: os checkboxes podem ter classe PrivateSwitchBase-input ou ser input[type="checkbox"] simples.
   */
  public async selectAllQuotesInTable(): Promise<void> {
    // Os checkboxes MUI têm o input[type="checkbox"] com opacity:0 — isDisplayed() retorna false.
    // Solução: encontra o input no DOM, verifica .checked via JS, e clica no span pai visível.
    await this.driver.wait(async () => {
      const inputs = await this.driver.findElements(By.css("input[type='checkbox']"));
      for (const input of inputs) {
        try {
          const isChecked: boolean = await this.driver.executeScript(
            "return arguments[0].checked;", input
          ) as boolean;
          if (!isChecked) {
            // Sobe ao span MUI clicável (MuiCheckbox-root / MuiSwitch-root / parentElement)
            const span = await this.driver.executeScript(
              "return arguments[0].closest('span.MuiCheckbox-root, span.MuiSwitch-root, span.MuiButtonBase-root') " +
              "|| arguments[0].parentElement;",
              input
            ) as ReturnType<typeof this.driver.findElement>;
            await this.driver.executeScript(
              "arguments[0].scrollIntoView({block:'center', inline:'center'});", span
            );
            await this.driver.sleep(100);
            await this.driver.executeScript("arguments[0].click();", span);
            await this.driver.sleep(300);
          }
        } catch { /* elemento removido do DOM após click — continua */ }
      }
      return true;
    }, portalConfig.timeoutMs, "Could not select quotes in table");

    await this.driver.sleep(500);
  }

  /**
   * Clica no botão "Vista por Percursos" / "Lanes View".
   * Seletores: tenders_lanes_view.json → button "Lanes View" pi pi-arrow-right-arrow-left
   */
  public async clickLanesView(): Promise<void> {
    const btn = await this.driver.wait(
      until.elementLocated(By.xpath(
        "//button[contains(normalize-space(),'Vista por Percursos') or " +
        "contains(normalize-space(),'Lanes View')]"
      )),
      portalConfig.timeoutMs,
      "Lanes View button not found"
    );
    await this.driver.wait(until.elementIsVisible(btn), portalConfig.timeoutMs);
    await btn.click();

    // Aguarda que a tabela da Lanes View carregue (qualquer coluna da tabela Lane)
    await this.driver.wait(
      until.elementLocated(By.xpath(
        "//th[contains(@class,'viewLaneTable-header-cell')] | " +
        "//th[normalize-space()='Origin' or normalize-space()='Origem'] | " +
        "//th[normalize-space()='Carrier' or normalize-space()='Transportadora']"
      )),
      portalConfig.timeoutMs,
      "Lanes View table did not load"
    );
    await this.driver.sleep(300);
  }

  /**
   * Clica no botão "Vista de Resumo" / "Summary View".
   * Seletores: tenders_summary_view.json → button "Summary View" pi pi-chart-bar
   */
  public async clickSummaryView(): Promise<void> {
    const btn = await this.driver.wait(
      until.elementLocated(By.xpath(
        "//button[contains(normalize-space(),'Vista de Resumo') or " +
        "contains(normalize-space(),'Summary View')]"
      )),
      portalConfig.timeoutMs,
      "Summary View button not found"
    );
    await this.driver.wait(until.elementIsVisible(btn), portalConfig.timeoutMs);
    await btn.click();

    // Aguarda que a tabela do Summary carregue (coluna "Total Quotes" ou "Total Cotações")
    await this.driver.wait(
      until.elementLocated(By.xpath(
        "//th[contains(normalize-space(),'Total Quotes') or contains(normalize-space(),'Cotações')]"
      )),
      portalConfig.timeoutMs,
      "Summary View table did not load"
    );
    await this.driver.sleep(300);
  }

  /**
   * Clica em "Terminar Concurso" / "Finish Tender" e confirma o diálogo se aparecer.
   * Seletores: tenders_em_contacao_view.json / tenders_summary_view.json → button "Finish Tender" pi pi-check
   * Aguarda o toast de sucesso.
   */
  public async clickFinishTender(): Promise<void> {
    const btn = await this.driver.wait(
      until.elementLocated(By.xpath(
        "//button[contains(normalize-space(),'Terminar Concurso') or " +
        "contains(normalize-space(),'Finish Tender')]"
      )),
      portalConfig.timeoutMs,
      "Finish Tender button not found"
    );
    await this.driver.wait(until.elementIsVisible(btn), portalConfig.timeoutMs);
    await this.driver.wait(until.elementIsEnabled(btn), portalConfig.timeoutMs);
    await btn.click();

    // Confirmação: pode aparecer um diálogo MUI com botão "Confirmar", "Confirm", "Sim", "Yes", "OK"
    await this.driver.sleep(500);
    const confirmLocator = By.xpath(
      "//button[" +
        "contains(normalize-space(),'Confirmar') or " +
        "contains(normalize-space(),'Confirm') or " +
        "contains(normalize-space(),'Sim') or " +
        "contains(normalize-space(),'Yes') or " +
        "normalize-space()='OK'" +
      "][not(contains(@class,'p-paginator'))]"
    );
    const confirmBtns = await this.driver.findElements(confirmLocator);
    for (const cb of confirmBtns) {
      if (await cb.isDisplayed().catch(() => false)) {
        await cb.click();
        break;
      }
    }

    // Aguarda toast de sucesso
    await this.driver.wait(
      until.elementLocated(By.css("div.MuiAlert-root.MuiAlert-colorSuccess.MuiAlert-filledSuccess")),
      portalConfig.timeoutMs,
      "Success alert did not appear after finishing tender"
    );

    // Aguarda que todos os toasts desapareçam
    await this.driver.wait(async () => {
      const alerts = await this.driver.findElements(
        By.css("div.MuiSnackbar-root, div.MuiAlert-root")
      );
      for (const a of alerts) {
        if (await a.isDisplayed().catch(() => false)) return false;
      }
      return true;
    }, portalConfig.timeoutMs).catch(() => {});
  }

  /**
   * Navega para a tabela de spot tenders e verifica que o tender aparece
   * com o campo "Finalizado" / "Is Finished" = true (switch MUI marcado).
   * Seletores: spot_tenders_finished.json → coluna "Is Finished" / "Finalizado"
   */
  public async expectTenderIsFinishedInTable(name: string): Promise<void> {
    // Aguarda que a linha do tender esteja visível na tabela
    const rowLocator = By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`);
    const row = await this.driver.wait(
      until.elementLocated(rowLocator),
      portalConfig.timeoutMs,
      `Tender row "${name}" not found in table`
    );
    await this.driver.wait(until.elementIsVisible(row), portalConfig.timeoutMs);

    // Verifica que o switch de "Finalizado" / "Is Finished" está marcado
    // O switch usa MuiSwitch-switchBase.Mui-checked dentro da linha
    await this.driver.wait(async () => {
      const isFinishedSwitch = await row.findElements(
        By.css("span.MuiSwitch-switchBase.Mui-checked, input.PrivateSwitchBase-input[checked]")
      );
      if (isFinishedSwitch.length > 0) return true;

      // Fallback: verifica atributo checked nos inputs dentro da linha
      const inputs = await row.findElements(By.css("input.PrivateSwitchBase-input"));
      for (const input of inputs) {
        const val = await input.getAttribute("checked").catch(() => null);
        if (val === "true" || val === "") return true;
      }
      return false;
    }, portalConfig.timeoutMs,
      `Tender "${name}" does not appear as finished (Finalizado/Is Finished not checked)`
    );
  }

  public async editSpotTender(name: string): Promise<void> {
    const rowLocator = By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`);
    const row = await this.findInteractableElement(rowLocator);
    await this.clickElement(row);

    const editBtn = await this.findInteractableElement(this.editButton);
    await this.clickElement(editBtn);

    // Aguarda que o formulário de edição mostre pelo menos um input interactável
    await this.driver.wait(async () => {
      const els = await this.driver.findElements(
        By.css("input:not([disabled]):not([readonly]), textarea:not([aria-hidden='true'])")
      );
      for (const el of els) {
        if (await el.isDisplayed().catch(() => false)) return true;
      }
      return false;
    }, portalConfig.timeoutMs, "Esperava que o formulário de edição do tender abrisse");

    // Navega pelo wizard até à textarea de mensagem — MAS só avança se existir
    // botão "Seguinte" (evita timeout se o formulário de edição não for um wizard)
    for (let step = 0; step < 5; step++) {
      const textareas = await this.driver.findElements(this.tenderMessageTextarea);
      let found = false;
      for (const el of textareas) {
        if (await el.isDisplayed().catch(() => false)) { found = true; break; }
      }
      if (found) break;
      const hasNext = await this.hasInteractableElement(this.nextWizardButton);
      if (!hasNext) break; // formulário de edição não tem wizard → não navega
      await this.clickTenderNext();
    }

    // Determina o campo a editar
    let editTarget: WebElement | null = null;
    const textareas = await this.driver.findElements(this.tenderMessageTextarea);
    for (const el of textareas) {
      if (await el.isDisplayed().catch(() => false)) { editTarget = el; break; }
    }

    if (editTarget) {
      // Edita a mensagem (passo 4 do wizard ou form com textarea)
      await this.clickElement(editTarget);
      await editTarget.sendKeys(Key.chord(Key.CONTROL, "a"));
      await editTarget.sendKeys(Key.DELETE);
      await editTarget.sendKeys(`Mensagem editada - ${name}`);
    } else {
      // Form directo sem textarea: edita o segundo input de texto visível
      // (evita o primeiro que é tipicamente o nome, que identificamos na tabela)
      const inputs = await this.driver.findElements(
        By.css("input[type='text']:not([disabled]):not([readonly])")
      );
      const visible: WebElement[] = [];
      for (const el of inputs) {
        if (await el.isDisplayed().catch(() => false)) visible.push(el);
      }
      const target = visible[1] ?? visible[0];
      if (target) {
        const current = (await target.getAttribute("value")) ?? "";
        await this.clickElement(target);
        await target.sendKeys(Key.chord(Key.CONTROL, "a"));
        await target.sendKeys(Key.DELETE);
        await target.sendKeys(`${current} editado`.trim());
      }
    }

    // Guarda: tenta "Enviar/Send" (wizard) ou "Guardar/Save" (form directo)
    const saveLocator = By.xpath(
      "//button[contains(normalize-space(),'Enviar') or contains(normalize-space(),'Send')" +
      " or contains(normalize-space(),'Guardar') or contains(normalize-space(),'Save')" +
      " or contains(normalize-space(),'Atualizar') or contains(normalize-space(),'Update')]"
    );
    const saveBtn = await this.findInteractableElement(saveLocator);
    await this.clickElement(saveBtn);
    await this.waitAfterSave();
    await this.openSpotTendersPageDirectly();
  }

  public async deleteSpotTender(name: string): Promise<void> {
    const rowLocator = By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`);
    const row = await this.findInteractableElement(rowLocator);
    await this.clickElement(row);

    const deleteBtn = await this.findInteractableElement(this.deleteMarketButton);
    await this.clickElement(deleteBtn);

    // Confirma o diálogo de eliminação (se aparecer)
    try {
      const confirmBtn = await this.driver.wait(until.elementLocated(this.confirmDeleteButton), 5000);
      await this.driver.wait(until.elementIsVisible(confirmBtn), 5000);
      await this.clickElement(confirmBtn);
    } catch {
      // sem diálogo de confirmação — delete imediato
    }

    await this.waitAfterSave();
  }

  public async expectSpotTenderNotVisible(name: string): Promise<void> {
    const rowLocator = By.xpath(`//tr[@role='row'][.//td[normalize-space()='${name}']]`);
    await this.driver.wait(async () => {
      const rows = await this.driver.findElements(rowLocator);
      for (const row of rows) {
        if (await row.isDisplayed().catch(() => false)) return false;
      }
      return true;
    }, portalConfig.timeoutMs, `Esperava que o tender "${name}" já não estivesse visível na tabela`);
  }

  public async navigateToSpotTenderCarriersStep(
    name: string,
    responseDeadline: string,
    shipmentStartDate: string,
    shipmentEndDate: string,
    pickupAddress: string,
    deliveryAddress: string,
    deliverTo: string,
    packageWeight: string = "100",
    packageQuantity: string = "1"
  ): Promise<void> {
    await this.openCreateTender();
    await this.completeCreateTenderAndReachCarriersStep(
      name,
      responseDeadline,
      shipmentStartDate,
      shipmentEndDate,
      pickupAddress,
      deliveryAddress,
      deliverTo,
      packageWeight,
      packageQuantity
    );
  }

  public async completeCreateTenderAndReachCarriersStep(
    name: string,
    responseDeadline: string,
    shipmentStartDate: string,
    shipmentEndDate: string,
    pickupAddress: string,
    deliveryAddress: string,
    deliverTo: string,
    packageWeight: string = "100",
    packageQuantity: string = "1"
  ): Promise<void> {
    await this.fillTenderInformationStep(
      name,
      responseDeadline,
      shipmentStartDate,
      shipmentEndDate,
      pickupAddress,
      deliveryAddress,
      deliverTo
    );

    await this.addTenderPackage(packageWeight, packageQuantity);
    await this.selectTenderMarketAndTransportType();

    await this.clickTenderNext(this.routeSelectionMarker);
    await this.clickTenderNext(this.carriersInvitationMarker);
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
        throw new Error(`Tipo de Transporte "${name}" devia ter sido eliminado mas ainda estÃ¡ visÃ­vel`);
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

  private async openTendersSection(): Promise<void> {
    await this.openSideMenu();
    if (await this.hasInteractableElement(this.spotTendersButton)) return;

    const section = await this.findInteractableElement(this.tendersSectionButton);
    await this.clickElement(section);
    await this.driver.wait(async () => this.hasInteractableElement(this.spotTendersButton), portalConfig.timeoutMs, "Expected Tenders section to expand");
  }

  private async openMarketsPageDirectly(): Promise<void> {
    const baseUrl = (await this.driver.getCurrentUrl()).split("#")[0];
    await this.driver.get(`${baseUrl}#/home/markets`);
    await this.driver.wait(until.urlContains("markets"), portalConfig.timeoutMs);
    await this.expectWesternEuropeVisible();
  }

  private async openSpotTendersPageDirectly(): Promise<void> {
    const baseUrl = (await this.driver.getCurrentUrl()).split("#")[0];
    await this.driver.get(`${baseUrl}#/home/tenders/spot-tenders`);
    await this.driver.wait(until.urlContains("spot-tenders"), portalConfig.timeoutMs);
    await this.findInteractableElement(this.spotTendersPageTitle);
  }

  private async openNonSpotTendersPageDirectly(): Promise<void> {
    const baseUrl = (await this.driver.getCurrentUrl()).split("#")[0];
    await this.driver.get(`${baseUrl}#/home/tenders/non-spot-tenders`);
    await this.driver.wait(until.urlContains("non-spot-tenders"), portalConfig.timeoutMs);
    await this.findInteractableElement(this.nonSpotTendersPageTitle);
  }

  /**
   * Selecciona o tipo de concurso (ex: "Faseado", "Spot") no combobox "Tipo de Concurso *"
   * do formulário de criação de concurso.
   * Seletores: tenders-create.json → input[role='combobox'] label "Tipo de Concurso *"
   * Usado por createNonSpotTender() para mudar o tipo default de "Spot" para "Faseado".
   */
  private async setTenderType(type: string): Promise<void> {
    const tipoInput = await this.driver.wait(
      until.elementLocated(By.xpath(
        "//div[.//label[contains(normalize-space(),'Tipo de Concurso')]]//input[@role='combobox']"
      )),
      portalConfig.timeoutMs,
      "Tipo de Concurso combobox not found in create tender form"
    );
    await this.driver.wait(until.elementIsVisible(tipoInput), portalConfig.timeoutMs);

    // Verifica se o valor já está correcto
    const currentValue = ((await tipoInput.getAttribute("value")) ?? "").trim().toLowerCase();
    if (currentValue === type.toLowerCase()) return;

    // Abre o dropdown e escreve o tipo
    await tipoInput.click();
    await this.driver.sleep(200);

    // Limpa e escreve o novo valor via JS para garantir que o React regista a mudança
    await this.driver.executeScript(`
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (setter) setter.call(arguments[0], '');
      arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
    `, tipoInput);
    await tipoInput.sendKeys(type);
    await this.driver.sleep(400);

    // Clica na primeira opção que contenha o tipo
    const option = await this.driver.wait(
      until.elementLocated(By.xpath(
        `//li[@role='option'][contains(normalize-space(),'${type}')] | ` +
        `//*[@role='option'][contains(normalize-space(),'${type}')]`
      )),
      portalConfig.timeoutMs,
      `Dropdown option "${type}" not found in Tipo de Concurso`
    );
    await this.driver.wait(until.elementIsVisible(option), portalConfig.timeoutMs);
    await option.click();
    await this.driver.sleep(300);
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

  private async clickTenderNext(expectedNextStep?: By): Promise<void> {
    await this.driver.executeScript("window.scrollTo({ top: 0, behavior: 'instant' });");
    await this.driver.sleep(250);
    const clicked = await this.driver.executeScript<boolean>(`
      const normalize = (value) => (value || "").replace(/\\s+/g, " ").trim().toLowerCase();
      const buttons = Array.from(document.querySelectorAll("button"));
      for (const button of buttons) {
        const text = normalize(button.textContent);
        if (!text.includes("next") && !text.includes("seguinte")) continue;
        const rect = button.getBoundingClientRect();
        const style = window.getComputedStyle(button);
        if (style.display === "none" || style.visibility === "hidden" || rect.width <= 0 || rect.height <= 0) continue;
        button.click();
        return true;
      }
      return false;
    `);
    if (!clicked) {
      const nextButton = await this.findInteractableElement(this.nextWizardButton);
      await this.clickElement(nextButton);
    }
    await this.driver.sleep(500);
    await this.failIfTenderValidationErrorAppears();
    if (expectedNextStep) {
      await this.driver.wait(async () => {
        const elements = await this.driver.findElements(expectedNextStep);
        for (const element of elements) {
          if (await element.isDisplayed().catch(() => false)) return true;
        }
        return false;
      }, portalConfig.timeoutMs, "Esperava avançar para a etapa seguinte do wizard");
    }
  }

  private async selectFirstTenderRow(): Promise<void> {
    const checkbox = await this.findInteractableElement(this.tenderRowCheckbox);
    await this.clickElement(checkbox);
    await this.driver.sleep(300);
  }

  private async selectFirstCarrierInvitation(): Promise<void> {
    await this.dumpCarrierInvitationDebug();

    // Estratégia 1: stg-tile pattern (estrutura igual a Mercados/Tipos de Transporte)
    const clickedViaTile = await this.driver.executeScript<boolean>(`
      const isVisible = (el) => {
        if (!(el instanceof HTMLElement)) return false;
        const r = el.getBoundingClientRect(), s = window.getComputedStyle(el);
        return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0;
      };
      // Tenta encontrar checkboxes dentro de div.stg-tile na secção de Transportadoras
      const stgContainers = Array.from(document.querySelectorAll("div.stg-container"));
      for (const container of stgContainers) {
        const title = container.querySelector("span.stg-title");
        const titleText = (title?.textContent || "").toLowerCase();
        if (!titleText.includes("transportad") && !titleText.includes("carrier")) continue;
        const checkboxes = Array.from(container.querySelectorAll("div.stg-tile input[type='checkbox']"));
        for (const cb of checkboxes) {
          if (!(cb instanceof HTMLInputElement) || !isVisible(cb) || cb.checked) continue;
          cb.click();
          cb.dispatchEvent(new Event("input", { bubbles: true }));
          cb.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }
      }
      return false;
    `);

    if (!clickedViaTile) {
      // Estratégia 2: MuiCheckbox-root dentro de qualquer secção com texto de transportadora
      const clickedViaMui = await this.driver.executeScript<boolean>(`
        const normalize = (v) => (v || "").replace(/\\s+/g, " ").trim().toLowerCase();
        const isVisible = (el) => {
          if (!(el instanceof HTMLElement)) return false;
          const r = el.getBoundingClientRect(), s = window.getComputedStyle(el);
          return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0;
        };
        // Procura o contentor da secção de carriers pelo título span.stg-title ou heading
        const titleCandidates = Array.from(document.querySelectorAll(
          "span.stg-title, h2, h3, h4, p, div.sectionTitle, div.panelTitle, legend"
        ));
        const titleEl = titleCandidates.find(el => isVisible(el) &&
          (normalize(el.textContent).includes("transportad") || normalize(el.textContent).includes("carrier"))
        );
        const section = titleEl
          ? (titleEl.closest("div.stg-container") || titleEl.closest("section") || titleEl.parentElement)
          : document.body;

        const roots = Array.from((section || document.body).querySelectorAll(
          "span.MuiCheckbox-root, span.MuiButtonBase-root.MuiCheckbox-root, label.MuiFormControlLabel-root"
        ));
        for (const root of roots) {
          if (!(root instanceof HTMLElement) || !isVisible(root)) continue;
          const input = root.querySelector("input[type='checkbox']");
          if (input instanceof HTMLInputElement && input.checked) continue;
          root.click();
          return true;
        }
        return false;
      `);

      if (!clickedViaMui) {
        // Estratégia 3: clica no primeiro anyStgTileCheckbox que seja interactável
        const tileCheckboxes = await this.driver.findElements(this.anyStgTileCheckbox);
        let clicked3 = false;
        for (const cb of tileCheckboxes) {
          if (await this.isInteractable(cb)) {
            const checked = await cb.getAttribute("checked");
            if (!checked) {
              await this.clickElement(cb);
              clicked3 = true;
              break;
            }
          }
        }
        if (!clicked3) {
          throw new Error(
            "Não foi possível selecionar um carrier na etapa Carriers Invitation — " +
            "verifica se existem transportadoras configuradas no sistema e se o crawler " +
            "capturou esta etapa (execute npm run crawl -- --pages=carriers-step)"
          );
        }
      }
    }

    await this.driver.sleep(400);

    // Verifica que pelo menos um checkbox ficou selecionado
    const anyChecked = await this.driver.executeScript<boolean>(`
      const checkboxes = Array.from(document.querySelectorAll("input[type='checkbox']"));
      return checkboxes.some(cb => cb instanceof HTMLInputElement && cb.checked);
    `);
    if (!anyChecked) {
      throw new Error("Carrier foi clicado mas nenhum checkbox ficou marcado — possível problema com React state");
    }
  }

  private async selectAllCarrierInvitations(): Promise<void> {
    await this.dumpCarrierInvitationDebug();

    // Clica em TODOS os checkboxes disponíveis na secção de transportadoras
    const totalClicked = await this.driver.executeScript<number>(`
      const isVisible = (el) => {
        if (!(el instanceof HTMLElement)) return false;
        const r = el.getBoundingClientRect(), s = window.getComputedStyle(el);
        return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0;
      };

      // Tenta encontrar a secção de transportadoras pelo título (stg-title ou heading)
      const titleCandidates = Array.from(document.querySelectorAll(
        "span.stg-title, h2, h3, h4, legend, div.sectionTitle"
      ));
      const titleEl = titleCandidates.find(el =>
        isVisible(el) && (
          (el.textContent || "").toLowerCase().includes("transportad") ||
          (el.textContent || "").toLowerCase().includes("carrier")
        )
      );
      const section = titleEl
        ? (titleEl.closest("div.stg-container") || titleEl.closest("section") || titleEl.parentElement || document.body)
        : document.body;

      // Recolhe todos os checkboxes visíveis não selecionados na secção
      const checkboxes = Array.from((section || document.body).querySelectorAll(
        "input[type='checkbox']"
      ));
      let count = 0;
      for (const cb of checkboxes) {
        if (!(cb instanceof HTMLInputElement)) continue;
        if (!isVisible(cb)) continue;
        if (cb.checked) continue;
        cb.click();
        cb.dispatchEvent(new Event("input",  { bubbles: true }));
        cb.dispatchEvent(new Event("change", { bubbles: true }));
        count++;
      }
      return count;
    `);

    await this.driver.sleep(400);

    // Verifica que pelo menos um checkbox ficou selecionado
    const anyChecked = await this.driver.executeScript<boolean>(`
      const checkboxes = Array.from(document.querySelectorAll("input[type='checkbox']"));
      return checkboxes.some(cb => cb instanceof HTMLInputElement && cb.checked);
    `);
    if (!anyChecked) {
      throw new Error(
        `selectAllCarrierInvitations: clicou ${totalClicked} checkbox(es) mas nenhum ficou marcado — ` +
        "possível problema com React state ou não há carriers disponíveis"
      );
    }
  }

  private async dumpCarrierInvitationDebug(): Promise<void> {
    try {
      const debugFolder = ensureDirectoryExists(path.join(process.cwd(), "reports", "debug"));
      const timestamp = timestampForFileName();

      const sectionHtml = await this.driver.executeScript<string>(`
        const normalize = (value) => (value || "").replace(/\\s+/g, " ").trim().toLowerCase();
        const section = Array.from(document.querySelectorAll("div")).find((element) => {
          const text = normalize(element.textContent);
          return text.includes("convidar transportadoras") || text.includes("carriers invitation");
        });
        return section?.outerHTML || "";
      `);

      const pageHtml = await this.driver.executeScript<string>("return document.documentElement.outerHTML;");

      const sectionPath = path.join(debugFolder, `tc020-carriers-section-${timestamp}.html`);
      const pagePath = path.join(debugFolder, `tc020-carriers-page-${timestamp}.html`);
      fs.writeFileSync(sectionPath, sectionHtml, "utf8");
      fs.writeFileSync(pagePath, pageHtml, "utf8");
      console.log(`[carrier-debug] saved ${sectionPath}`);
    } catch {
      // debug dump is best effort only
    }
  }

  private async fillTenderMessage(message: string): Promise<void> {
    const textarea = await this.findInteractableElement(this.tenderMessageTextarea);
    await this.clickElement(textarea);
    // sendKeys dispara eventos reais (keydown/keypress/keyup) que o React intercepta.
    // JS injection com dispatchEvent(new Event("input")) não actualiza o estado React.
    await textarea.sendKeys(Key.chord(Key.CONTROL, "a"));
    await textarea.sendKeys(Key.DELETE);
    await textarea.sendKeys(message);
    // Verifica pelo .value property
    await this.driver.wait(
      async () => {
        const current = await this.driver.executeScript<string>("return arguments[0].value;", textarea);
        return (current ?? "").trim() === message;
      },
      portalConfig.timeoutMs,
      `Esperava que a textarea contivesse "${message}"`
    );
  }

  private async addTenderPackage(weight: string, quantity: string): Promise<void> {
    await this.driver.executeScript("window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'instant' });");
    await this.driver.sleep(250);
    await this.findInteractableElement(this.tenderPackagesSection);
    const addRowButton = await this.findInteractableElement(this.tenderAddRowButton);
    await this.clickElement(addRowButton);

    const row = await this.findInteractableElement(this.tenderPackagesRow);
    const rowInputs = await row.findElements(By.css("input"));
    const visibleInputs = await this.filterAndSortVisibleInputs(rowInputs);
    if (visibleInputs.length < 3) {
      throw new Error(`Esperava encontrar 3 inputs na linha FCL, mas encontrei ${visibleInputs.length}`);
    }

    const equipmentCombobox = visibleInputs[0];
    await this.clickElement(equipmentCombobox);

    const option = await this.findInteractableElement(this.tenderDropdownOption);
    await this.clickElement(option);
    await equipmentCombobox.sendKeys(Key.TAB);
    await this.driver.sleep(300);

    await this.driver.wait(async () => {
      const currentEquipment = ((await equipmentCombobox.getAttribute("value")) ?? "").trim();
      return currentEquipment !== "" && currentEquipment !== "1";
    }, portalConfig.timeoutMs, "Esperava selecionar um equipamento FCL válido");

    const weightInput = visibleInputs[1];
    await this.replaceFormTextInputValue(weightInput, weight);

    const quantityInput = visibleInputs[2];
    await this.replaceFormTextInputValue(quantityInput, quantity);

    await this.driver.wait(async () => {
      const currentWeight = ((await weightInput.getAttribute("value")) ?? "").trim();
      const currentQuantity = ((await quantityInput.getAttribute("value")) ?? "").trim();
      return currentWeight === weight && currentQuantity === quantity;
    }, portalConfig.timeoutMs, "Esperava preencher Peso (KG) e Quantidade no FCL Packages");
  }

  private async fillTenderInformationStep(
    name: string,
    responseDeadline: string,
    shipmentStartDate: string,
    shipmentEndDate: string,
    pickupAddress: string,
    deliveryAddress: string,
    deliverTo: string
  ): Promise<void> {
    const inputs = await this.findInteractableElements(this.tenderInformationSectionInputs);
    const topInputs = await this.sortElementsByPosition(inputs);
    const filtered: WebElement[] = [];
    for (const input of topInputs) {
      const placeholder = ((await input.getAttribute("placeholder")) ?? "").trim().toLowerCase();
      const type = ((await input.getAttribute("type")) ?? "").trim().toLowerCase();
      const role = ((await input.getAttribute("role")) ?? "").trim().toLowerCase();
      const value = ((await input.getAttribute("value")) ?? "").trim();
      if (placeholder === "pesquisar" || placeholder === "search") continue;
      if (role === "combobox") continue;
      if (!["text", "date"].includes(type)) continue;
      if (value === "spot" || value === "fcl") continue;
      filtered.push(input);
    }

    if (filtered.length < 4) {
      throw new Error(`Esperava encontrar pelo menos 4 inputs no formulário de concurso, mas encontrei ${filtered.length}`);
    }

    // Preenche por posição — a ordem é determinada pela posição visual top→bottom, left→right
    await this.replaceInputValue(filtered[0], name);
    if (filtered[1]) await this.replaceDateInputValue(filtered[1], responseDeadline);
    if (filtered[2]) await this.replaceDateInputValue(filtered[2], shipmentStartDate);
    if (filtered[3]) await this.replaceDateInputValue(filtered[3], shipmentEndDate);
    if (filtered[4]) await this.replaceInputValue(filtered[4], pickupAddress);
    if (filtered[5]) await this.replaceInputValue(filtered[5], deliveryAddress);
    if (filtered[6]) await this.replaceInputValue(filtered[6], deliverTo);
  }

  private async selectTenderMarketAndTransportType(): Promise<void> {
    // ── Mercados ──────────────────────────────────────────────────────────────
    // Procura o input de pesquisa dentro da secção de Mercados e filtra por "Europe"
    await this.driver.executeScript<boolean>(`
      const normalize = (v) => (v || "").replace(/\\s+/g, " ").trim().toLowerCase();
      const isVisible = (el) => {
        if (!(el instanceof HTMLElement)) return false;
        const r = el.getBoundingClientRect(), s = window.getComputedStyle(el);
        return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0;
      };
      // Encontra a secção de Mercados pelo título stg-title
      const titles = Array.from(document.querySelectorAll("span.stg-title, h3, h4, legend, label"));
      const marketTitle = titles.find(el => isVisible(el) && normalize(el.textContent).includes("mercad"));
      if (!marketTitle) return false;
      const container = marketTitle.closest("div.stg-container") || marketTitle.closest("div");
      if (!container) return false;
      const searchInput = container.querySelector("input[placeholder='Pesquisar'], input[placeholder='Search']");
      if (!searchInput || !isVisible(searchInput)) return false;
      searchInput.focus();
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      if (setter) setter.call(searchInput, "Europe");
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    `);
    await this.driver.sleep(400);

    // Seleciona o primeiro item disponível na secção Mercados
    await this.clickFirstTenderSectionCheckbox("Mercados");
    await this.driver.sleep(300);

    // ── Tipos de Transporte ───────────────────────────────────────────────────
    // Seleciona o primeiro tile disponível (sem hardcode de nome em inglês)
    const transportSelected = await this.driver.executeScript<boolean>(`
      const isVisible = (el) => {
        if (!(el instanceof HTMLElement)) return false;
        const r = el.getBoundingClientRect(), s = window.getComputedStyle(el);
        return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0;
      };
      const checkboxes = Array.from(document.querySelectorAll("div.stg-tile input[type='checkbox']"));
      for (const cb of checkboxes) {
        if (!(cb instanceof HTMLInputElement) || !isVisible(cb) || cb.checked) continue;
        // Verifica que está numa secção de Tipos de Transporte (não de Mercados)
        const container = cb.closest("div.stg-container");
        if (!container) continue;
        const title = container.querySelector("span.stg-title");
        const titleText = (title?.textContent || "").toLowerCase();
        if (titleText.includes("mercad") || titleText.includes("market")) continue;
        cb.click();
        cb.dispatchEvent(new Event("input", { bubbles: true }));
        cb.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
      return false;
    `);

    if (!transportSelected) {
      // Fallback: tenta clicar em qualquer tile visível fora da secção Mercados
      const tiles = await this.driver.findElements(By.xpath("//div[contains(@class,'stg-tile')]//input[@type='checkbox']"));
      for (const tile of tiles) {
        if (await this.isInteractable(tile)) {
          await this.clickElement(tile);
          break;
        }
      }
    }
    await this.driver.sleep(300);
  }

  private async clickFirstTenderSectionCheckbox(sectionTitle: string): Promise<void> {
    const clicked = await this.driver.executeScript<boolean>(
      `
        const sectionName = arguments[0];
        const normalize = (value) => (value || "").replace(/\\s+/g, " ").trim().toLowerCase();
        const isVisible = (element) => {
          if (!(element instanceof HTMLElement)) return false;
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
        };

        const sections = Array.from(document.querySelectorAll("div"));
        const section = sections.find((element) => normalize(element.textContent).includes(normalize(sectionName)));
        if (!section) return false;

        const checkboxRoots = Array.from(section.querySelectorAll("span.MuiCheckbox-root, span.MuiButtonBase-root.MuiCheckbox-root, input[type='checkbox']"));
        for (const candidate of checkboxRoots) {
          if (!isVisible(candidate)) continue;
          if (candidate instanceof HTMLInputElement) {
            candidate.click();
            candidate.dispatchEvent(new Event("input", { bubbles: true }));
            candidate.dispatchEvent(new Event("change", { bubbles: true }));
            return true;
          }

          if (candidate instanceof HTMLElement) {
            candidate.click();
            const input = candidate.querySelector("input[type='checkbox']");
            if (input instanceof HTMLInputElement) {
              input.dispatchEvent(new Event("input", { bubbles: true }));
              input.dispatchEvent(new Event("change", { bubbles: true }));
            }
            return true;
          }
        }

        return false;
      `,
      sectionTitle
    );

    if (!clicked) {
      throw new Error(`Não foi possível clicar na primeira checkbox da secção "${sectionTitle}"`);
    }
  }

  private async clickTenderTileCheckbox(tileText: string): Promise<void> {
    const clicked = await this.driver.executeScript<boolean>(
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

        const checkboxes = Array.from(document.querySelectorAll("input[type='checkbox']"));
        for (const checkbox of checkboxes) {
          if (!(checkbox instanceof HTMLInputElement) || !isVisible(checkbox)) continue;
          const cardText = normalize(checkbox.closest("label")?.parentElement?.textContent);
          if (cardText !== normalize(targetText)) continue;
          checkbox.click();
          checkbox.dispatchEvent(new Event("input", { bubbles: true }));
          checkbox.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }

        return false;
      `,
      tileText
    );

    if (!clicked) {
      throw new Error(`NÃ£o foi possÃ­vel clicar na checkbox associada a "${tileText}"`);
    }

    await this.driver.wait(
      async () =>
        this.driver.executeScript<boolean>(
          `
            const targetText = arguments[0];
            const normalize = (value) => (value || "").replace(/\\s+/g, " ").trim();
            const tiles = Array.from(document.querySelectorAll("div.stg-tile, span.stg-tile-label"));
            for (const tile of tiles) {
              if (normalize(tile.textContent) !== normalize(targetText)) continue;
              const tileContainer = tile.closest("div.stg-tile") || tile.parentElement;
              const sibling = tileContainer?.nextElementSibling;
              const checkbox = sibling?.querySelector?.("input[type='checkbox']");
              if (checkbox instanceof HTMLInputElement) {
                return checkbox.checked;
              }
            }

            const checkboxes = Array.from(document.querySelectorAll("input[type='checkbox']"));
            for (const checkbox of checkboxes) {
              if (!(checkbox instanceof HTMLInputElement)) continue;
              const cardText = normalize(checkbox.closest("label")?.parentElement?.textContent);
              if (cardText !== normalize(targetText)) continue;
              return checkbox.checked;
            }

            return false;
          `,
          tileText
        ),
      3000,
      `Esperava selecionar a opÃ§Ã£o "${tileText}"`
    );
  }

  private async submitTenderWizard(): Promise<void> {
    try {
      const finishButton = await this.findInteractableElement(this.finishTenderButton);
      await this.clickElement(finishButton);
    } catch {
      await this.clickTenderNext();
    }

    await this.waitAfterSave();
  }

  private async failIfTenderValidationErrorAppears(): Promise<void> {
    await this.driver.sleep(300);
    const alerts = await this.driver.findElements(this.tenderErrorAlert);
    for (const alert of alerts) {
      try {
        if (await alert.isDisplayed()) {
          const text = ((await alert.getText()) || "").trim();
          if (text) throw new Error(text);
        }
      } catch (error) {
        if (error instanceof Error && error.message) throw error;
      }
    }
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
    // 1. Espera que o alerta de sucesso apareça (ou dá um sleep de segurança)
    try {
      await this.waitForSuccessAlert("sucesso");
    } catch {
      await this.driver.sleep(1500);
    }
    // 2. Aguarda que todos os toasts/alerts desapareçam antes de continuar,
    //    para não bloquearem cliques subsequentes (ex: botão de logout).
    const anyAlert = By.xpath("//*[contains(@class,'MuiAlert-root') or contains(@class,'MuiSnackbar-root')]");
    await this.driver.wait(
      async () => {
        const alerts = await this.driver.findElements(anyAlert);
        for (const el of alerts) {
          if (await el.isDisplayed().catch(() => false)) return false;
        }
        return true;
      },
      portalConfig.timeoutMs,
      "Esperava que os toasts/alerts desaparecessem"
    ).catch(() => { /* se não desaparecerem dentro do timeout, continua na mesma */ });
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

  private async findInteractableElements(locator: By): Promise<WebElement[]> {
    await this.driver.wait(until.elementLocated(locator), portalConfig.timeoutMs);
    const elements = await this.driver.findElements(locator);
    const interactable: WebElement[] = [];
    for (const el of elements) {
      if (await this.isInteractable(el)) interactable.push(el);
    }
    if (interactable.length === 0) {
      throw new Error(`Expected to find interactable elements for ${locator}`);
    }
    return interactable;
  }

  private async sortElementsByPosition(elements: WebElement[]): Promise<WebElement[]> {
    const withRects = await Promise.all(
      elements.map(async (element) => ({
        element,
        rect: await element.getRect(),
      }))
    );

    return withRects
      .sort((a, b) => {
        if (Math.abs(a.rect.y - b.rect.y) > 8) return a.rect.y - b.rect.y;
        return a.rect.x - b.rect.x;
      })
      .map((entry) => entry.element);
  }

  private async filterAndSortVisibleInputs(elements: WebElement[]): Promise<WebElement[]> {
    const visible: WebElement[] = [];
    for (const element of elements) {
      if (await this.isInteractable(element)) visible.push(element);
    }
    return this.sortElementsByPosition(visible);
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

  private async replaceFormTextInputValue(input: WebElement, value: string): Promise<void> {
    await this.clickElement(input);
    await input.sendKeys(Key.chord(Key.CONTROL, "a"));
    await input.sendKeys(Key.DELETE);
    await input.sendKeys(value);
    await input.sendKeys(Key.TAB);

    await this.driver.executeScript(
      `
        const input = arguments[0];
        const desired = arguments[1];
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
        if (setter) setter.call(input, desired);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
      `,
      input,
      value
    );

    await this.driver.wait(async () => {
      const current = ((await input.getAttribute("value")) ?? "").trim();
      return current === value;
    }, portalConfig.timeoutMs, `Expected form input value to be "${value}"`);
  }

  private async replaceDateInputValue(input: WebElement, value: string): Promise<void> {
    const typedValue = this.normalizeDateForTyping(value);
    const expectedDisplay = this.normalizeDateForDisplay(value);
    const expectedIso = this.normalizeDateForIso(value);

    await this.clickElement(input);
    await input.sendKeys(Key.chord(Key.CONTROL, "a"));
    await input.sendKeys(Key.DELETE);
    await this.driver.wait(async () => {
      const current = (await input.getAttribute("value")) ?? "";
      return current === "" || current.includes("aaaa");
    }, portalConfig.timeoutMs, "Expected date input to be cleared");

    await input.sendKeys(typedValue);
    await this.driver.wait(async () => {
      const current = ((await input.getAttribute("value")) ?? "").trim();
      const normalizedCurrent = current.replace(/\s+/g, "");
      const expectedCandidates = [expectedDisplay, expectedIso]
        .filter(Boolean)
        .map((candidate) => candidate.replace(/\s+/g, ""));

      return expectedCandidates.some((candidate) =>
        normalizedCurrent === candidate || normalizedCurrent.includes(candidate)
      );
    }, portalConfig.timeoutMs, `Expected input value to be "${expectedDisplay}"`);
  }

  private normalizeDateForTyping(value: string): string {
    const trimmed = value.trim();
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day}${month}${year}`;
    }

    const ptMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
    if (ptMatch) {
      const [, day, month, year] = ptMatch;
      return `${day}${month}${year}`;
    }

    return trimmed.replace(/\D/g, "");
  }

  private normalizeDateForDisplay(value: string): string {
    const trimmed = value.trim();
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return `${day}/${month}/${year}`;
    }

    return trimmed;
  }

  private normalizeDateForIso(value: string): string {
    const trimmed = value.trim();
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (isoMatch) return trimmed;

    const ptMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
    if (ptMatch) {
      const [, day, month, year] = ptMatch;
      return `${year}-${month}-${day}`;
    }

    return trimmed;
  }
}


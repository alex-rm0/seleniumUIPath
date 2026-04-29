/**
 * Crawl manual/interativo.
 *
 * Abre o Chrome num URL inicial e aguarda que o utilizador navegue.
 * A cada ENTER, captura o HTML da página actual e guarda em element-map/pages/.
 *
 * Uso:
 *   npm run crawl:manual
 *   npm run crawl:manual -- --url=https://dev.nexus.shipperform.devlop.systems/#/carrier/login
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { createDriver } from "./engine/core/driverFactory";
import { extractElements } from "./engine/crawler/elementExtractor";
import { ensureDirectoryExists } from "./engine/core/fileSystem";
import { CrawledPage } from "./engine/crawler/types";

const DEFAULT_URL = "https://dev.nexus.shipperform.devlop.systems/#/carrier/login";

function getStartUrl(): string {
  const urlArg = process.argv.slice(2).find((a) => a.startsWith("--url="));
  return urlArg ? urlArg.slice("--url=".length) : DEFAULT_URL;
}

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

function savePage(page: CrawledPage): void {
  const folder = ensureDirectoryExists("element-map/pages");
  const filePath = path.join(folder, `${page.key}.json`);
  fs.writeFileSync(filePath, JSON.stringify(page, null, 2), "utf8");
  console.log(`  ✓ Guardado em: element-map/pages/${page.key}.json  (${page.elements.length} elementos)`);
}

async function main(): Promise<void> {
  const startUrl = getStartUrl();
  const driver = await createDriver();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  try {
    await driver.get(startUrl);
    console.log("");
    console.log("=== Crawl Manual ===");
    console.log(`Browser aberto em: ${startUrl}`);
    console.log("");
    console.log("Navega para a página que queres capturar.");
    console.log("Quando estiver pronta, escreve um nome para o ficheiro (ex: carrier-bid-form)");
    console.log("e carrega ENTER.  Para terminar escreve: exit");
    console.log("");

    while (true) {
      const input = (await prompt(rl, "Nome da página (ou 'exit'): ")).trim();

      if (!input || input.toLowerCase() === "exit") {
        console.log("A fechar o browser...");
        break;
      }

      const key = input.replace(/[^a-z0-9-_]/gi, "-").toLowerCase();
      const currentUrl = await driver.getCurrentUrl();

      console.log(`  [crawl] A extrair "${key}" de: ${currentUrl}`);
      const elements = await extractElements(driver, "detailed");

      const page: CrawledPage = {
        name: key,
        key,
        url: currentUrl,
        extractedAt: new Date().toISOString(),
        elements,
      };

      savePage(page);
    }
  } finally {
    rl.close();
    await driver.quit();
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.stack ?? err.message : String(err);
  console.error("Crawl manual falhou:", message);
  process.exit(1);
});

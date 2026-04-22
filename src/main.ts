import * as fs from "fs";
import * as path from "path";
import { createDriver } from "./engine/core/driverFactory";
import { writeHtmlReport, writeJsonReport } from "./engine/core/reporter";
import { runCase } from "./engine/core/testRunner";
import { TestCase, TestResult } from "./engine/types/testCase";
import { executeFlow } from "./portal/flows/flowRegistry";
import { portalConfig } from "./portal/config/portalConfig";

function parseRequestedIds(): Set<string> | null {
  const args = process.argv.slice(2);
  if (args.length === 0) return null;

  const ids = new Set<string>();

  for (const arg of args) {
    if (arg.startsWith("--id=")) {
      arg.slice("--id=".length).split(",").map((s) => s.trim().toUpperCase()).filter(Boolean).forEach((id) => ids.add(id));
    } else if (/^TC\d+$/i.test(arg)) {
      ids.add(arg.toUpperCase());
    } else {
      console.warn(`[warn] Argumento ignorado: "${arg}"  (formato esperado: TC018 ou --id=TC018,TC001)`);
    }
  }

  return ids.size > 0 ? ids : null;
}

async function execute(): Promise<void> {
  const allCases: TestCase[] = loadTestCases();
  const requestedIds = parseRequestedIds();

  let testCases: TestCase[];

  if (requestedIds) {
    testCases = allCases.filter((tc) => requestedIds.has(tc.id.toUpperCase()));

    const notFound = [...requestedIds].filter(
      (id) => !allCases.some((tc) => tc.id.toUpperCase() === id)
    );
    if (notFound.length > 0) console.warn(`[warn] Testes não encontrados: ${notFound.join(", ")}`);

    if (testCases.length === 0) {
      console.error("Nenhum teste válido encontrado para os IDs fornecidos.");
      process.exit(1);
    }

    console.log(`Testes selecionados: ${testCases.map((tc) => tc.id).join(", ")}`);
  } else {
    testCases = allCases;
    console.log(`A correr todos os ${testCases.length} testes.`);
  }

  console.log("");

  const results: TestResult[] = [];

  for (const testCase of testCases) {
    const driver = await createDriver();
    try {
      const result: TestResult = await runCase(driver, testCase, executeFlow);
      results.push(result);
      console.log(`${result.id} - ${result.status} - ${result.details}`);
    } finally {
      await driver.quit();
    }
  }

  const jsonPath: string = writeJsonReport(results);
  const htmlPath: string = writeHtmlReport(results, portalConfig.projectName);
  console.log(`\nRelatório JSON: ${jsonPath}`);
  console.log(`Relatório HTML: ${htmlPath}`);
}

function loadTestCases(): TestCase[] {
  const sourceFile: string = path.resolve("src/portal/tests/testCases.json");
  const rawContent: string = fs.readFileSync(sourceFile, "utf8");
  return JSON.parse(rawContent) as TestCase[];
}

execute().catch((error: unknown) => {
  const message: string = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error("Execução falhada:", message);
  process.exit(1);
});

import * as fs from "fs";
import * as path from "path";
import { createDriver } from "./core/driverFactory";
import { writeHtmlReport, writeJsonReport } from "./core/reporter";
import { runCase } from "./core/testRunner";
import { TestCase, TestResult } from "./types/testCase";

async function execute(): Promise<void> {
  const testCases: TestCase[] = loadTestCases();
  const results: TestResult[] = [];

  for (const testCase of testCases) {
    const driver = await createDriver();
    try {
      // In UiPath this aligns with "Get Transaction Data" + "Process Transaction"
      const result: TestResult = await runCase(driver, testCase);
      results.push(result);
      console.log(`${result.id} - ${result.status} - ${result.details}`);
    } finally {
      await driver.quit();
    }
  }

  const jsonPath: string = writeJsonReport(results);
  const htmlPath: string = writeHtmlReport(results);
  console.log(`JSON report generated at: ${jsonPath}`);
  console.log(`HTML report generated at: ${htmlPath}`);
}

function loadTestCases(): TestCase[] {
  const sourceFile: string = path.resolve("src/tests/testCases.json");
  const rawContent: string = fs.readFileSync(sourceFile, "utf8");
  return JSON.parse(rawContent) as TestCase[];
}

execute().catch((error: unknown) => {
  const message: string = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error("Execution failed:", message);
  process.exit(1);
});

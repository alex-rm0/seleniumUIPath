import * as fs from "fs";
import * as path from "path";
import { WebDriver } from "selenium-webdriver";
import { engineConfig } from "../config/engineConfig";
import { ensureDirectoryExists } from "./fileSystem";
import { TestCase, TestResult } from "../types/testCase";

export type FlowExecutor = (driver: WebDriver, testCase: TestCase) => Promise<void>;

export async function runCase(
  driver: WebDriver,
  testCase: TestCase,
  executeFlow: FlowExecutor
): Promise<TestResult> {
  const startedAt: number = Date.now();

  try {
    await executeFlow(driver, testCase);

    return {
      id: testCase.id,
      title: testCase.title,
      status: "PASS",
      durationMs: Date.now() - startedAt,
      details: `${testCase.processArea} validated successfully.`,
    };
  } catch (error) {
    let screenshotPath: string | undefined;
    try {
      screenshotPath = await captureScreenshot(driver, testCase.id);
    } catch {
      // screenshot failure is non-fatal
    }

    const message: string = error instanceof Error ? error.message : "Unknown execution failure";
    return {
      id: testCase.id,
      title: testCase.title,
      status: "FAIL",
      durationMs: Date.now() - startedAt,
      details: `${testCase.processArea} failed. ${message}`,
      screenshotPath,
    };
  }
}

async function captureScreenshot(driver: WebDriver, caseId: string): Promise<string> {
  const absoluteFolder: string = ensureDirectoryExists(engineConfig.screenshotFolder);
  const fileName: string = `${caseId}_${Date.now()}.png`;
  const absolutePath: string = path.join(absoluteFolder, fileName);
  const imageBase64: string = await driver.takeScreenshot();
  fs.writeFileSync(absolutePath, imageBase64, "base64");
  return path.join(engineConfig.screenshotFolder, fileName);
}

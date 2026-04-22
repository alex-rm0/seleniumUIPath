import * as fs from "fs";
import * as path from "path";
import { createDriver } from "../core/driverFactory";
import { ensureDirectoryExists } from "../core/fileSystem";
import { timestampForFileName } from "../core/fileSystem";
import { crawlPortal } from "./pageCrawler";
import { ElementMap } from "./types";
import { appConfig } from "../config/appConfig";

async function run(): Promise<void> {
  console.log("=== PharmaNova UI Element Crawler ===");
  console.log(`Target: ${appConfig.baseUrl}`);
  console.log("");

  const driver = await createDriver();

  try {
    const pages = await crawlPortal(driver);

    const elementMap: ElementMap = {
      generatedAt: new Date().toISOString(),
      baseUrl: appConfig.baseUrl,
      pages,
    };

    const folder = ensureDirectoryExists("reports");
    const json = JSON.stringify(elementMap, null, 2);

    // Timestamped file — one per run, never overwritten
    const timestampedPath = path.join(folder, `element-map-${timestampForFileName()}.json`);
    fs.writeFileSync(timestampedPath, json, "utf8");

    // Latest file — always reflects the most recent run
    const latestPath = path.join(folder, "element-map-latest.json");
    fs.writeFileSync(latestPath, json, "utf8");

    const totalElements = pages.reduce((sum, p) => sum + p.elements.length, 0);

    console.log("");
    console.log("=== Crawl complete ===");
    console.log(`Pages crawled  : ${pages.length}`);
    console.log(`Total elements : ${totalElements}`);
    console.log(`Timestamped    : ${timestampedPath}`);
    console.log(`Latest         : ${latestPath}`);
    console.log("");

    for (const page of pages) {
      console.log(`  ${page.name}: ${page.elements.length} element(s)`);
    }
  } finally {
    await driver.quit();
  }
}

run().catch((err: unknown) => {
  const message = err instanceof Error ? err.stack ?? err.message : String(err);
  console.error("Crawler failed:", message);
  process.exit(1);
});

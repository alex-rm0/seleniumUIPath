import * as fs from "fs";
import * as path from "path";
import { createDriver } from "../core/driverFactory";
import { ensureDirectoryExists } from "../core/fileSystem";
import { crawlPages, PAGE_KEYS, PAGE_LABELS, PageKey } from "./pageCrawler";
import { ElementMap } from "./types";
import { appConfig } from "../config/appConfig";

// ─── CLI argument parsing ─────────────────────────────────────────────────────

function parseArgs(): Set<PageKey> {
  const args = process.argv.slice(2);
  const pagesFlag = args.find((a) => a.startsWith("--pages=") || a === "--pages");

  if (!pagesFlag) return new Set(PAGE_KEYS);

  const raw = pagesFlag.startsWith("--pages=")
    ? pagesFlag.slice("--pages=".length)
    : args[args.indexOf("--pages") + 1] ?? "";

  const requested = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => PAGE_KEYS.includes(s as PageKey)) as PageKey[];

  const invalid = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s && !PAGE_KEYS.includes(s as PageKey));

  if (invalid.length > 0) {
    console.warn(`[warn] Unknown page(s) ignored: ${invalid.join(", ")}`);
    console.warn(`       Available: ${PAGE_KEYS.join(", ")}`);
  }

  if (requested.length === 0) {
    console.warn("[warn] No valid pages specified — crawling all pages");
    return new Set(PAGE_KEYS);
  }

  return new Set(requested);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  const requested = parseArgs();

  console.log("=== PharmaNova UI Element Crawler ===");
  console.log(`Target : ${appConfig.baseUrl}`);
  console.log(`Pages  : ${[...requested].map((k) => PAGE_LABELS[k]).join(", ")}`);
  console.log("");

  const driver = await createDriver();

  try {
    const pages = await crawlPages(driver, requested);

    if (pages.length === 0) {
      console.log("No pages were crawled.");
      return;
    }

    // Per-page files in reports/pages/<key>.json
    const pagesFolder = ensureDirectoryExists("reports/pages");
    for (const page of pages) {
      const filePath = path.join(pagesFolder, `${page.key}.json`);
      fs.writeFileSync(filePath, JSON.stringify(page, null, 2), "utf8");
    }

    // Combined latest report
    const reportsFolder = ensureDirectoryExists("reports");
    const elementMap: ElementMap = {
      generatedAt: new Date().toISOString(),
      baseUrl: appConfig.baseUrl,
      pages,
    };
    const latestPath = path.join(reportsFolder, "element-map-latest.json");
    fs.writeFileSync(latestPath, JSON.stringify(elementMap, null, 2), "utf8");

    const totalElements = pages.reduce((sum, p) => sum + p.elements.length, 0);

    console.log("");
    console.log("=== Crawl complete ===");
    console.log(`Pages crawled  : ${pages.length}`);
    console.log(`Total elements : ${totalElements}`);
    console.log(`Per-page files : reports/pages/`);
    console.log(`Combined       : reports/element-map-latest.json`);
    console.log("");

    for (const page of pages) {
      console.log(`  ${page.key}.json — ${page.name}: ${page.elements.length} element(s)`);
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

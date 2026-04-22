import * as fs from "fs";
import * as path from "path";
import { WebDriver } from "selenium-webdriver";
import { createDriver } from "../core/driverFactory";
import { ensureDirectoryExists } from "../core/fileSystem";
import { CrawledPage, ElementMap } from "./types";

export interface CrawlRegistry<K extends string> {
  PAGE_KEYS: K[];
  PAGE_LABELS: Record<K, string>;
  crawlPages: (driver: WebDriver, requested: Set<K>) => Promise<CrawledPage[]>;
}

// ─── CLI argument parsing ─────────────────────────────────────────────────────

export function parsePageArgs<K extends string>(pageKeys: K[]): Set<K> {
  const args = process.argv.slice(2);
  const pagesFlag = args.find((a) => a.startsWith("--pages=") || a === "--pages");

  if (!pagesFlag) return new Set(pageKeys);

  const raw = pagesFlag.startsWith("--pages=")
    ? pagesFlag.slice("--pages=".length)
    : args[args.indexOf("--pages") + 1] ?? "";

  const requested = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => pageKeys.includes(s as K)) as K[];

  const invalid = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s && !pageKeys.includes(s as K));

  if (invalid.length > 0) {
    console.warn(`[warn] Unknown page(s) ignored: ${invalid.join(", ")}`);
    console.warn(`       Available: ${pageKeys.join(", ")}`);
  }

  if (requested.length === 0) {
    console.warn("[warn] No valid pages specified — crawling all pages");
    return new Set(pageKeys);
  }

  return new Set(requested);
}

// ─── Main crawl runner ────────────────────────────────────────────────────────

export async function runCrawl<K extends string>(
  registry: CrawlRegistry<K>,
  baseUrl: string
): Promise<void> {
  const requested = parsePageArgs(registry.PAGE_KEYS);

  console.log("=== UI Element Crawler ===");
  console.log(`Target : ${baseUrl}`);
  console.log(`Pages  : ${[...requested].map((k) => registry.PAGE_LABELS[k]).join(", ")}`);
  console.log("");

  const driver = await createDriver();

  try {
    const pages = await registry.crawlPages(driver, requested);

    if (pages.length === 0) {
      console.log("No pages were crawled.");
      return;
    }

    const pagesFolder = ensureDirectoryExists("element-map/pages");
    for (const page of pages) {
      const filePath = path.join(pagesFolder, `${page.key}.json`);
      fs.writeFileSync(filePath, JSON.stringify(page, null, 2), "utf8");
    }

    const elementMapFolder = ensureDirectoryExists("element-map");
    const elementMap: ElementMap = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      pages,
    };
    fs.writeFileSync(
      path.join(elementMapFolder, "latest.json"),
      JSON.stringify(elementMap, null, 2),
      "utf8"
    );

    const totalElements = pages.reduce((sum, p) => sum + p.elements.length, 0);

    console.log("=== Crawl complete ===");
    console.log(`Pages crawled  : ${pages.length}`);
    console.log(`Total elements : ${totalElements}`);
    console.log(`Per-page files : element-map/pages/`);
    console.log(`Combined       : element-map/latest.json`);
    console.log("");

    for (const page of pages) {
      console.log(`  ${page.key}.json — ${page.name}: ${page.elements.length} element(s)`);
    }
  } finally {
    await driver.quit();
  }
}

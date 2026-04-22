import { runCrawl } from "./engine/crawler/crawlerEngine";
import { crawlPages, PAGE_KEYS, PAGE_LABELS } from "./portal/crawler/pageCrawler";
import { portalConfig } from "./portal/config/portalConfig";

runCrawl({ crawlPages, PAGE_KEYS, PAGE_LABELS }, portalConfig.baseUrl).catch((err: unknown) => {
  const message = err instanceof Error ? err.stack ?? err.message : String(err);
  console.error("Crawler failed:", message);
  process.exit(1);
});

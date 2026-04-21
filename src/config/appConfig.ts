export interface AppConfig {
  baseUrl: string;
  browser: "chrome";
  timeoutMs: number;
  screenshotFolder: string;
}

export const appConfig: AppConfig = {
  baseUrl: "https://dev.nexus.shipperform.devlop.systems/#/login",
  browser: "chrome",
  timeoutMs: 10000,
  screenshotFolder: "reports/screenshots"
};

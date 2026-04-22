export interface TestCaseInput {
  username: string;
  password: string;
  marketName?: string;
  marketRename?: string;
}

export interface TestCaseExpected {
  shouldPass: boolean;
  expectedMessage: string;
  expectedAlertType?: "success" | "error";
  shouldLogout?: boolean;
  shouldStayLoggedOutAfterBack?: boolean;
  navigationFlow?:
    | "marketsToLocations"
    | "noDuplicateMarketsTab"
    | "switchMarketsAndLocationsTabs"
    | "logoutWithOpenTabs"
    | "marketsTableLoads"
    | "refreshMarketsTable"
    | "editWesternEuropeMarket"
    | "locationsTableLoads"
    | "refreshLocationsTable"
    | "editPortoMarselhaLocation"
    | "createEditDeleteMarket";
}

export interface TestCase {
  id: string;
  title: string;
  processArea: string;
  input: TestCaseInput;
  expected: TestCaseExpected;
}

export interface TestResult {
  id: string;
  title: string;
  status: "PASS" | "FAIL";
  durationMs: number;
  details: string;
  screenshotPath?: string;
}

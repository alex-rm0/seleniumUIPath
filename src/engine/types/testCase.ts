export interface TestCaseInput {
  username: string;
  password: string;
  [key: string]: string | undefined;
}

export interface TestCaseExpected {
  shouldPass: boolean;
  expectedMessage: string;
  expectedAlertType?: "success" | "error";
  shouldLogout?: boolean;
  shouldStayLoggedOutAfterBack?: boolean;
  navigationFlow?: string;
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

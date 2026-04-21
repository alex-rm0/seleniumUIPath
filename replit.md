# PharmaNova QA Automation

## Overview
A demonstration project showcasing automated QA testing for a pharmaceutical web portal. Uses TypeScript + Selenium WebDriver for functional web testing, following a Page Object Model (POM) pattern, with UiPath orchestration concepts.

## Architecture

### Frontend / Dashboard
- `server.js`: A simple Node.js HTTP server serving the QA dashboard on port 5000
  - Reads `src/tests/testCases.json` and renders a visual overview of all 17 test cases
  - Groups test cases by process area

### Automation Core (TypeScript)
- `src/main.ts`: Entry point — loads test cases and drives execution
- `src/config/appConfig.ts`: Target URL, browser, timeout, screenshot folder config
- `src/core/driverFactory.ts`: Creates Selenium WebDriver with ChromeDriver
- `src/core/testRunner.ts`: Runs individual test cases with Selenium
- `src/core/reporter.ts`: Generates JSON + HTML reports in `reports/`
- `src/core/fileSystem.ts`: Utility for directory management
- `src/pages/loginPage.ts`: Page Object for the login page
- `src/pages/navigationPage.ts`: Page Object for navigation/side menu
- `src/types/testCase.ts`: TypeScript interfaces for test data
- `src/tests/testCases.json`: 17 test cases (TC001–TC017) covering login, navigation, tab management, session management

### UiPath Orchestration
- `PharmaNova_Demo_Orchestrator/`: UiPath project files (Main.xaml, project.json) for RPA orchestration

## Running

### Dashboard (web preview)
The workflow `Start application` runs `node server.js` on port 5000.

### Running Selenium Tests
```bash
npm test
```
Requires Chrome + ChromeDriver installed. Generates HTML/JSON reports in `reports/`.

## Tech Stack
- TypeScript 6, ts-node
- Selenium WebDriver 4, ChromeDriver
- Node.js HTTP server (dashboard)
- UiPath (RPA orchestration concept)
- Page Object Model pattern

## Deployment
Configured for autoscale deployment running `node server.js`.

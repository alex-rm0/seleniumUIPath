# PharmaNova Selenium + UiPath Demo

This repository contains a practical demo for a pharmaceutical company using UiPath with Selenium to automate web unit and smoke tests.

## Scenario

PharmaNova QA validates a web portal used in batch release operations. The goal is to reduce manual verification time, improve traceability, and support compliance audits.

## Stack

- TypeScript
- Selenium WebDriver
- ChromeDriver
- UiPath orchestration concept

## Project Structure

- `src/main.ts`: execution entry point
- `src/tests/testCases.json`: test data
- `src/pages/loginPage.ts`: page object model
- `src/core/testRunner.ts`: test execution logic
- `src/core/reporter.ts`: JSON and HTML report generation
- `docs/uipath-workflow.md`: UiPath orchestration workflow for this automation
- `docs/demo-script.md`: presentation and live demo speaking notes

## Run

```bash
npm install
npm test
```

## Output

- JSON execution report in `reports/`
- HTML execution report in `reports/`
- Failure screenshots in `reports/screenshots/`

# UiPath Workflow Blueprint

## Objective

Use UiPath as the enterprise orchestrator to execute Selenium TypeScript test suites and collect compliance-ready evidence.

## UiPath Main Sequence

1. **Init State**
   - Read `Config.xlsx`:
     - `NodePath`
     - `ProjectPath`
     - `ExecutionCommand` (`npm test`)
     - `ReportPath` (`reports/`)
   - Create run folder with timestamp
   - Initialize logging context (`RunId`, environment, robot name)

2. **Get Transaction Data**
   - Read test inventory (`TestCases.xlsx` or API source)
   - Push each case into UiPath Queue:
     - `CaseId`
     - `Criticality`
     - `RequiredDataSet`

3. **Process Transaction**
   - For each queue item:
     - Execute `Start Process`:
       - FileName: `cmd.exe`
       - Arguments: `/c cd /d <ProjectPath> && npm test`
     - Wait for completion and capture exit code
     - Parse generated JSON report
     - Mark queue transaction:
       - `Successful` if case passed
       - `ApplicationException` if assertion failure
       - `SystemException` if infra/browser runtime failure

4. **Evidence Collection**
   - Archive:
     - HTML report
     - JSON report
     - Screenshots
   - Upload evidence to:
     - Shared folder, SharePoint, or Documentum

5. **End Process**
   - Send email/Teams summary:
     - total tests
     - pass/fail
     - links to evidence
   - Write audit line to log storage

## Suggested UiPath Assets

- **Assets**
  - `PharmaNova_NodePath`
  - `PharmaNova_TestProjectRoot`
  - `PharmaNova_NotifyEmails`
- **Queues**
  - `QA_BatchRelease_WebTests`
- **Orchestrator Triggers**
  - Nightly run (for regression)
  - Manual run (for release candidate sign-off)

## Compliance Notes

- Keep immutable report snapshots per run
- Store robot execution metadata (who, when, what version)
- Use controlled credentials from Orchestrator assets
- Version test scripts and tie run to git commit hash

import * as fs from "fs";
import * as path from "path";
import { TestResult } from "../types/testCase";
import { ensureDirectoryExists, timestampForFileName } from "./fileSystem";

export function writeJsonReport(results: TestResult[]): string {
  const folder: string = ensureDirectoryExists("reports");
  const fileName: string = `test-results-${timestampForFileName()}.json`;
  const fullPath: string = path.join(folder, fileName);
  fs.writeFileSync(fullPath, JSON.stringify(results, null, 2), "utf8");
  return fullPath;
}

export function writeHtmlReport(results: TestResult[], projectName: string): string {
  const folder: string = ensureDirectoryExists("reports");
  const fileName: string = `test-results-${timestampForFileName()}.html`;
  const fullPath: string = path.join(folder, fileName);

  const passed: number = results.filter((r) => r.status === "PASS").length;
  const failed: number = results.length - passed;
  const totalDuration: number = results.reduce((total, r) => total + r.durationMs, 0);

  const rows: string = results
    .map((result) => {
      const screenshotCell: string = result.screenshotPath
        ? `<a href="../${result.screenshotPath.replace(/\\/g, "/")}">Open</a>`
        : "-";
      return `
        <tr>
          <td>${result.id}</td>
          <td>${result.title}</td>
          <td>${result.status}</td>
          <td>${result.durationMs}</td>
          <td>${escapeHtml(result.details)}</td>
          <td>${screenshotCell}</td>
        </tr>`;
    })
    .join("");

  const html: string = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(projectName)} — QA Report</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; }
      .kpi { display: inline-block; margin-right: 16px; }
      table { border-collapse: collapse; width: 100%; margin-top: 16px; }
      th, td { border: 1px solid #d0d0d0; padding: 8px; text-align: left; }
      th { background: #f4f4f4; }
      .PASS { color: #0b7a0b; font-weight: 700; }
      .FAIL { color: #c62828; font-weight: 700; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(projectName)} — QA Automation Report</h1>
    <div class="kpi"><strong>Total:</strong> ${results.length}</div>
    <div class="kpi"><strong>Passed:</strong> ${passed}</div>
    <div class="kpi"><strong>Failed:</strong> ${failed}</div>
    <div class="kpi"><strong>Duration (ms):</strong> ${totalDuration}</div>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Title</th>
          <th>Status</th>
          <th>Duration (ms)</th>
          <th>Details</th>
          <th>Evidence</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </body>
</html>`;

  fs.writeFileSync(fullPath, html, "utf8");
  return fullPath;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

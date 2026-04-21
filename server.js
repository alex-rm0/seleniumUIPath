const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 5000;
const HOST = "0.0.0.0";

const testCases = JSON.parse(
  fs.readFileSync(path.join(__dirname, "src/tests/testCases.json"), "utf8")
);

const processAreas = [...new Set(testCases.map((tc) => tc.processArea))];

function groupByArea(cases) {
  const groups = {};
  for (const tc of cases) {
    if (!groups[tc.processArea]) groups[tc.processArea] = [];
    groups[tc.processArea].push(tc);
  }
  return groups;
}

function renderTestCase(tc) {
  const badge = tc.expected.shouldPass
    ? `<span class="badge pass">Expected: PASS</span>`
    : `<span class="badge fail">Expected: FAIL</span>`;
  const nav = tc.expected.navigationFlow
    ? `<span class="tag">${tc.expected.navigationFlow}</span>`
    : "";
  const logout = tc.expected.shouldLogout
    ? `<span class="tag">logout</span>`
    : "";
  const back = tc.expected.shouldStayLoggedOutAfterBack
    ? `<span class="tag">back-nav check</span>`
    : "";
  return `
    <div class="card">
      <div class="card-header">
        <span class="tc-id">${tc.id}</span>
        <span class="tc-title">${tc.title}</span>
        ${badge}
      </div>
      <div class="card-body">
        <div class="tags">${nav}${logout}${back}</div>
        <div class="expected-msg">"${tc.expected.expectedMessage}"</div>
      </div>
    </div>`;
}

function renderPage() {
  const groups = groupByArea(testCases);
  const sections = Object.entries(groups)
    .map(
      ([area, cases]) => `
    <section>
      <h2 class="area-title">${area}</h2>
      <div class="cards">${cases.map(renderTestCase).join("")}</div>
    </section>`
    )
    .join("");

  const totalPass = testCases.filter((tc) => tc.expected.shouldPass).length;
  const totalFail = testCases.filter((tc) => !tc.expected.shouldPass).length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PharmaNova QA Automation</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f0f4f8;
      color: #1a202c;
      min-height: 100vh;
    }
    header {
      background: linear-gradient(135deg, #1a3a5c 0%, #2563eb 100%);
      color: white;
      padding: 32px 40px 24px;
    }
    header h1 { font-size: 2rem; font-weight: 700; letter-spacing: -0.5px; }
    header p { margin-top: 8px; opacity: 0.85; font-size: 1rem; }
    .stats {
      display: flex; gap: 20px; margin-top: 20px;
    }
    .stat {
      background: rgba(255,255,255,0.15);
      border-radius: 10px;
      padding: 12px 24px;
      text-align: center;
    }
    .stat-num { font-size: 2rem; font-weight: 800; }
    .stat-label { font-size: 0.8rem; opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; }
    main { max-width: 1100px; margin: 0 auto; padding: 36px 24px; }
    .stack-badges {
      display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 32px;
    }
    .stack-badge {
      background: #e2e8f0; color: #2d3748;
      padding: 6px 16px; border-radius: 20px;
      font-size: 0.85rem; font-weight: 600;
    }
    section { margin-bottom: 36px; }
    .area-title {
      font-size: 1.1rem; font-weight: 700;
      color: #2563eb; border-left: 4px solid #2563eb;
      padding-left: 12px; margin-bottom: 14px;
    }
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px,1fr)); gap: 14px; }
    .card {
      background: white; border-radius: 10px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      overflow: hidden; border: 1px solid #e2e8f0;
      transition: box-shadow 0.2s;
    }
    .card:hover { box-shadow: 0 4px 16px rgba(37,99,235,0.15); }
    .card-header {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; border-bottom: 1px solid #f0f4f8;
      background: #f8fafc;
    }
    .tc-id {
      font-size: 0.75rem; font-weight: 700;
      background: #2563eb; color: white;
      border-radius: 6px; padding: 2px 8px;
      flex-shrink: 0;
    }
    .tc-title { font-weight: 600; font-size: 0.92rem; flex: 1; }
    .badge {
      font-size: 0.7rem; font-weight: 700; padding: 2px 8px;
      border-radius: 12px; flex-shrink: 0;
    }
    .badge.pass { background: #d1fae5; color: #065f46; }
    .badge.fail { background: #fee2e2; color: #991b1b; }
    .card-body { padding: 12px 16px; }
    .tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
    .tag {
      font-size: 0.72rem; background: #ede9fe; color: #5b21b6;
      border-radius: 10px; padding: 2px 10px; font-weight: 600;
    }
    .expected-msg {
      font-size: 0.82rem; color: #64748b;
      font-style: italic; line-height: 1.4;
    }
    footer {
      text-align: center; color: #94a3b8;
      font-size: 0.82rem; padding: 24px;
      border-top: 1px solid #e2e8f0; margin-top: 24px;
    }
  </style>
</head>
<body>
  <header>
    <h1>PharmaNova QA Automation</h1>
    <p>Selenium + UiPath Demo &mdash; Pharmaceutical Batch Release Portal</p>
    <div class="stats">
      <div class="stat">
        <div class="stat-num">${testCases.length}</div>
        <div class="stat-label">Test Cases</div>
      </div>
      <div class="stat">
        <div class="stat-num">${processAreas.length}</div>
        <div class="stat-label">Process Areas</div>
      </div>
      <div class="stat">
        <div class="stat-num">${totalPass}</div>
        <div class="stat-label">Expected Pass</div>
      </div>
      <div class="stat">
        <div class="stat-num">${totalFail}</div>
        <div class="stat-label">Expected Fail</div>
      </div>
    </div>
  </header>
  <main>
    <div class="stack-badges">
      <span class="stack-badge">TypeScript</span>
      <span class="stack-badge">Selenium WebDriver 4</span>
      <span class="stack-badge">ChromeDriver</span>
      <span class="stack-badge">UiPath Orchestration</span>
      <span class="stack-badge">Page Object Model</span>
    </div>
    ${sections}
  </main>
  <footer>PharmaNova QA Automation &mdash; Demo Project</footer>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(renderPage());
});

server.listen(PORT, HOST, () => {
  console.log(`PharmaNova QA Dashboard running at http://${HOST}:${PORT}`);
});

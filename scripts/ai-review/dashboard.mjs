#!/usr/bin/env node

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const port = Number(process.env.AI_REVIEW_DASHBOARD_PORT || 4177);
const planPath = path.join(repoRoot, 'PLAN.json');
const tasksPath = path.join(repoRoot, 'TASKS.md');
const reportJsonPath = path.join(repoRoot, 'builds', 'ai-review', 'latest-report.json');
const reportMdPath = path.join(repoRoot, 'builds', 'ai-review', 'latest-report.md');

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/') {
      return sendHtml(res, renderHtml());
    }

    if (req.method === 'GET' && req.url === '/api/state') {
      return sendJson(res, 200, readState());
    }

    if (req.method === 'POST' && req.url === '/api/run-review') {
      const body = await readBody(req);
      const mode = body.mode || 'manual';
      const change = body.change || '';
      const args = ['scripts/ai-review/orchestrator.mjs', `--mode=${mode}`];
      if (change) {
        args.push(`--change=${change}`);
      }

      const result = runNode(args);
      return sendJson(res, result.ok ? 200 : 500, {
        ...result,
        state: readState()
      });
    }

    if (req.method === 'POST' && req.url === '/api/save-plan') {
      const body = await readBody(req);
      const contents = JSON.stringify(body.plan, null, 2);
      fs.writeFileSync(planPath, `${contents}\n`);
      return sendJson(res, 200, {
        ok: true,
        state: readState()
      });
    }

    if (req.method === 'POST' && req.url === '/api/create-change') {
      const body = await readBody(req);
      const changeId = String(body.changeId || '').trim();
      const summary = String(body.summary || '').trim();

      if (!changeId) {
        return sendJson(res, 400, {
          ok: false,
          error: 'changeId is required.'
        });
      }

      const args = ['scripts/ai-review/new-change.mjs', changeId];
      if (summary) {
        args.push(...summary.split(' '));
      }

      const result = runNode(args);
      return sendJson(res, result.ok ? 200 : 500, {
        ...result,
        state: readState()
      });
    }

    if (req.method === 'POST' && req.url === '/api/install-hook') {
      const result = runProcess('sh', ['scripts/install-git-hooks.sh']);
      return sendJson(res, result.ok ? 200 : 500, {
        ...result,
        state: readState()
      });
    }

    sendJson(res, 404, {
      ok: false,
      error: 'Not found.'
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`AI review dashboard running at http://127.0.0.1:${port}`);
});

function readState() {
  const plan = readJson(planPath, {});
  const reportJson = readJson(reportJsonPath, null);
  const reportMarkdown = readText(reportMdPath);
  const tasks = readText(tasksPath);
  const hookPath = gitConfig('core.hooksPath');
  const changesDir = plan?.openspec?.changesDir ? path.join(repoRoot, plan.openspec.changesDir) : '';
  const changes = changesDir && fs.existsSync(changesDir)
    ? fs.readdirSync(changesDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
    : [];

  return {
    repoRoot,
    hookPath,
    hookInstalled: hookPath === '.githooks',
    openapiExists: fs.existsSync(path.join(repoRoot, 'openapi.yaml')),
    plan,
    tasks,
    changes,
    reportJson,
    reportMarkdown
  };
}

function renderHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AI Review Dashboard</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f1e8;
      --panel: #fffaf2;
      --ink: #1f2430;
      --muted: #675f52;
      --accent: #0f766e;
      --accent-2: #b45309;
      --border: #e8dcc8;
      --danger: #b91c1c;
      --success: #166534;
      --mono: "SFMono-Regular", Consolas, monospace;
      --sans: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--sans);
      color: var(--ink);
      background:
        radial-gradient(circle at top left, rgba(180, 83, 9, 0.12), transparent 32%),
        radial-gradient(circle at top right, rgba(15, 118, 110, 0.10), transparent 24%),
        var(--bg);
    }
    .shell {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }
    .hero {
      display: grid;
      gap: 16px;
      padding: 24px;
      border: 1px solid var(--border);
      border-radius: 20px;
      background: linear-gradient(145deg, rgba(255,250,242,0.96), rgba(248,238,224,0.92));
      box-shadow: 0 20px 40px rgba(86, 67, 33, 0.08);
    }
    h1, h2, h3 { margin: 0; }
    h1 { font-size: 2rem; }
    p { margin: 0; color: var(--muted); line-height: 1.45; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 18px;
      margin-top: 18px;
    }
    .panel {
      border: 1px solid var(--border);
      border-radius: 18px;
      background: var(--panel);
      padding: 18px;
      box-shadow: 0 14px 28px rgba(86, 67, 33, 0.05);
    }
    .panel h2 {
      font-size: 1.1rem;
      margin-bottom: 10px;
    }
    .stack { display: grid; gap: 10px; }
    .row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: rgba(255,255,255,0.75);
      font-size: 0.95rem;
    }
    .ok { color: var(--success); }
    .bad { color: var(--danger); }
    button {
      border: 0;
      border-radius: 12px;
      padding: 10px 14px;
      font: inherit;
      color: white;
      background: var(--accent);
      cursor: pointer;
    }
    button.alt { background: var(--accent-2); }
    input, select, textarea {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 10px 12px;
      font: inherit;
      background: white;
      color: var(--ink);
    }
    textarea {
      min-height: 260px;
      font-family: var(--mono);
      font-size: 0.9rem;
      line-height: 1.45;
    }
    pre {
      margin: 0;
      padding: 14px;
      border-radius: 14px;
      background: #241f1a;
      color: #f8f3ea;
      overflow: auto;
      font-family: var(--mono);
      font-size: 0.85rem;
      line-height: 1.45;
      white-space: pre-wrap;
    }
    .muted { color: var(--muted); }
    .log { min-height: 180px; }
    .tiny { font-size: 0.88rem; }
  </style>
</head>
<body>
  <div class="shell">
    <section class="hero">
      <h1>AI Review Dashboard</h1>
      <p>Inspect hooks, OpenSpec changes, latest reports, and edit the orchestration plan without digging through repo files.</p>
      <div class="row" id="status-pills"></div>
    </section>

    <section class="grid">
      <div class="panel stack">
        <h2>Actions</h2>
        <div class="row">
          <select id="change-select"></select>
          <button id="run-review">Run Review</button>
          <button class="alt" id="install-hook">Install Hook</button>
        </div>
        <div class="row">
          <input id="change-id" placeholder="new-change-id">
          <input id="change-summary" placeholder="Short feature summary">
          <button id="create-change">Create OpenSpec Change</button>
        </div>
        <p class="tiny">Use OpenSpec for feature work. Use OpenAPI only when a change actually touches REST endpoints.</p>
      </div>

      <div class="panel stack">
        <h2>Workflow Snapshot</h2>
        <div id="workflow-summary" class="stack tiny"></div>
      </div>
    </section>

    <section class="grid">
      <div class="panel stack">
        <h2>PLAN.json</h2>
        <textarea id="plan-editor"></textarea>
        <div class="row">
          <button id="save-plan">Save Plan</button>
        </div>
      </div>

      <div class="panel stack">
        <h2>Latest Report</h2>
        <pre id="report-view" class="log"></pre>
      </div>
    </section>

    <section class="grid">
      <div class="panel stack">
        <h2>TASKS.md</h2>
        <pre id="tasks-view" class="log"></pre>
      </div>

      <div class="panel stack">
        <h2>Action Log</h2>
        <pre id="action-log" class="log">Dashboard ready.</pre>
      </div>
    </section>
  </div>

  <script>
    const elements = {
      statusPills: document.getElementById('status-pills'),
      changeSelect: document.getElementById('change-select'),
      changeId: document.getElementById('change-id'),
      changeSummary: document.getElementById('change-summary'),
      workflowSummary: document.getElementById('workflow-summary'),
      planEditor: document.getElementById('plan-editor'),
      reportView: document.getElementById('report-view'),
      tasksView: document.getElementById('tasks-view'),
      actionLog: document.getElementById('action-log')
    };

    let state = null;

    async function callApi(url, options = {}) {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Request failed');
      }
      return payload;
    }

    function log(message) {
      elements.actionLog.textContent = '[' + new Date().toLocaleTimeString() + '] ' + message + '\\n\\n' + elements.actionLog.textContent;
    }

    function render() {
      if (!state) {
        return;
      }

      elements.statusPills.innerHTML = '';
      const pills = [
        ['Hook', state.hookInstalled ? 'Installed' : 'Not installed', state.hookInstalled],
        ['OpenAPI', state.openapiExists ? 'Present' : 'Optional / absent', state.openapiExists],
        ['Changes', String(state.changes.length), true],
        ['Review status', state.reportJson ? (state.reportJson.passed ? 'PASS' : 'FAIL') : 'No run yet', state.reportJson ? state.reportJson.passed : true]
      ];

      for (const [label, value, ok] of pills) {
        const pill = document.createElement('div');
        pill.className = 'pill ' + (ok ? 'ok' : 'bad');
        pill.textContent = label + ': ' + value;
        elements.statusPills.appendChild(pill);
      }

      elements.changeSelect.innerHTML = '';
      const empty = document.createElement('option');
      empty.value = '';
      empty.textContent = 'No specific change';
      elements.changeSelect.appendChild(empty);

      for (const change of state.changes) {
        const option = document.createElement('option');
        option.value = change;
        option.textContent = change;
        if (state.reportJson && state.reportJson.selectedChange === change) {
          option.selected = true;
        }
        elements.changeSelect.appendChild(option);
      }

      elements.workflowSummary.innerHTML = '';
      const lines = [
        'Repo: ' + state.repoRoot,
        'Hook path: ' + (state.hookPath || 'not set'),
        'Enabled reviewers: ' + (state.plan.models || []).filter((model) => model.enabled).map((model) => model.id).join(', '),
        'Enabled gates: ' + (state.plan.qualityGates || []).filter((gate) => gate.enabled).map((gate) => gate.name).join(', '),
        'Default spec: ' + ((state.plan.openspec || {}).defaultSpec || 'n/a'),
        'Latest change: ' + (state.reportJson?.selectedChange || 'none')
      ];

      for (const line of lines) {
        const item = document.createElement('div');
        item.textContent = line;
        elements.workflowSummary.appendChild(item);
      }

      elements.planEditor.value = JSON.stringify(state.plan, null, 2);
      elements.reportView.textContent = state.reportMarkdown || 'No report written yet.';
      elements.tasksView.textContent = state.tasks || 'No tasks file found.';
    }

    async function refresh() {
      state = await callApi('/api/state');
      render();
    }

    document.getElementById('run-review').addEventListener('click', async () => {
      try {
        log('Running review...');
        const result = await callApi('/api/run-review', {
          method: 'POST',
          body: {
            mode: 'manual',
            change: elements.changeSelect.value
          }
        });
        state = result.state;
        render();
        log((result.ok ? 'Review completed.' : 'Review failed.') + '\\n' + [result.stdout, result.stderr].filter(Boolean).join('\\n'));
      } catch (error) {
        log('Review request failed: ' + error.message);
      }
    });

    document.getElementById('install-hook').addEventListener('click', async () => {
      try {
        log('Installing hook...');
        const result = await callApi('/api/install-hook', { method: 'POST' });
        state = result.state;
        render();
        log((result.ok ? 'Hook installed.' : 'Hook install failed.') + '\\n' + [result.stdout, result.stderr].filter(Boolean).join('\\n'));
      } catch (error) {
        log('Hook install request failed: ' + error.message);
      }
    });

    document.getElementById('save-plan').addEventListener('click', async () => {
      try {
        const plan = JSON.parse(elements.planEditor.value);
        log('Saving PLAN.json...');
        const result = await callApi('/api/save-plan', {
          method: 'POST',
          body: { plan }
        });
        state = result.state;
        render();
        log('PLAN.json saved.');
      } catch (error) {
        log('Save failed: ' + error.message);
      }
    });

    document.getElementById('create-change').addEventListener('click', async () => {
      try {
        log('Creating OpenSpec change...');
        const result = await callApi('/api/create-change', {
          method: 'POST',
          body: {
            changeId: elements.changeId.value,
            summary: elements.changeSummary.value
          }
        });
        state = result.state;
        render();
        elements.changeId.value = '';
        elements.changeSummary.value = '';
        log((result.ok ? 'Change created.' : 'Change creation failed.') + '\\n' + [result.stdout, result.stderr].filter(Boolean).join('\\n'));
      } catch (error) {
        log('Change creation failed: ' + error.message);
      }
    });

    refresh().catch((error) => log('Initial load failed: ' + error.message));
  </script>
</body>
</html>`;
}

function sendHtml(res, html) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function gitConfig(key) {
  const result = runProcess('git', ['config', '--get', key]);
  return result.ok ? result.stdout.trim() : '';
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function runNode(args) {
  return runProcess('node', args);
}

function runProcess(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 8
  });

  return {
    ok: result.status === 0,
    status: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || ''
  };
}

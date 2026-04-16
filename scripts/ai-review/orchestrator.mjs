#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const planPath = path.join(repoRoot, 'PLAN.json');
const tasksPath = path.join(repoRoot, 'TASKS.md');
const buildsDir = path.join(repoRoot, 'builds', 'ai-review');

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const plan = readJson(planPath);
  ensureDir(buildsDir);

  const activeChanges = listOpenSpecChanges(plan);
  const selectedChange = selectChange(args, activeChanges);
  const changeContext = readChangeContext(plan, selectedChange);
  const gitContext = getGitContext(plan);
  const qualityGates = runQualityGates(plan, gitContext.changedFiles);
  const initialReviews = await runInitialReviews(plan, args, gitContext, changeContext, qualityGates);
  const reconciledReviews = await runReconciliation(plan, args, gitContext, changeContext, qualityGates, initialReviews);
  const mergedFindings = mergeFindings(plan, gitContext.changedFiles, reconciledReviews);
  const blockingReasons = collectBlockingReasons(plan, qualityGates, mergedFindings);
  const report = {
    timestamp: new Date().toISOString(),
    mode: args.mode,
    selectedChange,
    activeChanges,
    changedFiles: gitContext.changedFiles,
    diffBase: gitContext.baseRef,
    qualityGates,
    reviews: reconciledReviews,
    findings: mergedFindings,
    blockingReasons,
    passed: blockingReasons.length === 0
  };

  writeReport(report);

  if (shouldWriteTasks(plan, args.mode, args.writeTasks)) {
    writeTasks(report);
  }

  printSummary(report);

  if (!report.passed) {
    process.exit(1);
  }
}

function parseArgs(argv) {
  const args = {
    mode: 'manual',
    change: '',
    writeTasks: false,
    strictModels: false
  };

  for (const arg of argv) {
    if (arg.startsWith('--mode=')) {
      args.mode = arg.split('=')[1] || 'manual';
    } else if (arg.startsWith('--change=')) {
      args.change = arg.split('=')[1] || '';
    } else if (arg === '--write-tasks') {
      args.writeTasks = true;
    } else if (arg === '--strict-models') {
      args.strictModels = true;
    }
  }

  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function listOpenSpecChanges(plan) {
  const changesDir = path.join(repoRoot, plan.openspec.changesDir);

  if (!fs.existsSync(changesDir)) {
    return [];
  }

  return fs
    .readdirSync(changesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort();
}

function selectChange(args, activeChanges) {
  if (args.change) {
    return args.change;
  }

  if (process.env.OPENSPEC_CHANGE) {
    return process.env.OPENSPEC_CHANGE;
  }

  if (activeChanges.length === 1) {
    return activeChanges[0];
  }

  return '';
}

function readChangeContext(plan, changeId) {
  if (!changeId) {
    return {
      changeId: '',
      files: {},
      specDeltas: []
    };
  }

  const changeDir = path.join(repoRoot, plan.openspec.changesDir, changeId);

  if (!fs.existsSync(changeDir)) {
    return {
      changeId,
      files: {},
      specDeltas: []
    };
  }

  const specDeltas = collectFiles(path.join(changeDir, 'specs'));
  const files = {};

  for (const relativeFile of [
    'proposal.md',
    'design.md',
    'tasks.md',
    ...specDeltas.map((file) => path.relative(changeDir, file))
  ]) {
    const fullPath = path.join(changeDir, relativeFile);
    if (fs.existsSync(fullPath)) {
      files[relativeFile] = fs.readFileSync(fullPath, 'utf8');
    }
  }

  return {
    changeId,
    files,
    specDeltas: specDeltas.map((file) => path.relative(repoRoot, file))
  };
}

function collectFiles(rootDir) {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const results = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else {
        results.push(fullPath);
      }
    }
  }

  return results.sort();
}

function getGitContext(plan) {
  const baseRef = determineDiffBase();
  const changedFiles = collectChangedFiles(baseRef);
  const diff = collectDiffText(baseRef, changedFiles, plan.review.maxDiffBytes);

  return {
    baseRef,
    changedFiles,
    diff
  };
}

function determineDiffBase() {
  const upstream = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'], {
    allowFailure: true
  });

  if (upstream.ok && upstream.stdout.trim()) {
    const mergeBase = git(['merge-base', 'HEAD', upstream.stdout.trim()], { allowFailure: true });
    if (mergeBase.ok && mergeBase.stdout.trim()) {
      return mergeBase.stdout.trim();
    }
  }

  const headParent = git(['rev-parse', 'HEAD~1'], { allowFailure: true });
  if (headParent.ok && headParent.stdout.trim()) {
    return headParent.stdout.trim();
  }

  return '';
}

function gitDiffNames(baseRef) {
  if (baseRef) {
    const result = git(['diff', '--name-only', '--diff-filter=ACMR', `${baseRef}..HEAD`], {
      allowFailure: true
    });
    if (result.ok) {
      return toLines(result.stdout);
    }
  }

  const cached = git(['diff', '--name-only', '--diff-filter=ACMR', '--cached'], {
    allowFailure: true
  });

  return cached.ok ? toLines(cached.stdout) : [];
}

function collectChangedFiles(baseRef) {
  const committed = gitDiffNames(baseRef);
  const staged = diffNamesForArgs(['diff', '--name-only', '--diff-filter=ACMR', '--cached']);
  const workingTree = diffNamesForArgs(['diff', '--name-only', '--diff-filter=ACMR']);
  const untracked = diffNamesForArgs(['ls-files', '--others', '--exclude-standard']);

  return Array.from(new Set([...committed, ...staged, ...workingTree, ...untracked])).sort();
}

function diffNamesForArgs(args) {
  const result = git(args, { allowFailure: true });
  return result.ok ? toLines(result.stdout) : [];
}

function collectDiffText(baseRef, changedFiles, maxBytes) {
  const sections = [];

  if (baseRef) {
    const committed = git(['diff', '--unified=3', `${baseRef}..HEAD`], {
      allowFailure: true,
      maxBuffer: 1024 * 1024 * 8
    });
    if (committed.ok && committed.stdout.trim()) {
      sections.push(`## Committed Diff\n${committed.stdout}`);
    }
  }

  const staged = git(['diff', '--unified=3', '--cached'], {
    allowFailure: true,
    maxBuffer: 1024 * 1024 * 8
  });
  if (staged.ok && staged.stdout.trim()) {
    sections.push(`## Staged Diff\n${staged.stdout}`);
  }

  const workingTree = git(['diff', '--unified=3'], {
    allowFailure: true,
    maxBuffer: 1024 * 1024 * 8
  });
  if (workingTree.ok && workingTree.stdout.trim()) {
    sections.push(`## Working Tree Diff\n${workingTree.stdout}`);
  }

  const untracked = changedFiles.filter((file) => !isTrackedByGit(file));
  if (untracked.length > 0) {
    const snapshots = untracked
      .map((file) => formatUntrackedFile(file))
      .filter(Boolean)
      .join('\n\n');

    if (snapshots) {
      sections.push(`## Untracked Files\n${snapshots}`);
    }
  }

  return truncate(sections.join('\n\n'), maxBytes);
}

function isTrackedByGit(file) {
  const result = git(['ls-files', '--error-unmatch', file], { allowFailure: true });
  return result.ok;
}

function formatUntrackedFile(file) {
  const fullPath = path.join(repoRoot, file);
  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    return '';
  }

  const body = fs.readFileSync(fullPath, 'utf8');
  return `### ${file}\n${truncate(body, 5000)}`;
}

function runQualityGates(plan, changedFiles) {
  return plan.qualityGates
    .filter((gate) => gate.enabled)
    .map((gate) => {
      if (gate.type === 'php-lint-changed') {
        return runPhpLintGate(gate, changedFiles);
      }

      if (gate.type === 'command') {
        return runCommandGate(gate);
      }

      return {
        name: gate.name,
        type: gate.type,
        passed: true,
        skipped: true,
        output: `Unknown gate type: ${gate.type}`
      };
    });
}

function runPhpLintGate(gate, changedFiles) {
  const phpFiles = changedFiles.filter((file) => file.endsWith('.php'));

  if (phpFiles.length === 0) {
    return {
      name: gate.name,
      type: gate.type,
      passed: true,
      skipped: true,
      output: 'No changed PHP files.'
    };
  }

  const failures = [];
  for (const file of phpFiles) {
    const lint = runProcess('php', ['-l', file]);
    if (!lint.ok) {
      failures.push({
        file,
        output: lint.stderr || lint.stdout
      });
    }
  }

  return {
    name: gate.name,
    type: gate.type,
    passed: failures.length === 0,
    skipped: false,
    output: failures.length === 0 ? `Linted ${phpFiles.length} PHP file(s).` : JSON.stringify(failures, null, 2)
  };
}

function runCommandGate(gate) {
  const result = runShell(gate.command);

  return {
    name: gate.name,
    type: gate.type,
    command: gate.command,
    passed: result.ok,
    skipped: false,
    output: `${truncate(result.stdout, 4000)}${result.stderr ? `\n${truncate(result.stderr, 4000)}` : ''}`.trim()
  };
}

async function runInitialReviews(plan, args, gitContext, changeContext, qualityGates) {
  const reviewers = plan.models.filter((model) => model.enabled);
  const reviews = [];

  for (const reviewer of reviewers) {
    const review = await reviewWithModel(reviewer, buildInitialPrompt(plan, gitContext, changeContext, qualityGates));
    reviews.push(review);
  }

  if (args.strictModels && reviews.every((review) => review.status !== 'ok')) {
    throw new Error('No reviewer models completed successfully.');
  }

  return reviews;
}

async function runReconciliation(plan, args, gitContext, changeContext, qualityGates, initialReviews) {
  const successfulReviews = initialReviews.filter((review) => review.status === 'ok');

  if (successfulReviews.length < 2) {
    return initialReviews;
  }

  const reconciled = [];

  for (const review of initialReviews) {
    if (review.status !== 'ok') {
      reconciled.push(review);
      continue;
    }

    const peers = successfulReviews
      .filter((peer) => peer.id !== review.id)
      .map((peer) => ({
        id: peer.id,
        summary: peer.data.summary,
        findings: peer.data.findings
      }));

    const revised = await reviewWithModel(
      review.model,
      buildReconciliationPrompt(plan, gitContext, changeContext, qualityGates, review.data, peers)
    );

    reconciled.push(
      revised.status === 'ok'
        ? {
            ...revised,
            initialData: review.data
          }
        : review
    );
  }

  return reconciled;
}

async function reviewWithModel(model, prompt) {
  try {
    let raw = '';

    if (model.provider === 'ollama') {
      raw = await callOllama(model, prompt);
    } else if (model.provider === 'openai-compatible') {
      raw = await callOpenAICompatible(model, prompt);
    } else if (model.provider === 'gemini') {
      raw = await callGemini(model, prompt);
    } else {
      return {
        id: model.id,
        model,
        status: 'skipped',
        error: `Unsupported provider: ${model.provider}`
      };
    }

    const data = parseModelReview(raw);

    return {
      id: model.id,
      model,
      status: 'ok',
      raw,
      data
    };
  } catch (error) {
    return {
      id: model.id,
      model,
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function callOllama(model, prompt) {
  const response = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model.model,
      prompt,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status}`);
  }

  const payload = await response.json();
  return String(payload.response || '');
}

async function callOpenAICompatible(model, prompt) {
  const baseUrl = String(model.baseUrl || 'http://127.0.0.1:1234/v1').replace(/\/$/, '');
  const apiKeyEnv = model.apiKeyEnv || '';
  const apiKey = apiKeyEnv ? (process.env[apiKeyEnv] || 'lm-studio') : 'lm-studio';
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model.model,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: 'You are a strict code reviewer. Return only valid JSON matching the requested schema.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI-compatible request failed: ${response.status}`);
  }

  const payload = await response.json();
  return String(payload.choices?.[0]?.message?.content || '');
}

async function callGemini(model, prompt) {
  const apiKeyEnv = model.apiKeyEnv || 'GEMINI_API_KEY';
  const apiKey = process.env[apiKeyEnv];

  if (!apiKey) {
    throw new Error(`Missing ${apiKeyEnv} for Gemini reviewer.`);
  }

  const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${model.model}:generateContent`);
  url.searchParams.set('key', apiKey);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status}`);
  }

  const payload = await response.json();
  return String(payload.candidates?.[0]?.content?.parts?.[0]?.text || '');
}

function parseModelReview(raw) {
  const parsed = extractJson(raw);
  const findings = Array.isArray(parsed.findings) ? parsed.findings : [];

  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary : 'No summary provided.',
    findings: findings.map(normalizeFinding),
    tests_to_run: Array.isArray(parsed.tests_to_run) ? parsed.tests_to_run : [],
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : null
  };
}

function extractJson(raw) {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error(`Model did not return valid JSON. Output: ${truncate(trimmed, 500)}`);
  }
}

function normalizeFinding(finding) {
  return {
    title: String(finding.title || 'Untitled finding').trim(),
    severity: normalizeSeverity(finding.severity),
    file: String(finding.file || '').trim(),
    reason: String(finding.reason || '').trim(),
    evidence: String(finding.evidence || '').trim(),
    suggested_fix: String(finding.suggested_fix || '').trim()
  };
}

function normalizeSeverity(severity) {
  const value = String(severity || 'low').toLowerCase();
  return ['low', 'medium', 'high', 'critical'].includes(value) ? value : 'low';
}

function mergeFindings(plan, changedFiles, reviews) {
  const findingsByKey = new Map();

  for (const review of reviews) {
    if (review.status !== 'ok') {
      continue;
    }

    for (const finding of review.data.findings) {
      const verified = isEvidenceBackedFinding(finding, changedFiles);
      const key = findingKey(finding);
      const current = findingsByKey.get(key) || {
        ...finding,
        verified,
        reviewers: [],
        consensus: 0
      };

      current.reviewers.push(review.id);
      current.consensus = current.reviewers.length;
      current.verified = current.verified || verified;
      findingsByKey.set(key, current);
    }
  }

  return Array.from(findingsByKey.values()).sort(compareFindings(plan));
}

function isEvidenceBackedFinding(finding, changedFiles) {
  if (!finding.file) {
    return false;
  }

  const normalized = finding.file.replace(/^\.\//, '');
  const fullPath = path.join(repoRoot, normalized);
  const fileExists = fs.existsSync(fullPath);
  const trackedCoreFile = ['PLAN.json', 'TASKS.md', 'openapi.yaml'].includes(normalized) || normalized.startsWith('openspec/');

  return fileExists && (changedFiles.includes(normalized) || trackedCoreFile);
}

function compareFindings(plan) {
  const order = severityOrderMap(plan.review.blockOnSeverity);

  return (left, right) => {
    const severityDelta = order(right.severity) - order(left.severity);
    if (severityDelta !== 0) {
      return severityDelta;
    }

    return right.consensus - left.consensus || left.title.localeCompare(right.title);
  };
}

function severityOrderMap(blockOnSeverity) {
  const baseOrder = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3
  };

  return (severity) => {
    const extra = blockOnSeverity.includes(severity) ? 10 : 0;
    return baseOrder[severity] + extra;
  };
}

function collectBlockingReasons(plan, qualityGates, findings) {
  const reasons = [];

  for (const gate of qualityGates) {
    if (!gate.passed && !gate.skipped) {
      reasons.push(`Quality gate failed: ${gate.name}`);
    }
  }

  for (const finding of findings) {
    if (!finding.verified) {
      continue;
    }

    const shouldBlock = plan.review.blockOnSeverity.includes(finding.severity);
    const enoughConsensus = finding.consensus >= plan.review.minimumConsensus;

    if (shouldBlock && enoughConsensus) {
      reasons.push(`Blocking finding: ${finding.severity.toUpperCase()} ${finding.title}`);
    }
  }

  return reasons;
}

function writeReport(report) {
  const jsonPath = path.join(buildsDir, 'latest-report.json');
  const mdPath = path.join(buildsDir, 'latest-report.md');

  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(mdPath, renderMarkdownReport(report));
}

function renderMarkdownReport(report) {
  const lines = [
    '# AI Review Report',
    '',
    `- Timestamp: ${report.timestamp}`,
    `- Mode: ${report.mode}`,
    `- OpenSpec change: ${report.selectedChange || 'not selected'}`,
    `- Diff base: ${report.diffBase || 'none'}`,
    `- Result: ${report.passed ? 'PASS' : 'FAIL'}`,
    '',
    '## Changed Files',
    ''
  ];

  if (report.changedFiles.length === 0) {
    lines.push('No changed files detected.', '');
  } else {
    for (const file of report.changedFiles) {
      lines.push(`- ${file}`);
    }
    lines.push('');
  }

  lines.push('## Quality Gates', '');
  for (const gate of report.qualityGates) {
    lines.push(`- ${gate.name}: ${gate.passed ? 'PASS' : gate.skipped ? 'SKIP' : 'FAIL'}`);
  }
  lines.push('');

  lines.push('## Reviewers', '');
  for (const review of report.reviews) {
    lines.push(`- ${review.id}: ${review.status.toUpperCase()}`);
    if (review.status === 'ok') {
      lines.push(`  Summary: ${review.data.summary}`);
    } else if (review.error) {
      lines.push(`  Error: ${review.error}`);
    }
  }
  lines.push('');

  lines.push('## Findings', '');
  if (report.findings.length === 0) {
    lines.push('No findings.', '');
  } else {
    for (const finding of report.findings) {
      lines.push(`- [${finding.severity.toUpperCase()}] ${finding.title}`);
      lines.push(`  File: ${finding.file || 'unknown'}`);
      lines.push(`  Consensus: ${finding.consensus}`);
      lines.push(`  Verified: ${finding.verified ? 'yes' : 'no'}`);
      if (finding.reason) {
        lines.push(`  Reason: ${finding.reason}`);
      }
    }
    lines.push('');
  }

  if (report.blockingReasons.length > 0) {
    lines.push('## Blocking Reasons', '');
    for (const reason of report.blockingReasons) {
      lines.push(`- ${reason}`);
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function shouldWriteTasks(plan, mode, cliWriteTasks) {
  if (cliWriteTasks) {
    return true;
  }

  if (mode === 'pre-push') {
    return Boolean(plan.review.writeTasksOnPrePush);
  }

  return Boolean(plan.review.writeTasksOnManualRun);
}

function writeTasks(report) {
  const lines = [
    '# AI Review Tasks',
    '',
    'This file is the human-readable companion to `PLAN.json`.',
    '',
    '## Current Workflow',
    '',
    '- Start new feature work by creating an OpenSpec change folder.',
    '- Update `openapi.yaml` only when the feature adds or changes REST endpoints.',
    '- Run `npm run ai:review -- --change=<change-id>` during development.',
    '- Let `.githooks/pre-push` run the same review and test gate before `git push`.',
    '',
    '## Latest Findings',
    ''
  ];

  if (report.findings.length === 0) {
    lines.push('No recorded findings.');
  } else {
    for (const finding of report.findings) {
      lines.push(`- [ ] ${finding.severity.toUpperCase()}: ${finding.title} (${finding.file || 'unknown file'})`);
    }
  }

  fs.writeFileSync(tasksPath, `${lines.join('\n')}\n`);
}

function printSummary(report) {
  console.log(`AI review ${report.passed ? 'passed' : 'failed'}.`);
  console.log(`Report: ${path.relative(repoRoot, path.join(buildsDir, 'latest-report.md'))}`);

  if (report.selectedChange) {
    console.log(`OpenSpec change: ${report.selectedChange}`);
  } else {
    console.log('OpenSpec change: not selected');
  }

  for (const gate of report.qualityGates) {
    console.log(`Gate ${gate.name}: ${gate.passed ? 'PASS' : gate.skipped ? 'SKIP' : 'FAIL'}`);
  }

  for (const review of report.reviews) {
    console.log(`Reviewer ${review.id}: ${review.status.toUpperCase()}`);
    if (review.status !== 'ok' && review.error) {
      console.log(`  ${review.error}`);
    }
  }

  if (report.blockingReasons.length > 0) {
    console.log('Blocking reasons:');
    for (const reason of report.blockingReasons) {
      console.log(`- ${reason}`);
    }
  }
}

function buildInitialPrompt(plan, gitContext, changeContext, qualityGates) {
  return [
    'You are reviewing a WordPress plugin change.',
    'Return JSON only.',
    '',
    'Schema:',
    '{',
    '  "summary": "short summary",',
    '  "findings": [',
    '    {',
    '      "title": "short title",',
    '      "severity": "low|medium|high|critical",',
    '      "file": "relative/path.ext",',
    '      "reason": "why this is a problem",',
    '      "evidence": "quote or paraphrase from the diff/spec/tests",',
    '      "suggested_fix": "short fix suggestion"',
    '    }',
    '  ],',
    '  "tests_to_run": ["optional test suggestion"],',
    '  "confidence": 0.0',
    '}',
    '',
    'Rules:',
    '- Prefer concrete bugs, regressions, missing tests, and contract mismatches.',
    '- Do not invent files.',
    '- Use changed files or OpenSpec files when possible.',
    '- If evidence is weak, omit the finding.',
    '',
    `OpenAPI path: ${plan.openapi.path}`,
    `OpenSpec change: ${changeContext.changeId || 'not selected'}`,
    '',
    'OpenSpec context:',
    JSON.stringify(changeContext.files, null, 2),
    '',
    'Quality gate results:',
    JSON.stringify(qualityGates, null, 2),
    '',
    'Changed files:',
    JSON.stringify(gitContext.changedFiles, null, 2),
    '',
    'Git diff:',
    gitContext.diff || 'No diff available.'
  ].join('\n');
}

function buildReconciliationPrompt(plan, gitContext, changeContext, qualityGates, currentReview, peers) {
  return [
    'Reconcile your review with peer reviewer output.',
    'Return JSON only using the same schema as before.',
    '',
    'Keep only findings that still look valid after reading the peer review and quality gates.',
    'If the peer has a stronger point than yours, include it in your final list.',
    '',
    `OpenAPI path: ${plan.openapi.path}`,
    `OpenSpec change: ${changeContext.changeId || 'not selected'}`,
    '',
    'Your current review:',
    JSON.stringify(currentReview, null, 2),
    '',
    'Peer reviews:',
    JSON.stringify(peers, null, 2),
    '',
    'Quality gate results:',
    JSON.stringify(qualityGates, null, 2),
    '',
    'Changed files:',
    JSON.stringify(gitContext.changedFiles, null, 2),
    '',
    'Git diff:',
    gitContext.diff || 'No diff available.'
  ].join('\n');
}

function findingKey(finding) {
  return [
    finding.file || 'unknown',
    finding.severity,
    slugify(finding.title)
  ].join('|');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function truncate(value, size) {
  if (!value) {
    return '';
  }

  return value.length > size ? `${value.slice(0, size)}\n...[truncated]` : value;
}

function toLines(value) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function git(args, options = {}) {
  return runProcess('git', args, options);
}

function runShell(command) {
  return runProcess('sh', ['-lc', command], { maxBuffer: 1024 * 1024 * 8 });
}

function runProcess(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: options.maxBuffer || 1024 * 1024 * 4
  });

  return {
    ok: result.status === 0,
    code: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    allowFailure: Boolean(options.allowFailure)
  };
}

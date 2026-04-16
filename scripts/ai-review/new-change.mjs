#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const planPath = path.join(repoRoot, 'PLAN.json');

main();

function main() {
  const [, , rawChangeId, ...rest] = process.argv;

  if (!rawChangeId) {
    console.error('Usage: npm run ai:change -- <change-id> [short summary]');
    process.exit(1);
  }

  const changeId = slugify(rawChangeId);
  const summary = rest.join(' ').trim() || 'Describe the feature goal and user impact.';
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  const changeDir = path.join(repoRoot, plan.openspec.changesDir, changeId);
  const specName = plan.openspec.defaultSpec;
  const specDir = path.join(changeDir, 'specs', specName);

  fs.mkdirSync(specDir, { recursive: true });

  writeIfMissing(
    path.join(changeDir, 'proposal.md'),
    [
      `# Proposal: ${titleCase(changeId)}`,
      '',
      '## Why',
      '',
      summary,
      '',
      '## What Changes',
      '',
      '- Describe the behavior change.',
      '- Describe affected users or systems.',
      '',
      '## Success Criteria',
      '',
      '- Add acceptance criteria here.'
    ].join('\n')
  );

  writeIfMissing(
    path.join(changeDir, 'design.md'),
    [
      `# Design: ${titleCase(changeId)}`,
      '',
      '## Notes',
      '',
      '- Describe the architecture or implementation plan.',
      '- List dependencies, migrations, or rollout constraints.',
      '- Mention whether this feature needs `openapi.yaml` updates.'
    ].join('\n')
  );

  writeIfMissing(
    path.join(changeDir, 'tasks.md'),
    [
      '# Tasks',
      '',
      '- [ ] Define the feature behavior.',
      '- [ ] Implement the code changes.',
      '- [ ] Add or enable relevant tests.',
      '- [ ] Run `npm run ai:review -- --change=' + changeId + '`.'
    ].join('\n')
  );

  writeIfMissing(
    path.join(specDir, 'spec.md'),
    [
      '## ADDED Requirements',
      '',
      '### Requirement: New behavior',
      'Describe the new requirement.',
      '',
      '#### Scenario: Happy path',
      '- WHEN the user performs the action',
      '- THEN the system responds as expected'
    ].join('\n')
  );

  console.log(`Created OpenSpec change: ${path.relative(repoRoot, changeDir)}`);
}

function writeIfMissing(filePath, contents) {
  if (fs.existsSync(filePath)) {
    return;
  }

  fs.writeFileSync(filePath, `${contents}\n`);
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleCase(value) {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

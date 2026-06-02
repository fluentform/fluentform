#!/usr/bin/env node
/**
 * Run quality gates manually with clean terminal output.
 *
 * Usage:
 *   node dev/run-checks.mjs              # all checks
 *   node dev/run-checks.mjs --php        # PHPStan + PHPCS only
 *   node dev/run-checks.mjs --admin      # ESLint — resources/admin only
 *   node dev/run-checks.mjs --public     # ESLint — resources/public only
 *   node dev/run-checks.mjs --admin --public  # ESLint both (no PHP)
 *   node dev/run-checks.mjs --php --admin     # PHP checks + admin ESLint
 */

import { spawn }         from 'child_process';
import { existsSync }    from 'fs';
import { resolve }       from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT      = resolve(__dirname, '..');
const DEV       = __dirname;

const argv    = process.argv.slice(2);
const noFlags = !argv.some(a => a.startsWith('--'));
const opt     = f => argv.includes(f);

const runPhp    = noFlags || opt('--php');
const runAdmin  = noFlags || opt('--admin');
const runPublic = noFlags || opt('--public');

// ── ANSI ──────────────────────────────────────────────────────────────────────
const c = {
    reset:  '\x1b[0m',
    bold:   '\x1b[1m',
    dim:    '\x1b[2m',
    red:    '\x1b[31m',
    green:  '\x1b[32m',
    cyan:   '\x1b[36m',
};
const hr = `${c.dim}${'─'.repeat(52)}${c.reset}`;

// ── Spinner ───────────────────────────────────────────────────────────────────
const FRAMES = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];

function spinner(label) {
    let i = 0;
    const t = setInterval(
        () => process.stdout.write(`\r  ${c.cyan}${FRAMES[i++ % FRAMES.length]}${c.reset}  ${label}`),
        80,
    );
    return () => { clearInterval(t); process.stdout.write('\r\x1b[K'); };
}

// ── Augmented PATH (mirrors the bash hook) ────────────────────────────────────
const env = {
    ...process.env,
    PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH}`,
};

// ── run() ─────────────────────────────────────────────────────────────────────
function run(label, cmd, args, cwd) {
    return new Promise((resolve) => {
        const stop  = spinner(label);
        const start = Date.now();
        const child = spawn(cmd, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });

        let buf = '';
        child.stdout.on('data', d => { buf += d; });
        child.stderr.on('data', d => { buf += d; });

        child.on('close', (code) => {
            stop();
            const secs = ((Date.now() - start) / 1000).toFixed(1);
            const ok   = code === 0;
            const icon = ok ? `${c.green}✓${c.reset}` : `${c.red}✗${c.reset}`;
            const name = ok ? `${c.green}${label}${c.reset}` : `${c.red}${label}${c.reset}`;
            console.log(`  ${icon}  ${name.padEnd(ok ? 33 : 27)}${c.dim}${secs}s${c.reset}`);
            resolve({ label, ok, output: buf });
        });
    });
}

// ── Clean up PHPStan progress-bar noise ───────────────────────────────────────
function cleanPhpStan(raw) {
    return raw
        .split('\n')
        .filter(l => !/[░▓]|\x1b\[1G|\x1b\[2K|\[1G|\[2K/.test(l))
        .join('\n')
        .trim();
}

// ── Print a failure block ─────────────────────────────────────────────────────
function printFailure({ label, output }) {
    const body = label === 'PHPStan' ? cleanPhpStan(output) : output.trim();
    if (!body) return;

    console.log(`\n${hr}`);
    console.log(`${c.bold}${c.red} ✗ ${label}${c.reset}`);
    console.log(hr);
    for (const line of body.split('\n')) {
        console.log(`  ${line}`);
    }
}

// ── Print warnings for a passing check (non-blocking) ─────────────────────────
function printWarnings({ label, output }) {
    const body = label === 'PHPStan' ? cleanPhpStan(output) : output.trim();
    if (!/WARNING/.test(body)) return;

    console.log(`\n${hr}`);
    console.log(`${c.bold} ⚠ ${label} — warnings (not blocking)${c.reset}`);
    console.log(hr);
    for (const line of body.split('\n')) {
        if (/WARNING|FILE:/.test(line)) console.log(`  ${line}`);
    }
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log(`\n${c.bold}  FluentForm Quality Gate${c.reset}`);
console.log(`${hr}\n`);

const results = [];

if (runPhp) {
    results.push(await run('PHPStan', 'composer', ['phpstan', '--no-interaction'], DEV));

    const changed = (process.env.GATE_PHP_FILES || '')
        .split('\n').map(s => s.trim()).filter(Boolean).map(f => `../${f}`);
    const phpcsTargets = changed.length ? changed : ['../app'];
    results.push(await run('PHPCS', 'composer', ['phpcs', '--no-interaction', '--', ...phpcsTargets], DEV));
}

if (runAdmin || runPublic) {
    const eslintRunner = resolve(DEV, 'eslint-check.mjs');
    if (!existsSync(eslintRunner)) {
        console.log(`  ${c.dim}⊘  ESLint skipped — dev/eslint-check.mjs not found (apply QG-03)${c.reset}`);
    } else {
        const paths = [...(runAdmin ? ['resources/admin'] : []), ...(runPublic ? ['resources/public'] : [])];
        const label = `ESLint (${paths.map(p => p.split('/').pop()).join(' + ')})`;
        results.push(await run(label, 'node', ['dev/eslint-check.mjs', '--paths', ...paths], ROOT));
    }
}

// ── Summary ───────────────────────────────────────────────────────────────────
const failures = results.filter(r => !r.ok);
const passed   = results.length - failures.length;

for (const f of failures) printFailure(f);
for (const r of results.filter(r => r.ok)) printWarnings(r);

console.log(`\n${hr}`);
if (failures.length === 0) {
    console.log(`  ${c.green}${c.bold}All ${passed} check${passed !== 1 ? 's' : ''} passed.${c.reset}`);
} else {
    console.log(
        `  ${c.red}${c.bold}${failures.length} check${failures.length !== 1 ? 's' : ''} failed.${c.reset}` +
        `  ${c.dim}${passed} passed.${c.reset}`,
    );
}
console.log(`${hr}\n`);

process.exit(failures.length > 0 ? 1 : 0);

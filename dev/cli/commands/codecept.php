<?php

/**
 * Runs the Codeception (wp-browser) suites and surfaces the HTML report + the
 * coverage UI. Invoked from wpf.php for: test, codecept, coverage, test:ui.
 *
 *   ./wpf test                 # Integration + Functional, with HTML report
 *   ./wpf test Integration     # one suite (any extra args pass through)
 *   ./wpf coverage             # same + code coverage (HTML/XML/text)
 *   ./wpf test:ui              # open the last HTML report without re-running
 */
return function ($cwd, array $args) {
    $wpb = $cwd . '/dev/wp-browser';
    $bin = $wpb . '/vendor/bin/codecept';
    $env = $wpb . '/tests/.env';
    $out = $wpb . '/tests/_output';
    $index = $out . '/index.html';
    $coverage = $out . '/coverage/index.html';

    $open = function ($path) {
        if (!is_file($path)) {
            return;
        }
        if (PHP_OS_FAMILY === 'Darwin') {
            exec('open ' . escapeshellarg($path) . ' > /dev/null 2>&1 &');
        } elseif (PHP_OS_FAMILY === 'Linux') {
            exec('xdg-open ' . escapeshellarg($path) . ' > /dev/null 2>&1 &');
        }
        echo "Report: {$path}\n";
    };

    $command = strtolower((string) reset($args));

    if ($command === 'test:ui') {
        if (!is_file($index)) {
            die("No report yet. Run ./wpf test first.\n");
        }
        $open($index);
        return;
    }

    if (!is_file($bin)) {
        die("Codeception is not installed.\nRun: cd dev/wp-browser && composer install\n");
    }
    if (!is_file($env)) {
        die("Missing dev/wp-browser/tests/.env\nRun: cp dev/wp-browser/tests/.env.example dev/wp-browser/tests/.env  (then fill in sandbox values)\n");
    }

    // Args after the command (e.g. a suite name or filter) pass through to codecept.
    $passthru = array_slice($args, 1);

    // Default to Integration + Functional when no suite is named. Acceptance is
    // opt-in (needs chromedriver + a served site): ./wpf test Acceptance.
    $hasSuite = false;
    foreach ($passthru as $a) {
        if (in_array($a, ['Integration', 'Functional', 'Acceptance'], true)) {
            $hasSuite = true;
            break;
        }
    }
    // Each WPLoader suite must run in its own process — two WPLoader boots in
    // one codecept invocation collide on WordPress's global $table_prefix.
    $suites = $hasSuite
        ? array_values(array_filter($passthru, function ($a) {
            return in_array($a, ['Integration', 'Functional', 'Acceptance'], true);
        }))
        : ['Integration', 'Functional'];
    $extra = array_values(array_filter($passthru, function ($a) {
        return !in_array($a, ['Integration', 'Functional', 'Acceptance'], true);
    }));

    $coverageFlags = [];
    $runner = [escapeshellarg($bin)]; // default: codecept via its own shebang php
    $covPhp = null;
    if ($command === 'coverage') {
        // Collect only — per-suite reports overwrite each other, so we merge the
        // serialized coverage from every suite into one report after the loop.
        $coverageFlags = ['--coverage'];
        // Coverage needs a PCOV/Xdebug driver. The default test PHP (e.g. Herd)
        // often has none, so run codecept under a driver-capable PHP if found.
        $covPhp = coveragePhp();
        if ($covPhp) {
            echo "Coverage driver PHP: {$covPhp}\n";
            // PCOV only instruments files under pcov.directory; point it at the
            // plugin root so app/ is collected (Codeception's include filters it).
            $runner = [
                escapeshellarg($covPhp),
                '-d', 'pcov.enabled=1',
                '-d', 'pcov.directory=' . escapeshellarg($cwd),
                escapeshellarg($bin),
            ];
        } else {
            echo "WARNING: no PCOV/Xdebug driver found — coverage will be empty.\n";
            echo "Install one (e.g. PCOV for a homebrew php@8.3) or set WPF_COVERAGE_PHP.\n";
        }
    }

    @unlink($out . '/coverage.xml'); // stale guard: don't show a previous run's number

    $exit = 0;
    $suiteData = [];
    $covSnapshots = [];
    foreach ($suites as $suite) {
        // Per-suite filenames so suites don't overwrite each other.
        $reportFile = strtolower($suite) . '-report.html';
        $xmlFile    = strtolower($suite) . '-report.xml';
        $parts = array_merge(
            ['cd ' . escapeshellarg($wpb) . ' &&'],
            $runner,
            ['run', escapeshellarg($suite)],
            array_map('escapeshellarg', $extra),
            ['--html', escapeshellarg($reportFile), '--xml', escapeshellarg($xmlFile)],
            $coverageFlags
        );
        $cmd = implode(' ', $parts);
        echo "› {$cmd}\n\n";
        passthru($cmd, $suiteExit);
        $exit = $exit ?: (int) $suiteExit;
        $suiteData[$suite] = [
            'report' => is_file($out . '/' . $reportFile) ? $reportFile : null,
            'stats'  => parseJUnit($out . '/' . $xmlFile),
        ];
        // Snapshot this suite's serialized coverage before the next run overwrites it.
        if ($command === 'coverage' && is_file($out . '/coverage.serialized')) {
            $snap = $out . '/' . strtolower($suite) . '.cov';
            copy($out . '/coverage.serialized', $snap);
            $covSnapshots[] = $snap;
        }
    }

    // Merge per-suite coverage into one accurate Clover + HTML report.
    if ($command === 'coverage' && $covPhp && $covSnapshots) {
        $merge = $cwd . '/dev/cli/commands/merge-coverage.php';
        $mergeCmd = implode(' ', array_merge(
            [escapeshellarg($covPhp), '-d', 'pcov.enabled=0', escapeshellarg($merge), escapeshellarg($out)],
            array_map('escapeshellarg', $covSnapshots)
        ));
        echo "\n› merging coverage from " . count($covSnapshots) . " suite(s)\n";
        passthru($mergeCmd);
    }

    $coverageStats = parseCoverage($out . '/coverage.xml');
    writeDashboard($index, $suiteData, $coverageStats, is_file($coverage));

    echo "\n";
    $open($index);

    exit((int) $exit);
};

/**
 * Find a PHP binary with a coverage driver (PCOV or Xdebug) loaded. Checks
 * WPF_COVERAGE_PHP, then common homebrew php@8.3, then the current PHP.
 */
function coveragePhp(): ?string
{
    $candidates = array_filter([
        getenv('WPF_COVERAGE_PHP') ?: null,
        '/opt/homebrew/opt/php@8.3/bin/php',
        '/opt/homebrew/opt/php@8.2/bin/php',
        PHP_BINARY,
        'php',
    ]);

    foreach ($candidates as $php) {
        $mods = @shell_exec(escapeshellarg($php) . ' -m 2>/dev/null');
        if ($mods && preg_match('/^(pcov|xdebug)$/mi', $mods)) {
            return $php;
        }
    }
    return null;
}

function parseJUnit(string $xmlPath): array
{
    $stats = ['tests' => 0, 'failures' => 0, 'errors' => 0, 'skipped' => 0, 'assertions' => 0, 'time' => 0.0, 'cases' => []];
    if (!is_file($xmlPath)) {
        return $stats;
    }
    $xml = @simplexml_load_file($xmlPath);
    if (!$xml) {
        return $stats;
    }
    foreach ($xml->xpath('//testsuite') as $ts) {
        foreach (['tests', 'failures', 'errors', 'skipped', 'assertions'] as $k) {
            $stats[$k] += (int) $ts[$k];
        }
        $stats['time'] += (float) $ts['time'];
        break; // outermost testsuite already aggregates its children
    }
    foreach ($xml->xpath('//testcase') as $tc) {
        $failed = $tc->failure || $tc->error;
        $stats['cases'][] = [
            'name' => (string) $tc['name'],
            'ok'   => !$failed,
            'time' => (float) $tc['time'],
        ];
    }
    return $stats;
}

function parseCoverage(string $cloverPath): ?array
{
    if (!is_file($cloverPath)) {
        return null;
    }
    $xml = @simplexml_load_file($cloverPath);
    if (!$xml) {
        return null;
    }
    $metrics = $xml->project->metrics ?? null;
    if (!$metrics) {
        return null;
    }
    $statements = (int) $metrics['statements'];
    $covered = (int) $metrics['coveredstatements'];
    return [
        'pct'     => $statements ? round($covered / $statements * 100, 1) : 0.0,
        'covered' => $covered,
        'total'   => $statements,
    ];
}

function writeDashboard(string $index, array $suiteData, ?array $coverage, bool $hasCoverageHtml): void
{
    $humanize = function (string $name): string {
        $name = preg_replace('/^[Tt]est[_ ]?/', '', $name);
        $name = str_replace('_', ' ', $name);
        return htmlspecialchars(trim($name), ENT_QUOTES);
    };

    $totals = ['tests' => 0, 'failures' => 0, 'errors' => 0, 'skipped' => 0, 'time' => 0.0];
    $cards = '';
    foreach ($suiteData as $suite => $data) {
        $s = $data['stats'];
        foreach (['tests', 'failures', 'errors', 'skipped'] as $k) {
            $totals[$k] += $s[$k];
        }
        $totals['time'] += $s['time'];
        $bad = $s['failures'] + $s['errors'];
        $passed = max(0, $s['tests'] - $bad - $s['skipped']);
        $ok = $bad === 0;
        $accent = $ok ? '#1a7f37' : '#cf222e';
        $badge = $ok ? 'passing' : ($bad . ' failing');
        $time = number_format($s['time'], 2);

        // What was tested — one row per test case.
        $rows = '';
        foreach ($s['cases'] as $c) {
            $mark = $c['ok'] ? '<span class="ok">✓</span>' : '<span class="fail">✕</span>';
            $rows .= '<li>' . $mark . ' ' . $humanize($c['name'])
                . ' <span class="t">' . number_format($c['time'], 2) . 's</span></li>' . "\n";
        }
        $reportLink = $data['report']
            ? "<a class=\"detail\" href=\"{$data['report']}\">full report →</a>"
            : '';

        $cards .= <<<CARD
  <div class="card" style="--accent:{$accent}">
    <div class="card-top"><span class="suite">{$suite}</span><span class="badge">{$badge}</span></div>
    <div class="nums"><b>{$passed}</b> passed · {$s['failures']} failed · {$s['errors']} errors · {$s['skipped']} skipped</div>
    <div class="meta">{$s['tests']} tests · {$s['assertions']} assertions · {$time}s {$reportLink}</div>
    <details><summary>What was tested ({$s['tests']})</summary><ul class="cases">
{$rows}</ul></details>
  </div>

CARD;
    }

    $totalBad = $totals['failures'] + $totals['errors'];
    $allOk = $totalBad === 0 && $totals['tests'] > 0;
    $heroColor = $allOk ? '#1a7f37' : ($totals['tests'] === 0 ? '#57606a' : '#cf222e');
    $heroText = $totals['tests'] === 0 ? 'No tests run' : ($allOk ? 'All passing' : $totalBad . ' failing');
    $totalTime = number_format($totals['time'], 2);

    // Coverage section: real % + bar when a report exists, else an honest note.
    if ($coverage) {
        $pct = $coverage['pct'];
        $barColor = $pct >= 70 ? '#1a7f37' : ($pct >= 40 ? '#bf8700' : '#cf222e');
        $link = $hasCoverageHtml ? '<a class="detail" href="coverage/index.html">full coverage →</a>' : '';
        $covSection = <<<COV
  <div class="card cov">
    <div class="card-top"><span class="suite">Code coverage</span><span class="badge">{$pct}%</span></div>
    <div class="bar"><span style="width:{$pct}%;background:{$barColor}"></span></div>
    <div class="meta">{$coverage['covered']} / {$coverage['total']} statements covered {$link}</div>
  </div>
COV;
    } else {
        $covSection = <<<COV
  <div class="card cov muted">
    <div class="card-top"><span class="suite">Code coverage</span><span class="badge">not measured</span></div>
    <div class="meta">Run <code>./wpf coverage</code> with a PCOV/Xdebug driver to populate this.</div>
  </div>
COV;
    }

    $html = <<<HTML
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>FluentForm — Test Summary</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
         margin: 0; background: #f6f8fa; color: #1f2328; }
  .wrap { max-width: 760px; margin: 0 auto; padding: 48px 20px 80px; }
  .hero { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
  .dot { width: 14px; height: 14px; border-radius: 50%; background: {$heroColor}; box-shadow: 0 0 0 4px color-mix(in srgb, {$heroColor} 20%, transparent); }
  h1 { font-size: 24px; margin: 0; font-weight: 650; }
  .status { color: {$heroColor}; font-weight: 650; }
  .sub { color: #57606a; margin: 4px 0 28px; font-size: 14px; }
  .grid { display: grid; gap: 14px; }
  .card { display: block; text-decoration: none; color: inherit; background: #fff;
          border: 1px solid #d0d7de; border-left: 4px solid var(--accent, #57606a);
          border-radius: 10px; padding: 16px 18px; transition: box-shadow .15s, transform .15s; }
  .card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); transform: translateY(-1px); }
  .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .suite { font-weight: 650; font-size: 16px; }
  .badge { font-size: 12px; font-weight: 600; color: var(--accent, #57606a);
           background: color-mix(in srgb, var(--accent, #57606a) 12%, transparent); padding: 2px 10px; border-radius: 999px; }
  .nums { font-size: 14px; } .nums b { font-size: 15px; }
  .meta { color: #57606a; font-size: 13px; margin-top: 4px; }
  .detail { color: #2271b1; text-decoration: none; margin-left: 6px; font-weight: 500; }
  .detail:hover { text-decoration: underline; }
  details { margin-top: 12px; } summary { cursor: pointer; font-size: 13px; color: #57606a; user-select: none; }
  ul.cases { list-style: none; margin: 10px 0 0; padding: 0; font-size: 13.5px; }
  ul.cases li { padding: 4px 0; border-top: 1px solid #eaeef2; display: flex; align-items: baseline; gap: 8px; }
  ul.cases .t { margin-left: auto; color: #8b949e; font-variant-numeric: tabular-nums; font-size: 12px; }
  .ok { color: #1a7f37; font-weight: 700; } .fail { color: #cf222e; font-weight: 700; }
  .cov { --accent:#8250df; } .cov.muted { --accent:#57606a; }
  .bar { height: 8px; border-radius: 999px; background: #eaeef2; overflow: hidden; margin: 8px 0 4px; }
  .bar span { display: block; height: 100%; border-radius: 999px; }
  code { background: #eaeef2; padding: 1px 6px; border-radius: 5px; font-size: 12.5px; }
  @media (prefers-color-scheme: dark) {
    body { background: #0d1117; color: #e6edf3; } .card { background: #161b22; border-color: #30363d; }
    .sub, .meta, summary { color: #8b949e; } ul.cases li { border-color: #21262d; }
    .bar, code { background: #21262d; }
  }
</style></head><body><div class="wrap">
  <div class="hero"><span class="dot"></span><h1>FluentForm — Test Summary</h1></div>
  <div class="sub"><span class="status">{$heroText}</span> · {$totals['tests']} tests · {$totalBad} failing · {$totals['skipped']} skipped · {$totalTime}s</div>
  <div class="grid">
{$cards}{$covSection}
  </div>
</div></body></html>
HTML;

    file_put_contents($index, $html);
}

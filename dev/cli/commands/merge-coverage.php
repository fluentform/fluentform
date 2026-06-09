<?php

/**
 * Merge per-suite serialized coverage into one Clover XML + HTML report.
 *
 * WPLoader suites run in separate processes (each overwrites coverage.serialized),
 * so the runner snapshots each to <suite>.cov; this merges them into an accurate
 * combined report. Run under a PHP with a coverage driver via dev/wp-browser/vendor.
 *
 * Usage: php merge-coverage.php <outputDir> <cov1> [<cov2> ...]
 */

use SebastianBergmann\CodeCoverage\CodeCoverage;
use SebastianBergmann\CodeCoverage\Report\Clover;
use SebastianBergmann\CodeCoverage\Report\Html\Facade as HtmlReport;

$out = $argv[1] ?? '';
$covFiles = array_slice($argv, 2);

if ($out === '' || !$covFiles) {
    fwrite(STDERR, "Usage: merge-coverage.php <outputDir> <cov...>\n");
    exit(2);
}

$autoload = dirname($out, 2) . '/vendor/autoload.php'; // <wp-browser>/vendor
if (!is_file($autoload)) {
    fwrite(STDERR, "Cannot find {$autoload}\n");
    exit(2);
}
require $autoload;

$merged = null;
foreach ($covFiles as $file) {
    if (!is_file($file)) {
        continue;
    }
    // Codeception writes each .cov as `<?php return \unserialize(<<<...)` — so
    // include the file to get the CodeCoverage object back, don't unserialize bytes.
    $cov = include $file;
    if (!$cov instanceof CodeCoverage) {
        continue;
    }
    if ($merged === null) {
        $merged = $cov;
    } else {
        $merged->merge($cov);
    }
}

if ($merged === null) {
    fwrite(STDERR, "No usable coverage data to merge.\n");
    exit(1);
}

(new Clover())->process($merged, $out . '/coverage.xml');
(new HtmlReport())->process($merged, $out . '/coverage');

echo "Merged coverage written to {$out}/coverage.xml and {$out}/coverage/\n";

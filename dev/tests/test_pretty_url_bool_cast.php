<?php
/**
 * Standalone regression test for the Pretty URL toggle boolean coercion bug.
 *
 * Why standalone: the repo doesn't have a bootstrapped PHPUnit/WP test suite yet,
 * and the bug is a pure boolean-normalization issue isolatable from WP. Once
 * dev/test/setup.sh is run, this can be promoted to a TestCase.
 *
 * Bug: SettingsService::savePrettyUrlSettings did `(bool) Arr::get($prettyUrl, 'enabled')`.
 * jQuery form-encodes nested objects, so JS `false` arrives as string 'false',
 * and `(bool) 'false' === true`. Toggle never saves OFF.
 *
 * Fix: Arr::isTrue() — wraps filter_var(..., FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE).
 *
 * Run: php dev/tests/test_pretty_url_bool_cast.php
 */

$results = ['pass' => 0, 'fail' => 0];

function assertSame($expected, $actual, $label) {
    global $results;
    if ($expected === $actual) {
        $results['pass']++;
        echo "  PASS  $label\n";
    } else {
        $results['fail']++;
        echo "  FAIL  $label — expected " . var_export($expected, true) . ", got " . var_export($actual, true) . "\n";
    }
}

function buggyCast($value) {
    return (bool) $value;
}

function fixedCast($value) {
    return filter_var($value, FILTER_VALIDATE_BOOLEAN);
}

echo "\n== Current/buggy behavior (proves the bug) ==\n";
assertSame(false, buggyCast(false),    'bool false → false');
assertSame(true,  buggyCast(true),     'bool true → true');
assertSame(true,  buggyCast('true'),   "string 'true' → true");
assertSame(true,  buggyCast('false'),  "string 'false' → true (BUG)");
assertSame(false, buggyCast('0'),      "string '0' → false");
assertSame(false, buggyCast(''),       "empty string → false");
assertSame(true,  buggyCast('1'),      "string '1' → true");

echo "\n== Fixed behavior (Arr::isTrue normalization) ==\n";
assertSame(false, fixedCast(false),    'bool false → false');
assertSame(true,  fixedCast(true),     'bool true → true');
assertSame(true,  fixedCast('true'),   "string 'true' → true");
assertSame(false, fixedCast('false'),  "string 'false' → false (jQuery form-encoded JS false)");
assertSame(false, fixedCast('0'),      "string '0' → false");
assertSame(false, fixedCast(''),       "empty string → false");
assertSame(true,  fixedCast('1'),      "string '1' → true");
assertSame(true,  fixedCast(1),        'int 1 → true');
assertSame(false, fixedCast(0),        'int 0 → false');
assertSame(false, fixedCast(null),     'null → false');

echo "\n== Summary ==\n";
echo "Pass: {$results['pass']}\nFail: {$results['fail']}\n";

exit($results['fail'] === 0 ? 0 : 1);

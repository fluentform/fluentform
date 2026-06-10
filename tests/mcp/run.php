<?php
/**
 * Dependency-free test runner for the FluentForm MCP module.
 *
 * Run:  php tests/mcp/run.php
 *
 * Covers the safety layer (MCPHelper response envelope / error shape / pagination
 * clamping / date normalization / text helpers), the master-switch storage
 * (PermissionGate), and the integrity of every tool definition the server
 * exposes. These are the pieces an AI agent depends on being correct and stable.
 */

require __DIR__ . '/bootstrap.php';

use FluentForm\App\Modules\MCP\AbilitiesRegistrar;
use FluentForm\App\Modules\MCP\Support\ErrorCodes;
use FluentForm\App\Modules\MCP\Support\FormAccess;
use FluentForm\App\Modules\MCP\Support\MCPHelper;
use FluentForm\App\Modules\MCP\Support\PermissionGate;
use FluentForm\App\Modules\MCP\Tools\ContextTools;
use FluentForm\App\Modules\MCP\Tools\FormTools;
use FluentForm\App\Modules\MCP\Tools\SubmissionTools;
use FluentForm\App\Modules\MCP\Tools\ReportTools;
use FluentForm\App\Modules\MCP\Tools\IntegrationTools;

$tests  = 0;
$passed = 0;
$failures = [];

function ok($cond, $label)
{
    global $tests, $passed, $failures;
    $tests++;
    if ($cond) {
        $passed++;
    } else {
        $failures[] = $label;
        echo "  ✘ {$label}\n";
    }
}

function eq($actual, $expected, $label)
{
    ok($actual === $expected, $label . ' (got ' . var_export($actual, true) . ', expected ' . var_export($expected, true) . ')');
}

echo "MCPHelper::pagination\n";
$p = MCPHelper::pagination(['page' => 0, 'per_page' => 9999]);
eq($p['page'], 1, 'page < 1 clamps to 1');
eq($p['per_page'], MCPHelper::MAX_PER_PAGE, 'per_page above default cap clamps to MAX_PER_PAGE');
$p = MCPHelper::pagination(['per_page' => 5000], 15, 200);
eq($p['per_page'], MCPHelper::HARD_MAX_PER_PAGE, 'per_page clamps to HARD_MAX_PER_PAGE even with raised tool max');
$p = MCPHelper::pagination(['per_page' => -3], 15);
eq($p['per_page'], 15, 'per_page < 1 falls back to default');
$p = MCPHelper::pagination([], 15);
eq($p['page'], 1, 'default page is 1');
eq($p['per_page'], 15, 'default per_page honored');

echo "MCPHelper::toIso8601\n";
eq(MCPHelper::toIso8601(''), null, 'empty -> null');
eq(MCPHelper::toIso8601('0000-00-00 00:00:00'), null, 'zero-date -> null');
eq(MCPHelper::toIso8601('not-a-date'), null, 'garbage -> null');
$iso = MCPHelper::toIso8601('2024-06-05 10:30:00');
ok(is_string($iso) && strpos($iso, '2024-06-05T10:30:00') === 0, 'Y-m-d H:i:s -> ISO-8601 string');
$dt = new DateTime('2020-01-02 03:04:05', new DateTimeZone('UTC'));
ok(strpos(MCPHelper::toIso8601($dt), '2020-01-02T03:04:05') === 0, 'DateTime passthrough');

echo "MCPHelper::error\n";
$err = MCPHelper::error('bad_thing', 'Something failed.', ['fields' => ['x'], 'retryable' => true]);
ok($err instanceof WP_Error, 'error() returns WP_Error');
$decoded = json_decode($err->get_error_message(), true);
eq($decoded['error']['code'], 'bad_thing', 'error message JSON carries code');
eq($decoded['error']['retryable'], true, 'error retryable override respected');
ok($decoded['error']['fields'] === ['x'], 'error fields carried');
$err2 = MCPHelper::error('x', 'y');
$d2 = json_decode($err2->get_error_message(), true);
eq($d2['error']['retryable'], false, 'error retryable defaults false');

echo "MCPHelper::envelope\n";
$env = MCPHelper::envelope('Done.', ['a' => 1], ['page' => ['current' => 1]]);
eq($env['summary'], 'Done.', 'envelope summary');
eq($env['data']['a'], 1, 'envelope data');
eq($env['meta']['schema_version'], MCPHelper::SCHEMA_VERSION, 'envelope schema_version');
ok(isset($env['meta']['generated_at']) && isset($env['meta']['timezone']), 'envelope base meta present');
ok($env['meta']['page']['current'] === 1, 'envelope merges extra meta');

echo "MCPHelper text helpers\n";
eq(MCPHelper::htmlToText('<b>Hi</b>   there'), 'Hi there', 'htmlToText strips tags + collapses ws');
$prev = MCPHelper::preview('abcdefghij', 5);
eq($prev, 'abcde…', 'preview truncates with ellipsis');
eq(MCPHelper::preview('short', 50), 'short', 'preview leaves short text intact');

echo "MCPHelper paging/paginator helpers\n";
$meta = MCPHelper::pagingMeta(['current_page' => 2, 'per_page' => 10, 'total' => 25, 'last_page' => 3]);
eq($meta['page']['pages'], 3, 'pagingMeta total pages from array');
eq($meta['page']['has_more'], true, 'pagingMeta has_more true mid-set');
$lastMeta = MCPHelper::pagingMeta(['current_page' => 3, 'per_page' => 10, 'total' => 25, 'last_page' => 3]);
eq($lastMeta['page']['has_more'], false, 'pagingMeta has_more false on last page');
$paginatorObj = new class {
    public function total() { return 7; }
    public function items() { return ['a', 'b']; }
    public function currentPage() { return 1; }
    public function perPage() { return 2; }
    public function lastPage() { return 4; }
};
eq(MCPHelper::paginatorTotal($paginatorObj), 7, 'paginatorTotal from object');
eq(MCPHelper::paginatorItems($paginatorObj), ['a', 'b'], 'paginatorItems from object');
eq(MCPHelper::paginatorTotal(['total' => 9]), 9, 'paginatorTotal from array');
eq(MCPHelper::paginatorItems(['data' => [1, 2, 3]]), [1, 2, 3], 'paginatorItems from array');

echo "PermissionGate master switch\n";
$GLOBALS['__mcp_test_options'] = [];
$GLOBALS['__mcp_test_can'] = true;
eq(PermissionGate::isEnabled(), false, 'isEnabled false by default (ships off)');
eq(PermissionGate::setEnabled(true), true, 'setEnabled(true) returns true when authorized');
eq(PermissionGate::isEnabled(), true, 'isEnabled true after enable');
PermissionGate::setEnabled(false);
eq(PermissionGate::isEnabled(), false, 'isEnabled false after disable');
$GLOBALS['__mcp_test_can'] = false;
eq(PermissionGate::setEnabled(true), false, 'setEnabled fails closed without manage_options');
eq(PermissionGate::isEnabled(), false, 'switch unchanged when unauthorized');
$GLOBALS['__mcp_test_can'] = true;
ok(in_array('fluentform_entries_viewer', PermissionGate::readRoleCaps(), true), 'readRoleCaps includes entries viewer');
ok(!empty(PermissionGate::readRoleCaps()), 'readRoleCaps non-empty');

echo "FormAccess::isInternalKey\n";
ok(FormAccess::isInternalKey('_wp_http_referer'), 'underscore key is internal');
ok(FormAccess::isInternalKey('__fluent_form_embded_post_id'), 'double-underscore key is internal');
ok(FormAccess::isInternalKey('_fluentform_12_fluentformnonce'), 'nonce key is internal');
ok(FormAccess::isInternalKey('g-recaptcha-response'), 'captcha token is internal');
ok(!FormAccess::isInternalKey('email'), 'plain field is not internal');
ok(!FormAccess::isInternalKey('first_name'), 'named field is not internal');
ok(!FormAccess::isInternalKey(''), 'empty string is not internal');

echo "ErrorCodes taxonomy\n";
$codes = ErrorCodes::all();
ok(count($codes) > 0, 'ErrorCodes::all() is non-empty');
ok(count($codes) === count(array_unique($codes)), 'error codes are unique');
ok(count(array_filter($codes, 'is_string')) === count($codes), 'every error code is a string');
$missing = FormAccess::resolveForm(0);
ok($missing instanceof WP_Error, 'resolveForm(0) returns WP_Error');
$mc = json_decode($missing->get_error_message(), true);
eq($mc['error']['code'], ErrorCodes::MISSING_IDENTIFIER, 'resolveForm(0) uses MISSING_IDENTIFIER');
ok(in_array($mc['error']['code'], $codes, true), 'returned code is a declared ErrorCode');

echo "AbilitiesRegistrar::catalogue\n";
$cat = AbilitiesRegistrar::catalogue();
eq(count($cat), 11, 'catalogue lists all 11 tools');
$byName = [];
foreach ($cat as $row) {
    $byName[$row['name']] = $row;
    ok(!empty($row['group']), $row['name'] . ' has a group');
    ok(is_bool($row['write']), $row['name'] . ' write flag is boolean');
}
eq($byName['fluentform/create-form']['write'], true, 'create-form is a write tool');
eq($byName['fluentform/create-form']['group'], 'Forms', 'create-form grouped under Forms');
eq($byName['fluentform/list-forms']['write'], false, 'list-forms is a read tool');
eq($byName['fluentform/get-submission']['group'], 'Entries', 'get-submission grouped under Entries');
eq($byName['fluentform/get-forms-context']['group'], 'Discovery', 'context grouped under Discovery');

echo "Tool definitions integrity\n";
$defs = array_merge(
    ContextTools::definitions(),
    FormTools::definitions(),
    SubmissionTools::definitions(),
    ReportTools::definitions(),
    IntegrationTools::definitions()
);

$expectedTools = [
    'fluentform/get-forms-context',
    'fluentform/list-forms',
    'fluentform/get-form',
    'fluentform/create-form',
    'fluentform/list-submissions',
    'fluentform/get-submission',
    'fluentform/update-submission-status',
    'fluentform/add-submission-note',
    'fluentform/get-form-stats',
    'fluentform/get-submissions-trend',
    'fluentform/list-integrations',
];

eq(count($defs), count($expectedTools), 'exactly the expected number of tools registered');

foreach ($expectedTools as $name) {
    ok(isset($defs[$name]), "tool present: {$name}");
}

foreach ($defs as $name => $def) {
    ok(strpos($name, 'fluentform/') === 0, "name namespaced: {$name}");
    ok(!empty($def['label']), "{$name} has label");
    ok(!empty($def['description']), "{$name} has description");
    ok(isset($def['execute_callback']) && is_callable($def['execute_callback']), "{$name} has callable execute_callback");
    ok(isset($def['permission_callback']) && ($def['permission_callback'] instanceof Closure), "{$name} has permission_callback closure");
    if (isset($def['input_schema'])) {
        ok(isset($def['input_schema']['type']) && 'object' === $def['input_schema']['type'], "{$name} input_schema is an object");
    }
}

// Read tools must be annotated readonly so clients can auto-approve them.
$readTools = [
    'fluentform/get-forms-context',
    'fluentform/list-forms',
    'fluentform/get-form',
    'fluentform/list-submissions',
    'fluentform/get-submission',
    'fluentform/get-form-stats',
    'fluentform/get-submissions-trend',
    'fluentform/list-integrations',
];
foreach ($readTools as $name) {
    ok(!empty($defs[$name]['annotations']['readonly']), "{$name} annotated readonly");
}

// Write tools must NOT be annotated readonly.
foreach (['fluentform/create-form', 'fluentform/update-submission-status', 'fluentform/add-submission-note'] as $name) {
    ok(empty($defs[$name]['annotations']['readonly']), "{$name} not annotated readonly (it writes)");
}

echo "\n";
if ($failures) {
    echo "FAILED: {$passed}/{$tests} assertions passed, " . count($failures) . " failed.\n";
    exit(1);
}

echo "PASSED: {$passed}/{$tests} assertions.\n";
exit(0);

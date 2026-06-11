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
use FluentForm\App\Modules\MCP\Support\Mutation;
use FluentForm\App\Modules\MCP\Support\PermissionGate;
use FluentForm\App\Modules\MCP\Tools\ContextTools;
use FluentForm\App\Modules\MCP\Tools\FormTools;
use FluentForm\App\Modules\MCP\Tools\SubmissionTools;
use FluentForm\App\Modules\MCP\Tools\ReportTools;
use FluentForm\App\Modules\MCP\Tools\IntegrationTools;
use FluentForm\App\Modules\MCP\Tools\ConditionTools;

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

echo "MCPHelper::isYmd\n";
ok(MCPHelper::isYmd('2026-06-10'), 'valid date accepted');
ok(MCPHelper::isYmd('2024-02-29'), 'leap day accepted');
ok(!MCPHelper::isYmd('2026-13-01'), 'month 13 rejected');
ok(!MCPHelper::isYmd('2026-02-30'), 'impossible day rejected');
ok(!MCPHelper::isYmd('10-06-2026'), 'wrong segment order rejected');
ok(!MCPHelper::isYmd('2026-6-1'), 'unpadded date rejected');
ok(!MCPHelper::isYmd('last month'), 'natural language rejected');
ok(!MCPHelper::isYmd(''), 'empty string rejected');
ok(!MCPHelper::isYmd(20260610), 'non-string rejected');

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
eq(ErrorCodes::LIMIT_EXCEEDED, 'limit_exceeded', 'LIMIT_EXCEEDED constant value');
eq(ErrorCodes::UNFILTERED_HTML_REQUIRED, 'unfiltered_html_required', 'UNFILTERED_HTML_REQUIRED constant value');
ok(in_array(ErrorCodes::LIMIT_EXCEEDED, $codes, true), 'ErrorCodes::all() includes LIMIT_EXCEEDED');
ok(in_array(ErrorCodes::UNFILTERED_HTML_REQUIRED, $codes, true), 'ErrorCodes::all() includes UNFILTERED_HTML_REQUIRED');
$missing = FormAccess::resolveForm(0);
ok($missing instanceof WP_Error, 'resolveForm(0) returns WP_Error');
$mc = json_decode($missing->get_error_message(), true);
eq($mc['error']['code'], ErrorCodes::MISSING_IDENTIFIER, 'resolveForm(0) uses MISSING_IDENTIFIER');
ok(in_array($mc['error']['code'], $codes, true), 'returned code is a declared ErrorCode');

echo "AbilitiesRegistrar::catalogue\n";
$GLOBALS['__mcp_test_options'] = [];
$GLOBALS['__mcp_test_can'] = true;
$cat = AbilitiesRegistrar::catalogue();
eq(count($cat), 12, 'catalogue lists the 12 default tools (advanced opt-in off)');
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

echo "Mutation::redact\n";
$redacted = Mutation::redact([
    'title'           => 'Hello',
    'confirm_token'   => 'abc.def',
    'api_key'         => 'sk-123',
    'nested'          => ['password' => 'p', 'keep' => 'v'],
    'fluentformnonce' => 'n',
]);
eq($redacted['title'], 'Hello', 'redact keeps non-sensitive value');
eq($redacted['confirm_token'], '[redacted]', 'redact masks confirm_token');
eq($redacted['api_key'], '[redacted]', 'redact masks api_key');
eq($redacted['nested']['password'], '[redacted]', 'redact recurses into nested secrets');
eq($redacted['nested']['keep'], 'v', 'redact keeps nested non-secret');
eq($redacted['fluentformnonce'], '[redacted]', 'redact masks nonce key');

echo "Mutation::runGuarded dry-run\n";
$GLOBALS['__mcp_test_can'] = true;
$applied = false;
$preview = Mutation::runGuarded(
    'fluentform/delete-submission',
    ['entry_id' => 5, 'dry_run' => true],
    'submission:5',
    'status:read',
    function () { return ['entry_id' => 5, 'permanent' => true]; },
    function () use (&$applied) { $applied = true; return ['ok' => true]; }
);
ok(is_array($preview) && !empty($preview['dry_run']), 'dry_run returns a preview envelope');
ok(!empty($preview['confirm_token']), 'dry_run returns a confirm_token');
ok($applied === false, 'dry_run does NOT execute the mutation');

$noConfirm = Mutation::runGuarded(
    'fluentform/delete-submission',
    ['entry_id' => 5],
    'submission:5',
    'status:read',
    function () { return []; },
    function () use (&$applied) { $applied = true; return ['ok' => true]; }
);
ok($noConfirm instanceof WP_Error, 'execute without confirm_token is refused');
eq($noConfirm->get_error_code(), ErrorCodes::CONFIRMATION_REQUIRED, 'refusal uses CONFIRMATION_REQUIRED');
ok($applied === false, 'mutation still not executed without a valid token');

echo "Mutation::runGuarded idempotent replay\n";
$applyCount = 0;
$runGuarded = function ($params) use (&$applyCount) {
    return Mutation::runGuarded(
        'fluentform/delete-submission',
        $params,
        'submission:9',
        'status:read',
        function () { return ['entry_id' => 9, 'permanent' => true]; },
        function () use (&$applyCount) { $applyCount++; return ['ok' => true, 'id' => 9]; }
    );
};
$prevEnvelope = $runGuarded(['entry_id' => 9, 'dry_run' => true]);
$executed = $runGuarded(['entry_id' => 9, 'confirm_token' => $prevEnvelope['confirm_token'], 'idempotency_key' => 'retry-1']);
ok(is_array($executed) && !empty($executed['ok']), 'execute succeeds with a valid confirm_token');
eq($applyCount, 1, 'mutation applied exactly once');
$retried = $runGuarded(['entry_id' => 9, 'confirm_token' => $prevEnvelope['confirm_token'], 'idempotency_key' => 'retry-1']);
ok(is_array($retried) && !empty($retried['idempotent_replay']), 'retry with the consumed token replays the cached result');
eq($applyCount, 1, 'replay does not run the mutation again');
$otherKey = $runGuarded(['entry_id' => 9, 'confirm_token' => $prevEnvelope['confirm_token'], 'idempotency_key' => 'retry-2']);
ok($otherKey instanceof WP_Error, 'a different idempotency_key with a consumed token is refused');
eq($applyCount, 1, 'refused retry does not run the mutation');

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
    'fluentform/delete-submission',
    'fluentform/bulk-update-submissions',
    'fluentform/get-form-stats',
    'fluentform/get-submissions-trend',
    'fluentform/list-integrations',
];

eq(count($defs), count($expectedTools), 'exactly the expected number of tools registered (raw, pre-gating)');

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
foreach (['fluentform/create-form', 'fluentform/update-submission-status', 'fluentform/add-submission-note', 'fluentform/delete-submission'] as $name) {
    ok(empty($defs[$name]['annotations']['readonly']), "{$name} not annotated readonly (it writes)");
}

// The one destructive tool must be annotated so clients hard-confirm it.
ok(!empty($defs['fluentform/delete-submission']['annotations']['destructive']), 'delete-submission annotated destructive');

echo "Submission output augmentation seam\n";
$GLOBALS['__mcp_test_filters'] = [];
add_filter('fluentform/mcp_submission_data', function ($data, $submission) {
    $data['payment'] = ['status' => 'paid', 'total' => '$10.00', 'form_id' => (int) $submission->form_id];
    return $data;
}, 10, 2);
$base = ['id' => 1, 'form_id' => 5, 'fields' => []];
$augmented = apply_filters('fluentform/mcp_submission_data', $base, (object) ['form_id' => 5]);
ok(isset($augmented['payment']) && 'paid' === $augmented['payment']['status'], 'mcp_submission_data listener augments the entry payload');
eq($augmented['payment']['form_id'], 5, 'mcp_submission_data passes the submission context to listeners');
ok(!isset($base['payment']), 'mcp_submission_data does not mutate the caller payload by reference');

$GLOBALS['__mcp_test_filters'] = [];
$passthrough = apply_filters('fluentform/mcp_submission_data', $base, (object) ['form_id' => 5]);
ok(!isset($passthrough['payment']), 'mcp_submission_data degrades to a clean pass-through without a listener');

add_filter('fluentform/mcp_submission_rows', function ($rows, $items, $formId) {
    foreach ($rows as &$row) {
        $row['payment'] = ['status' => 'paid'];
    }
    unset($row);
    return $rows;
}, 10, 3);
$rows = apply_filters('fluentform/mcp_submission_rows', [['id' => 1], ['id' => 2]], [], 5);
ok(isset($rows[0]['payment'], $rows[1]['payment']), 'mcp_submission_rows listener augments every row');
$GLOBALS['__mcp_test_filters'] = [];
$rowsPass = apply_filters('fluentform/mcp_submission_rows', [['id' => 1]], [], 5);
ok(!isset($rowsPass[0]['payment']), 'mcp_submission_rows degrades to a clean pass-through without a listener');

// Regression: the production tool methods must actually fire the seams.
$submissionToolsSrc = file_get_contents(__DIR__ . '/../../app/Modules/MCP/Tools/SubmissionTools.php');
ok(false !== strpos($submissionToolsSrc, "apply_filters('fluentform/mcp_submission_data'"), 'getSubmission wires the mcp_submission_data seam');
ok(false !== strpos($submissionToolsSrc, "apply_filters('fluentform/mcp_submission_rows'"), 'listSubmissions wires the mcp_submission_rows seam');

echo "Advanced tools opt-in gating\n";
$GLOBALS['__mcp_test_options'] = [];
$GLOBALS['__mcp_test_can'] = true;
eq(PermissionGate::isNewToolsEnabled(), false, 'isNewToolsEnabled false by default (advanced ships off)');
$offDefs = AbilitiesRegistrar::getDefinitions();
ok(!isset($offDefs['fluentform/bulk-update-submissions']), 'bulk tool absent when opt-in off');

$offCount = count(AbilitiesRegistrar::catalogue());
eq(PermissionGate::setNewToolsEnabled(true), true, 'setNewToolsEnabled(true) returns true when authorized');
eq(PermissionGate::isNewToolsEnabled(), true, 'isNewToolsEnabled true after enable');
$onDefs = AbilitiesRegistrar::getDefinitions();
ok(isset($onDefs['fluentform/bulk-update-submissions']), 'bulk tool present when opt-in on');
ok(isset($onDefs['fluentform/get-form-styling']), 'get-form-styling present when opt-in on');
ok(isset($onDefs['fluentform/update-form-styling']), 'update-form-styling present when opt-in on');
ok(count(AbilitiesRegistrar::catalogue()) > $offCount, 'advanced opt-in grows the catalogue');

$GLOBALS['__mcp_test_can'] = false;
eq(PermissionGate::setNewToolsEnabled(false), false, 'setNewToolsEnabled fails closed without manage_options');
eq(PermissionGate::isNewToolsEnabled(), true, 'advanced opt-in unchanged when unauthorized');
$GLOBALS['__mcp_test_can'] = true;

echo "bulk-update-submissions definition\n";
$bulk = $onDefs['fluentform/bulk-update-submissions'];
ok(!empty($bulk['annotations']['destructive']), 'bulk tool annotated destructive');
ok(empty($bulk['annotations']['readonly']), 'bulk tool not annotated readonly (it writes)');
ok(!empty($bulk['advanced']), 'bulk tool flagged advanced');
$bulkProps = $bulk['input_schema']['properties'];
ok(isset($bulkProps['entry_ids']) && 'array' === $bulkProps['entry_ids']['type'], 'bulk schema has entry_ids array');
$bulkActions = $bulkProps['action']['enum'];
foreach (['read', 'unread', 'trashed', 'favorite', 'unfavorite', 'delete_permanently'] as $verb) {
    ok(in_array($verb, $bulkActions, true), "bulk action enum includes {$verb}");
}
// handleBulkActions has no spam branch (Helper::getEntryStatuses excludes it),
// so offering it would silently no-op while reporting success.
ok(!in_array('spam', $bulkActions, true), 'bulk action enum excludes spam (would silently no-op)');
ok(isset($bulkProps['dry_run'], $bulkProps['confirm_token'], $bulkProps['idempotency_key']), 'bulk schema exposes the guard params');
eq($bulk['input_schema']['required'], ['entry_ids', 'action'], 'bulk requires entry_ids and action');

echo "form-styling definitions\n";
$getStyling = $onDefs['fluentform/get-form-styling'];
ok(!empty($getStyling['annotations']['readonly']), 'get-form-styling annotated readonly');
ok(!empty($getStyling['advanced']), 'get-form-styling flagged advanced');
eq($getStyling['input_schema']['required'], ['form_id'], 'get-form-styling requires form_id');
$updateStyling = $onDefs['fluentform/update-form-styling'];
ok(empty($updateStyling['annotations']['readonly']), 'update-form-styling not annotated readonly (it writes)');
ok(!empty($updateStyling['advanced']), 'update-form-styling flagged advanced');
$styleProps = $updateStyling['input_schema']['properties'];
ok(isset($styleProps['styler_theme'], $styleProps['css'], $styleProps['js']), 'update-form-styling exposes theme, css, js');
ok(!isset($styleProps['styler_styles']), 'update-form-styling does NOT accept free-form styler_styles (CSS-injection surface dropped)');

echo "field-conditions definitions\n";
ok(isset($onDefs['fluentform/get-field-conditions']), 'get-field-conditions present when opt-in on');
ok(isset($onDefs['fluentform/update-field-conditions']), 'update-field-conditions present when opt-in on');
$getCond = $onDefs['fluentform/get-field-conditions'];
ok(!empty($getCond['annotations']['readonly']), 'get-field-conditions annotated readonly');
ok(!empty($getCond['advanced']), 'get-field-conditions flagged advanced');
$updCond = $onDefs['fluentform/update-field-conditions'];
ok(empty($updCond['annotations']['readonly']), 'update-field-conditions not annotated readonly (it writes)');
ok(!empty($updCond['advanced']), 'update-field-conditions flagged advanced');
eq($updCond['input_schema']['required'], ['form_id', 'field_key'], 'update-field-conditions requires form_id + field_key');

echo "ConditionTools field walking + validation\n";
$sampleFields = [
    ['attributes' => ['name' => 'email'], 'settings' => ['label' => 'Email']],
    ['attributes' => ['name' => 'reason'], 'settings' => ['label' => 'Reason', 'conditional_logics' => ['status' => true, 'conditions' => [['field' => 'email', 'operator' => '=', 'value' => 'vip']]]]],
    ['element' => 'container', 'columns' => [
        ['fields' => [
            ['attributes' => ['name' => 'nested'], 'settings' => ['label' => 'Nested', 'conditional_logics' => ['status' => true, 'type' => 'group', 'condition_groups' => [['rules' => [['field' => 'email', 'operator' => '!=', 'value' => '']]]]]]],
        ]],
    ]],
];
$keys = ConditionTools::fieldKeys($sampleFields);
ok(isset($keys['email'], $keys['reason'], $keys['nested']), 'fieldKeys finds nested field keys');
$conds = ConditionTools::extractConditions($sampleFields);
eq(count($conds), 2, 'extractConditions returns only conditioned fields, recursing into containers');
$condKeys = array_map(function ($c) { return $c['key']; }, $conds);
ok(in_array('reason', $condKeys, true), 'extractConditions includes a simple-conditions field');
ok(in_array('nested', $condKeys, true), 'extractConditions includes a grouped-conditions nested field');
$validSimple = ['status' => true, 'type' => 'any', 'conditions' => [['field' => 'email', 'operator' => '=', 'value' => 'vip']]];
ok(true === ConditionTools::validateLogics($validSimple, $keys), 'validateLogics accepts a valid simple rule set');
$validGroup = ['status' => true, 'type' => 'group', 'condition_groups' => [['rules' => [['field' => 'email', 'operator' => '!=', 'value' => '']]]]];
ok(true === ConditionTools::validateLogics($validGroup, $keys), 'validateLogics accepts editor-shaped condition_groups[].rules');
ok(ConditionTools::validateLogics(['type' => 'any', 'conditions' => [['field' => 'email', 'operator' => '=']]], $keys) instanceof WP_Error, 'validateLogics rejects missing status (rules would be inert at runtime)');
ok(ConditionTools::validateLogics(['status' => 'yes', 'conditions' => [['field' => 'email', 'operator' => '=']]], $keys) instanceof WP_Error, 'validateLogics rejects non-boolean status');
ok(ConditionTools::validateLogics(['status' => true, 'type' => 'group', 'condition_groups' => [['conditions' => [['field' => 'email', 'operator' => '=']]]]], $keys) instanceof WP_Error, 'validateLogics rejects group using conditions key (runtime reads rules)');
ok(ConditionTools::validateLogics(['status' => true, 'conditions' => [['operator' => '=']]], $keys) instanceof WP_Error, 'validateLogics rejects a rule missing field');
ok(ConditionTools::validateLogics(['status' => true, 'conditions' => [['field' => ['evil'], 'operator' => '=']]], $keys) instanceof WP_Error, 'validateLogics rejects a non-string field without TypeError');
ok(ConditionTools::validateLogics(['status' => true, 'conditions' => [['field' => 'ghost', 'operator' => '=', 'value' => 'x']]], $keys) instanceof WP_Error, 'validateLogics rejects a rule referencing an unknown field');
ok(ConditionTools::validateLogics([], $keys) instanceof WP_Error, 'validateLogics rejects empty logics');
ok(!ConditionTools::hasRules(null) && !ConditionTools::hasRules([]), 'hasRules false for null/empty');

echo "mcp_tool_definitions seam\n";
$GLOBALS['__mcp_test_options'] = [];
$GLOBALS['__mcp_test_filters'] = [];
$baseline = count(AbilitiesRegistrar::getDefinitions());
add_filter('fluentform/mcp_tool_definitions', function ($defs) {
    $defs['fluentform/pro-injected'] = ['label' => 'Pro Injected', 'description' => 'x', 'execute_callback' => function () {}, 'permission_callback' => function () { return true; }];
    return $defs;
});
$injected = AbilitiesRegistrar::getDefinitions();
ok(isset($injected['fluentform/pro-injected']), 'mcp_tool_definitions lets a listener inject a tool definition');
eq(count($injected), $baseline + 1, 'mcp_tool_definitions adds exactly the injected tool');
$GLOBALS['__mcp_test_filters'] = [];
ok(!isset(AbilitiesRegistrar::getDefinitions()['fluentform/pro-injected']), 'definitions unchanged without a listener');

$GLOBALS['__mcp_test_options'] = [];

echo "\n";
if ($failures) {
    echo "FAILED: {$passed}/{$tests} assertions passed, " . count($failures) . " failed.\n";
    exit(1);
}

echo "PASSED: {$passed}/{$tests} assertions.\n";
exit(0);

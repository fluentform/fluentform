<?php
/**
 * Integration coverage for conditional visibility on the validation path with
 * COMPLEX setups: fields inside conditional containers, chained conditions
 * through containers, and every controller type (select, radio, checkbox,
 * hidden input, text).
 *
 * Builds a real form, runs the real Parser (Extractor::extractEssentials)
 * against several payloads, and asserts which fields end up in the essentials
 * set (the set that drives required-validation and accepted keys) — matching
 * what the browser shows for the same state.
 *
 *   wp --path=/path/to/wp eval-file \
 *     wp-content/plugins/fluentform/dev/tests/integration_conditional_container_cascade.php
 *
 * Exit code is 0 on green, non-zero on any FAIL.
 */

use FluentForm\App\Services\Parser\Form as FormParser;

$GLOBALS['ccc_failures'] = 0;
function ccc_check($label, $expected, $actual)
{
    $ok = $expected === $actual;
    if (!$ok) $GLOBALS['ccc_failures']++;
    echo ($ok ? 'PASS' : 'FAIL') . "  $label\n";
    if (!$ok) {
        echo "      expected: " . var_export($expected, true) . "\n";
        echo "      actual:   " . var_export($actual, true) . "\n";
    }
}

$cond = function ($field, $operator, $value) {
    return ['type' => 'any', 'status' => true, 'conditions' => [
        ['field' => $field, 'value' => $value, 'operator' => $operator],
    ]];
};
$noCond = ['type' => 'any', 'status' => false, 'conditions' => []];

$text = function ($name, $conditionals, $required = true) {
    return [
        'element' => 'input_text',
        'attributes' => ['type' => 'text', 'name' => $name],
        'settings' => [
            'label' => $name,
            'conditional_logics' => $conditionals,
            'validation_rules' => ['required' => ['value' => $required, 'message' => 'required']],
        ],
    ];
};

$formFields = ['fields' => [
    [
        'element' => 'select',
        'attributes' => ['name' => 'mode', 'type' => 'select'],
        'settings' => ['label' => 'Mode', 'conditional_logics' => $noCond, 'validation_rules' => []],
        'options' => ['a' => 'A', 'b' => 'B'],
    ],
    [
        'element' => 'input_radio',
        'attributes' => ['name' => 'toggle', 'type' => 'radio'],
        'settings' => ['label' => 'Toggle', 'conditional_logics' => $noCond, 'validation_rules' => []],
        'options' => ['on' => 'On', 'off' => 'Off'],
    ],
    [
        'element' => 'input_hidden',
        'attributes' => ['name' => 'kd', 'type' => 'hidden', 'value' => ''],
        'settings' => ['conditional_logics' => $noCond, 'validation_rules' => []],
    ],
    // Conditional container shown when mode = b, with three children
    [
        'element' => 'container',
        'attributes' => [],
        'settings' => ['conditional_logics' => $cond('mode', '=', 'b')],
        'columns' => [[
            'fields' => [
                $text('inner_text', $noCond),
                [
                    'element' => 'input_checkbox',
                    'attributes' => ['name' => 'boxes', 'type' => 'checkbox'],
                    'settings' => ['label' => 'Boxes', 'conditional_logics' => $noCond, 'validation_rules' => []],
                    'options' => ['X' => 'X', 'Y' => 'Y'],
                ],
                $text('inner_gated', $cond('toggle', '=', 'on')),
            ],
        ]],
    ],
    // Outside dependents referencing in-container controllers
    $text('dep_empty', $cond('inner_text', '=', '')),
    $text('dep_boxes', $cond('boxes', '!=', 'X')),
    $text('dep_chain', $cond('inner_gated', '!=', 'z')),
    // Form 483 shape: hidden-input controller
    $text('dep_kd', $cond('kd', '!=', '3')),
    // Checkbox-TYPE payment component (form 481 shape): submits an array,
    // so its unselected state must satisfy "!=" like input_checkbox does
    [
        'element' => 'multi_payment_component',
        'attributes' => ['name' => 'pay_boxes', 'type' => 'checkbox'],
        'settings' => ['label' => 'Addons', 'conditional_logics' => $noCond, 'validation_rules' => []],
        'settings_pricing_options' => [],
    ],
    $text('dep_pay', $cond('pay_boxes', '!=', 'Install')),
]];

$formId = wpFluent()->table('fluentform_forms')->insertGetId([
    'title'       => 'Cascade Container Fixture',
    'status'      => 'published',
    'form_fields' => json_encode($formFields),
    'created_by'  => 1,
    'created_at'  => current_time('mysql'),
    'updated_at'  => current_time('mysql'),
]);
$form = wpFluent()->table('fluentform_forms')->where('id', $formId)->first();

$essentialNames = function ($payload) use ($form) {
    $parser = new FormParser($form);
    return array_keys($parser->getEssentialInputs($payload, ['rules', 'raw']));
};

// ============================================================
// S1: container hidden (mode=a), toggle unselected, kd empty.
// Browser shows ONLY: mode, toggle, kd. Every dependent hidden.
// ============================================================
$names = $essentialNames(['mode' => 'a', 'kd' => '']);
sort($names);
ccc_check('S1 hidden container: only base fields are essential', ['dep_pay', 'kd', 'mode', 'pay_boxes', 'toggle'], $names);

// ============================================================
// S2: container shown (mode=b), toggle unselected (radio missing),
// boxes unselected (missing). Browser shows: base + inner_text + boxes
// + dep_boxes ([] != X is true). Hidden: inner_gated (toggle not on),
// dep_chain (inner_gated empty scalar), dep_empty (inner_text filled),
// dep_kd (kd empty).
// ============================================================
$names = $essentialNames(['mode' => 'b', 'kd' => '', 'inner_text' => 'hello']);
sort($names);
ccc_check('S2 visible container, unselected checkbox keeps its "!=" dependent', ['boxes', 'dep_boxes', 'dep_pay', 'inner_text', 'kd', 'mode', 'pay_boxes', 'toggle'], $names);

// ============================================================
// S3: container shown, inner_text left empty -> dep_empty ("= ''") is
// visible; checkbox picked X -> dep_boxes hidden (X != X false).
// ============================================================
$names = $essentialNames(['mode' => 'b', 'kd' => '', 'inner_text' => '', 'boxes' => ['X']]);
sort($names);
ccc_check('S3 "= empty" dependent shown, picked checkbox hides its "!=" dependent', ['boxes', 'dep_empty', 'dep_pay', 'inner_text', 'kd', 'mode', 'pay_boxes', 'toggle'], $names);

// ============================================================
// S4: chained through container: toggle=on -> inner_gated visible;
// inner_gated filled with 'q' (!= z) -> dep_chain visible.
// ============================================================
$names = $essentialNames(['mode' => 'b', 'kd' => '', 'inner_text' => 'x', 'toggle' => 'on', 'inner_gated' => 'q']);
sort($names);
ccc_check('S4 chained through container: gated inner + its dependent visible', ['boxes', 'dep_boxes', 'dep_chain', 'dep_pay', 'inner_gated', 'inner_text', 'kd', 'mode', 'pay_boxes', 'toggle'], $names);

// ============================================================
// S5: forged payload — container hidden but inner values submitted
// anyway. Server must still hide the container subtree and dependents.
// ============================================================
$names = $essentialNames(['mode' => 'a', 'kd' => '', 'inner_text' => 'sneak', 'inner_gated' => 'q', 'boxes' => ['Y'], 'toggle' => 'on']);
sort($names);
ccc_check('S5 forged in-container values do not resurrect hidden fields', ['dep_pay', 'kd', 'mode', 'pay_boxes', 'toggle'], $names);

// ============================================================
// S6: form 483 shape — kd = '1' makes dep_kd visible and required.
// ============================================================
$names = $essentialNames(['mode' => 'a', 'kd' => '1']);
sort($names);
ccc_check('S6 hidden-input controller with value shows its dependent', ['dep_kd', 'dep_pay', 'kd', 'mode', 'pay_boxes', 'toggle'], $names);

// ============================================================
// S7: form 481 shape — checkbox-TYPE payment component unselected
// (missing from payload). The browser treats it as [] so the "!="
// dependent stays visible and required.
// ============================================================
$names = $essentialNames(['mode' => 'a', 'kd' => '']);
ccc_check('S7 unselected checkbox-type payment keeps its "!=" dependent', true, in_array('dep_pay', $names, true));

// S7b: picking the matching addon hides the dependent.
$names = $essentialNames(['mode' => 'a', 'kd' => '', 'pay_boxes' => ['Install']]);
ccc_check('S7b picked checkbox-type payment hides its "!=" dependent', false, in_array('dep_pay', $names, true));

wpFluent()->table('fluentform_forms')->where('id', $formId)->delete();

echo "\n";
if ($GLOBALS['ccc_failures'] > 0) {
    fwrite(STDERR, "RESULT: {$GLOBALS['ccc_failures']} FAIL(s)\n");
    exit(1);
}
echo "RESULT: ALL GREEN\n";

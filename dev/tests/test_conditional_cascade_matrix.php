<?php
/**
 * Exhaustive proof for the visibility cascade across operators and types.
 *
 * Two invariants:
 *  (A) Operator transparency: when the referenced controller has NO conditional
 *      logic (always visible), isConditionallyVisible() returns the SAME result
 *      as the flat evaluate() for EVERY operator and input. This proves the
 *      cascade does not change any operator's semantics — it delegates to the
 *      unchanged assess().
 *  (B) Cascade: when the controller IS hidden by its own conditional, the
 *      dependent is hidden — for any / all / group, regardless of operator.
 *
 * Run: php dev/tests/test_conditional_cascade_matrix.php
 */
error_reporting(E_ALL & ~E_DEPRECATED);
$r = ['pass' => 0, 'fail' => 0];
function check($c, $l) { global $r; if ($c) { $r['pass']++; } else { $r['fail']++; echo "  FAIL  $l\n"; } }

if (!class_exists('FluentForm\Framework\Helpers\ArrayHelper')) require_once __DIR__ . '/stubs/CascadeArrayHelper.php';
if (!class_exists('FluentForm\App\Helpers\Str')) require_once __DIR__ . '/stubs/CascadeStr.php';
require_once __DIR__ . '/../../app/Services/ConditionAssesor.php';
use FluentForm\App\Services\ConditionAssesor;

function vis($name, $map, $inputs) { return ConditionAssesor::isConditionallyVisible($name, $map, $inputs); }
function flat($conditional, $inputs) { $f = ['conditionals' => $conditional]; return ConditionAssesor::evaluate($f, $inputs); }

$operators = [
    ['=', '5'], ['!=', '5'], ['>', '5'], ['<', '5'], ['>=', '5'], ['<=', '5'],
    ['contains', 'ell'], ['doNotContains', 'ell'], ['startsWith', 'he'], ['endsWith', 'lo'],
    ['length_equal', '5'], ['length_less_than', '5'], ['length_greater_than', '5'],
    ['test_regex', '^[0-9]+$'], ['=', ''], ['!=', ''],
];
$controllerValues = [null /* missing */, '', '5', '3', '10', 'hello', '12345', 'abc'];

/* (A) operator transparency — single condition, non-conditional controller */
foreach ($operators as $pair) {
    list($op, $val) = $pair;
    foreach ($controllerValues as $cv) {
        $inputs = $cv === null ? [] : ['ctrl' => $cv];
        $dep = ['status' => true, 'type' => 'any', 'conditions' => [['field' => 'ctrl', 'operator' => $op, 'value' => $val]]];
        $map = ['dep' => $dep];
        $a = vis('dep', $map, $inputs);
        $b = flat($dep, $inputs);
        check($a === $b, "transparency op=$op val='$val' ctrl=" . var_export($cv, true) . " cascade=" . var_export($a, true) . " flat=" . var_export($b, true));
    }
}

/* (A2) any/all with two conditions on non-conditional controllers */
foreach ([['=', '5'], ['!=', '5'], ['>', '5'], ['contains', 'x']] as $pair) {
    list($op, $val) = $pair;
    foreach (['all', 'any'] as $type) {
        foreach ($controllerValues as $cv) {
            $inputs = $cv === null ? ['c2' => '5'] : ['ctrl' => $cv, 'c2' => '5'];
            $dep = ['status' => true, 'type' => $type, 'conditions' => [
                ['field' => 'ctrl', 'operator' => $op, 'value' => $val],
                ['field' => 'c2', 'operator' => '=', 'value' => '5'],
            ]];
            $map = ['dep' => $dep];
            check(vis('dep', $map, $inputs) === flat($dep, $inputs), "transparency type=$type op=$op ctrl=" . var_export($cv, true));
        }
    }
}

/* (A3) group conditions, non-conditional controllers */
foreach ($controllerValues as $cv) {
    $inputs = $cv === null ? [] : ['ctrl' => $cv];
    $dep = ['status' => true, 'type' => 'group', 'condition_groups' => [
        ['rules' => [['field' => 'ctrl', 'operator' => '=', 'value' => '5']]],
        ['rules' => [['field' => 'ctrl', 'operator' => '!=', 'value' => '']]],
    ]];
    $map = ['dep' => $dep];
    check(vis('dep', $map, $inputs) === flat($dep, $inputs), "transparency group ctrl=" . var_export($cv, true));
}

/* (B) controller HIDDEN by its own conditional => dependent hidden, every operator */
$toggleOff = ['toggle' => 'off'];
foreach ($operators as $pair) {
    list($op, $val) = $pair;
    foreach (['any', 'all'] as $type) {
        $map = [
            'gate' => ['status' => true, 'type' => 'any', 'conditions' => [['field' => 'toggle', 'operator' => '=', 'value' => 'on']]],
            'dep'  => ['status' => true, 'type' => $type, 'conditions' => [['field' => 'gate', 'operator' => $op, 'value' => $val]]],
        ];
        check(vis('dep', $map, $toggleOff) === false, "hidden-controller op=$op type=$type -> must be hidden");
    }
}

/* (B2) 'all' with a satisfied visible condition + a hidden-controller condition => hidden */
$inB2 = ['toggle' => 'off', 'visibleCtrl' => 'x'];
$mapB2 = [
    'gate' => ['status' => true, 'type' => 'any', 'conditions' => [['field' => 'toggle', 'operator' => '=', 'value' => 'on']]],
    'dep'  => ['status' => true, 'type' => 'all', 'conditions' => [
        ['field' => 'visibleCtrl', 'operator' => '=', 'value' => 'x'],
        ['field' => 'gate', 'operator' => '!=', 'value' => 'y'],
    ]],
];
check(vis('dep', $mapB2, $inB2) === false, "'all' with one hidden controller -> hidden");

/* (B3) 'any' satisfied by a visible controller => shown even though another ctrl is hidden */
$mapB3 = [
    'gate' => ['status' => true, 'type' => 'any', 'conditions' => [['field' => 'toggle', 'operator' => '=', 'value' => 'on']]],
    'dep'  => ['status' => true, 'type' => 'any', 'conditions' => [
        ['field' => 'visibleCtrl', 'operator' => '=', 'value' => 'x'],
        ['field' => 'gate', 'operator' => '=', 'value' => 'z'],
    ]],
];
check(vis('dep', $mapB3, $inB2) === true, "'any' satisfied by a visible controller -> shown");

echo "\n  " . $r['pass'] . " passed, " . $r['fail'] . " failed\n";
exit($r['fail'] > 0 ? 1 : 0);

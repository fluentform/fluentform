<?php
/**
 * Regression test (ticket #159913): the backend honors a coupon only when the
 * coupon field is visible for the submitted answers — by its own conditional
 * logic and by every ancestor container's. Guards against a crafted POST
 * applying a discount for a hidden coupon field.
 *
 * The methods touch only ArrayHelper and ConditionAssesor (no WordPress), so we
 * build PaymentAction without its constructor and set the private $data/$form.
 *
 * Run: php dev/tests/test_coupon_field_condition_pass.php
 */

namespace FluentForm\Dev\Tests\CouponFieldConditionPass;

use ReflectionClass;
use FluentForm\App\Modules\Payments\Classes\PaymentAction;

error_reporting(E_ALL & ~E_DEPRECATED);

if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__);
}

// PSR-4 autoload resolves PaymentAction, ConditionAssesor, Str, Helper and the
// framework Support classes. The Compat ArrayHelper lives outside the PSR-4
// path, so require it explicitly.
require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../../app/Compat/ArrayHelper.php';

$results = ['pass' => 0, 'fail' => 0];

function assertSame($expected, $actual, $label)
{
    global $results;
    if ($expected === $actual) {
        $results['pass']++;
        echo "  PASS  $label\n";
    } else {
        $results['fail']++;
        echo "  FAIL  $label — expected " . var_export($expected, true) . ", got " . var_export($actual, true) . "\n";
    }
}

/**
 * Build a PaymentAction with the given submission data, bypassing the
 * constructor (which runs the full setup pipeline).
 */
function makeActionWithData(array $data)
{
    $rc = new ReflectionClass(PaymentAction::class);
    $action = $rc->newInstanceWithoutConstructor();
    $prop = $rc->getProperty('data');
    $prop->setAccessible(true);
    $prop->setValue($action, $data);
    return $action;
}

/**
 * Set the private $form (a stdClass carrying the form_fields JSON) so the
 * ancestor-container walk in isCouponFieldVisible() has a form tree to read.
 */
function setForm($action, array $formFields)
{
    $rc = new ReflectionClass(PaymentAction::class);
    $prop = $rc->getProperty('form');
    $prop->setAccessible(true);
    $prop->setValue($action, (object) ['form_fields' => json_encode($formFields)]);
}

// A coupon field shown only for selected products (its own conditional logic).
$conditionalCouponField = [
    'element'    => 'payment_coupon',
    'attributes' => ['name' => 'payment-coupon'],
    'settings'   => [
        'conditional_logics' => [
            'type'       => 'any',
            'status'     => true,
            'conditions' => [
                ['field' => 'clinic_type', 'operator' => '=', 'value' => 'Football (Ages 8-12)'],
                ['field' => 'clinic_type', 'operator' => '=', 'value' => 'Boys Basketball - Elite Clinic'],
            ],
        ],
    ],
];

echo "Coupon field WITH its own conditional logic (shown for Football 8-12 / Basketball Elite):\n";

assertSame(true, makeActionWithData(['clinic_type' => 'Boys Basketball - Elite Clinic'])->isFieldConditionPass($conditionalCouponField), 'eligible product -> coupon honored');
assertSame(true, makeActionWithData(['clinic_type' => 'Football (Ages 8-12)'])->isFieldConditionPass($conditionalCouponField), 'other eligible product -> coupon honored');
assertSame(false, makeActionWithData(['clinic_type' => 'Volleyball'])->isFieldConditionPass($conditionalCouponField), 'ineligible product -> coupon ignored');
assertSame(false, makeActionWithData(['clinic_type' => 'Baseball'])->isFieldConditionPass($conditionalCouponField), 'another ineligible product -> coupon ignored');
assertSame(false, makeActionWithData([])->isFieldConditionPass($conditionalCouponField), 'no controlling answer -> coupon ignored');

echo "\nBackward compatibility — coupon field WITHOUT active conditional logic:\n";

$noConditionField = ['element' => 'payment_coupon', 'attributes' => ['name' => 'payment-coupon'], 'settings' => ['conditional_logics' => []]];
assertSame(true, makeActionWithData(['clinic_type' => 'Volleyball'])->isFieldConditionPass($noConditionField), 'no conditional logic -> always honored');

$disabledConditionField = ['element' => 'payment_coupon', 'attributes' => ['name' => 'payment-coupon'], 'settings' => ['conditional_logics' => [
    'type' => 'any', 'status' => false,
    'conditions' => [['field' => 'clinic_type', 'operator' => '=', 'value' => 'Football (Ages 8-12)']],
]]];
assertSame(true, makeActionWithData(['clinic_type' => 'Volleyball'])->isFieldConditionPass($disabledConditionField), 'conditional logic disabled -> always honored');

echo "\nMissing controlling field — must match the frontend (JS parity, treatMissingAsEmpty=false):\n";

// "Show coupon when promo_optin != ''" — the JS evaluator treats a missing
// field as not-equal-to-anything, so the coupon is visible client-side; the
// backend must agree, or a valid discount is dropped.
$shownWhenNotEmpty = ['element' => 'payment_coupon', 'attributes' => ['name' => 'payment-coupon'], 'settings' => ['conditional_logics' => [
    'type' => 'any', 'status' => true,
    'conditions' => [['field' => 'promo_optin', 'operator' => '!=', 'value' => '']],
]]];
assertSame(true, makeActionWithData([])->isFieldConditionPass($shownWhenNotEmpty), 'missing field with != "" -> visible (matches frontend)');
assertSame(true, makeActionWithData(['promo_optin' => 'yes'])->isFieldConditionPass($shownWhenNotEmpty), 'present non-empty field with != "" -> visible');

// A coupon field with NO conditional logic of its own, placed inside a
// Container shown only for membership = premium. Hiding the container must hide
// the coupon — the ancestor case a self-condition-only gate would miss.
$couponInContainer = ['element' => 'payment_coupon', 'attributes' => ['name' => 'payment-coupon'], 'settings' => ['conditional_logics' => []]];
$formWithConditionalContainer = [
    'fields' => [
        ['element' => 'select', 'attributes' => ['name' => 'membership']],
        [
            'element'    => 'container',
            'attributes' => ['name' => 'premium_block'],
            'settings'   => ['conditional_logics' => [
                'type' => 'any', 'status' => true,
                'conditions' => [['field' => 'membership', 'operator' => '=', 'value' => 'premium']],
            ]],
            'columns' => [
                ['fields' => [$couponInContainer]],
            ],
        ],
    ],
];

echo "\nCoupon field inside a conditional CONTAINER (own conditions empty):\n";

$a = makeActionWithData(['membership' => 'premium']);
setForm($a, $formWithConditionalContainer);
assertSame(true, $a->isCouponFieldVisible($couponInContainer), 'container visible -> coupon honored');

$a = makeActionWithData(['membership' => 'basic']);
setForm($a, $formWithConditionalContainer);
assertSame(false, $a->isCouponFieldVisible($couponInContainer), 'container hidden -> coupon ignored (ancestor gate)');

$a = makeActionWithData([]);
setForm($a, $formWithConditionalContainer);
assertSame(false, $a->isCouponFieldVisible($couponInContainer), 'no controlling answer -> container hidden -> coupon ignored');

echo "\nAncestor-container walk:\n";

$a = makeActionWithData([]);
$ancestors = $a->getFieldAncestorContainers($formWithConditionalContainer['fields'], 'payment-coupon');
assertSame('container', isset($ancestors[0]) ? $ancestors[0]['element'] : null, 'walk returns the container ancestor');
assertSame(null, $a->getFieldAncestorContainers($formWithConditionalContainer['fields'], 'does-not-exist'), 'walk returns null for a missing field');
assertSame([], $a->getFieldAncestorContainers([['element' => 'payment_coupon', 'attributes' => ['name' => 'payment-coupon']]], 'payment-coupon'), 'top-level coupon field has no ancestor containers');

echo "\n";
echo "Passed: {$results['pass']}, Failed: {$results['fail']}\n";
exit($results['fail'] === 0 ? 0 : 1);

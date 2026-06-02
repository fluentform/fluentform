<?php
/**
 * Regression test: free PaymentAction option matching must distinguish a
 * numeric-string option label from the option price.
 *
 * Bug: PaymentAction::getItemFromVariables() matched the submitted value with a
 * loose `==` against both the option label AND the price:
 *     if ($label == $key || $value == $key)   // last match wins
 * When every option is priced the same (e.g. 10) and a label is numerically
 * equal to that price ("010" == 10), the value clause is true for every option,
 * so the LAST option wins. Submitting label "010" charged a different item.
 * Non-numeric labels (s010) dodge it because "10" == "s010" is a string compare.
 *
 * getItemFromVariables() touches WordPress helpers, so this runs under a booted WP:
 *     wp eval-file wp-content/plugins/fluentform/dev/tests/test_payment_item_numeric_value_matching.php
 */

use FluentForm\App\Modules\Payments\Classes\PaymentAction;

$results = ['pass' => 0, 'fail' => 0];
$assert = function ($expected, $actual, $label) use (&$results) {
    if ($expected === $actual) { $results['pass']++; echo "  PASS  $label\n"; }
    else { $results['fail']++; echo "  FAIL  $label — expected " . var_export($expected, true) . ", got " . var_export($actual, true) . "\n"; }
};

// 20 options, numeric labels 001..020, every price (value) = 10 — the repro config.
$pricingOptions = [];
for ($i = 1; $i <= 20; $i++) {
    $pricingOptions[] = ['label' => sprintf('%03d', $i), 'value' => 10];
}
$paymentItem = [
    'element'    => 'multi_payment_component',
    'attributes' => ['name' => 'payment_input', 'type' => 'checkbox'],
    'settings'   => ['is_payment_field' => 'yes', 'pricing_options' => $pricingOptions],
];

echo "PaymentAction::getItemFromVariables (charged item):\n";
$ref = new ReflectionMethod(PaymentAction::class, 'getItemFromVariables');
$ref->setAccessible(true);
$action = (new ReflectionClass(PaymentAction::class))->newInstanceWithoutConstructor();
foreach (['001', '009', '010', '011', '020'] as $submitted) {
    $item = $ref->invoke($action, $paymentItem, $submitted);
    $resolved = is_array($item) ? $item['item_name'] : '(none)';
    $assert($submitted, $resolved, "submit '$submitted' charges item '$submitted'");
}

echo "\nPassed: {$results['pass']}, Failed: {$results['fail']}\n";

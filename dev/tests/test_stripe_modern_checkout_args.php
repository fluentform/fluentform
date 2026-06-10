<?php
/**
 * Slice 2 — modern hosted Checkout Session arg building.
 *
 * The modern Stripe Checkout API (current version) requires line_items in the
 * price_data shape and an explicit `mode`, unlike the legacy 2020-08-27 shape
 * ({amount, currency, name, quantity}). ModernCheckout converts the existing
 * (discount-distributed) legacy items to the modern shape and assembles the
 * one-time session args — pure, no network. Run:
 *   php dev/tests/test_stripe_modern_checkout_args.php
 */

error_reporting(E_ALL & ~E_DEPRECATED);

if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__);
}

if (!function_exists('apply_filters')) {
    function apply_filters($tag, $value)
    {
        return $value;
    }
}

$results = ['pass' => 0, 'fail' => 0];

function check($cond, $label)
{
    global $results;
    if ($cond) { $results['pass']++; echo "  PASS  $label\n"; }
    else { $results['fail']++; echo "  FAIL  $label\n"; }
}

require_once __DIR__ . '/../../app/Modules/Payments/PaymentMethods/Stripe/API/ModernCheckout.php';

use FluentForm\App\Modules\Payments\PaymentMethods\Stripe\API\ModernCheckout;

// --- 1. legacy -> modern line_items conversion ---
$legacy = [
    ['amount' => 933, 'currency' => 'usd', 'name' => 'Item A', 'quantity' => 2],
    ['amount' => 934, 'currency' => 'usd', 'name' => 'Item A', 'quantity' => 1],
];
$modern = ModernCheckout::toModernLineItems($legacy);

check(count($modern) === 2, 'two line items converted');
check(
    $modern[0] === [
        'price_data' => [
            'currency'     => 'usd',
            'unit_amount'  => 933,
            'product_data' => ['name' => 'Item A'],
        ],
        'quantity' => 2,
    ],
    'first item converted to price_data shape'
);
check($modern[1]['price_data']['unit_amount'] === 934, 'second item unit_amount preserved');
check($modern[1]['quantity'] === 1, 'second item quantity preserved');

// --- 2. one-time session args ---
$base = [
    'success_url'  => 'https://site.test/success',
    'cancel_url'   => 'https://site.test/cancel',
    'metadata'     => ['submission_id' => 7, 'form_id' => 3],
    'customer_email' => 'a@b.test',
    'payment_intent_data' => ['description' => 'My Form', 'metadata' => ['form_id' => 3]],
];
$args = ModernCheckout::buildOneTimeArgs($base, $modern);

check(($args['mode'] ?? null) === 'payment', 'mode is payment for one-time');
// Modern Checkout does NOT create a Customer for one-time payments by default,
// but the completion handler (handleSessionRedirectBack) requires session->customer.
// customer_creation=always preserves the legacy behaviour the recorder expects.
check(($args['customer_creation'] ?? null) === 'always', 'customer_creation=always for one-time');
check(($args['line_items'] ?? null) === $modern, 'line_items attached in modern shape');
check(($args['success_url'] ?? null) === 'https://site.test/success', 'success_url preserved');
check(($args['cancel_url'] ?? null) === 'https://site.test/cancel', 'cancel_url preserved');
check(($args['metadata']['submission_id'] ?? null) === 7, 'metadata preserved');
check(isset($args['payment_intent_data']['description']), 'payment_intent_data preserved');
// modern Checkout rejects the legacy top-level 'amount'/'name' keys — ensure none leaked
check(!isset($args['line_items'][0]['amount']), 'no legacy amount key leaked into line_items');

// --- 3. subscription args (hosted) ---
$rec = ModernCheckout::recurringLineItem(['currency' => 'usd', 'unit_amount' => 999, 'name' => 'Monthly Plan'], 'month', 1, 1);
check($rec['price_data']['recurring'] === ['interval' => 'month', 'interval_count' => 1], 'recurring line item carries interval');
check($rec['price_data']['unit_amount'] === 999, 'recurring unit_amount preserved');

$subArgs = ModernCheckout::buildSubscriptionArgs(
    ['success_url' => 'https://s.test/s', 'cancel_url' => 'https://s.test/c', 'payment_intent_data' => ['x' => 1]],
    [$rec],
    [['price_data' => ['currency' => 'usd', 'unit_amount' => 500, 'product_data' => ['name' => 'Signup']], 'quantity' => 1]],
    ['trial_period_days' => 7]
);
check(($subArgs['mode'] ?? null) === 'subscription', 'mode subscription');
check(count($subArgs['line_items']) === 2, 'recurring + signup line items merged');
check(!isset($subArgs['payment_intent_data']), 'payment_intent_data removed in subscription mode');
check(($subArgs['subscription_data']['trial_period_days'] ?? null) === 7, 'trial passed through');

// --- 4. Payment Intent args (modern inline / Payment Element) ---
$piArgs = ModernCheckout::buildPaymentIntentArgs(
    ['metadata' => ['form_id' => 9], 'description' => 'Order'],
    1500,
    'usd'
);
check(($piArgs['amount'] ?? null) === 1500, 'payment intent amount');
check(($piArgs['currency'] ?? null) === 'usd', 'payment intent currency');
check(!isset($piArgs['automatic_payment_methods']), 'no automatic_payment_methods (would allow ACH)');
check(!isset($piArgs['payment_method_types']), 'method selection left to caller (PMC or fallback)');
check(($piArgs['metadata']['form_id'] ?? null) === 9, 'payment intent metadata preserved');
check(ModernCheckout::inlinePaymentMethodTypes() === ['card'], 'fallback method types = card only (no link/bank)');

echo "\nPassed: {$results['pass']}, Failed: {$results['fail']}\n";
exit($results['fail'] === 0 ? 0 : 1);

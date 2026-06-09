<?php
/**
 * Modern inline subscription arg building (review #1009 fixes 2 & 3).
 *
 * The raw Subscriptions API (used by the inline Payment Element path) needs a
 * product id on every price_data and carries one-time charges via
 * add_invoice_items — unlike the hosted Checkout Session which accepts inline
 * product_data and merges one-time items as line_items. These pure helpers map
 * the shared modernSubscriptionComponents() output to that raw shape, and derive
 * a stable per-account product cache key so a product is created once, not per
 * checkout. Pure, no network. Run:
 *   php dev/tests/test_stripe_modern_inline_subscription.php
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

// A recurring item as produced by modernSubscriptionComponents()/recurringLineItem().
$recurring = [
    'price_data' => [
        'currency'     => 'usd',
        'unit_amount'  => 999,
        'product_data' => ['name' => 'Monthly Plan'],
        'recurring'    => ['interval' => 'month', 'interval_count' => 1],
    ],
    'quantity' => 2,
];

// A one-time item (signup fee / one-time order item) — inline product_data, no product id yet.
$oneTime = [
    'price_data' => [
        'currency'     => 'usd',
        'unit_amount'  => 500,
        'product_data' => ['name' => 'Signup fee for Monthly Plan'],
    ],
    'quantity' => 1,
];

// --- 1. recurring item -> raw Subscriptions API item (product id injected) ---
$item = ModernCheckout::inlineSubscriptionItem($recurring, 'prod_REC');
check(($item['price_data']['product'] ?? null) === 'prod_REC', 'recurring item carries resolved product id');
check(!isset($item['price_data']['product_data']), 'inline product_data dropped (raw API rejects it)');
check(($item['price_data']['recurring'] ?? null) === ['interval' => 'month', 'interval_count' => 1], 'recurring interval preserved');
check(($item['price_data']['unit_amount'] ?? null) === 999, 'recurring unit_amount preserved');
check(($item['price_data']['currency'] ?? null) === 'usd', 'recurring currency preserved');
check(($item['quantity'] ?? null) === 2, 'recurring quantity preserved');

// --- 2. one-time item -> add_invoice_items entry (fix #2: money integrity) ---
$inv = ModernCheckout::inlineAddInvoiceItem($oneTime, 'prod_SIGNUP');
check(($inv['price_data']['product'] ?? null) === 'prod_SIGNUP', 'add_invoice_item carries resolved product id');
check(($inv['price_data']['unit_amount'] ?? null) === 500, 'add_invoice_item unit_amount preserved');
check(($inv['price_data']['currency'] ?? null) === 'usd', 'add_invoice_item currency preserved');
check(!isset($inv['price_data']['recurring']), 'add_invoice_item is not recurring');
check(($inv['quantity'] ?? null) === 1, 'add_invoice_item quantity preserved');

// --- 3. product cache key (fix #3: reuse, do not create per checkout) ---
$k1 = ModernCheckout::productCacheKey('sk_test_abc', null, 'Monthly Plan');
$k2 = ModernCheckout::productCacheKey('sk_test_abc', null, 'Monthly Plan');
check($k1 === $k2, 'cache key is deterministic for the same plan/secret/account');
check(strpos($k1, 'ff_stripe_modern_product_') === 0, 'cache key is namespaced');

$kDiffName = ModernCheckout::productCacheKey('sk_test_abc', null, 'Yearly Plan');
check($k1 !== $kDiffName, 'cache key varies by product name');

$kConnected = ModernCheckout::productCacheKey('sk_test_abc', 'acct_123', 'Monthly Plan');
check($k1 !== $kConnected, 'cache key varies by connected account (no cross-account reuse)');

$kOtherKey = ModernCheckout::productCacheKey('sk_test_xyz', null, 'Monthly Plan');
check($k1 !== $kOtherKey, 'cache key varies by secret key');

echo "\nPassed: {$results['pass']}, Failed: {$results['fail']}\n";
exit($results['fail'] === 0 ? 0 : 1);

<?php
/**
 * Slice 1 — connection_mode gate for the modern Stripe Checkout flow.
 *
 * StripeSettings::useModernCheckout() decides legacy vs modern, mirroring
 * PayPalSettings::useOrdersApi(). Contract:
 *   - Existing customers (option exists, no connection_mode key) default to LEGACY.
 *   - Fresh installs (no option yet) default to MODERN.
 *   - Modern requires connection_mode === 'modern' AND a secret key present for the active mode.
 *   - Filterable via fluentform/stripe_use_modern_checkout.
 *
 * Pure logic — stubs WP functions, no DB/WP boot. Run:
 *   php dev/tests/test_stripe_connection_mode_gate.php
 */

error_reporting(E_ALL & ~E_DEPRECATED);

if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__);
}
if (!defined('FLUENTFORM_FRAMEWORK_UPGRADE')) {
    define('FLUENTFORM_FRAMEWORK_UPGRADE', '2.0.0');
}

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

// ---- WordPress stubs ----
$GLOBALS['__ff_option_store'] = ['fluentform_payment_settings_stripe' => null];

if (!function_exists('get_option')) {
    function get_option($key, $default = false)
    {
        $v = $GLOBALS['__ff_option_store'][$key] ?? null;
        return $v === null ? $default : $v;
    }
    function wp_parse_args($args, $defaults)
    {
        return array_merge($defaults, is_array($args) ? $args : []);
    }
    function apply_filters($tag, $value)
    {
        return $value;
    }
}

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../../app/Modules/Payments/PaymentMethods/Stripe/StripeSettings.php';

use FluentForm\App\Modules\Payments\PaymentMethods\Stripe\StripeSettings;

function setOption($value)
{
    $GLOBALS['__ff_option_store']['fluentform_payment_settings_stripe'] = $value;
}

echo "Existing customer (option present, no connection_mode) -> LEGACY:\n";
setOption(['is_active' => 'yes', 'payment_mode' => 'test', 'test_secret_key' => 'sk_test_x', 'is_encrypted' => 'no']);
assertSame('legacy', StripeSettings::getSettings(false)['connection_mode'], 'existing default connection_mode is legacy');
assertSame(false, StripeSettings::useModernCheckout(), 'existing customer NOT on modern');

echo "\nFresh install (no option yet) -> MODERN default:\n";
setOption(null);
assertSame('modern', StripeSettings::getSettings(false)['connection_mode'], 'fresh default connection_mode is modern');

echo "\nModern + global API keys (provider=api_keys) -> gate FALSE (Connect required):\n";
setOption(['is_active' => 'yes', 'connection_mode' => 'modern', 'provider' => 'api_keys', 'payment_mode' => 'test', 'test_secret_key' => 'sk_test_x', 'is_encrypted' => 'no']);
assertSame(false, StripeSettings::useModernCheckout(), 'modern with raw api_keys is false (Connect only)');

echo "\nModern + Connect but NO connected account -> gate false:\n";
setOption(['is_active' => 'yes', 'connection_mode' => 'modern', 'provider' => 'connect', 'payment_mode' => 'test', 'test_account_id' => '', 'test_secret_key' => '', 'is_encrypted' => 'no']);
assertSame(false, StripeSettings::useModernCheckout(), 'modern connect without account is false');

echo "\nModern + Connect WITH connected account + token -> gate true:\n";
setOption(['is_active' => 'yes', 'connection_mode' => 'modern', 'provider' => 'connect', 'payment_mode' => 'test', 'test_account_id' => 'acct_123', 'test_secret_key' => 'sk_test_token', 'is_encrypted' => 'no']);
assertSame(true, StripeSettings::useModernCheckout(), 'modern connect with account is true');

echo "\nExplicit legacy with Connect -> gate false:\n";
setOption(['is_active' => 'yes', 'connection_mode' => 'legacy', 'provider' => 'connect', 'payment_mode' => 'test', 'test_account_id' => 'acct_123', 'test_secret_key' => 'sk_test_token', 'is_encrypted' => 'no']);
assertSame(false, StripeSettings::useModernCheckout(), 'explicit legacy is false');

echo "\n";
echo "Passed: {$results['pass']}, Failed: {$results['fail']}\n";
exit($results['fail'] === 0 ? 0 : 1);

<?php
/**
 * Regression test: {payment.*} receipt smartcodes must resolve when the receipt
 * is built from a WPFluent Model entry (the Resend Email Notification path),
 * not only from a stdClass DB row (the initial path).
 *
 * Same root cause as test_resend_submission_smartcode.php, different class:
 * PaymentReceipt::getSubmissionValue() used property_exists($this->entry, $prop).
 * On resend, PaymentHandler::paymentReceiptView() builds the receipt from
 * ShortCodeParser::getEntry(), which returns the Submission Model the resend
 * handler set — so property_exists() is false and {payment.payment_status} /
 * {payment.payment_method} silently resolve to ''. The fix routes the column
 * lookup through Helper::getEntryColumns().
 *
 * getSubmissionValue() is public and the payment_status / non-'test'
 * payment_method branches touch no WordPress functions, so we can call the real
 * method without booting WP (ABSPATH is stubbed so the guard at the top of the
 * class file does not exit).
 *
 * Run: php dev/tests/test_payment_receipt_submission_value.php
 */

namespace FluentForm\Dev\Tests\PaymentReceiptValue;

error_reporting(E_ALL & ~E_DEPRECATED);

if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__);
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

require_once __DIR__ . '/../../app/Helpers/Traits/GlobalDefaultMessages.php';
require_once __DIR__ . '/../../app/Helpers/Helper.php';
require_once __DIR__ . '/../../app/Modules/Payments/Classes/PaymentReceipt.php';

use FluentForm\App\Modules\Payments\Classes\PaymentReceipt;

/**
 * Minimal stand-in for a WPFluent Orm Model: columns live in an internal bag,
 * exposed only via __get()/getAttributes() — exactly like the framework Model.
 */
class FakeModelEntry
{
    private $attributes = [];

    public function __construct(array $attributes)
    {
        $this->attributes = $attributes;
    }

    public function __get($key)
    {
        return isset($this->attributes[$key]) ? $this->attributes[$key] : null;
    }

    public function __isset($key)
    {
        return isset($this->attributes[$key]);
    }

    public function getAttributes()
    {
        return $this->attributes;
    }
}

$columns = [
    'id'             => 41,
    'payment_status' => 'paid',
    'payment_method' => 'stripe',
];

echo "stdClass entry (initial / direct receipt path):\n";
$std = new PaymentReceipt((object) $columns);
assertSame('Paid', $std->getSubmissionValue('payment_status'), '{payment.payment_status} resolves');
assertSame('Stripe', $std->getSubmissionValue('payment_method'), '{payment.payment_method} resolves');

echo "\nModel entry (resend email notification path):\n";
$model = new PaymentReceipt(new FakeModelEntry($columns));
assertSame('Paid', $model->getSubmissionValue('payment_status'), '{payment.payment_status} resolves');
assertSame('Stripe', $model->getSubmissionValue('payment_method'), '{payment.payment_method} resolves');

echo "\n";
echo "Passed: {$results['pass']}, Failed: {$results['fail']}\n";
exit($results['fail'] === 0 ? 0 : 1);

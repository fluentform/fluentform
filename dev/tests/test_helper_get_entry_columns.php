<?php
/**
 * Unit test for Helper::getEntryColumns() — the shared entry-shape normalizer
 * used by ShortCodeParser::getSubmissionData() and PaymentReceipt::getSubmissionValue().
 *
 * It must return the column => value map for both a stdClass DB row (columns are
 * real properties) and a WPFluent Model (columns live in an internal attribute
 * bag reached via getAttributes()), including null-valued columns, and degrade
 * safely for array / null input.
 *
 * Run: php dev/tests/test_helper_get_entry_columns.php
 */

namespace FluentForm\Dev\Tests\HelperEntryColumns;

error_reporting(E_ALL & ~E_DEPRECATED);

if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__);
}

require_once __DIR__ . '/../../app/Helpers/Traits/GlobalDefaultMessages.php';
require_once __DIR__ . '/../../app/Helpers/Helper.php';

use FluentForm\App\Helpers\Helper;

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

    public function getAttributes()
    {
        return $this->attributes;
    }
}

$cols = ['id' => 41, 'serial_number' => 1024, 'payment_total' => null];

assertSame($cols, Helper::getEntryColumns((object) $cols), 'stdClass row → columns (keeps null col)');
assertSame($cols, Helper::getEntryColumns(new FakeModelEntry($cols)), 'Model → getAttributes() (keeps null col)');
assertSame(['a' => 1], Helper::getEntryColumns(['a' => 1]), 'array → itself');
assertSame([], Helper::getEntryColumns(null), 'null → empty array');

echo "\nPassed: {$results['pass']}, Failed: {$results['fail']}\n";
exit($results['fail'] === 0 ? 0 : 1);

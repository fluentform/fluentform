<?php
/**
 * Regression test: {submission.*} smartcodes must resolve when the entry is
 * passed to ShortCodeParser as a WPFluent Model object (the Resend Email
 * Notification path), not only as a stdClass / integer id (the initial path).
 *
 * Why standalone: the repo has no bootstrapped WP PHPUnit suite yet, mirroring
 * dev/tests/test_pretty_url_bool_cast.php. The 'serial_number' / 'id' branch of
 * ShortCodeParser::getSubmissionData() touches no WordPress functions, so we can
 * invoke the REAL protected method via reflection without booting WP.
 *
 * Bug: getSubmissionData() used property_exists($entry, $key). A stdClass DB row
 * (initial notification, where an int id is passed and getEntry() loads a row)
 * exposes columns as real properties, so property_exists() is true. But the
 * Resend handler now passes a Submission Model whose columns live in an internal
 * $attributes bag reached via __get(), so property_exists() is false and every
 * {submission.<column>} smartcode silently resolves to ''. The fix routes the
 * column lookup through Helper::getEntryColumns().
 *
 * Regression point: fluentformpro 79c5981c ("Security: Fix Security issues")
 * switched resendEntryEmail() from a stdClass row to a Submission Model.
 *
 * Run: php dev/tests/test_resend_submission_smartcode.php
 */

namespace FluentForm\Dev\Tests\ResendSmartcode;

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
require_once __DIR__ . '/../../app/Services/FormBuilder/ShortCodeParser.php';

use FluentForm\App\Services\FormBuilder\ShortCodeParser;

/**
 * Minimal stand-in for a WPFluent Orm Model: columns are NOT real object
 * properties; they are stored in an internal bag and exposed only through
 * __get()/__isset()/getAttributes(), exactly like the framework Model.
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

/**
 * Invoke the real protected ShortCodeParser::getSubmissionData() with a given
 * entry object set as the parser's current entry.
 */
function resolveSubmissionSmartcode($entry, $key)
{
    $ref = new \ReflectionClass(ShortCodeParser::class);

    $entryProp = $ref->getProperty('entry');
    $entryProp->setAccessible(true);
    $entryProp->setValue(null, $entry);

    $method = $ref->getMethod('getSubmissionData');
    $method->setAccessible(true);

    return $method->invoke(null, $key);
}

$columns = [
    'id'            => 41,
    'form_id'       => 441,
    'serial_number' => 1024,
    'status'        => 'read',
];

echo "stdClass entry (initial notification path):\n";
$stdEntry = (object) $columns;
assertSame('1024', (string) resolveSubmissionSmartcode($stdEntry, 'serial_number'), '{submission.serial_number} resolves');
assertSame('41', (string) resolveSubmissionSmartcode($stdEntry, 'id'), '{submission.id} resolves');

echo "\nModel entry (resend email notification path):\n";
$modelEntry = new FakeModelEntry($columns);
assertSame('1024', (string) resolveSubmissionSmartcode($modelEntry, 'serial_number'), '{submission.serial_number} resolves');
assertSame('41', (string) resolveSubmissionSmartcode($modelEntry, 'id'), '{submission.id} resolves');
assertSame('read', (string) resolveSubmissionSmartcode($modelEntry, 'status'), '{submission.status} resolves');

echo "\n";
echo "Passed: {$results['pass']}, Failed: {$results['fail']}\n";
exit($results['fail'] === 0 ? 0 : 1);

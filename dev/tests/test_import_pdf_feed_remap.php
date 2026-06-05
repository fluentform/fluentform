<?php
/**
 * Regression test: importing a form must remap notification PDF-feed references.
 *
 * Why standalone: the repo has no bootstrapped WP PHPUnit suite (vendor/bin/phpunit
 * is broken), mirroring dev/tests/test_pretty_url_bool_cast.php. The remap helper
 * TransferService::remapNotificationPdfFeeds() is pure (json_decode + wp_json_encode),
 * so it is exercised directly with a wp_json_encode() shim and no WordPress boot.
 *
 * Bug: PDF feeds are stored as `_pdf_feeds` form_meta rows; email notifications
 * attach the PDF by referencing that row's auto-increment id in pdf_attachments.
 * On export the feed IS shipped, but TransferService::importForms() re-inserts the
 * feed under a NEW id while leaving the notification's pdf_attachments pointing at
 * the OLD id, so the imported form's email silently stops attaching the PDF. Form
 * duplication already remaps this (Duplicator.php / Form.php); import is the lone
 * path that diverged.
 *
 * Fix: TransferService::remapNotificationPdfFeeds($notificationValue, $pdfFeedMap)
 * rewrites pdf_attachments through an oldFeedId => newFeedId map (dropping ids that
 * were not imported); importForms() builds the map two-pass and calls it.
 *
 * Run: php dev/tests/test_import_pdf_feed_remap.php
 */

error_reporting(E_ALL & ~E_DEPRECATED);

if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__);
}

// Minimal WP shim used by the pure helper.
if (!function_exists('wp_json_encode')) {
    function wp_json_encode($data, $options = 0, $depth = 512)
    {
        return json_encode($data, $options, $depth);
    }
}

require_once __DIR__ . '/../../app/Services/Transfer/TransferService.php';

use FluentForm\App\Services\Transfer\TransferService;

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

function attachmentsOf($json)
{
    $decoded = json_decode($json, true);
    return isset($decoded['pdf_attachments']) ? $decoded['pdf_attachments'] : null;
}

// 1) Happy path: a mapped feed id is rewritten to its new id (string-preserving).
$notif = json_encode(['name' => 'Admin', 'sendTo' => ['type' => 'email'], 'pdf_attachments' => ['3084']]);
$out = TransferService::remapNotificationPdfFeeds($notif, [3084 => 10458]);
assertSame(['10458'], attachmentsOf($out), 'single mapped attachment -> new id');

// 2) Multiple attachments, all mapped.
$notif = json_encode(['pdf_attachments' => ['3084', '3085']]);
$out = TransferService::remapNotificationPdfFeeds($notif, [3084 => 10458, 3085 => 10459]);
assertSame(['10458', '10459'], attachmentsOf($out), 'multiple mapped attachments -> new ids');

// 3) Failure mode: an attachment whose feed was not imported is dropped (it would
//    otherwise point to an unrelated form's meta row on the target site).
$notif = json_encode(['pdf_attachments' => ['3084', '999']]);
$out = TransferService::remapNotificationPdfFeeds($notif, [3084 => 10458]);
assertSame(['10458'], attachmentsOf($out), 'unmapped attachment is dropped');

// 4) Notification without pdf_attachments is returned unchanged.
$notif = json_encode(['name' => 'No PDF', 'subject' => 'Hi']);
$out = TransferService::remapNotificationPdfFeeds($notif, [3084 => 10458]);
assertSame($notif, $out, 'no pdf_attachments -> unchanged');

// 5) Empty attachments array stays empty.
$notif = json_encode(['pdf_attachments' => []]);
$out = TransferService::remapNotificationPdfFeeds($notif, [3084 => 10458]);
assertSame([], attachmentsOf($out), 'empty attachments stays empty');

// 6) Empty map drops stale ids — a kept id would resolve to an unrelated
//    form's meta row on the target site.
$notif = json_encode(['pdf_attachments' => ['3084']]);
$out = TransferService::remapNotificationPdfFeeds($notif, []);
assertSame([], attachmentsOf($out), 'empty map -> stale attachments dropped');

// 7) Numeric-string vs int key parity (export ids may be ints, attachments strings).
$notif = json_encode(['pdf_attachments' => ['3084']]);
$out = TransferService::remapNotificationPdfFeeds($notif, [3084 => 10458]);
assertSame(['10458'], attachmentsOf($out), 'string attachment matches int map key');

echo "\n";
echo "Passed: {$results['pass']}, Failed: {$results['fail']}\n";
exit($results['fail'] === 0 ? 0 : 1);

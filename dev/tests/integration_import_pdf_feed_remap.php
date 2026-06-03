<?php
/**
 * Integration round-trip: export a form, import it through the REAL
 * TransferService::importForms(), and assert the imported notification's
 * pdf_attachments points at the imported feed's NEW row id (not the stale
 * source id).
 *
 * Booted via WordPress so the real DB + models run:
 *   wp --path=/Volumes/Projects/forms eval-file \
 *     wp-content/plugins/fluentform/dev/tests/integration_import_pdf_feed_remap.php
 *
 * Self-contained: it creates a throwaway source form with one `_pdf_feeds` row
 * and one notification linked to it, runs export -> import, asserts, then deletes
 * both the source and imported forms. Fails before the fix (stale id), passes after.
 */

use FluentForm\App\Models\Form;
use FluentForm\App\Models\FormMeta;
use FluentForm\App\Services\Transfer\TransferService;
use FluentForm\Framework\Http\Request\File;

$pass = 0;
$fail = 0;
$report = function ($ok, $label) use (&$pass, &$fail) {
    if ($ok) {
        $pass++;
        echo "  PASS  $label\n";
    } else {
        $fail++;
        echo "  FAIL  $label\n";
    }
};

// --- Arrange: a throwaway source form with a pdf feed + a linked notification ---
$srcFormId = Form::insertGetId([
    'title'       => 'PDF REMAP SRC',
    'form_fields' => json_encode(['fields' => []]),
    'status'      => 'published',
    'type'        => 'form',
    'created_by'  => 1,
]);

$feedId = FormMeta::insertGetId([
    'form_id'  => $srcFormId,
    'meta_key' => '_pdf_feeds',
    'value'    => wp_json_encode(['name' => 'General', 'template_key' => 'general', 'settings' => []]),
]);

FormMeta::insertGetId([
    'form_id'  => $srcFormId,
    'meta_key' => 'notifications',
    'value'    => wp_json_encode([
        'name'            => 'Admin Notification',
        'sendTo'          => ['type' => 'email', 'email' => 'a@b.com'],
        'subject'         => 'New entry',
        'pdf_attachments' => [(string) $feedId],
    ]),
]);

echo "Source form $srcFormId: feed id $feedId, notification pdf_attachments=[\"$feedId\"]\n";

// --- Act: export exactly like TransferService::exportForms(), then import for real ---
$result = Form::with(['formMeta'])->whereIn('id', [$srcFormId])->get();
$forms = [];
foreach ($result as $item) {
    $form = json_decode($item);
    $form->metas = array_values(array_filter($form->form_meta, function ($m) {
        return $m->meta_key !== '_total_views';
    }));
    $form->form_fields = json_decode($form->form_fields);
    $forms[] = $form;
}
$json = json_encode(array_values($forms));

$tmp = tempnam(sys_get_temp_dir(), 'ffexp') . '.json';
file_put_contents($tmp, $json);
$file = new File($tmp, 'export.json', 'application/json');

$importResult = TransferService::importForms($file);
$newFormId = array_key_first($importResult['inserted_forms']);

// --- Assert ---
$newFeed = FormMeta::where('form_id', $newFormId)->where('meta_key', '_pdf_feeds')->first();
$newNotif = FormMeta::where('form_id', $newFormId)->where('meta_key', 'notifications')->first();
$newFeedId = $newFeed ? (int) $newFeed->id : 0;
$att = $newNotif ? (json_decode($newNotif->value, true)['pdf_attachments'] ?? []) : [];

echo "Imported form $newFormId: new feed id $newFeedId, notification pdf_attachments=" . json_encode($att) . "\n";

$report($newFeed && $newNotif, 'imported feed + notification exist');
$report($newFeedId !== $feedId, 'imported feed got a fresh id (not the source id)');
$report(count($att) === 1 && (int) $att[0] === $newFeedId, 'notification pdf_attachments points to the NEW feed id');

// --- Cleanup ---
Form::where('id', $srcFormId)->delete();
FormMeta::where('form_id', $srcFormId)->delete();
Form::where('id', $newFormId)->delete();
FormMeta::where('form_id', $newFormId)->delete();
@unlink($tmp);
echo "cleaned up forms $srcFormId, $newFormId\n";

echo "\nPassed: $pass, Failed: $fail\n";

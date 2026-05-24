<?php
/**
 * Integration test: exercise the actual save → read round-trip through
 * SettingsService → FormPrettyUrlService → FormMeta.
 *
 * Mirrors what the Vue page does: sends pretty_url.enabled as the *string* 'false'
 * (jQuery's form-urlencoded serialization of JS boolean false).
 *
 * Run via WP-CLI on the local dev site:
 *   wp --path=/Volumes/Projects/forms eval-file \
 *     wp-content/plugins/fluentform/dev/tests/integration_pretty_url_save.php
 */

use FluentForm\App\Models\Form;
use FluentForm\App\Models\FormMeta;
use FluentForm\App\Services\Settings\SettingsService;

if (!class_exists(SettingsService::class)) {
    fwrite(STDERR, "FluentForm not loaded\n");
    exit(2);
}

if (!class_exists('\FluentFormPro\classes\SharePage\FormPrettyUrlService')) {
    fwrite(STDERR, "FluentFormPro pretty URL service not available — skipping\n");
    exit(2);
}

$form = Form::where('type', 'form')->orderBy('id', 'asc')->first();
if (!$form) {
    fwrite(STDERR, "No form available for test\n");
    exit(2);
}
$formId = (int) $form->id;
echo "Using form_id={$formId}\n";

function check($label, $expected, $actual) {
    if ($expected === $actual) {
        echo "  PASS  $label\n";
        return true;
    }
    echo "  FAIL  $label — expected " . var_export($expected, true) . ", got " . var_export($actual, true) . "\n";
    return false;
}

$service = new SettingsService();
$proService = '\FluentFormPro\classes\SharePage\FormPrettyUrlService';
$ok = true;

// Round-trip ON
$service->storeConversationalDesign([
    'pretty_url' => ['slug' => 'pretty-url-regression', 'enabled' => 'true'],
], $formId);
$ok = check('enabled=true persisted', true, $proService::isEnabled($formId)) && $ok;

// Round-trip OFF using string 'false' (jQuery serialization) — the regression case
$service->storeConversationalDesign([
    'pretty_url' => ['slug' => 'pretty-url-regression', 'enabled' => 'false'],
], $formId);
$ok = check("enabled=string 'false' persisted as OFF", false, $proService::isEnabled($formId)) && $ok;

// Round-trip OFF using bool false (defensive)
$service->storeConversationalDesign([
    'pretty_url' => ['slug' => 'pretty-url-regression', 'enabled' => false],
], $formId);
$ok = check('enabled=bool false persisted as OFF', false, $proService::isEnabled($formId)) && $ok;

// Round-trip ON using string 'true'
$service->storeConversationalDesign([
    'pretty_url' => ['slug' => 'pretty-url-regression', 'enabled' => 'true'],
], $formId);
$ok = check("enabled=string 'true' persisted as ON", true, $proService::isEnabled($formId)) && $ok;

// Cleanup
$service->storeConversationalDesign([
    'pretty_url' => ['slug' => '', 'enabled' => 'false'],
], $formId);
FormMeta::where('form_id', $formId)
    ->where('meta_key', '_form_slug')
    ->where('value', 'pretty-url-regression')
    ->delete();

echo "\nResult: " . ($ok ? "ALL PASS" : "FAILURES") . "\n";
exit($ok ? 0 : 1);

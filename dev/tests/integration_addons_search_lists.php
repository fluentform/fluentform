<?php
/**
 * Integration test for the free-side integration lists:
 *  - AddOnModule::getPremiumAddOns() must advertise every integration pro ships
 *    (Pipedrive, amoCRM, OnePageCRM, Insightly, Mailster were missing) with a
 *    resolvable logo asset.
 *  - GlobalSearchService::get() must link every Configure Integration page
 *    (Notion, Airtable v2, Constant Contact V3, OpenAI were missing), contain
 *    no duplicate links, and carry no title typos (rCaptcha, Constatant).
 *
 * Run: wp --path=/Volumes/Projects/forms eval-file dev/tests/integration_addons_search_lists.php
 */

$GLOBALS['ff_lists_pass'] = 0;
$GLOBALS['ff_lists_fail'] = 0;

if (!function_exists('ff_lists_check')) {
    function ff_lists_check($condition, $label)
    {
        if ($condition) {
            $GLOBALS['ff_lists_pass']++;
            echo "  PASS  $label\n";
        } else {
            $GLOBALS['ff_lists_fail']++;
            echo "  FAIL  $label\n";
        }
    }
}

// --- AddOnModule::getPremiumAddOns() ---
$addOns = (new \FluentForm\App\Modules\AddOnModule())->getPremiumAddOns();

$expectedAddOns = [
    'pipedrive'  => 'Pipedrive',
    'amocrm'     => 'amoCRM',
    'onepagecrm' => 'OnePageCRM',
    'insightly'  => 'Insightly',
    'mailster'   => 'Mailster',
];

foreach ($expectedAddOns as $key => $title) {
    ff_lists_check(isset($addOns[$key]), "premium addon '$key' exists");
    if (!isset($addOns[$key])) {
        continue;
    }
    $addOn = $addOns[$key];
    ff_lists_check($addOn['title'] === $title, "addon '$key' title is '$title'");
    ff_lists_check(!empty($addOn['description']), "addon '$key' has description");
    ff_lists_check(!empty($addOn['purchase_url']), "addon '$key' has purchase_url");
    ff_lists_check('crm' === $addOn['category'], "addon '$key' category is crm");
}

// every advertised logo must resolve to a real compiled asset
foreach ($addOns as $key => $addOn) {
    $relative = parse_url($addOn['logo'], PHP_URL_PATH);
    $marker = '/fluentform/assets/';
    $pos = strpos($relative, $marker);
    $file = false;
    if (false !== $pos) {
        $file = FLUENTFORM_DIR_PATH . 'assets/' . substr($relative, $pos + strlen($marker));
    }
    ff_lists_check($file && file_exists($file), "addon '$key' logo asset exists (" . basename((string) $relative) . ")");
}

// --- GlobalSearchService::get() ---
$links = (new \FluentForm\App\Services\GlobalSearchService())->get()['links'];
$paths = array_column($links, 'path');
$titles = array_column($links, 'title');

$expectedAnchors = [
    '#general-notion-settings'              => 'Notion',
    '#general-airtable_v2-settings'         => 'Airtable v2',
    '#general-constatantcontactv3-settings' => 'Constant Contact V3',
    '#general-openai-settings'              => 'OpenAI',
];

foreach ($expectedAnchors as $anchor => $label) {
    $found = false;
    foreach ($paths as $path) {
        if (false !== strpos($path, $anchor)) {
            $found = true;
            break;
        }
    }
    ff_lists_check($found, "search links include $label ($anchor)");
}

// the legacy typo'd hash must remain (pro integrationKey carries the typo)
$legacyHashFound = false;
foreach ($paths as $path) {
    if (false !== strpos($path, '#general-constatantcontact-settings')) {
        $legacyHashFound = true;
        break;
    }
}
ff_lists_check($legacyHashFound, 'legacy constatantcontact hash unchanged');

// no duplicate title+path pairs (MooSend was listed twice)
$pairs = [];
foreach ($links as $link) {
    $pairs[] = $link['title'] . '|' . $link['path'];
}
$dupes = array_diff_assoc($pairs, array_unique($pairs));
ff_lists_check(0 === count($dupes), 'no duplicate links (found: ' . implode(', ', array_unique($dupes)) . ')');

// display-title typos fixed
$typoTitles = array_filter($titles, function ($title) {
    return false !== strpos($title, 'rCaptcha') || false !== strpos($title, 'Constatant');
});
ff_lists_check(0 === count($typoTitles), 'no typo titles (found: ' . implode(', ', $typoTitles) . ')');

echo "\nRESULT: {$GLOBALS['ff_lists_pass']} passed, {$GLOBALS['ff_lists_fail']} failed — " . ($GLOBALS['ff_lists_fail'] ? 'RED' : 'ALL GREEN') . "\n";

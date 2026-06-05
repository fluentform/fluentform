<?php
/**
 * Regression test: editor asset enqueue must not fatal for a deleted form id.
 *
 * Bug: Menu::enqueueEditorAssets() does find($formId) with no null guard.
 * For a deleted/nonexistent form_id the method reads and then ASSIGNS
 * $form->form_fields on null (Menu.php:985). On PHP 8+ property assignment
 * on null is a fatal Error, white-screening the whole admin page before the
 * graceful "No form found" body (renderFormInnerPages) can render.
 *
 * Run: wp --path=/Volumes/Projects/forms eval-file dev/tests/test_editor_deleted_form_no_fatal.php
 */

use FluentForm\App\Modules\Registerer\Menu;

$GLOBALS['ff_editor_pass'] = 0;
$GLOBALS['ff_editor_fail'] = 0;

if (!function_exists('ff_editor_check')) {
    function ff_editor_check($condition, $label)
    {
        if ($condition) {
            $GLOBALS['ff_editor_pass']++;
            echo "  PASS  $label\n";
        } else {
            $GLOBALS['ff_editor_fail']++;
            echo "  FAIL  $label\n";
        }
    }
}

// A form id that is guaranteed not to exist
$missingId = (int) wpFluent()->table('fluentform_forms')->max('id') + 999999;

wpFluentForm('request')->set('form_id', $missingId);

$menu = new Menu(wpFluentForm());

$method = new \ReflectionMethod(Menu::class, 'enqueueEditorAssets');
$method->setAccessible(true);

// On PHP 8+ assigning a property on null throws Error; on PHP 7.4 it emits
// "Creating default object from empty value". The guard must prevent both.
$nullAssignWarnings = [];
set_error_handler(function ($errno, $errstr) use (&$nullAssignWarnings) {
    if (false !== strpos($errstr, 'Creating default object from empty value')
        || false !== strpos($errstr, 'property of non-object')
        || false !== strpos($errstr, 'property on null')
    ) {
        $nullAssignWarnings[] = $errstr;
    }
    return true;
});

$thrown = null;
try {
    $method->invoke($menu);
} catch (\Throwable $e) {
    $thrown = $e;
}

restore_error_handler();

ff_editor_check(
    null === $thrown,
    'enqueueEditorAssets() with deleted form id does not throw'
    . ($thrown ? ' — got: ' . get_class($thrown) . ': ' . $thrown->getMessage() : '')
);

ff_editor_check(
    [] === $nullAssignWarnings,
    'enqueueEditorAssets() with deleted form id does not touch properties on null'
    . ($nullAssignWarnings ? ' — got: ' . implode(' | ', array_unique($nullAssignWarnings)) : '')
);

// Happy path: a real form id must still enqueue without throwing
$realForm = wpFluent()->table('fluentform_forms')->orderBy('id', 'DESC')->first();
if ($realForm) {
    wpFluentForm('request')->set('form_id', $realForm->id);

    $thrown = null;
    try {
        $method->invoke(new Menu(wpFluentForm()));
    } catch (\Throwable $e) {
        $thrown = $e;
    }

    ff_editor_check(
        null === $thrown,
        'enqueueEditorAssets() with existing form id still works'
        . ($thrown ? ' — got: ' . get_class($thrown) . ': ' . $thrown->getMessage() : '')
    );
} else {
    echo "  SKIP  no existing form available for happy-path check\n";
}

echo "\nEditor deleted-form guard: {$GLOBALS['ff_editor_pass']} passed, {$GLOBALS['ff_editor_fail']} failed\n";
if ($GLOBALS['ff_editor_fail'] > 0) {
    exit(1);
}

# FluentForm 6.2.0 — Breaking Changes for Third-Party Plugins

This document covers all breaking changes in FluentForm 6.2.0 that may affect third-party plugins or custom code integrating with FluentForm.

---

## 1. `->get()` Returns Collection Instead of Array

Starting from FluentForm **6.2.0**, the `->get()` method returns a **Collection** object instead of a plain PHP array:

```php
// Both of these now return a Collection, not an array
$forms = Form::where('status', 'published')->get();
$forms = wpFluent()->table('fluentform_forms')->get();
```

The **items inside** are unchanged — you still access properties with `$item->name` (arrow syntax). Only the outer wrapper changed.

### Quick Fix

Add `->all()` after `->get()` to get a plain array back:

```php
$forms = Form::where('status', 'published')->get()->all();
```

> **`->all()` vs `->toArray()`**: Use `->all()` — it returns an array but keeps each item as an object (`$item->name`). `->toArray()` converts each item into an associative array too (`$item['name']`), which will break your existing property access.

### What Still Works (No Changes Needed)

```php
$forms = Form::where('status', 'published')->get();

foreach ($forms as $form) { echo $form->title; }   // looping
if (count($forms) > 0) { ... }                      // counting
$first = $forms[0];                                  // index access
if (isset($forms[0])) { ... }                       // isset check
echo json_encode($forms);                            // JSON encoding
```

### What Breaks

#### PHP array functions — Fatal Error

```php
$forms = Form::get();

// ALL of these will FATAL — Collection is not an array:
array_map(fn($f) => $f->id, $forms);
array_filter($forms, fn($f) => $f->status === 'active');
array_merge($forms, $otherArray);
array_column($forms, 'id');
array_keys($forms);
array_values($forms);
array_slice($forms, 0, 5);
in_array($item, $forms);
array_pop($forms);
reset($forms);
```

**Fix — convert to array first:**
```php
$forms = Form::get()->all();
array_map(fn($f) => $f->id, $forms);  // works
```

**Or use Collection methods:**
```php
$forms = Form::get();
$ids    = $forms->map(fn($f) => $f->id)->all();            // replaces array_map
$active = $forms->filter(fn($f) => $f->status === 'active'); // replaces array_filter
$first  = $forms->first();                                   // replaces reset()
$last   = $forms->last();                                    // replaces end()
$sliced = $forms->take(5);                                   // replaces array_slice
$exists = $forms->contains($item);                           // replaces in_array
```

#### Empty checks — Silent Bug (No Error, Wrong Behavior)

A Collection is always "truthy" in PHP, even with zero items:

```php
$forms = Form::where('id', -1)->get(); // empty result

// BROKEN — these conditions no longer work as expected:
if (!$forms) { ... }           // always false
if (empty($forms)) { ... }    // always false
if ($forms) { ... }            // always true
```

**Fix — use `count()`:**
```php
if (!count($forms)) { return; }   // empty check
if (count($forms)) { ... }        // not-empty check
```

#### Type checks and type hints

```php
// BROKEN
if (is_array($forms)) { ... }           // returns false now
function processItems(array $items) {}   // TypeError

// Fix
if (is_array($forms) || $forms instanceof \Traversable) { ... }
processItems($forms->all());
```

---

## 2. Removed Classes — Entries & EntryQuery

The following classes were removed from `app/Modules/Entries/` and replaced with **deprecated stubs** that log warnings:

| Removed Class | Stub Kept? | Deprecation Warning |
|---------------|-----------|---------------------|
| `FluentForm\App\Modules\Entries\Entries` | Yes | `_deprecated_function()` in constructor |
| `FluentForm\App\Modules\Entries\EntryQuery` | Yes | `_deprecated_function()` in constructor |
| `FluentForm\App\Modules\Entries\Report` | No | N/A |
| `FluentForm\App\Modules\Entries\Export` | Yes (wrapper) | N/A |

### If your plugin uses `Entries` or `EntryQuery`

These stubs still work but will show deprecation notices in `debug.log` when `WP_DEBUG` is enabled:

```
Function FluentForm\App\Modules\Entries\EntryQuery is deprecated since version 6.2.0!
Use FluentForm\App\Models\Submission model or wpFluent() queries instead.
```

**Current code (still works, but deprecated):**
```php
$entries = wpFluentForm('FluentForm\App\Modules\Entries\Entries')->_getEntries(
    $formId, $page, $perPage, $orderBy, $status, null, $wheres
);
```

**Recommended replacement:**
```php
use FluentForm\App\Models\Submission;

$query = (new Submission)->customQuery([
    'form_id'    => $formId,
    'sort_by'    => $orderBy,
    'entry_type' => $status,
    'search'     => $search,
]);
$submissions = $query->get();
```

### If your plugin uses `Report`

No stub exists. Use `FluentForm\App\Services\Report\ReportHelper` instead.

### Stubs will be removed in version 7.0

Known affected plugins:
- **Ninja Tables** — `FluentFormProvider.php` uses `_getEntries()`
- **x-plugin-run-one-master** — 4 locations across 3 files

---

## 3. Renamed Namespaces — Database Migrations

The `app/Databases/` directory was moved to `database/` with new namespaces:

| Old (still works via alias) | New |
|-----------------------------|-----|
| `FluentForm\App\Databases\Migrations\FormSubmissions` | `FluentForm\Database\Migrations\Submissions` |
| `FluentForm\App\Databases\Migrations\SubmissionDetails` | `FluentForm\Database\Migrations\SubmissionDetails` |

Backward-compat aliases exist in `app/Compat/` with `_deprecated_function()` warnings. Old imports still work but will log deprecation notices. Will be removed in 7.0.

---

## 4. Renamed Namespaces — Framework Request Classes

These have backward-compat aliases in `app/Compat/`:

| Old (still works via alias) | New |
|-----------------------------|-----|
| `FluentForm\Framework\Request\Request` | `FluentForm\Framework\Http\Request\Request` |
| `FluentForm\Framework\Request\File` | `FluentForm\Framework\Http\Request\File` |

No action needed — the aliases handle this automatically. Will be removed in a future version.

---

## 5. ArrayHelper Namespace Change

`FluentForm\Framework\Helpers\ArrayHelper` has been moved to `FluentForm\Framework\Support\Arr`.

A backward-compat alias exists in `app/Compat/ArrayHelper.php` — old imports still work. Update when convenient:

```php
// Before (still works via alias)
use FluentForm\Framework\Helpers\ArrayHelper;

// After
use FluentForm\Framework\Support\Arr;
```

---

## 6. Renamed Hooks — Underscore/Hyphen to Slash Format (Since 5.0)

> **Note:** This change was introduced in **FluentForm 5.0**, not 6.2.0. Listed here because the deprecated hooks will be **removed in 7.0**.

All FluentForm hooks were renamed from underscore/hyphen format to slash format:

```
fluentform_hook_name    →    fluentform/hook_name
fluentform-hook-name    →    fluentform/hook_name
```

450+ hooks affected (137 actions + 316 filters). Old names still fire via `do_action_deprecated()` and `apply_filters_deprecated()`.

```php
// Before (deprecated — will be removed in 7.0)
add_action('fluentform_loaded', function($app) { ... });
add_filter('fluentform_editor_shortcodes', function($shortcodes) { ... });

// After
add_action('fluentform/loaded', function($app) { ... });
add_filter('fluentform/editor_shortcodes', function($shortcodes) { ... });
```

**Action required:** Update hook names before 7.0. Enable `WP_DEBUG` to see which hooks need updating.

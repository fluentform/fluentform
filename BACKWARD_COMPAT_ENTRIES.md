# Backward-Compatible Stubs: Entries & EntryQuery

**Date:** 2026-02-25
**Context:** Production crash — `ReflectionException: Class "FluentForm\App\Modules\Entries\Entries" does not exist`
**Root Cause:** Commit `567e39d2` deleted `Entries.php`, `EntryQuery.php`, `Report.php`, `Export.php` from `app/Modules/Entries/`. A deprecated wrapper was created for `Export` but not for `Entries` or `EntryQuery`. Third-party plugins (Ninja Tables, x-plugin-run-one-master) resolve `Entries` via the service container and crash.

---

## Affected Third-Party Code

```php
// ninja-tables/app/Modules/DataProviders/FluentFormProvider.php (lines 169, 249)
$entries = wpFluentForm('FluentForm\App\Modules\Entries\Entries')->_getEntries(
    intval($formId), $page, $perPage, $orderBy, $status, null, $wheres
);

// x-plugin-run-one-master (4 locations across 3 files)
$entries = wpFluentForm('FluentForm\App\Modules\Entries\Entries')->_getEntries(...);
```

All callers use `_getEntries()` which returns `['submissions' => [...], 'formLabels' => [...]]`.

---

## Solution: Minimal Backward-Compatible Stubs

We restored the two deleted files as **minimal stubs** with identical public API. The stubs contain the full original query logic (not delegating to the new `Submission::customQuery()`) because the delegation approach would require the same amount of code for pagination format conversion, wheres loop, and filter transformation — no real savings.

### `EntryQuery.php` — 113 lines (original was 212)

Kept: constructor, 12 properties, `getResponses()` with full filter/sort/paginate/search logic.
Removed: `getResponse()`, `getNextResponse()`, `getPrevResponse()`, `getNextPrevEntryQuery()`, `groupCount()` — none used by third-party plugins.
Added: `_deprecated_function()` in constructor for debug log warnings.

```php
<?php
namespace FluentForm\App\Modules\Entries;
use FluentForm\App\Helpers\Helper;

class EntryQuery
{
    protected $request;
    protected $formModel;
    protected $responseModel;
    protected $formId = false;
    protected $per_page = 10;
    protected $page_number = 1;
    protected $status = false;
    protected $is_favourite = null;
    protected $sort_by = 'ASC';
    protected $search = false;
    protected $wheres = [];
    protected $startDate;
    protected $endDate;

    public function __construct()
    {
        _deprecated_function(__CLASS__, '6.2.0', 'FluentForm\App\Services\Submission\SubmissionService');
        $this->request = wpFluentForm('request');
        $this->formModel = wpFluent()->table('fluentform_forms');
        $this->responseModel = wpFluent()->table('fluentform_submissions');
    }

    public function getResponses()
    {
        // Full query logic identical to original — pagination, status/favourite,
        // date range, search, custom wheres, count + get + apply_filters
        // Returns: ['data' => [...], 'paginate' => ['total', 'per_page', 'current_page', 'last_page']]
    }
}
```

### `Entries.php` — 72 lines (original was 874)

Kept: `_getEntries()` and `getFormInputsAndLabels()` — the only 2 methods third-party plugins call.
Removed: all 10 other methods (moved to SubmissionService, EntryViewRenderer, ReportHelper, REST controllers, Ajax.php).

```php
<?php
namespace FluentForm\App\Modules\Entries;
use FluentForm\App\Modules\Form\FormDataParser;
use FluentForm\App\Modules\Form\FormFieldsParser;

class Entries extends EntryQuery
{
    public function _getEntries($formId, $currentPage, $perPage, $sortBy, $entryType, $search, $wheres = [])
    {
        // Sets query params on parent, calls getResponses(), parses entries
        // Returns: ['submissions' => ['data' => [...], 'paginate' => [...]], 'formLabels' => [...]]
    }

    public function getFormInputsAndLabels($form, $with = ['admin_label', 'raw'])
    {
        // Returns: ['inputs' => [...], 'labels' => [...]]
    }
}
```

---

## Why Not Delegate to Submission::customQuery()?

Considered and rejected. The new `Submission::customQuery()` (Eloquent model) returns a different format that would need:
- Manual pagination array construction (customQuery returns raw query, paginateEntries returns different keys)
- Manual wheres loop (customQuery doesn't support the `[column, operator, value]` array format)
- Format transformation to match the old return structure

Net result: roughly the same amount of code as keeping the original logic. Keeping the original is also safer — zero risk of behavioral differences.

---

## What Changed vs Original

| Aspect | Original | Stub |
|--------|----------|------|
| `EntryQuery` lines | 212 | 113 |
| `Entries` lines | 874 | 72 |
| `_getEntries()` signature | `($formId, $currentPage, $perPage, $sortBy, $entryType, $search, $wheres = [])` | Identical |
| `_getEntries()` return | `['submissions' => [...], 'formLabels' => [...]]` | Identical |
| `getResponses()` query logic | Full filter/sort/paginate/search | Identical |
| `getResponses()` return | `['data' => [...], 'paginate' => [...]]` | Identical |
| Deprecation notice | None | `_deprecated_function()` in constructor |
| `$responseMetaModel` property | Set in constructor | Removed — not used by `_getEntries()` |
| Other 10 methods | Present | Removed — handled elsewhere |

---

## Where the Other 10 Methods Went

| Old Method | New Location | How It Changed |
|------------|-------------|----------------|
| `renderEntries()` | `EntryViewRenderer::renderEntries()` | Identical copy |
| `changeEntryStatus()` | `Ajax.php` → `SubmissionService::updateStatus()` | Same logic, permission upgraded to `manage_entries` |
| `changeEntryUser()` | `Ajax.php` → `SubmissionService::updateSubmissionUser()` | Same logic, try/catch error handling |
| `updateEntryDiffs()` | `SubmissionService::updateEntryDiffs()` | Same logic, same signature |
| `getUsers()` | `Ajax.php` (inlined) | Identical, too small for its own method |
| `getAllFormEntries()` | REST API via `SubmissionController` | New REST-based approach |
| `getEntriesReport()` | `ReportHelper` via REST | Moved to service |
| `getEntries()` | REST API via `SubmissionController` | Wrapper around `_getEntries()` + extra filters |
| `getEntry()` / `_getEntry()` | REST API via `SubmissionController` | New REST-based approach |
| `getNotes()` / `addNote()` | `SubmissionService::getNotes()` via REST | Moved to service |
| `getEntriesGroup()` | REST API | Already had REST equivalent |
| `getAvailableForms()` | Not needed — only used internally by deleted methods | Removed |

---

## How PSR-4 Autoloading Resolves This

```json
// composer.json
"autoload": {
    "psr-4": {
        "FluentForm\\App\\": "app/"
    }
}
```

`FluentForm\App\Modules\Entries\Entries` → `app/Modules/Entries/Entries.php`
`FluentForm\App\Modules\Entries\EntryQuery` → `app/Modules/Entries/EntryQuery.php`

No classmap or container binding changes needed. PSR-4 mapping automatically resolves both classes.

---

## Removal Plan

These stubs should be removed in the next **major** version (7.0). Before removal:

1. Release Ninja Tables update replacing `wpFluentForm('...Entries')` with direct `wpFluent()` queries or REST API calls
2. Notify x-plugin-run-one-master maintainers to update their integration
3. Monitor `_deprecated_function()` warnings in debug logs for any other callers
4. Add a version check in the stubs: if Free version >= 7.0, don't load

---

## Other Broken Namespace References Found (Same Root Cause)

The `app/Databases/` directory was moved to `database/` and the namespace changed from `FluentForm\App\Databases\*` to `FluentForm\Database\*`. Two files still reference the old namespace:

### 1. `fluentformpro/src/Payments/AjaxEndpoints.php:9` — WILL CRASH

```php
// BROKEN — class and namespace both wrong
use FluentForm\App\Databases\Migrations\FormSubmissions;
// line 76: FormSubmissions::migrate(true);

// SHOULD BE
use FluentForm\Database\Migrations\Submissions;
// line 76: Submissions::migrate(true);
```

- **Impact:** Fatal error when `upgradeDB()` runs (called during payment module activation/upgrade)
- **Old class:** `FluentForm\App\Databases\Migrations\FormSubmissions` (deleted)
- **New class:** `FluentForm\Database\Migrations\Submissions` (in `database/Migrations/Submissions.php`, loaded via classmap)

### 2. `fluentform/app/Modules/Form/FormHandler.php:5` — WILL CRASH

```php
// BROKEN — namespace wrong
use FluentForm\App\Databases\Migrations\SubmissionDetails;
// line 179: SubmissionDetails::migrate();

// SHOULD BE
use FluentForm\Database\Migrations\SubmissionDetails;
```

- **Impact:** Fatal error when `SubmissionDetails::migrate()` is called (during form submission handling for new installs/upgrades)
- **Old namespace:** `FluentForm\App\Databases\Migrations` (directory deleted)
- **New namespace:** `FluentForm\Database\Migrations` (in `database/Migrations/SubmissionDetails.php`, loaded via classmap)

### 3. `Report.php` — Deleted, No Stub (Low Risk)

- Old class: `FluentForm\App\Modules\Entries\Report`
- Deleted in same commit `567e39d2` along with Entries/EntryQuery
- No references found in fluentformpro or other known third-party plugins
- Functionality moved to `ReportHelper` service
- **Risk:** Low — only a concern if unknown third-party plugins reference it directly

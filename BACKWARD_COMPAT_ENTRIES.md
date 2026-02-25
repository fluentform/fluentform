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

## What Was Deleted (Old Code)

### `EntryQuery.php` (212 lines) — Base query class

The old class set up DB table references and built paginated, filtered queries against `fluentform_submissions`:

```php
class EntryQuery
{
    protected $request;
    protected $formModel;      // wpFluent()->table('fluentform_forms')
    protected $responseModel;  // wpFluent()->table('fluentform_submissions')

    // Query parameters set by _getEntries() before calling getResponses()
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
        $this->request = wpFluentForm('request');
        $this->formModel = wpFluent()->table('fluentform_forms');
        $this->responseModel = wpFluent()->table('fluentform_submissions');
    }

    public function getResponses()
    {
        $query = $this->responseModel
            ->where('form_id', $this->formId)
            ->orderBy('id', Helper::sanitizeOrderValue($this->sort_by));

        // Pagination
        if ($this->per_page > 0)    $query->limit($this->per_page);
        if ($this->page_number > 0) $query->offset(($this->page_number - 1) * $this->per_page);

        // Status / favourite filter
        if ($this->is_favourite) {
            $query->where('is_favourite', $this->is_favourite);
            $query->where('status', '!=', 'trashed');
        } else {
            if (!$this->status) $query->where('status', '!=', 'trashed');
            else                $query->where('status', $this->status);
        }

        // Date range
        if ($this->startDate && $this->endDate) {
            $query->where('created_at', '>=', $this->startDate);
            $query->where('created_at', '<=', $this->endDate . ' 23:59:59');
        }

        // Search across id, response, status, created_at
        if ($this->search) {
            $s = $this->search;
            $query->where(function ($q) use ($s) {
                $q->where('id', 'LIKE', "%{$s}%")
                  ->orWhere('response', 'LIKE', "%{$s}%")
                  ->orWhere('status', 'LIKE', "%{$s}%")
                  ->orWhere('created_at', 'LIKE', "%{$s}%");
            });
        }

        // Custom WHERE clauses (used by Ninja Tables for user_id filtering)
        if ($this->wheres) {
            foreach ($this->wheres as $where) {
                // supports: ['column', 'value'] or ['column', 'operator', 'value']
                // if value is array, uses whereIn()
            }
        }

        $total = $query->count();
        $responses = $query->get();
        $responses = apply_filters('fluentform/get_raw_responses', $responses, $this->formId);

        return [
            'data'     => $responses,
            'paginate' => [
                'total'        => $total,
                'per_page'     => $this->per_page,
                'current_page' => $this->page_number,
                'last_page'    => ceil($total / $this->per_page),
            ],
        ];
    }

    // Also had: getResponse(), getNextResponse(), getPrevResponse(),
    // getNextPrevEntryQuery(), groupCount() — none used by third-party plugins
}
```

### `Entries.php` (874 lines) — God class with 12 methods

Only `_getEntries()` and `getFormInputsAndLabels()` are needed by third-party plugins:

```php
class Entries extends EntryQuery
{
    public function _getEntries($formId, $currentPage, $perPage, $sortBy, $entryType, $search, $wheres = [])
    {
        // 1. Set query parameters on parent EntryQuery properties
        $this->formId = $formId;
        $this->per_page = $perPage;
        $this->sort_by = $sortBy;
        $this->page_number = $currentPage;
        $this->search = $search;
        $this->wheres = $wheres;

        // 2. Map entryType to status/favourite filter
        if ('favorite' == $entryType)              $this->is_favourite = true;
        elseif ('all' != $entryType && $entryType) $this->status = $entryType;

        // 3. Optional date range from request
        $dateRange = $this->request->get('date_range');
        if ($dateRange) {
            $this->startDate = $dateRange[0];
            $this->endDate = $dateRange[1];
        }

        // 4. Load form, get field labels
        $form = $this->formModel->find($formId);
        $formMeta = $this->getFormInputsAndLabels($form);
        $formLabels = apply_filters('fluentform/entry_lists_labels', $formMeta['labels'], $form);

        // 5. Execute query via parent's getResponses()
        $submissions = $this->getResponses();

        // 6. Parse raw DB rows into structured entry objects
        $submissions['data'] = FormDataParser::parseFormEntries($submissions['data'], $form);

        return compact('submissions', 'formLabels');
    }

    public function getFormInputsAndLabels($form, $with = ['admin_label', 'raw'])
    {
        $formInputs = FormFieldsParser::getEntryInputs($form, $with);
        $inputLabels = FormFieldsParser::getAdminLabels($form, $formInputs);
        return ['inputs' => $formInputs, 'labels' => $inputLabels];
    }

    // Other 10 methods (not needed by third parties):
    // getAllFormEntries(), getEntriesReport(), renderEntries(), getEntriesGroup(),
    // getEntries(), _getEntry(), getEntry(), getNotes(), addNote(),
    // changeEntryStatus(), updateEntryDiffs(), getUsers(), changeEntryUser(),
    // getAvailableForms()
}
```

---

## What We Restored (New Stub Code)

### `EntryQuery.php` — Minimal stub (113 lines vs original 212)

Kept only what `_getEntries()` needs: constructor, properties, `getResponses()`.

Removed methods not called by any third-party plugin: `getResponse()`, `getNextResponse()`, `getPrevResponse()`, `getNextPrevEntryQuery()`, `groupCount()`.

Added `_deprecated_function()` in constructor so debug logs show migration warnings.

```php
class EntryQuery
{
    // Same 12 properties as original
    // Same constructor — adds _deprecated_function(__CLASS__, '6.2.0', 'SubmissionService')
    // Same getResponses() — identical query logic, identical return format
}
```

### `Entries.php` — Minimal stub (72 lines vs original 874)

Kept only the 2 methods third-party plugins call: `_getEntries()`, `getFormInputsAndLabels()`.

Removed all 10 other methods — they were either moved to `SubmissionService`, `EntryViewRenderer`, `ReportHelper`, REST controllers, or inlined in `Ajax.php`.

```php
class Entries extends EntryQuery
{
    // Same _getEntries() — identical signature, identical return format
    // Same getFormInputsAndLabels() — identical
    // Deprecation notice inherited from parent constructor
}
```

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
| `apply_filters_deprecated()` calls | Yes (old + new hook names) | Removed — only fires new hook names |
| `$responseMetaModel` property | Set in constructor | Removed — not used by `_getEntries()` |
| Other 10 methods | Present | Removed — handled elsewhere |

---

## Where the Other 10 Methods Went

| Old Method | New Location | How It Changed |
|------------|-------------|----------------|
| `renderEntries()` | `EntryViewRenderer::renderEntries()` | Identical copy |
| `changeEntryStatus()` | `Ajax.php` line 297 → `SubmissionService::updateStatus()` | Same logic, permission upgraded to `manage_entries` |
| `changeEntryUser()` | `Ajax.php` line 217 → `SubmissionService::updateSubmissionUser()` | Same logic, try/catch error handling |
| `updateEntryDiffs()` | `SubmissionService::updateEntryDiffs()` | Same logic, same signature |
| `getUsers()` | `Ajax.php` line 229 (inlined) | Identical, too small for its own method |
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

No classmap or container binding changes needed. The PSR-4 mapping automatically resolves both classes. When Ninja Tables calls `wpFluentForm('FluentForm\App\Modules\Entries\Entries')`, the container auto-resolves it via the autoloader, finds the file, instantiates the class, and `_getEntries()` works.

---

## Removal Plan

These stubs should be removed in the next **major** version (7.0). Before removal:

1. Release Ninja Tables update replacing `wpFluentForm('...Entries')` with direct `wpFluent()` queries or REST API calls
2. Notify x-plugin-run-one-master maintainers to update their integration
3. Monitor `_deprecated_function()` warnings in debug logs for any other callers
4. Add a version check in the stubs: if Free version >= 7.0, don't load

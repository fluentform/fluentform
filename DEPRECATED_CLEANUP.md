# Deprecated Class Removal & Temp Cleanup Cron

## Deleted Files

### `app/Modules/Entries/Entries.php` (~875 lines)
- **Why:** Marked `@deprecated` in favor of `SubmissionController` and `SubmissionService`. 8 of 11 AJAX handlers calling this class started with `dd()` (undefined, would crash if invoked) — confirmed dead code replaced by the REST API.
- **Where migrated:**
  - `renderEntries()` → new `app/Modules/Entries/EntryViewRenderer.php` (the only non-data method with no service equivalent)
  - `updateEntryDiffs()` → `SubmissionService::updateEntryDiffs()`
  - `changeEntryStatus()` → rewired in `Ajax.php` to `SubmissionService::updateStatus()`
  - `changeEntryUser()` → rewired in `Ajax.php` to `SubmissionService::updateSubmissionUser()`
  - `getUsers()` → inlined in `Ajax.php` as a `get_users()` call
  - All other methods (`getAllFormEntries`, `getEntriesReport`, `getEntriesGroup`, `getEntries`, `getEntry`, `getNotes`, `addNote`) — dead code behind `dd()`, already replaced by REST endpoints in `SubmissionController`

### `app/Modules/Entries/EntryQuery.php` (~213 lines)
- **Why:** Base class for `Entries.php`. No other class extends it. Deleted along with its only consumer.

### `app/Modules/Entries/Report.php` (~353 lines)
- **Why:** Marked `@deprecated` in favor of `ReportHelper::generateReport()`. The single AJAX handler (`fluentform-form-report`) started with `dd()` — dead code. The REST API serves reports via `ReportHelper` directly.

### `app/Modules/Entries/Export.php` (~277 lines)
- **Why:** Marked `@deprecated` in favor of `TransferService`. Its only remaining consumer was `StepFormEntries` in Pro, which passed `'fluentform_draft_submissions'` as the table name.
- **Where migrated:** `TransferService::getSubmissions()` now accepts an optional `table` key in `$args`. When provided, it queries that table directly with basic `form_id`/`search`/`sort_by` filters instead of going through the `Submission` model (which applies status/date/favorites/payment filters that don't apply to draft submissions). Pro's `StepFormEntries` now calls `TransferService::exportEntries()` with `['table' => 'fluentform_draft_submissions']` merged into the request args.
- **Bonus fix:** `TransferService::exportEntries()` now null-guards the `fields_to_export` filter loop, preventing a PHP 8+ `in_array()` type error when the arg is absent (as it is for draft exports).

---

## New Methods & Files

### `app/Modules/Entries/EntryViewRenderer.php` (new file)
- **What:** Contains `renderEntries($form_id)` — renders the admin entries page.
- **Why:** This was the only method in `Entries.php` that had no service-layer equivalent. It's a view/UI concern (enqueues scripts, localizes data, renders template), not data logic.
- **How:** Extracted verbatim from `Entries::renderEntries()`. Referenced in `app/Hooks/actions.php` line 90.

### `SubmissionService::updateEntryDiffs($entryId, $formId, $formData)`
- **What:** Deletes existing `fluentform_entry_details` rows for changed fields, then bulk-inserts new ones.
- **Why:** `EntryEditor.php` (Pro) called `Entries::updateEntryDiffs()` to record field-level diffs when an admin edits a submission. Needed a new home.
- **How:** Logic copied from `Entries::updateEntryDiffs()` using the `EntryDetails` model already imported by the service.

### `TransferService::getSubmissions()` — `table` arg support
- **What:** When `$args['table']` is set, queries that table directly with `form_id`, `search`, and `sort_by` filters instead of going through `Submission::customQuery()`.
- **Why:** `Submission::customQuery()` applies status/date/favorites/payment filters that only make sense for `fluentform_submissions`. Draft submissions (`fluentform_draft_submissions`) don't have those columns.
- **How:** A single `if ($tableName)` branch at the top of `getSubmissions()`. The rest of the method (entry ID filtering, advanced filters) still runs for both paths.

### `TransferService::exportEntries()` — `fields_to_export` null-guard
- **What:** The `fields_to_export` filter loop is now wrapped in `if (!empty($selectedLabels))`.
- **Why:** When `fields_to_export` is absent (as in draft exports), `$selectedLabels` is null, and `in_array($key, null)` throws a type error in PHP 8+. With the guard, all fields are exported when no selection is specified.

---

## Ajax.php Handler Changes

### Removed (9 dead handlers with `dd()`)
| AJAX Action | Was Calling |
|---|---|
| `fluentform_get_all_entries` | `Entries::getAllFormEntries()` |
| `fluentform_get_all_entries_report` | `Entries::getEntriesReport()` |
| `fluentform-form-entry-counts` | `Entries::getEntriesGroup()` |
| `fluentform-form-entries` | `Entries::getEntries()` |
| `fluentform-get-entry` | `Entries::getEntry()` |
| `fluentform-get-entry-notes` | `Entries::getNotes()` |
| `fluentform-add-entry-note` | `Entries::addNote()` |
| `fluentform-form-report` | `Report::getReport()` |
| (already no-usage) `fluentform-get-entry` | `Entries::getEntry()` |

### Rewired (3 live handlers)
| AJAX Action | Old Target | New Target |
|---|---|---|
| `fluentform-change-entry-status` | `Entries::changeEntryStatus()` | `SubmissionService::updateStatus()` |
| `fluentform-update-entry-user` | `Entries::changeEntryUser()` | `SubmissionService::updateSubmissionUser()` |
| `fluentform-get-users` | `Entries::getUsers()` | Inline `get_users()` call |

---

## Scheduler: Temp File Cleanup

**File:** `app/Services/Scheduler/Scheduler.php` — `cleanUpOldData()`

**What:** On the daily cron, cleans files in `wp-content/uploads/fluentform/temp/` older than 2 days (preserves `index.php`).

**Why:** Previously, temp files were only cleaned during entry deletion (`SubmissionService::deleteFiles()`). Orphaned temp files from abandoned uploads, failed submissions, or forms without deletions would accumulate indefinitely.

**How:** `glob()` + `filemtime()` check + `wp_delete_file()`. Guarded by `defined('FLUENTFORM_UPLOAD_DIR')` to avoid errors if the constant isn't set. The existing inline cleanup in `deleteFiles()` remains as-is (belt + suspenders).

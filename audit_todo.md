# FluentForm Plugin Audit Report

> **Version**: 6.1.17 | **Date**: 2026-02-23 | **Branch**: dev
>
> This audit covers Security, Optimization, and full Traceability from UI through REST/AJAX to Controllers, Services, Models, and Database.

---

## Table of Contents

- [1. Security Issues](#1-security-issues)
- [2. Optimization Issues](#2-optimization-issues)
- [3. Traceability Issues](#3-traceability-issues)
  - [3a. UI to REST/AJAX Layer](#3a-ui-to-restajax-layer)
  - [3b. Routes to Controllers/Policies](#3b-routes-to-controllerspolicies)
  - [3c. Controllers to Services](#3c-controllers-to-services)
  - [3d. Services/Models to Database](#3d-servicesmodels-to-database)

---

## 1. Security Issues

### CRITICAL

_(none found at critical level -- closest is HIGH)_

### HIGH

#### SEC-H1: Authorization Bypass in Subscription Cancellation (IDOR)
- **File**: `app/Modules/Payments/TransactionShortcodes.php:458`
- **Type**: Broken Access Control
- **Description**: The condition `if (!$submission && $submission->user_id != $userid || $this->canCancelSubscription($submission))` has inverted logic. The `&&` should be `||`, and `canCancelSubscription` check is inverted (blocks when TRUE, allows when FALSE).
- **Impact**: An authenticated user could cancel another user's subscription because ownership check is not enforced.
- **Fix**: Change to: `if (!$submission || $submission->user_id != $userid || !$this->canCancelSubscription($subscription))`

### MEDIUM

#### SEC-M1: Always-True Condition in Route Dispatch
- **File**: `app/Modules/Payments/TransactionShortcodes.php:163`
- **Type**: Logic Bug
- **Description**: `else if ('cancel_transaction')` is a bare string that always evaluates to `true`. Should be `else if ($route == 'cancel_transaction')`.
- **Impact**: Any AJAX request not matching `get_subscription_transactions` will execute subscription cancellation logic.
- **Fix**: Change to `else if ($route == 'cancel_transaction')`

#### SEC-M2: Arbitrary Form Meta Key Overwrite
- **File**: `app/Services/Submission/SubmissionService.php:349-356`
- **Type**: Privilege Escalation
- **Description**: `storeColumnSettings()` accepts any user-supplied `meta_key` (sanitized only with `sanitize_text_field`) and writes to `FormMeta::persist()`. This allows overwriting sensitive form meta like `formSettings`, `notifications`, or `_payment_settings`.
- **Fix**: Whitelist allowed meta keys (e.g., `_entry_columns`, `_entry_columns_order`).

#### SEC-M3: Arbitrary Plugin Activation Without Sanitization
- **File**: `app/Http/Controllers/SuggestedPluginsController.php:107-134`
- **Type**: Input Validation
- **Description**: `activatePlugin()` passes user-supplied `plugin_slug` directly to WordPress `activate_plugin()` without `sanitize_key()`. Compare with `installPlugin()` at line 71 which does sanitize.
- **Fix**: Add `sanitize_text_field()` and validate against allowed slugs.

#### SEC-M4: Weak CSS Sanitization Allows CSS Injection
- **File**: `boot/globals.php:473-485`
- **Type**: XSS via CSS Injection
- **Description**: `fluentformSanitizeCSS()` only checks for HTML tags via regex. Does NOT strip `expression()`, `url(javascript:)`, `@import`, or `behavior:` CSS attack vectors.
- **Fix**: Add CSS-specific sanitization for `expression()`, `url(javascript:)`, `behavior:`, `-moz-binding`, external `@import`.

### LOW

#### SEC-L1: Missing Nonce/Auth on `select_group_ajax_data`
- **File**: `app/Hooks/Ajax.php:382-386`
- **Type**: Missing CSRF Protection
- **Description**: No nonce verification or permission check on `wp_ajax_fluentform_select_group_ajax_data`.
- **Fix**: Add `Acl::verify('fluentform_dashboard_access')`.

#### SEC-L2: Unsanitized `sort_by` in Legacy Export
- **File**: `app/Modules/Entries/Export.php:224`
- **Type**: Potential SQL Injection (mitigated by framework)
- **Description**: `sort_by` request param passed directly to `orderBy()`. Framework sanitizes internally, but inconsistent with `Helper::sanitizeOrderValue()` used elsewhere.
- **Fix**: Use `Helper::sanitizeOrderValue()`.

#### SEC-L3: Weak JS Sanitization Regex
- **File**: `boot/globals.php:438-441`
- **Type**: Stored XSS (requires `unfiltered_html` capability)
- **Description**: `fluentform_kses_js()` strips `<script>` tags via regex but can miss edge cases.
- **Fix**: Ensure `unfiltered_html` capability check is robust; consider using `wp_strip_all_tags()`.

#### SEC-L4: String Interpolation in selectRaw
- **File**: `app/Services/Report/ReportHelper.php:939`
- **Type**: SQL Injection (low risk -- value from DB)
- **Description**: `$minDateRecord->min_date` interpolated directly into `selectRaw()`. Same code at line 866 correctly uses parameterized bindings.
- **Fix**: Use `->selectRaw("FLOOR(DATEDIFF(DATE(created_at), ?) / 3) as group_num", [$minDateRecord->min_date])`

#### SEC-L5: Unsanitized `$_REQUEST` in Receipt Shortcode
- **File**: `app/Modules/Payments/TransactionShortcodes.php:93-95`
- **Type**: Input Sanitization Missing
- **Description**: `$data = $_REQUEST` passed entirely without sanitization.
- **Fix**: Extract and sanitize only needed keys.

#### SEC-L6: Missing Nonce on Stripe SCA AJAX Endpoints
- **File**: `app/Modules/Payments/PaymentMethods/Stripe/StripeInlineProcessor.php:30-37`
- **Type**: Missing CSRF Protection
- **Description**: `confirmScaPayment` and `confirmScaSetupIntentsPayment` handlers registered for `wp_ajax_nopriv_` without nonce verification.
- **Fix**: Add nonce verification or submission-specific token.

---

## 2. Optimization Issues

### CRITICAL

#### OPT-C1: Bug -- Accessing `$user` Properties Before Null Check
- **File**: `app/Services/Submission/SubmissionService.php:93-99` and `:199-204`
- **Type**: Potential Fatal Error
- **Description**: Code accesses `$user->first_name` BEFORE checking `if ($user)`. If `get_user_by()` returns `false` (deleted user), this causes a fatal error. Duplicated in both `find()` and `findByParams()`.
- **Fix**: Move `if ($user)` check immediately after `get_user_by()`.

#### OPT-C2: Performance -- `isUniqueValidation()` Loads ALL Submissions Into Memory
- **File**: `app/Helpers/Helper.php:481-487`
- **Type**: Performance / Memory
- **Description**: For payment forms, loads EVERY submission via `Submission::where('form_id', $form->id)->get()->toArray()`, decodes each JSON response, iterates through all. Also has a logic bug: `$exist` is overwritten each iteration so only the last match counts.
- **Fix**: Use a DB query with `LIKE` or `JSON_EXTRACT`. Add `break` on match. Use chunking.

### HIGH

#### OPT-H1: `recordEntryDetails()` Inserts One Row At a Time
- **File**: `app/Services/Submission/SubmissionService.php:711-713`
- **Type**: Performance
- **Description**: `foreach ($entryItems as $entryItem) { EntryDetails::insert($entryItem); }` generates N individual INSERT queries. For forms with many fields, this is very slow.
- **Fix**: `EntryDetails::insert($entryItems);` (single bulk insert).

#### OPT-H2: `SubmissionController::remove()` Skips File Deletion
- **File**: `app/Http/Controllers/SubmissionController.php:135-150`
- **Type**: Bug
- **Description**: Calls `$submission::remove([$submissionId])` directly instead of `SubmissionService::deleteEntries()`, bypassing file cleanup. Uploaded files become orphaned on disk.
- **Fix**: Use `$submissionService->deleteEntries([$submissionId], $formId)`.

#### OPT-H3: `findShortCodePage()` Loads ALL Posts Into Memory
- **File**: `app/Services/Form/FormService.php:600-633`
- **Type**: Performance / Memory
- **Description**: `get_posts(['posts_per_page' => -1])` loads ALL posts of ALL public types, then iterates checking for shortcode IDs. Devastating on sites with thousands of posts.
- **Fix**: Use `$wpdb` with `WHERE post_content LIKE '%fluentform%'` to limit to relevant posts.

#### OPT-H4: Code Duplication -- `find()` and `findByParams()` (~80 lines identical)
- **File**: `app/Services/Submission/SubmissionService.php:51-122` and `:136-223`
- **Type**: Duplication
- **Description**: Nearly identical logic for auto-read, meta loading, form parsing, user loading, and filters.
- **Fix**: Extract shared logic into `enrichSubmission($submission)`.

#### OPT-H5: Deprecated `Entries` Class -- 880 Lines of Duplicate Code
- **File**: `app/Modules/Entries/Entries.php` (entire file)
- **Type**: Dead Code / Duplication
- **Description**: Marked `@deprecated` but still 880 lines duplicating `SubmissionService` and `SubmissionController`. Methods like `getEntries()`, `_getEntry()`, `getNotes()`, etc. are all duplicated.
- **Fix**: Create thin wrappers delegating to new services, or remove if no external callers.

### MEDIUM

#### OPT-M1: Identical Sanitization in `index()` and `all()` Same Controller
- **File**: `app/Http/Controllers/SubmissionController.php:12-50` and `:201-240`
- **Type**: Duplication
- **Description**: Exact same `$sanitizeMap`, `entry_type` mapping, `date_range` and `payment_statuses` sanitization.
- **Fix**: Extract into `sanitizeSubmissionAttributes($attributes)`.

#### OPT-M2: `shouldSkipCaptchaValidation()` Calls `get_option()` Repeatedly
- **File**: `app/Services/Form/FormValidationService.php:898-916`
- **Type**: Performance
- **Description**: Called 3 times (once per captcha type), each fetching `_fluentform_global_form_settings`. Same option fetched 25+ times across the class.
- **Fix**: Cache in a class property at construction.

#### OPT-M3: `deleteEntries()` Fires Individual Actions in Loop
- **File**: `app/Services/Submission/SubmissionService.php:415-437`
- **Type**: Performance
- **Description**: `do_action_deprecated` called per-ID in loops for both before/after hooks.
- **Fix**: Check if deprecated hooks have listeners; if not, remove loops.

#### OPT-M4: Deprecated `Report` Class Duplicates `ReportHelper`
- **File**: `app/Modules/Entries/Report.php` (352 lines)
- **Type**: Dead Code / Duplication
- **Fix**: Remove or make thin delegator.

#### OPT-M5: `deleteFiles()` Cleans Entire Temp Directory On Every Deletion
- **File**: `app/Services/Submission/SubmissionService.php:470-480`
- **Type**: Performance / Side Effect
- **Description**: Unconditionally empties the temp upload dir when ANY submission is deleted, affecting all forms/users. Race condition risk.
- **Fix**: Move temp cleanup to a cron job (clean files older than N hours).

#### OPT-M6: `getDisabledComponents()` is 200+ Lines of Repetitive Arrays
- **File**: `app/Services/Form/FormService.php:312-511`
- **Type**: Code Structure
- **Description**: 18+ identical array patterns repeated manually.
- **Fix**: Create config array and build in a loop.

#### OPT-M7: Duplicate `Export` Class + Redundant `require_once vendor/autoload.php`
- **File**: `app/Modules/Entries/Export.php:170` and `app/Services/Transfer/TransferService.php:304`
- **Type**: Duplication / Autoloading
- **Fix**: Remove deprecated Export class. Ensure autoload loads once at boot.

#### OPT-M8: Dead Code -- `findPreviousSubmission()`
- **File**: `app/Models/Submission.php:173-188`
- **Type**: Dead Code
- **Description**: Never called. Superseded by `findAdjacentSubmission()`.
- **Fix**: Remove.

### LOW

#### OPT-L1: Dead Code -- `User` Model Effectively Unused
- **File**: `app/Models/User.php`
- **Description**: Only referenced as a relationship but all code uses `get_user_by()` directly.
- **Fix**: Either use the ORM relationship or remove.

#### OPT-L2: Unused `use` Statements
- **File**: `app/Services/Form/FormService.php:10-13`
- **Description**: `ArrayHelper`, `File`, and `Application` imports never used.
- **Fix**: Remove.

#### OPT-L3: Commented-Out Code
- **Files**: `app/Services/Form/FormValidationService.php:824-828`, `app/Modules/Entries/Entries.php:762-766`
- **Fix**: Remove commented code.

#### OPT-L4: Timezone Inconsistency in `Submission::report()`
- **File**: `app/Models/Submission.php:339-401`
- **Description**: Mixes `date()` (server timezone) with `current_time('mysql')` (WP timezone).
- **Fix**: Use `current_time('mysql')` consistently.

---

## 3. Traceability Issues

### 3a. UI to REST/AJAX Layer

#### TRACE-UI-1: BROKEN Route Names -- SuggestedPlugins Install/Activate Buttons (CRITICAL)
- **File**: `resources/assets/admin/views/SuggestedPlugins.vue:154,179`
- **Type**: Broken Functionality
- **Description**: Calls `FluentFormsGlobal.$rest.route('suggested-plugins/install-plugin')` but Route.js defines the property as `suggestedPluginsInstallPlugin`. The `/` in the string means JavaScript property lookup fails. Both Install and Activate buttons are completely broken.
- **Fix**: Change to `route('suggestedPluginsInstallPlugin')` and `route('suggestedPluginsActivatePlugin')`.

#### TRACE-UI-2: Nonce Retry Loses HTTP Method for DELETE/PUT/PATCH (MEDIUM)
- **File**: `resources/assets/admin/Request.js:6-8,30-35`
- **Type**: Silent Failure
- **Description**: When a DELETE/PUT/PATCH request gets a stale nonce error, the retry sends a plain POST without the `X-HTTP-Method-Override` header. All DELETE operations (delete forms, settings, submissions, logs, managers) silently fail on nonce retry.
- **Fix**: Store original method before overwriting, use it for retry.

#### TRACE-UI-3: Variable Reference Error in `_UserChange.vue`
- **File**: `resources/assets/admin/views/_UserChange.vue:75`
- **Type**: ReferenceError
- **Description**: `.catch(error => { this.$fail(errors.message); })` -- uses `errors` (undefined) instead of `error`.
- **Fix**: Change `errors.message` to `error.message`.

#### TRACE-UI-4: Trash Count Bug on Permanent Delete
- **File**: `resources/assets/admin/views/Entries.vue:947`
- **Type**: UI Counter Bug
- **Description**: When permanently deleting from trash, `this.counts.trashed` is decremented then immediately incremented, netting zero change.
- **Fix**: Skip `this.counts.trashed += 1` when action is permanent delete.

### 3b. Routes to Controllers/Policies

#### TRACE-RC-1: Write Operations Protected by Read Permission (MEDIUM)
- **File**: `app/Http/Policies/SubmissionPolicy.php`
- **Affected Routes**:
  - `POST /submissions/{entry_id}/update-submission-user` -- changes submission ownership, only requires `fluentform_entries_viewer`
  - `POST /submissions/{entry_id}/notes` -- writes notes, only requires `fluentform_entries_viewer`
- **Fix**: Add policy methods `updateSubmissionUser()` and `store()` that check `fluentform_manage_entries`.

#### TRACE-RC-2: REST Form Submit Blocks Anonymous Users (MEDIUM)
- **File**: `app/Http/Routes/api.php:146`
- **Description**: `POST /form-submit` uses `SubmissionPolicy` which requires `fluentform_entries_viewer`. Anonymous users can only submit via the AJAX endpoint. If this REST route is ever used on the frontend, it will fail.
- **Fix**: Use `PublicPolicy` if intended for public submission, or document as admin-only.

#### TRACE-RC-3: Unused Controller/Policy/Request Classes
- **Files**:
  - `app/Http/Policies/PublicPolicy.php` -- defined but never used by any route
  - `app/Http/Requests/UserRequest.php` -- validation rules defined, never used
  - `app/Http/Controllers/IntegrationManagerController.php` -- not referenced by any route
- **Fix**: Remove or wire up.

#### TRACE-RC-4: Report Endpoints Pass Raw Input
- **Files**: All `app/Http/Controllers/ReportController.php` methods
- **Description**: Most report endpoints pass `$this->request->all()` raw to services or `apply_filters` without sanitization.
- **Fix**: Add sanitization maps for expected parameters.

### 3c. Controllers to Services

All controller-to-service calls verified. Every controller method calls service methods that exist with correct signatures. No broken calls found.

Minor notes:
- `FormController@formEditHistory` uses `$historyService::get($formId)` (static call via instance) -- works but inconsistent with `$historyService->delete($id)` pattern
- `GlobalIntegrationController@updateModuleStatus` calls `$this->request->get()` with no params -- returns entire request unsanitized

### 3d. Services/Models to Database

#### TRACE-DB-1: BROKEN Relationship -- `Form::logs()` (CRITICAL)
- **File**: `app/Models/Form.php:87-89`
- **Description**: `$this->hasMany(Log::class, 'form_id', 'id')` but `fluentform_logs` table has NO `form_id` column. The correct column is `parent_source_id` (confirmed by `Log::form()` which correctly uses `parent_source_id`).
- **Impact**: `$form->logs` or `$form->logs()` generates SQL with nonexistent `form_id` column -- SQL error or empty results.
- **Fix**: Change to `$this->hasMany(Log::class, 'parent_source_id', 'id')`

#### TRACE-DB-2: IP Column Size Mismatch
- **File**: `database/Migrations/FormAnalytics.php:32`
- **Description**: `fluentform_form_analytics.ip` is `CHAR(15)` (IPv4 only) while `fluentform_submissions.ip` is `VARCHAR(45)` (IPv6 compatible). IPv6 addresses truncated in analytics.
- **Fix**: Change to `VARCHAR(45)`.

#### Verified (No Issues)
- All 12 models map to correct tables
- All model relationships have valid foreign keys (except Form::logs)
- All service DB operations reference existing columns
- All migration-defined tables are referenced correctly
- All raw `wpFluent()` queries use correct table/column names
- All data types match between PHP and database
- Pro plugin tables (order_items, transactions, subscriptions) guarded with `PaymentHelper::hasPaymentSettings()`

---

## Summary Dashboard

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Security | 0 | 1 | 4 | 6 | 11 |
| Optimization | 2 | 5 | 8 | 4 | 19 |
| Traceability (UI) | 1 | 0 | 1 | 2 | 4 |
| Traceability (Routes) | 0 | 0 | 2 | 2 | 4 |
| Traceability (Controllers) | 0 | 0 | 0 | 2 | 2 |
| Traceability (DB) | 1 | 0 | 0 | 1 | 2 |
| **TOTAL** | **4** | **6** | **15** | **17** | **42** |

---

## Task List for Sub-Agents

Each item below is a self-contained fix. Sub-agents should pick items and mark them done.

### Priority 1: Critical (Fix Immediately)

- [ ] `TRACE-DB-1` -- Fix `Form::logs()` relationship FK from `form_id` to `parent_source_id` in `app/Models/Form.php:88`
- [ ] `TRACE-UI-1` -- Fix broken route names in `resources/assets/admin/views/SuggestedPlugins.vue:154,179`
- [ ] `OPT-C1` -- Fix null check order for `$user` in `app/Services/Submission/SubmissionService.php:93-99` and `:199-204`
- [ ] `OPT-C2` -- Fix `isUniqueValidation()` loading all submissions in `app/Helpers/Helper.php:481-487`

### Priority 2: High (Fix Soon)

- [ ] `SEC-H1` -- Fix authorization bypass in `app/Modules/Payments/TransactionShortcodes.php:458`
- [ ] `SEC-M1` -- Fix always-true condition in `app/Modules/Payments/TransactionShortcodes.php:163`
- [ ] `OPT-H1` -- Bulk insert in `recordEntryDetails()` at `app/Services/Submission/SubmissionService.php:711`
- [ ] `OPT-H2` -- Fix `remove()` skipping file deletion at `app/Http/Controllers/SubmissionController.php:135`
- [ ] `OPT-H3` -- Fix `findShortCodePage()` loading all posts at `app/Services/Form/FormService.php:600`
- [ ] `TRACE-UI-2` -- Fix nonce retry losing HTTP method in `resources/assets/admin/Request.js`

### Priority 3: Medium (Fix When Convenient)

- [ ] `SEC-M2` -- Whitelist meta keys in `storeColumnSettings()` at `app/Services/Submission/SubmissionService.php:349`
- [ ] `SEC-M3` -- Sanitize plugin_slug in `activatePlugin()` at `app/Http/Controllers/SuggestedPluginsController.php:115`
- [ ] `SEC-M4` -- Improve CSS sanitization in `boot/globals.php:473`
- [ ] `TRACE-RC-1` -- Add proper policy checks for write operations on submission notes and user updates
- [ ] `TRACE-RC-2` -- Fix or document REST form-submit endpoint policy
- [ ] `OPT-M1` -- Extract shared sanitization logic in `SubmissionController`
- [ ] `OPT-M2` -- Cache global form settings in `FormValidationService`
- [ ] `OPT-M3` -- Remove deprecated per-ID action loops in `deleteEntries()`
- [ ] `OPT-M4` -- Remove or delegate deprecated `Report` class
- [ ] `OPT-M5` -- Move temp dir cleanup to cron in `deleteFiles()`
- [ ] `OPT-M6` -- Refactor `getDisabledComponents()` to data-driven loop
- [ ] `OPT-M7` -- Remove deprecated `Export` class, remove redundant `require_once`
- [ ] `OPT-M8` -- Remove dead `findPreviousSubmission()` method
- [ ] `TRACE-DB-2` -- Change `FormAnalytics.ip` from `CHAR(15)` to `VARCHAR(45)`
- [ ] `TRACE-UI-3` -- Fix `errors` to `error` in `resources/assets/admin/views/_UserChange.vue:75`

### Priority 4: Low (Cleanup)

- [ ] `SEC-L1` -- Add nonce/auth to `select_group_ajax_data` AJAX handler
- [ ] `SEC-L2` -- Use `sanitizeOrderValue()` in `Export.php:224`
- [ ] `SEC-L4` -- Use parameterized binding in `ReportHelper.php:939`
- [ ] `SEC-L5` -- Sanitize `$_REQUEST` in `TransactionShortcodes.php:94`
- [ ] `SEC-L6` -- Add nonce to Stripe SCA AJAX endpoints
- [ ] `OPT-L1` -- Remove unused `User` model or use ORM relationship
- [ ] `OPT-L2` -- Remove unused `use` statements in `FormService.php`
- [ ] `OPT-L3` -- Remove commented-out code blocks
- [ ] `OPT-L4` -- Fix timezone inconsistency in `Submission::report()`
- [ ] `OPT-H4` -- Extract shared logic from `find()`/`findByParams()`
- [ ] `OPT-H5` -- Remove or thin-wrap deprecated `Entries` class
- [ ] `TRACE-RC-3` -- Remove unused `PublicPolicy`, `UserRequest`, `IntegrationManagerController`
- [ ] `TRACE-RC-4` -- Add sanitization to report controller endpoints
- [ ] `TRACE-UI-4` -- Fix trash count on permanent delete in `Entries.vue:947`
- [ ] `SEC-L3` -- Review JS sanitization regex for edge cases

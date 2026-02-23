# Testing Checklist for Security Update Branch

This checklist covers all 26 commits on the `security-update` branch. Tests are grouped by category. Each test references the commit it validates and provides step-by-step reproduction instructions.

---

## Group 1: Security Fixes

### TEST-SEC-01: Sanitize plugin_slug input in activatePlugin endpoint

- **Commit**: `57f7822d`
- **Files changed**: `app/Http/Controllers/SuggestedPluginsController.php`
- **Steps to test**:
  1. Log in as an admin user with `activate_plugins` capability.
  2. Send a POST request to the `activatePlugin` REST route with a normal `plugin_slug` value (e.g., `fluent-crm/fluent-crm.php`). Confirm it works.
  3. Send the same request with a malicious `plugin_slug` containing HTML/script tags (e.g., `<script>alert(1)</script>`). Confirm the value is sanitized and the request returns an appropriate error.
  4. Send the request with an empty `plugin_slug`. Confirm a 400 error is returned with the message "Plugin slug is required."
  5. Confirm the `installPlugin` method also uses `sanitize_key()` when calling `plugins_api`.
- **Expected result**: All `plugin_slug` values are sanitized via `sanitize_text_field()` before use. Malicious input is stripped. Empty slugs are rejected with a 400 error.

---

### TEST-SEC-02: Strengthen CSS sanitization against CSS injection vectors

- **Commit**: `3fe48e77`
- **Files changed**: `boot/globals.php`
- **Steps to test**:
  1. Call `fluentformSanitizeCSS()` with valid CSS (e.g., `color: red; font-size: 14px;`). Confirm it passes through unchanged.
  2. Call with CSS containing an HTML tag (e.g., `color: red; <script>alert(1)</script>`). Confirm an empty string is returned.
  3. Call with `expression(alert(1))`. Confirm an empty string is returned.
  4. Call with `url("javascript:alert(1)")`. Confirm an empty string is returned.
  5. Call with `behavior: url(script.htc)`. Confirm an empty string is returned.
  6. Call with `-moz-binding: url(evil.xml#xss)`. Confirm an empty string is returned.
  7. Call with `null`, empty string, and non-string values. Confirm graceful handling (empty string returned).
  8. Call with `@import url('https://fonts.googleapis.com/css2?family=Roboto')`. Confirm it passes through (legitimate use).
- **Expected result**: All dangerous CSS patterns (`expression()`, `javascript:` URLs, `behavior:`, `-moz-binding:`) are blocked. Valid CSS including `@import` passes through.

---

### TEST-SEC-03: Use parameterized binding in report chart selectRaw query

- **Commit**: `499f772a`
- **Files changed**: `app/Services/Report/ReportHelper.php`
- **Steps to test**:
  1. Navigate to the form reports page for a form with submissions.
  2. View the chart report data. Confirm charts render correctly with accurate counts.
  3. Verify in the codebase that `selectRaw()` uses parameterized bindings (second argument array) rather than string interpolation.
  4. Confirm `getOverviewChartData`, `getFormStats`, and related methods work correctly.
- **Expected result**: All `selectRaw()` calls use parameterized bindings. No SQL injection is possible through the report endpoints.

---

### TEST-SEC-04: Sanitize sort_by parameter in legacy export query

- **Commit**: `84c228cd`
- **Files changed**: `app/Modules/Entries/Export.php`
- **Steps to test**:
  1. Navigate to a form's entries and trigger a CSV or JSON export with default sort order. Confirm the export succeeds with entries in descending order.
  2. Set `sort_by=ASC` in the export request. Confirm entries are exported in ascending order.
  3. Attempt to set `sort_by` to an SQL injection payload (e.g., `DESC; DROP TABLE wp_posts--`). Confirm the value is sanitized by `Helper::sanitizeOrderValue()` and defaults to `DESC`.
  4. Test with `sort_by` values of `asc`, `desc` (lowercase). Confirm they are normalized to uppercase and work correctly.
- **Expected result**: The `sort_by` parameter is validated to only allow `ASC` or `DESC`. Any other input defaults to `DESC`.

---

### TEST-SEC-05: Restrict storeColumnSettings to allowed meta keys only

- **Commit**: `1fcac53f`
- **Files changed**: `app/Services/Submission/SubmissionService.php`
- **Steps to test**:
  1. In the entries list view, change column visibility settings. Confirm the settings save successfully with meta key `_visible_columns`.
  2. Drag and reorder columns. Confirm the settings save successfully with meta key `_columns_order`.
  3. Attempt a direct REST API call to the column settings endpoint with a disallowed `meta_key` value (e.g., `admin_email`, `_custom_key`). Confirm the request is rejected with an error "Invalid meta key for column settings."
  4. Confirm that only `_visible_columns` and `_columns_order` are in the allowlist.
- **Expected result**: Only the two allowed meta keys can be stored. Arbitrary meta key writes are blocked.

---

### TEST-SEC-06: Add nonce and permission check to select_group AJAX handler

- **Commit**: `c29a1c55`
- **Files changed**: `app/Hooks/Ajax.php`
- **Steps to test**:
  1. While logged in as an admin, trigger the `fluentform_select_group_ajax_data` AJAX action (through the form editor where grouped select components are used). Confirm it returns data successfully.
  2. Call the same AJAX endpoint without a valid nonce. Confirm the request is rejected.
  3. Log in as a subscriber (no `fluentform_dashboard_access` permission). Call the endpoint with a valid nonce. Confirm the request is rejected with a permission error.
  4. Confirm that `Acl::verify('fluentform_dashboard_access')` is called before processing.
- **Expected result**: The AJAX handler validates nonce and checks user permissions before returning data.

---

### TEST-SEC-07: Sanitize request input in payment receipt shortcode

- **Commit**: `f007a37f`
- **Files changed**: `app/Modules/Payments/TransactionShortcodes.php`
- **Steps to test**:
  1. Visit a page with the `[fluentform_payment_view]` shortcode and provide a valid `transaction` hash in the URL. Confirm the receipt displays correctly.
  2. Provide a `transaction` parameter containing HTML/script injection (e.g., `?transaction=<script>alert(1)</script>`). Confirm the value is sanitized.
  3. Confirm that `$_REQUEST['transaction']` is processed through `sanitize_text_field(wp_unslash(...))` before use.
  4. Omit the `transaction` parameter entirely. Confirm no error is thrown.
- **Expected result**: The `transaction` request parameter is sanitized before being passed to the transaction lookup.

---

### TEST-SEC-08: Add input sanitization to report endpoints and improve JS sanitizer

- **Commit**: `1869be23`
- **Files changed**: `app/Http/Controllers/ReportController.php`, `boot/globals.php`
- **Steps to test**:
  1. Navigate to the admin reports/analytics page. Confirm all report widgets load correctly: overview chart, submission stats, form stats, top performing forms, payment types, API logs.
  2. Intercept a report request and inject malicious values into `form_id` (a string), `period` (`<script>`), `group_by` (SQL fragment). Confirm all values are sanitized.
  3. Verify `ReportController` uses a shared `sanitizeReportAttributes()` method applying `intval` for `form_id` and `sanitize_text_field` for strings.
  4. Test `fluentform_kses_js()` with `<script>alert(1)</script>content<script>more</script>`. Confirm only `content` remains (all script tags stripped).
- **Expected result**: All report endpoint inputs are sanitized. `fluentform_kses_js()` strips script tags individually.

---

### TEST-SEC-09: Fix always-true condition in payment AJAX route dispatch

- **Commit**: `50d97c74`
- **Files changed**: `app/Modules/Payments/TransactionShortcodes.php`
- **Steps to test**:
  1. Review the `routeAjaxEndpoints()` method. Confirm it now uses proper conditional branching (`if/else if`) with `$route ==` comparisons.
  2. Send an AJAX request with `route=get_subscription_transactions`. Confirm `sendSubscriptionPayments()` is called.
  3. Send an AJAX request with `route=cancel_transaction`. Confirm `cancelSubscriptionAjax()` is called.
  4. Send an AJAX request with `route=nonexistent_route`. Confirm no handler is executed.
- **Expected result**: Route dispatch uses proper conditional logic. Only the matching handler fires.

---

## Group 2: Functionality Fixes

### TEST-FUNC-01: Fix broken Form::logs() relationship using wrong foreign key

- **Commit**: `b813274f`
- **Files changed**: `app/Models/Form.php`
- **Steps to test**:
  1. Create a form and submit it to generate log entries (e.g., enable email notifications).
  2. In PHP or via a test, call `$form->logs` on a form instance. Confirm logs are returned.
  3. Verify the relationship uses `parent_source_id` as the foreign key (matching the `fluentform_logs` table schema).
  4. Confirm logs are empty for forms with no log entries (not an error).
- **Expected result**: `Form::logs()` returns correct log entries using the `parent_source_id` foreign key.

---

### TEST-FUNC-02: Fix broken route names for suggested plugin install/activate buttons

- **Commit**: `96d77eec`
- **Files changed**: `resources/assets/admin/views/SuggestedPlugins.vue`
- **Steps to test**:
  1. Navigate to the Fluent Forms admin page where suggested/recommended plugins are displayed.
  2. Locate a plugin that is not installed. Click "Install". Confirm the REST API request goes to the correct route (`suggestedPluginsInstallPlugin`).
  3. Locate a plugin that is installed but not active. Click "Activate". Confirm the request goes to `suggestedPluginsActivatePlugin`.
  4. Confirm no 404 or route-not-found errors appear in the browser console.
- **Expected result**: Install and Activate buttons correctly resolve their REST route names.

---

### TEST-FUNC-03: Fix fatal error when submission user has been deleted

- **Commit**: `c6759e1b`
- **Files changed**: `app/Services/Submission/SubmissionService.php`
- **Steps to test**:
  1. Create a form and submit it while logged in as a test user.
  2. View the submission in admin to confirm user info shows.
  3. Delete the test user from WordPress.
  4. View the same submission again. Confirm no fatal error occurs.
  5. Verify the submission still displays (user info is simply absent).
  6. Test both `find()` (direct view) and `findByParams()` (lookup by serial/UID). Both should handle deleted users.
- **Expected result**: Viewing a submission whose user has been deleted does not cause a fatal error.

---

### TEST-FUNC-04: Fix single submission delete skipping file cleanup

- **Commit**: `eb83ed3d`
- **Files changed**: `app/Http/Controllers/SubmissionController.php`
- **Steps to test**:
  1. Create a form with a file upload field. Submit it with an attached file.
  2. Confirm the file exists on disk (in the uploads directory).
  3. Delete the single submission (permanent delete).
  4. Confirm the uploaded file is removed from disk.
  5. Confirm entry details, submission meta, and the submission record are all removed from the database.
  6. Also test bulk delete to ensure it still works with file cleanup.
- **Expected result**: Single submission delete now calls `deleteEntries()` which handles file cleanup via `deleteFiles()`.

---

### TEST-FUNC-05: Fix nonce retry losing HTTP method for DELETE/PUT/PATCH requests

- **Commit**: `47260afd`
- **Files changed**: `resources/assets/admin/Request.js`
- **Steps to test**:
  1. Let the admin session expire (wait for the nonce to become stale) while on a Fluent Forms admin page.
  2. Perform a DELETE action (e.g., permanently delete a trashed submission).
  3. Confirm the nonce is refreshed and the retry uses the correct HTTP method (`delete`) rather than falling back to `post`.
  4. Repeat for a PUT/PATCH action if available.
  5. Verify the `originalMethod` variable captures the initial method before override to `POST`.
- **Expected result**: Retried requests preserve the original HTTP method (DELETE, PUT, or PATCH).

---

### TEST-FUNC-06: Fix ReferenceError in user search error handler

- **Commit**: `2a6174f7`
- **Files changed**: `resources/assets/admin/views/_UserChange.vue`
- **Steps to test**:
  1. Open a submission detail page and click the edit button to change the submission's user.
  2. Type a search query in the user search dropdown. Confirm results load.
  3. Simulate a network error for the user search endpoint (e.g., block the request in DevTools).
  4. Confirm the error handler displays an error message via `this.$fail(error.message)` instead of throwing a `ReferenceError`.
  5. Open the browser console. Confirm no `ReferenceError` is logged.
- **Expected result**: The `.catch()` handler uses `error` (singular) matching the parameter name.

---

### TEST-FUNC-07: Fix trash counter not updating on permanent delete

- **Commit**: `2d227292`
- **Files changed**: `resources/assets/admin/views/Entries.vue`
- **Steps to test**:
  1. Create several form submissions.
  2. Trash two submissions. Confirm the "Trashed" tab counter shows 2.
  3. Navigate to the "Trashed" entries view.
  4. Permanently delete one trashed entry.
  5. Confirm the trash counter decreases from 2 to 1 (not incorrectly increasing).
  6. Permanently delete the remaining trashed entry. Confirm the counter shows 0.
- **Expected result**: When permanently deleting from the trashed view, the `trashed` count decreases correctly.

---

### TEST-FUNC-08: Fix timezone inconsistency in Submission::report date ranges

- **Commit**: `35c60b01`
- **Files changed**: `app/Models/Submission.php`
- **Steps to test**:
  1. Set the WordPress timezone to a non-UTC timezone (e.g., `America/New_York`).
  2. Create form submissions at known times (especially around midnight local timezone).
  3. View the form's submission chart.
  4. Confirm the default date range uses `current_time()` consistently for both start and end dates.
  5. Confirm the chart correctly shows submissions for the last 30 days including today.
  6. Provide custom date ranges. Confirm boundaries use `00:00:00` for start and `23:59:59` for end.
- **Expected result**: Date calculations use consistent timezone functions. Today's submissions are always included.

---

## Group 3: Performance Fixes

### TEST-PERF-01: Fix isUniqueValidation loading all submissions into memory

- **Commit**: `024fa957`
- **Files changed**: `app/Helpers/Helper.php`
- **Steps to test**:
  1. Create a form with a text field that has "unique validation" enabled.
  2. Submit the form with a value. Confirm submission succeeds.
  3. Submit again with the same value. Confirm the unique validation error appears.
  4. Verify the uniqueness check uses `->exists()` instead of `->get()->count()`.
  5. For forms with payment: submit a form with payment enabled and unique validation. Confirm the fallback JSON column check also uses `->exists()`.
  6. On a form with many submissions (1000+), confirm no noticeable delay.
- **Expected result**: `isUniqueValidation()` uses `EXISTS` queries instead of loading all matching rows.

---

### TEST-PERF-02: Use bulk insert for entry details

- **Commit**: `65b5bdf8`
- **Files changed**: `app/Services/Submission/SubmissionService.php`
- **Steps to test**:
  1. Create a form with multiple fields (10+). Submit it. Confirm all entry details are saved correctly.
  2. View the submission detail. Confirm each field value appears correctly.
  3. Create a form with nested/repeater fields. Submit with multiple sub-entries. Confirm sub-fields are recorded.
  4. Verify in the code that `EntryDetails::insert($entryItems)` is called once with the full array.
- **Expected result**: `recordEntryDetails()` performs a single bulk `INSERT` query. All fields are recorded correctly.

---

### TEST-PERF-03: Fix findShortCodePage loading all posts into memory

- **Commit**: `0e00aec6`
- **Files changed**: `app/Services/Form/FormService.php`
- **Steps to test**:
  1. Navigate to a form's settings where "Shortcode Locations" is displayed.
  2. Confirm pages/posts containing the form shortcode are listed correctly.
  3. Verify the method first runs `$wpdb->get_col()` to find matching post IDs, then uses `post__in` to load only those.
  4. On a site with many posts (5000+), confirm no excessive memory usage or timeout.
  5. Test with multiple post types (pages, posts, custom post types).
- **Expected result**: `findShortCodePage()` pre-filters via SQL and loads only matching posts. Memory usage is proportional to matching posts, not total posts.

---

## Group 4: Database Migration

### TEST-DB-01: Widen FormAnalytics ip column for IPv6

- **Commit**: `ef2fa841`
- **Files changed**: `database/Migrations/FormAnalytics.php`
- **Steps to test**:
  1. On a fresh install, confirm `fluentform_form_analytics` table has `ip` as `VARCHAR(45)`.
  2. On an existing install, run the migration (deactivate/reactivate plugin). Confirm the `ip` column is altered from `CHAR(15)` to `VARCHAR(45)`.
  3. Submit a form from an IPv6 address (or simulate one). Confirm the full address is stored correctly.
  4. Submit from a standard IPv4 address. Confirm it still works.
  5. Verify migration only runs ALTER when column length < 45 (idempotent).
- **Expected result**: The `ip` column supports IPv6 addresses (up to 45 characters). Migration is safe to run multiple times.

---

## Group 5: Code Quality / Maintenance

### TEST-MAINT-01: Remove dead findPreviousSubmission method

- **Commit**: `579413cd`
- **Files changed**: `app/Models/Submission.php`
- **Steps to test**:
  1. Search the entire codebase for `findPreviousSubmission`. Confirm no callers exist.
  2. Navigate between submissions in admin (next/previous navigation). Confirm `findAdjacentSubmission()` still works.
- **Expected result**: Dead method removed without functional impact.

---

### TEST-MAINT-02: Remove unused imports from FormService

- **Commit**: `f4c9acbc`
- **Files changed**: `app/Services/Form/FormService.php`
- **Steps to test**:
  1. Confirm no `use` statements remain for classes not referenced in the file body.
  2. Smoke test: create a form, edit settings, view form locations, export entries. Confirm no class-not-found errors.
- **Expected result**: Unused `use` statements removed. No runtime impact.

---

### TEST-MAINT-03: Remove commented-out code blocks

- **Commit**: `8b97d337`
- **Files changed**: `app/Services/Form/FormValidationService.php`, `app/Modules/Entries/Entries.php`
- **Steps to test**:
  1. Review both files. Confirm no significant blocks of commented-out code remain.
  2. Smoke test form validation: submit with required fields empty, with validation rules, with conditional logic.
  3. Smoke test entries: view entries list, filter entries, bulk actions.
- **Expected result**: Commented-out dead code removed. No functional changes.

---

### TEST-MAINT-04: Extract duplicate submission sanitization

- **Commit**: `98158867`
- **Files changed**: `app/Http/Controllers/SubmissionController.php`
- **Steps to test**:
  1. View the entries list for a form. Confirm entries load correctly.
  2. Change filters (status, search, date range, favorites). Confirm filtering works.
  3. Change pagination. Confirm it works.
  4. Verify `index()` and `all()` both use the shared `sanitizeSubmissionAttributes()` method.
- **Expected result**: Duplicate sanitization logic consolidated. All endpoints sanitize consistently.

---

### TEST-MAINT-05: Extract shared submission enrichment logic

- **Commit**: `7928c809`
- **Files changed**: `app/Services/Submission/SubmissionService.php`
- **Steps to test**:
  1. View a single submission. Confirm user info is displayed (name, permalink).
  2. View a submission whose user has been deleted. Confirm no error.
  3. View a submission from a guest user (user_id is 0/null). Confirm no error.
  4. Verify both `find()` and `findByParams()` call the shared `enrichWithUser()` method.
  5. Compare output of `find()` and `findByParams()` for the same submission. Confirm consistent data.
- **Expected result**: Shared enrichment methods eliminate duplication while preserving identical behavior.

---

## Group 6: Integration Tests

### TEST-INT-01: End-to-end submission lifecycle

- **Steps to test**:
  1. Create a form with: required fields, unique validation field, file upload field, payment field (if Pro available).
  2. Submit as a logged-in user. Confirm submission succeeds and entry details are bulk-inserted.
  3. View the submission. Confirm user info shows and entry details are correct.
  4. Submit again with the same unique field value. Confirm unique validation blocks it.
  5. View the form's reports. Confirm charts and stats load correctly.
  6. Export entries as CSV. Confirm sort order is sanitized.
  7. Trash the submission. Confirm trash counter updates.
  8. Permanently delete from trash. Confirm files cleaned up and trash counter decreases.
  9. Delete the test user. View remaining submissions. Confirm no fatal error.
  10. Check form shortcode locations. Confirm page loads without memory issues.

---

### TEST-INT-02: Session expiry and nonce renewal flow

- **Steps to test**:
  1. Log in to admin and navigate to Fluent Forms entries.
  2. Wait for the WordPress nonce to expire (or manually invalidate it).
  3. Perform a DELETE action (permanently delete from trash). Confirm nonce is renewed and correct HTTP method used on retry.
  4. Perform a POST action (status update). Confirm this also works after renewal.
  5. Verify no double-action occurs.

---

### TEST-INT-03: Payment shortcode and AJAX dispatch flow

- **Steps to test**:
  1. Create a page with `[fluentform_payments]` shortcode. Visit while logged in. Confirm transactions display.
  2. Visit while logged out. Confirm appropriate fallback.
  3. Click "View" on a transaction to trigger receipt page. Confirm renders correctly with sanitized input.
  4. Expand subscription payments (triggers AJAX). Confirm only the matching handler fires.
  5. Test subscription cancellation via AJAX. Confirm correct route dispatches.

---

## Summary

| Category | Test Count |
|---|---|
| Security | 9 |
| Functionality | 8 |
| Performance | 3 |
| Database Migration | 1 |
| Code Quality / Maintenance | 5 |
| Integration | 3 |
| **Total** | **29** |

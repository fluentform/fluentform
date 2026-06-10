## 1. Error taxonomy

- [ ] 1.1 Add `LIMIT_EXCEEDED = 'limit_exceeded'` and `UNFILTERED_HTML_REQUIRED = 'unfiltered_html_required'` constants to `app/Modules/MCP/Support/ErrorCodes.php`
- [ ] 1.2 Add both new codes to `ErrorCodes::all()`

## 2. Pro extension seam (filters)

- [ ] 2.1 Apply `fluentform/mcp_tool_definitions` to the merged map in `AbilitiesRegistrar::getDefinitions()`, with a documented contract comment; keep `mcp_loaded` + `mcp_ability_names` untouched
- [ ] 2.2 Apply `fluentform/mcp_submission_data` to the entry payload in `SubmissionTools::getSubmission()` before return, with a documented contract comment
- [ ] 2.3 Apply `fluentform/mcp_submission_row` to each row in `SubmissionTools::listSubmissions()` before return, with a documented contract comment
- [ ] 2.4 Surface native payment fields in `get-submission` only when `isset()` on the submission (graceful without Pro)

## 3. New-tools gating

- [ ] 3.1 Add `isNewToolsEnabled()` / `setNewToolsEnabled()` to `PermissionGate` (reuse `_fluentform_mcp_settings`, admin-only, fail-closed), mirroring `isEnabled()`/`setEnabled()`
- [ ] 3.2 In `AbilitiesRegistrar`, include `StylingTools`, `ConditionTools`, and the bulk definition only when the opt-in is on
- [ ] 3.3 Expose the opt-in state in `McpSettingsController::status()` and add an admin-only toggle handler
- [ ] 3.4 Add the opt-in toggle UI to `resources/assets/admin/settings/McpSettings.vue` (Vue 2 Options API), gated behind the master switch, with a clear "advanced tools" description

## 4. Bulk submissions tool

- [ ] 4.1 Add `fluentform/bulk-update-submissions` to `SubmissionTools::definitions()` with the `action` enum, `entry_ids[]`, `dry_run`/`confirm_token`/`idempotency_key`, `destructive` annotation, and the manage-entries permission
- [ ] 4.2 Implement the handler: clamp `entry_ids` count to 200 (`LIMIT_EXCEEDED` on over-cap), resolve + scope-check each id, partition in-scope vs skipped, group in-scope ids by resolved `form_id`
- [ ] 4.3 Route through `Mutation::runGuarded` with a stable entityKey (`bulk:<action>:<hash>`) and fingerprint (action + sorted ids + count); preview returns the in-scope count + skipped ids
- [ ] 4.4 On execute, map the MCP action enum to `handleBulkActions` action_type and call once per form group; return a summary envelope; audit once

## 5. Form styling tools

- [ ] 5.1 Create `app/Modules/MCP/Tools/StylingTools.php` with `get-form-styling` (readonly) + `update-form-styling` definitions, form-scoped permission
- [ ] 5.2 Implement `get-form-styling` over `Customizer::get()` + `SettingsService::getPreset()` (theme, structured styles, css/js)
- [ ] 5.3 Implement `update-form-styling`: theme + `styler_styles` always writable via `Mutation::run`; sanitize inputs
- [ ] 5.4 For css/js writes, pre-check `fluentformCanUnfilteredHTML()`; return `UNFILTERED_HTML_REQUIRED` when absent; otherwise sanitize via `fluentformSanitizeCSS`/`fluentform_kses_js` and persist via `Customizer::store()`
- [ ] 5.5 Register `StylingTools` in `AbilitiesRegistrar::toolClasses()` (behind the opt-in from 3.2)

## 6. Field conditions tools

- [ ] 6.1 Create `app/Modules/MCP/Tools/ConditionTools.php` with `get-field-conditions` (readonly) + `update-field-conditions` definitions, form-scoped permission
- [ ] 6.2 Implement `get-field-conditions`: parse form fields, emit only conditioned fields in a compact per-field shape (key, enabled, rules)
- [ ] 6.3 Implement `update-field-conditions`: load form definition, replace only targeted fields' `conditional_logics`, preserve everything else, route through `Mutation::run`
- [ ] 6.4 Validate each rule has non-empty `field` + `operator` and every referenced field exists on the form (`INVALID_PARAM` on failure, persist nothing); sanitize recursively with `fluentFormSanitizer`
- [ ] 6.5 Register `ConditionTools` in `AbilitiesRegistrar::toolClasses()` (behind the opt-in from 3.2)

## 7. Tests

- [ ] 7.1 In `tests/mcp/run.php`, bump the expected tool count and add the new tools to `$expectedTools` (and to the catalogue-count assertion), accounting for the opt-in being on in the test context
- [ ] 7.2 Add readonly assertions for `get-form-styling`, `get-field-conditions`; destructive assertion for `bulk-update-submissions`; not-readonly for the write tools
- [ ] 7.3 Cover the bulk guard: dry_run returns a preview + token without executing; execute without token is refused; over-200 returns `LIMIT_EXCEEDED`; at-200 is accepted
- [ ] 7.4 Cover the new filters fire and degrade gracefully without a listener (`mcp_submission_data`, `mcp_submission_row`, `mcp_tool_definitions`)
- [ ] 7.5 Cover off-by-default gating: new tools absent when opt-in off, present when on; opt-in setter is admin-only / fail-closed
- [ ] 7.6 Assert `ErrorCodes::all()` includes `LIMIT_EXCEEDED` and `UNFILTERED_HTML_REQUIRED` and remains unique/all-string

## 8. Verification (free repo)

- [ ] 8.1 Run `php tests/mcp/run.php` — all assertions pass
- [ ] 8.2 `php -l` on every new/changed PHP file
- [ ] 8.3 `composer dump-autoload` after adding the two new tool classes; confirm both appear in `vendor/composer/autoload_classmap.php`
- [ ] 8.4 `openspec validate issue-na-mcp-bulk-payments-styling-conditionals --strict` passes

## 9. Pro companion (SEPARATE `fluentformpro` repo — own branch + draft PR)

> Cross-repo: `fluentformpro` is a separate git repository (branch off `dev`). These tasks ship
> as a distinct draft PR and depend on the free-core filters from group 2 existing. No new MCP
> tools/abilities/endpoints are added on the Pro side.

- [ ] 9.1 Create `src/Payments/MCP/PaymentDataProvider.php` in `fluentformpro` (one listener class, no ability registration)
- [ ] 9.2 Wire it from `FluentFormPro::registerHooks()` in `fluentformpro.php` (direct `add_filter`, matching the existing Pro pattern) or on the `fluentform/mcp_loaded` action
- [ ] 9.3 Implement the `fluentform/mcp_submission_data` listener: resolve `form_id` from the submission, return unchanged unless `Acl::hasPermission('fluentform_view_payments', $formId)`, else inject a compact `payment` block
- [ ] 9.4 Build the block via `OrderData::getSummary()` / `getTransactions()` / `getSubscriptionsAndPaymentTotal()`, formatting amounts with `PaymentHelper::formatMoney($cents, $currency)`; surface status, formatted total, currency, method, transaction count, subscription status — never raw cents or serialized vendor blobs
- [ ] 9.5 Implement the `fluentform/mcp_submission_row` listener with a minimal per-row summary; batch-load payment status for the page's entry ids in ONE query (no N+1)
- [ ] 9.6 Fail-closed: any exception or missing capability returns the payload unchanged (never throws into the MCP envelope, never leaks payment data)
- [ ] 9.7 `php -l` on the new Pro file; manual verification against a paid form (`get-submission` shows the block with payments perm; hidden without it)

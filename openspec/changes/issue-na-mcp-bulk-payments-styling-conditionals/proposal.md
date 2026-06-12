## Why

The FluentForm MCP server today exposes 12 read/write tools but stops at single-entry
operations, leaves payment data invisible to agents, and offers no way to read or change
a form's visual styling or a field's conditional logic. Agents managing real inboxes need
to triage many entries at once, see payment context next to a submission, restyle a form,
and adjust show/hide rules — all without leaving the conversation. This change adds those
four capabilities behind the existing safety rails, plus a unified Pro-extension seam so
FluentForm Pro can inject payment/transaction data and override tool definitions through
one contract instead of forking.

## What Changes

- **Bulk submission actions** — a single `fluentform/bulk-update-submissions` tool with an
  `action` enum (`read`, `unread`, `spam`, `trashed`, `favorite`, `unfavorite`,
  `delete_permanently`). Takes `entry_ids[]` capped at 200, routes through
  `Mutation::runGuarded` (dry_run → confirm_token → idempotency_key), and re-asserts
  per-entry form scope before acting (IDOR-safe). Wraps `SubmissionService::handleBulkActions()`.
- **Payment data + Pro seam** — two output-augmentation filters,
  `fluentform/mcp_submission_data` (entry-level, applied in `get-submission`) and
  `fluentform/mcp_submission_rows` (list-level, applied in `list-submissions`), let Pro inject
  payment / transactions / subscription blocks. A new `fluentform/mcp_tool_definitions` filter
  lets Pro inject or override tool definitions through one unified seam. Free core surfaces
  any payment fields only when present (isset-guarded) and degrades gracefully without Pro.
  The existing `fluentform/mcp_loaded` action and `fluentform/mcp_ability_names` filter are
  retained for back-compat.
- **Form styling tools** — `fluentform/get-form-styling` (readonly) and
  `fluentform/update-form-styling` (write via `Mutation::run`) over the Customizer + styler
  meta. Theme (`styler_theme`) and structured `styler_styles` are always writable. Custom
  CSS/JS writes are allowed ONLY when WP security permits: pre-check
  `fluentformCanUnfilteredHTML()` / the `unfiltered_html` capability and return a clean
  `UNFILTERED_HTML_REQUIRED` forbidden error instead of letting `Customizer::store()` throw.
  Form-scoped via `FormAccess`.
- **Field conditional logic tools** — `fluentform/get-field-conditions` (readonly, compact
  per-field) and `fluentform/update-field-conditions` (write via `Mutation::run`, per-field
  granularity). Validates rule shape (`field` + `operator` required), validates referenced
  fields exist on the form, sanitizes recursively with `fluentFormSanitizer`.
- **Off-by-default gating** — the 5 new tools ship OFF until an admin opts in through a new
  control on the MCP settings card. They still inherit the master MCP switch and per-ability
  FluentForm permissions on top.
- **Default payment provider (free core; revised from a Pro companion)** — `Support\PaymentDataProvider`
  consumes the `fluentform/mcp_submission_data` and `fluentform/mcp_submission_rows` filters to
  inject a compact `payment` block, reusing the core `OrderData` / `PaymentHelper` services
  (`app/Modules/Payments` lives in free core — the original Pro placement rested on a false
  premise and was superseded; fluentformpro#223 closed). It registers NO new MCP tools, abilities,
  or endpoints, checks `fluentform_view_payments` per form before injecting (the entry-read tools
  are gated on entry-view permission — not payments), and never overwrites an addon-populated
  `payment` key, keeping the seams open for Pro to add premium-gateway extras.
- **Error taxonomy** — add `LIMIT_EXCEEDED` and `UNFILTERED_HTML_REQUIRED` to the closed
  `ErrorCodes` set and `ErrorCodes::all()`.
- **Tests** — extend `tests/mcp/run.php`: bump the tool count from 12, add the new tools to
  the expected list, assert readonly/destructive annotations, and cover the new filters, the
  bulk guard, the 200-entry limit clamp, and the off-by-default gating.

No BREAKING changes: every new tool is additive, gated off by default, and the existing
hooks are preserved.

## Capabilities

### New Capabilities

- `mcp-bulk-submissions`: one guarded bulk tool over many entries with per-entry scope
  re-assertion and a hard entry-count cap.
- `mcp-form-styling`: read and write a form's theme, structured styles, and (capability-gated)
  custom CSS/JS through the MCP surface.
- `mcp-field-conditions`: read and write per-field conditional logic with shape and
  field-existence validation.
- `mcp-pro-extension-seam`: the unified filter contract (`mcp_submission_data`,
  `mcp_submission_rows`, `mcp_tool_definitions`) that lets Pro augment output and tools.
- `mcp-tool-gating`: an admin opt-in that keeps the new tool group off until explicitly enabled.
- `mcp-pro-payment-provider`: the **Pro-side consumer** (companion change in the `fluentformpro`
  repo) that injects a permission-gated, compact `payment` block through the free-core filters —
  without adding any new MCP endpoints.

### Modified Capabilities

<!-- None. The existing MCP tools (specs/) are not yet captured as openspec capabilities; this
     change is the first to formalize MCP behavior, so all entries are New. -->

## Impact

- **New tool classes**: `app/Modules/MCP/Tools/StylingTools.php`,
  `app/Modules/MCP/Tools/ConditionTools.php`; bulk tool added to
  `app/Modules/MCP/Tools/SubmissionTools.php`.
- **Touched**: `app/Modules/MCP/AbilitiesRegistrar.php` (register new classes,
  `mcp_tool_definitions` filter, gating filter), `app/Modules/MCP/Support/ErrorCodes.php`
  (two new codes), `app/Modules/MCP/MCPInit.php` / `PermissionGate.php` (new-tools opt-in
  storage), `app/Http/Controllers/McpSettingsController.php` (expose the opt-in).
- **Services wrapped (read-only callers)**: `SubmissionService::handleBulkActions()`,
  `Customizer::get()/store()`, `SettingsService::getPreset()/savePreset()`, the form-fields
  read/update path.
- **Admin UI**: `resources/assets/admin/settings/McpSettings.vue` gains an opt-in toggle for
  the new tool group (Vue 2 Options API).
- **Tests**: `tests/mcp/run.php`.
- **Filters added** (addon-facing contract): `fluentform/mcp_submission_data`,
  `fluentform/mcp_submission_rows`, `fluentform/mcp_tool_definitions`.
- **Dependencies**: none new. FluentForm Pro is an optional consumer of the new filters.
- **Cross-repo companion (`fluentformpro`, separate git repo, branch off `dev`)**: one new
  listener class (e.g. `src/Payments/MCP/PaymentDataProvider.php`) wired from
  `fluentformpro.php` → `FluentFormPro::registerHooks()` (or on the `fluentform/mcp_loaded`
  action). It hooks `fluentform/mcp_submission_data` + `fluentform/mcp_submission_rows`, checks
  `Acl::hasPermission('fluentform_view_payments', $formId)`, and builds the `payment` block via
  `OrderData::getSummary()` / `getTransactions()` / `getSubscriptionsAndPaymentTotal()` +
  `PaymentHelper::formatMoney()`. No new MCP tools/abilities/endpoints. Ships as a **separate
  draft PR** in the `fluentformpro` repo — it cannot live on the free `mcp-local-test` branch.

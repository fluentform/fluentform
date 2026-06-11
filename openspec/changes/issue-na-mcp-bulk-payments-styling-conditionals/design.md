# Design — MCP bulk, payments seam, styling, conditionals

## Context

The MCP module (`app/Modules/MCP/`) already has a mature shape: each tool class owns a
`definitions()` slice; `AbilitiesRegistrar` merges and registers them; `Mutation::run` /
`Mutation::runGuarded` are the only write paths (audit + WriteGuard); `FormAccess` centralizes
form/entry resolution and scope; `MCPHelper` standardizes envelopes, errors, pagination, and the
`HARD_MAX_PER_PAGE = 200` cap; `ErrorCodes` is a closed taxonomy guarded by tests. This change
extends that shape rather than reworking it — every decision below defers to an existing seam.

## Goals

- Add bulk entry actions, payment visibility, styling read/write, and conditional-logic
  read/write as MCP tools.
- Give Pro a single, documented contract to inject payment data and override tools.
- Keep the new surface off until an admin opts in.
- Reuse `Mutation`, `WriteGuard`, `FormAccess`, `MCPHelper`, and `ErrorCodes` unchanged in
  spirit (only additive constants).

## Non-Goals

- No new admin REST routes beyond the existing MCP settings controller surface.
- No payment logic in free core — only the seam and isset-guarded surfacing.
- No new database tables or schema changes.
- No rework of the existing 12 tools' behavior.

## Decisions

### D1 — One bulk tool with an action enum (not seven tools)

A single `bulk-update-submissions` with an `action` enum keeps the catalogue small and gives the
agent one mental model. `SubmissionService::handleBulkActions()` already switches on an
`action_type` string (`other.delete_permanently`, `other.make_favorite`,
`other.unmark_favorite`, plus the status values), so the MCP enum maps cleanly onto it. The tool
maps `favorite`/`unfavorite` → `other.make_favorite`/`other.unmark_favorite`,
`delete_permanently` → `other.delete_permanently`, and the status verbs straight through.

**Alternative considered**: one tool per action. Rejected — it bloats the catalogue 7×, and the
agent would still need the same guard/scope logic duplicated per tool.

### D2 — Always route bulk through `runGuarded`

Even reversible bulk actions (mark read) go through the dry_run → confirm_token → idempotency
flow. Rationale: the agent cannot see the entry set in advance, so a "harmless" mark-read could
silently touch hundreds of records. The dry-run preview returns the resolved, in-scope count and
a per-id breakdown so the agent confirms against reality. `handleBulkActions` itself is not
idempotent (a second delete is a no-op but a second status flip re-flips nothing harmful), and
`WriteGuard::idempotent` already caches the first result.

The guard `entityKey` is a stable hash of the sorted in-scope entry id list (e.g.
`bulk:<action>:<md5 of sorted ids>`); the `fingerprint` includes the action plus the count, so a
changed set forces a fresh dry-run.

### D3 — Per-entry scope re-assertion happens at resolve time, before the guard preview

The tool resolves each id through the existing `FormAccess`/`PermissionGate::canAccessForm`
path and partitions into in-scope vs skipped BEFORE building the preview or calling
`handleBulkActions`. `handleBulkActions` is then called with only the in-scope ids and their
single shared `form_id` (it requires one `form_id`). Because a bulk set could span forms, the
tool groups in-scope ids by resolved `form_id` and calls `handleBulkActions` once per form group.
This preserves the service contract while staying IDOR-safe.

**Alternative considered**: pass all ids and let the service filter. Rejected — the service
trusts the caller's `form_id` and does not apply user scope, so that would be an IDOR.

### D4 — Limit enforced in the tool, surfaced as `LIMIT_EXCEEDED`

`MCPHelper::HARD_MAX_PER_PAGE` (200) is the existing ceiling concept; the bulk cap reuses the
same number. The tool checks `count(entry_ids) > 200` up front and returns `LIMIT_EXCEEDED`
(a new code) rather than silently truncating, so the agent learns it must split the batch.

### D5 — Output augmentation via post-filters, not inheritance

`get-submission` and `list-submissions` apply `fluentform/mcp_submission_data` and
`fluentform/mcp_submission_rows` to their assembled payloads just before returning. Pro returns an
augmented array; absent a listener the payload passes through unchanged. Free core additionally
surfaces native payment fields only when `isset()` on the submission (e.g. `payment_status`,
`payment_total`, `currency`) so a payments-enabled site shows basic payment context even without
Pro, and a non-payments site shows nothing fabricated.

### D6 — Unified tool-definition seam

`AbilitiesRegistrar::getDefinitions()` applies `fluentform/mcp_tool_definitions` to the merged
map. This is the one place Pro can add or override a definition. The legacy `mcp_loaded` action
(fired in `MCPInit::registerAbilities`) and `mcp_ability_names` filter
(`MCPInit::registerCustomServer`) stay exactly as they are — the new filter is purely additive,
so existing Pro builds keep working.

### D7 — Styling over Customizer + styler preset, CSS/JS capability-gated in the tool

`get-form-styling` reads via `Customizer::get($formId, [...meta keys...])` (theme via
`_ff_selected_style`, structured styles via `_ff_form_styles`, css/js via the existing keys) plus
`SettingsService::getPreset()` for the available presets context. `update-form-styling` writes
theme/structured styles via the preset/Customizer path and writes css/js via `Customizer::store()`
ONLY after the tool itself pre-checks `fluentformCanUnfilteredHTML()`. The pre-check exists
because `Customizer::store()` throws a raw `\Exception` when the capability is missing; the tool
must instead return a structured `UNFILTERED_HTML_REQUIRED` error. CSS/JS sanitization reuses
`fluentformSanitizeCSS()` / `fluentform_kses_js()` (the same functions `Customizer::store()`
applies), so the contract matches the admin UI exactly.

### D8 — Conditionals read/write at per-field granularity over the form definition

Conditional logic lives at `settings.conditional_logics` on each field in the form's stored
field JSON (supports both the legacy `conditions[]` shape and the `condition_groups[]` group
shape, each rule requiring `field` + `operator`). `get-field-conditions` walks the parsed fields
and emits only conditioned fields in a compact shape. `update-field-conditions` loads the form
definition, replaces only the targeted fields' `conditional_logics`, validates each rule's shape
and that referenced field keys exist on the form, sanitizes recursively with `fluentFormSanitizer`,
and persists through the existing form-fields update path. Untargeted fields and the rest of the
definition are preserved byte-for-byte where possible.

### D9 — New-tools opt-in stored in the existing MCP option

The opt-in reuses `_fluentform_mcp_settings` (the option `PermissionGate` already owns), under a
new key (e.g. `new_tools_enabled`). `PermissionGate` gains `isNewToolsEnabled()` /
`setNewToolsEnabled()` mirroring `isEnabled()`/`setEnabled()` (admin-only, fail-closed).
`AbilitiesRegistrar` only includes `StylingTools`, `ConditionTools`, and the bulk definition when
the opt-in is on, so off-by-default means truly unregistered (zero ability surface), not merely
hidden. The settings card and `McpSettingsController::status()` expose and toggle the flag.

### D10 — Pro consumes the seam through one permission-gated listener (no new endpoints)

The free-core `get-submission` / `list-submissions` tools are authorized by **entry-view**
permission, not the **payments** capability. Auto-reusing the existing
`fluentform/submission_order_data` filter (which Pro already implements for the admin entries UI)
would therefore leak payment data to any MCP user who can read entries but lacks
`fluentform_view_payments`. So Pro instead attaches a dedicated listener to the MCP-specific
`fluentform/mcp_submission_data` / `fluentform/mcp_submission_rows` filters and, inside it:

1. Resolves the entry's `form_id` from the submission passed by the filter.
2. Calls `Acl::hasPermission('fluentform_view_payments', $formId)` and returns the payload
   **unchanged** if absent (no leak, fail-closed).
3. Builds a compact `payment` block by reusing `OrderData::getSummary()` /
   `getTransactions()` / `getSubscriptionsAndPaymentTotal()` and formatting amounts with
   `PaymentHelper::formatMoney($cents, $currency)` — surfacing status, formatted total, currency,
   method, transaction count, and subscription status; never raw cents or serialized vendor blobs.

This answers "does Pro need changes": **yes — exactly one small listener class, and zero new MCP
endpoints.** It bootstraps from `FluentFormPro::registerHooks()` (direct `add_filter`, matching the
Pro plugin's existing pattern) or on the `fluentform/mcp_loaded` action; it does not register an
ability or tool.

**Alternative considered**: have free core call the existing `fluentform/submission_order_data`
directly so Pro needs no change at all. Rejected on the permission-leak ground above, and because
the admin order-data shape (order_items, refunds, serialized vendor responses) is too heavy for an
agent context — the MCP block must be compact and permission-aware.

**List-level N+1 guard**: the `mcp_submission_rows` listener must not issue a payment query per row.
Pro batch-loads payment status for the page's entry ids in one query and maps onto the rows (D10
scenario), keeping query count independent of page size.

**Cross-repo boundary**: `fluentformpro` is a separate git repository. The free-core seam (this
change, on `mcp-local-test`) and the Pro listener (a separate `fluentformpro` branch + draft PR)
ship as two coordinated PRs. The free side is the contract; the Pro side is one optional consumer.

## Risks / Trade-offs

- **Cross-form bulk sets** add a grouping loop around `handleBulkActions`. Mitigated by keeping
  the grouping in the tool and calling the unchanged service per form.
- **Guard fingerprint staleness**: if entries change state between dry-run and confirm, the
  fingerprint (action + sorted in-scope ids + count) forces a fresh preview — consistent with
  the single-entry delete behavior.
- **Pro filter shape drift**: documented contracts above each `apply_filters` reduce this; tests
  assert the filters fire and that absence degrades gracefully.
- **CSS/JS sanitization**: relying on the existing WP-standard helpers means the MCP path is no
  weaker than the admin UI; the capability pre-check closes the raw-exception leak.

## Migration Plan

Purely additive. No data migration. On upgrade, the new-tools opt-in defaults off, so existing
MCP installs see no behavior change until an admin opts in. Existing Pro hooks remain functional.

## Open Questions

- None blocking. The exact native payment field keys surfaced by free core (D5) will be
  finalized against the Submission model during implementation, guarded by `isset()` so a wrong
  guess simply surfaces nothing rather than erroring.

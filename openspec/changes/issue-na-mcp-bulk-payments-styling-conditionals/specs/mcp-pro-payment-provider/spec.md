## ADDED Requirements

> Cross-repo note: these requirements are satisfied by a companion change in the
> **`fluentformpro`** repository (a separate git repo, default branch `dev`). FluentForm Pro
> consumes the free-core seams defined in `mcp-pro-extension-seam`; it MUST NOT register any new
> MCP tools, abilities, or endpoints. All Pro behavior here is output augmentation through the
> free-core filters only.

### Requirement: Pro injects payment context without new MCP endpoints

FluentForm Pro SHALL attach a single listener to the free-core `fluentform/mcp_submission_data`
filter (entry level) and `fluentform/mcp_submission_row` filter (list level) to add a compact
`payment` block to MCP entry output. Pro MUST NOT register new MCP abilities, tools, or server
endpoints — the existing `fluentform/mcp_loaded` / `fluentform/mcp_ability_names` seams are used
only for bootstrapping the listener, not for adding a tool catalogue entry.

#### Scenario: Paid entry gains a payment block
- **WHEN** a paid submission is read via `get-submission` and Pro's listener is active
- **THEN** the returned payload carries a `payment` block built from the Pro order data, and the
  free-core tool catalogue is unchanged (no Pro-registered tool appears)

#### Scenario: Non-payment entry is untouched
- **WHEN** the submission has no transactions or subscriptions
- **THEN** Pro returns the payload unchanged with no fabricated payment keys

### Requirement: Payment data is gated on the payments capability

Pro's listener SHALL verify `fluentform_view_payments` for the entry's form (via
`Acl::hasPermission('fluentform_view_payments', $formId)`) before injecting any payment data, and
MUST return the payload unchanged when the capability is absent. This is required because
`get-submission` and `list-submissions` are authorized by entry-view permission — not by the
payments capability — so payment data MUST NOT leak to an MCP user who can view entries but cannot
view payments.

#### Scenario: Entry-viewer without payments permission sees no payment data
- **WHEN** the MCP user can view entries but lacks `fluentform_view_payments` for the form
- **THEN** `get-submission` / `list-submissions` return the core payload with no `payment` block

#### Scenario: User with payments permission sees the payment block
- **WHEN** the MCP user holds `fluentform_view_payments` for the form
- **THEN** the `payment` block is injected for paid entries

### Requirement: Compact, formatted payment shape reusing existing Pro services

Pro's payment block SHALL be built by reusing `OrderData::getSummary()`,
`OrderData::getTransactions()`, and `OrderData::getSubscriptionsAndPaymentTotal()`, with monetary
amounts formatted via `PaymentHelper::formatMoney($cents, $currency)`. The block MUST be a compact,
agent-sized summary (status, formatted total, currency, payment method, transaction count, and —
when present — a subscription status), NOT the full admin order-data structure. Raw cents-only and
serialized vendor payloads MUST NOT be surfaced verbatim.

#### Scenario: Amounts are human-readable
- **WHEN** a payment block is injected
- **THEN** totals appear as formatted currency strings (e.g. `"$99.99"`) alongside the ISO
  currency code, not raw integer cents

#### Scenario: Subscription summary is included when relevant
- **WHEN** the entry has an associated subscription
- **THEN** the block includes the subscription status and billing interval in compact form

### Requirement: List-level payment summary stays lightweight

For `list-submissions`, Pro's `fluentform/mcp_submission_row` listener SHALL add at most a minimal
payment summary per row (e.g. payment status + formatted total) and MUST avoid per-row queries
that would cause an N+1 across the page. Pro SHOULD batch-load payment status for the page's entry
ids in one query and map onto the rows.

#### Scenario: A page of rows does not trigger per-row payment queries
- **WHEN** `list-submissions` returns a page of N rows for a payment-enabled form
- **THEN** Pro resolves payment summaries with a bounded number of queries independent of N

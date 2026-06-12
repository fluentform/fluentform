## ADDED Requirements

> Note (revised): these requirements are satisfied by **free core's**
> `Support\PaymentDataProvider` — the payment module (`app/Modules/Payments`: OrderData,
> PaymentHelper, transactions/subscriptions tables) lives in the free plugin, so the provider
> does too. An earlier draft placed it in `fluentformpro` on the false premise that payments were
> Pro-only. The seams stay open for Pro to augment with genuinely Pro-only data later; any such
> listener MUST NOT register new MCP tools, abilities, or endpoints, and MUST respect an already
> populated `payment` key.

### Requirement: A default provider injects payment context without new MCP endpoints

Free core SHALL attach a single listener to the `fluentform/mcp_submission_data` filter (entry
level) and `fluentform/mcp_submission_rows` filter (list level) to add a compact `payment` block
to MCP entry output. The provider MUST NOT register new MCP abilities, tools, or server
endpoints, and MUST NOT overwrite a `payment` key an addon listener already populated.

#### Scenario: Paid entry gains a payment block
- **WHEN** a paid submission is read via `get-submission` and the provider is active
- **THEN** the returned payload carries a `payment` block built from the core order data, and the
  tool catalogue is unchanged (no provider-registered tool appears)

#### Scenario: Non-payment entry is untouched
- **WHEN** the submission has no transactions or subscriptions
- **THEN** the provider returns the payload unchanged with no fabricated payment keys

### Requirement: Payment data is gated on the payments capability

The provider SHALL verify `fluentform_view_payments` for the entry's form (via
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

### Requirement: Compact, formatted payment shape reusing existing core services

The payment block SHALL be built by reusing core
`OrderData::getTransactions()` and `OrderData::getSubscriptionsAndPaymentTotal()`, with monetary
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

For `list-submissions`, the `fluentform/mcp_submission_rows` listener SHALL add at most a minimal
payment summary per row (e.g. payment status + formatted total) and MUST avoid per-row queries
that would cause an N+1 across the page. The provider SHOULD build the summaries from the
Submission models the seam passes, issuing no queries of its own.

#### Scenario: A page of rows does not trigger per-row payment queries
- **WHEN** `list-submissions` returns a page of N rows for a payment-enabled form
- **THEN** the provider resolves payment summaries with a bounded number of queries independent of N

### Requirement: Server-side payment summary tool

The system SHALL expose an advanced, read-only `get-payment-summary` tool that computes payment
totals server-side via the same `ReportHelper::getPaymentsByType` aggregation the admin Reports
page uses: amount and count per payment status, split into one-time and subscription
transactions, plus a combined paid total. The tool SHALL be gated on the
`fluentform_view_payments` capability, SHALL access-check a supplied `form_id` before passing it
to the report layer (which trusts non-zero ids), and SHALL fall back to the caller's allowed-forms
scope when `form_id` is omitted. When the payment module is disabled the tool SHALL return a
structured `feature_disabled` error rather than empty data.

#### Scenario: Paid total for one form
- **WHEN** the agent calls `get-payment-summary` with a `form_id` and a date window
- **THEN** the response carries the summed paid amount, per-status amounts and counts, and the
  decoded currency symbol — computed in SQL, accurate at any entry volume

#### Scenario: Site-wide totals respect form scope
- **WHEN** `form_id` is omitted by a "specific forms" manager
- **THEN** the aggregation covers only the forms in that manager's allowed scope

#### Scenario: Payment module off
- **WHEN** the payment module is disabled
- **THEN** the tool returns the `feature_disabled` error code instead of zeros

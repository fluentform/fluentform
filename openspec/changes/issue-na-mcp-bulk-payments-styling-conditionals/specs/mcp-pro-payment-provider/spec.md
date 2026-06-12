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

For `list-submissions`, Pro's `fluentform/mcp_submission_rows` listener SHALL add at most a minimal
payment summary per row (e.g. payment status + formatted total) and MUST avoid per-row queries
that would cause an N+1 across the page. Pro SHOULD batch-load payment status for the page's entry
ids in one query and map onto the rows.

#### Scenario: A page of rows does not trigger per-row payment queries
- **WHEN** `list-submissions` returns a page of N rows for a payment-enabled form
- **THEN** Pro resolves payment summaries with a bounded number of queries independent of N

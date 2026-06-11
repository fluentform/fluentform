## ADDED Requirements

### Requirement: Single guarded bulk-update tool

The system SHALL expose one MCP tool `fluentform/bulk-update-submissions` that applies a
single action to many entries at once. The tool MUST accept an `action` parameter constrained
to the enum `read`, `unread`, `spam`, `trashed`, `favorite`, `unfavorite`,
`delete_permanently`, and an `entry_ids` array of integers. The tool MUST be annotated
`destructive` (not `readonly`) and MUST route every execution through `Mutation::runGuarded`
(dry_run → confirm_token → idempotency_key) regardless of which action is chosen, because the
agent cannot know in advance which entries the bulk set contains.

#### Scenario: Reversible bulk status change executes after confirmation
- **WHEN** the agent calls the tool with `action: trashed`, a valid `entry_ids` list, and a
  matching `confirm_token` from a prior `dry_run`
- **THEN** the system marks exactly those entries `trashed` via
  `SubmissionService::handleBulkActions()` and returns a success envelope summarizing the count

#### Scenario: Destructive bulk delete requires the dry-run confirmation flow
- **WHEN** the agent calls the tool with `action: delete_permanently` and no `confirm_token`
- **THEN** the system returns a `confirmation_required` error and performs no deletion

### Requirement: Entry count is capped

The system SHALL reject or clamp a bulk request whose `entry_ids` count exceeds 200. The cap
MUST be enforced before any mutation runs and MUST surface the `LIMIT_EXCEEDED` error code so
the agent can split the batch.

#### Scenario: Over-cap request is refused
- **WHEN** the agent submits `entry_ids` containing 201 or more ids
- **THEN** the system returns a `LIMIT_EXCEEDED` error naming the 200 limit and mutates nothing

#### Scenario: At-cap request is accepted
- **WHEN** the agent submits exactly 200 valid `entry_ids` with a valid confirmation
- **THEN** the system proceeds with the bulk action

### Requirement: Per-entry form-scope re-assertion (IDOR-safe)

The system SHALL resolve each entry's real `form_id` from the database and check it against the
current user's form scope before that entry is included in the mutation. A "specific forms"
manager MUST NOT affect an entry on a form outside their assignment by passing its id. Scope
MUST NOT be trusted from any caller-supplied `form_id`.

#### Scenario: Out-of-scope entries are excluded
- **WHEN** a scoped user submits a mix of in-scope and out-of-scope `entry_ids`
- **THEN** the system applies the action only to in-scope entries and reports which ids were
  skipped, without leaking details of the out-of-scope entries

#### Scenario: Fully out-of-scope request is forbidden
- **WHEN** every submitted `entry_id` belongs to a form outside the user's scope
- **THEN** the system returns a `forbidden` error and mutates nothing

### Requirement: One audit record per bulk execution

The system SHALL write a single MCP audit row (component "MCP") for each executed bulk action,
capturing the actor, the tool, the resolved action, the affected entry count, and
success/failure — consistent with every other MCP mutation.

#### Scenario: Successful bulk action is audited
- **WHEN** a bulk action completes
- **THEN** an audit row is recorded with redacted params and a success status, and the tool
  call still succeeds even if the audit write fails

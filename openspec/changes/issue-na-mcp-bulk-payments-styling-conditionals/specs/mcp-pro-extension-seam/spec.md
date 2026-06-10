## ADDED Requirements

### Requirement: Entry-level output augmentation filter

The system SHALL apply a `fluentform/mcp_submission_data` filter to the assembled entry payload
in `get-submission` before it is returned, passing the payload plus the submission context, so
FluentForm Pro can inject payment, transactions, and subscription blocks. The filter contract
MUST be documented in a comment above the `apply_filters` call. Free core MUST surface any
payment-related fields only when present (isset-guarded) and MUST return a complete, valid
response when no listener is attached.

#### Scenario: Pro injects payment data into a single entry
- **WHEN** a Pro listener is attached and the agent calls `get-submission` for a paid entry
- **THEN** the returned entry payload includes the Pro-supplied payment block alongside the
  core fields

#### Scenario: Free core degrades gracefully without Pro
- **WHEN** no listener is attached to `fluentform/mcp_submission_data`
- **THEN** `get-submission` returns the standard core payload unchanged, with no payment keys
  fabricated

### Requirement: List-level output augmentation filter

The system SHALL apply a `fluentform/mcp_submission_row` filter to each compact row in
`list-submissions` before the rows are returned, so Pro can attach a per-row payment summary.
The contract MUST be documented above the `apply_filters` call.

#### Scenario: Pro augments list rows
- **WHEN** a Pro listener is attached and the agent calls `list-submissions`
- **THEN** each returned row carries the Pro-supplied summary in addition to the core columns

#### Scenario: Rows are unchanged without a listener
- **WHEN** no listener is attached to `fluentform/mcp_submission_row`
- **THEN** `list-submissions` returns the standard compact rows unchanged

### Requirement: Unified tool-definition injection filter

The system SHALL apply a `fluentform/mcp_tool_definitions` filter to the merged tool-definition
map so Pro can inject new tools or override existing definitions through one unified seam. The
existing `fluentform/mcp_loaded` action and `fluentform/mcp_ability_names` filter MUST be
retained for backwards compatibility. The contract MUST be documented above the `apply_filters`
call.

#### Scenario: Pro adds a tool through the unified seam
- **WHEN** a Pro listener adds a definition via `fluentform/mcp_tool_definitions`
- **THEN** the new tool is registered and appears in the catalogue and the server's ability list

#### Scenario: Back-compat hooks still fire
- **WHEN** a legacy listener uses `fluentform/mcp_loaded` and `fluentform/mcp_ability_names`
- **THEN** its abilities are still registered and exposed, unchanged by the new filter

## ADDED Requirements

### Requirement: New tool group is off by default

The system SHALL keep the new tool group (bulk-update-submissions, get/update-form-styling,
get/update-field-conditions) disabled until an administrator explicitly opts in via a control
on the FluentForm → Settings → MCP card. The opt-in state MUST default to off on a fresh
install and MUST persist in the MCP settings option. When the opt-in is off, the new tools MUST
NOT be registered as abilities and MUST NOT appear in the server's ability list or the settings
catalogue.

#### Scenario: New tools absent by default
- **WHEN** MCP is enabled but the new-tools opt-in has never been turned on
- **THEN** the catalogue and the server expose only the original tool set, and the new tools are
  not registered

#### Scenario: New tools appear after opt-in
- **WHEN** an administrator enables the new-tools opt-in
- **THEN** the new tools are registered and appear in the catalogue and the server's ability list

### Requirement: Opt-in stacks on top of existing gates

The system SHALL treat the new-tools opt-in as an additional gate layered above the master MCP
switch and the per-ability FluentForm permission checks. Enabling the opt-in MUST NOT bypass the
master switch or any per-ability permission; a user still needs the relevant FluentForm
capability to invoke a new tool.

#### Scenario: Master switch still governs the new tools
- **WHEN** the new-tools opt-in is on but the master MCP switch is off
- **THEN** the endpoint rejects requests and no new tool is reachable

#### Scenario: Per-ability permission still enforced
- **WHEN** the new-tools opt-in is on and a user without the entries-manage capability calls
  `bulk-update-submissions`
- **THEN** the tool's permission check denies the call

### Requirement: Opt-in change is admin-only

The system SHALL allow only a user who can `manage_options` to change the new-tools opt-in,
consistent with the master MCP switch. An unauthorized change attempt MUST fail closed and leave
the stored state unchanged.

#### Scenario: Non-admin cannot flip the opt-in
- **WHEN** a user lacking `manage_options` attempts to enable the new-tools opt-in
- **THEN** the change is rejected and the stored opt-in state is unchanged

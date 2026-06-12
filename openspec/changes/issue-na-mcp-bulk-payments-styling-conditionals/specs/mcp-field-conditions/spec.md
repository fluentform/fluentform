## ADDED Requirements

### Requirement: Read per-field conditional logic

The system SHALL expose a readonly MCP tool `fluentform/get-field-conditions` that returns a
compact, per-field view of the conditional logic configured on a form's fields. The tool MUST
be annotated `readonly`, MUST be form-scoped through `FormAccess`, and MUST present each field's
conditions in a token-lean shape (field key, enabled flag, and the rules), omitting fields that
carry no conditions.

#### Scenario: Conditions returned for an accessible form
- **WHEN** the agent calls `get-field-conditions` for an accessible form
- **THEN** the system returns each conditioned field with its enabled flag and rules in a
  success envelope

#### Scenario: Out-of-scope form is forbidden
- **WHEN** the agent calls `get-field-conditions` for a form outside the user's scope
- **THEN** the system returns a `forbidden` error

### Requirement: Write per-field conditional logic

The system SHALL expose a write tool `fluentform/update-field-conditions` that updates the
conditional logic of one or more fields with per-field granularity, routed through
`Mutation::run`. Only the targeted fields' conditions MUST change; other fields and the rest of
the form definition MUST be preserved. Inputs MUST be sanitized recursively with
`fluentFormSanitizer`. The write MUST be audited.

#### Scenario: Field conditions updated, other fields untouched
- **WHEN** the agent submits new conditions for one field on an accessible form
- **THEN** the system persists that field's conditions, leaves all other fields unchanged, and
  returns a success envelope

### Requirement: Rule shape and field-existence validation

The system SHALL validate every submitted rule before persisting: each rule MUST carry a
non-empty `field` and `operator`, and every referenced `field` MUST exist on the target form.
A request that fails validation MUST be rejected with `INVALID_PARAM` and MUST persist nothing.

#### Scenario: Missing field or operator is rejected
- **WHEN** a submitted rule omits `field` or `operator`
- **THEN** the system returns an `invalid_param` error naming the offending rule and persists
  nothing

#### Scenario: Reference to a non-existent field is rejected
- **WHEN** a rule references a `field` key that does not exist on the form
- **THEN** the system returns an `invalid_param` error identifying the unknown field and
  persists nothing

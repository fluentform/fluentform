## ADDED Requirements

### Requirement: Read a form's styling

The system SHALL expose a readonly MCP tool `fluentform/get-form-styling` that returns a form's
current theme (`styler_theme`), structured styles (`styler_styles`), and custom CSS/JS over
`Customizer::get()` and the styler preset meta. The tool MUST be annotated `readonly`, MUST be
form-scoped through `FormAccess`, and MUST resolve the form before returning anything.

#### Scenario: Styling returned for an accessible form
- **WHEN** the agent calls `get-form-styling` with a `form_id` the user may access
- **THEN** the system returns the theme, structured styles, and any custom CSS/JS in a success
  envelope

#### Scenario: Out-of-scope form is forbidden
- **WHEN** the agent calls `get-form-styling` for a form outside the user's scope
- **THEN** the system returns a `forbidden` error and reveals no styling

### Requirement: Write theme and structured styles

The system SHALL expose a write tool `fluentform/update-form-styling` that updates the form's
theme and structured `styler_styles`, routed through `Mutation::run`. Theme and structured
styles MUST always be writable (subject to form scope and the manage permission). Inputs MUST
be sanitized before persistence.

#### Scenario: Theme and structured styles update
- **WHEN** the agent calls `update-form-styling` with a new theme and structured styles for an
  accessible form
- **THEN** the system persists them via the styler preset / Customizer path and returns a
  success envelope, with the write audited

### Requirement: Capability-gated custom CSS/JS writes

The system SHALL allow writing custom CSS/JS through `update-form-styling` ONLY when WordPress
security permits it. Before delegating to `Customizer::store()`, the tool MUST pre-check
`fluentformCanUnfilteredHTML()` / the `unfiltered_html` capability and, when the capability is
absent, MUST return a clean `UNFILTERED_HTML_REQUIRED` forbidden error rather than letting
`Customizer::store()` throw a raw exception. CSS/JS that is written MUST be sanitized to WP
standards (the same `fluentformSanitizeCSS` / `fluentform_kses_js` path the admin UI uses).

#### Scenario: CSS/JS write refused without capability
- **WHEN** a user lacking `unfiltered_html` calls `update-form-styling` with `css` or `js`
- **THEN** the system returns an `UNFILTERED_HTML_REQUIRED` error, persists no CSS/JS, and does
  not surface an uncaught exception

#### Scenario: CSS/JS write allowed and sanitized with capability
- **WHEN** a user with `unfiltered_html` submits `css` and `js`
- **THEN** the system sanitizes both to WP standards and persists them via `Customizer::store()`

#### Scenario: Theme-only update is unaffected by the CSS/JS gate
- **WHEN** a user lacking `unfiltered_html` updates only theme/structured styles (no css/js)
- **THEN** the update succeeds, because the capability gate applies only to CSS/JS writes

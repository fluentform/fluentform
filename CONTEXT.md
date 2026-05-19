# FluentForm (Free)

Canonical glossary for the FluentForm free plugin — the WordPress form builder providing form creation, submission handling, conditional logic, basic integrations, and conversational forms. Published on WordPress.org.

> Draft seed terms extracted from the codebase. Confirm and refine via `/grill-with-docs`.

## Language

**Form**:
The form definition — its field schema, settings, conditional logic config, and integration configuration. Stored as a single row in the forms table.
_Avoid_: Template (Template is a saved form preset, not the live form)

**Submission**:
A single instance of someone submitting a Form. Stored in the submissions table. **Canonical term** — "Entry" appears in legacy code but should be migrated over time.
_Avoid_: Entry, Response, FormResponse

**Field**:
A single input element in a Form's schema (text, email, number, file, signature, etc.). Defined in the Form's field JSON; rendered as one form control.
_Avoid_: Input, Question (Question is conversational-form-specific)

**ConditionalLogic**:
Rules attached to a Field defining when it shows/hides/requires based on other Field values. Evaluated both client-side (UX) and server-side (validation).
_Avoid_: Visibility rules, Show-if logic

**ConversationalForm**:
A Form rendered in Typeform-style one-question-at-a-time mode. Same Form definition, alternate render path.
_Avoid_: Wizard, StepForm

**Notification**:
An outbound action triggered by a Submission — email, webhook, integration call. Configured per-Form.
_Avoid_: Action, Trigger

**Smartcode**:
A token-replacement placeholder (e.g. `{inputs.email}`, `{user.first_name}`) usable in Notification templates and Field default values. Resolved against the Submission + WP context.
_Avoid_: Shortcode (Shortcode is WP-level), Variable, Merge tag

**Acl**:
The capability-check abstraction (`Acl::verify('capability', $formId)`). Wraps `current_user_can()` with form-scoped overrides.
_Avoid_: Permission, Auth (too generic)

## Relationships

- A **Form** produces zero or more **Submissions**
- A **Form** contains one or more **Fields**
- A **Field** has zero or more **ConditionalLogic** rules
- A **Submission** triggers zero or more **Notifications**
- A **Form** has zero or more configured **Notifications**

## Example dialogue

> **Dev:** "If a Field has ConditionalLogic that hides it, do we still validate it on submit?"
> **Domain expert:** "No — the final Submission payload doesn't include hidden Fields. But the server re-evaluates ConditionalLogic to make sure the client wasn't lying about visibility. A required Field can't be skipped just by hiding it client-side."

## Flagged ambiguities

- **Submission vs Entry** — both appear in code. **Submission** is canonical (matches the table name and primary model). Migrate `Entry` usages opportunistically.

## ADDED Requirements

### Requirement: Vanilla runtime preserves current submission behavior
The system SHALL implement `resources/assets/public/form-submission.js` with plain JavaScript for core runtime behavior while preserving current observable behavior for submit, validation, ajax request, success/failure rendering, reset handling, and captcha lifecycle.

#### Scenario: Basic form submission parity
- **GIVEN** a single-step Fluent Form is rendered with jQuery loading mode set to `enabled` or `disabled`
- **WHEN** a user submits a valid Fluent Form with no special gateways
- **THEN** the runtime sends request fields required by `fluentform_submit` (`action`, `form_id`, and serialized `data`) with the same field names as the current implementation
- **AND** success response handling preserves current behavior for success message rendering, redirect, and hide-form/reset action paths

#### Scenario: Validation failure parity
- **GIVEN** a form has client-side validation rules and error placement settings configured
- **WHEN** client-side validation fails before ajax submission
- **THEN** validation errors are shown at the same target locations (`stackToBottom` or inline) as the current implementation
- **AND** first-error scrolling behavior targets the first invalid element or stack container as currently implemented

#### Scenario: Reinit and repeated form handling parity
- **GIVEN** a form instance has already been initialized once
- **WHEN** the form is reinitialized through the existing `ff_reinit` flow
- **THEN** runtime handlers are reattached once per form instance without duplicate submit/reset side effects

#### Scenario: Multi-step form page transition parity
- **GIVEN** a multi-step Fluent Form is loaded and jQuery loading mode is `disabled`
- **WHEN** a user advances or returns between steps
- **THEN** runtime step transition events (`ff_to_next_page`, `ff_to_prev_page`, `update_slider`) are emitted and consumed so visible step state changes without page reload
- **AND** step progress UI reflects the active step index

#### Scenario: Captcha reset after submission failure
- **GIVEN** a form includes at least one supported captcha provider (`g-recaptcha`, `h-captcha`, or `cf-turnstile`)
- **WHEN** ajax submission fails after captcha completion
- **THEN** the corresponding captcha widget is reset to an uncompleted state
- **AND** the user can complete captcha again and resubmit in the same page session

#### Scenario: File upload field payload parity
- **GIVEN** a form includes Fluent Forms upload fields with uploaded file preview items
- **WHEN** the user submits the form
- **THEN** submission payload includes uploaded file references in the same field naming shape as the current implementation (`<field_name>[]`)
- **AND** success and failure handling for the submission request follows the same runtime path as forms without file uploads

### Requirement: Runtime APIs remain stable for consumers
The system SHALL preserve externally consumed runtime interfaces currently relied on by Free/Pro scripts and custom integrations.

#### Scenario: Global app access remains available
- **GIVEN** another Free, Pro, or custom script obtains a form element reference
- **WHEN** that script calls `window.fluentFormApp(formElement)`
- **THEN** it receives a compatible runtime instance exposing methods consumed by dependent modules (`sendData`, `showFormSubmissionProgress`, `hideFormSubmissionProgress`, validator rule mutation helpers, and related runtime methods)

#### Scenario: Helper access remains available
- **GIVEN** runtime or dependent modules call `window.ff_helper` methods
- **WHEN** numeric and currency helper methods are used on field values
- **THEN** helper behavior remains compatible with existing numeric parsing and formatting flows

#### Scenario: Multi-step form page transition parity
- **GIVEN** a multi-step Fluent Form is loaded and jQuery is absent (or mode is `disabled`)
- **WHEN** a user advances to the next step via the step-next button
- **THEN** the runtime fires `ff_to_next_page` via the native event bus (and jQuery bridge when active)
- **AND** the visible step panel changes to the next step without page reload
- **AND** step progress indicator reflects the new step index

#### Scenario: Captcha reset after submission failure
- **GIVEN** a form with reCAPTCHA, hCaptcha, or Turnstile is displayed
- **WHEN** a server-side submission fails (non-validation error)
- **THEN** the captcha widget is reset to its initial uncompleted state
- **AND** the user can re-complete the captcha and resubmit without page reload

#### Scenario: File upload field included in submission payload
- **GIVEN** a form contains a Fluent Forms file upload field and the user has selected a file
- **WHEN** the user submits the form
- **THEN** the vanilla runtime sends the file via the same multipart/form-data mechanism as the current jQuery implementation
- **AND** server response is handled identically to the non-file submission success/failure path

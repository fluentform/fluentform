## ADDED Requirements

### Requirement: Legacy jQuery lifecycle events continue to fire
The system SHALL continue to emit legacy jQuery Fluent Forms lifecycle events with the same event names and compatible payloads for integration safety.

#### Scenario: Submission success bridge event
- **GIVEN** jQuery bridge is active and `window.jQuery` is available
- **WHEN** a form submission succeeds
- **THEN** jQuery listeners for `fluentform_submission_success` receive the same payload structure used by the current implementation (`form`, `config`, `response`)
- **AND** native event listeners continue to receive equivalent payload data

#### Scenario: Submission failure bridge event
- **GIVEN** jQuery bridge is active and `window.jQuery` is available
- **WHEN** a form submission fails
- **THEN** jQuery listeners for `fluentform_submission_failed` receive the same payload structure used by the current implementation (`form`, `response`, and `config` where present)
- **AND** failure handling order remains compatible for existing gateway handlers

#### Scenario: Init and reset bridge events
- **GIVEN** jQuery bridge is active and `window.jQuery` is available
- **WHEN** form runtime initializes or resets
- **THEN** jQuery listeners for `fluentform_init`, `fluentform_init_<formId>`, `fluentform_init_single`, and `fluentform_reset` continue to run with compatible arguments

### Requirement: Bridge must cover Free and Pro consumers
The system SHALL validate bridge compatibility against known Free and Pro consumer scripts before changing default jQuery dependency behavior.

#### Scenario: Pro payment/chat hooks stay functional
- **GIVEN** Pro modules subscribe to existing lifecycle events (payment handlers, chat field, gateway handlers)
- **WHEN** those modules run with bridge mode active
- **THEN** those handlers continue to execute without requiring integration code changes

#### Scenario: Free advanced/save-progress hooks stay functional
- **GIVEN** Free modules subscribe to init, step, reset, and submission events
- **WHEN** those modules run with bridge mode active
- **THEN** the same hooks continue to execute with compatible event payloads

#### Scenario: Step event bridge parity
- **GIVEN** a multi-step form is active and jQuery bridge is enabled
- **WHEN** runtime fires step transition events
- **THEN** jQuery listeners for `ff_to_next_page`, `ff_to_prev_page`, and `update_slider` are invoked with payloads compatible with current multi-step flows

#### Scenario: Bridge no-op when jQuery is unavailable
- **GIVEN** jQuery loading mode is `disabled` and `window.jQuery` is undefined
- **WHEN** runtime dispatches lifecycle events
- **THEN** the bridge layer skips jQuery emission without throwing runtime errors
- **AND** native event dispatch continues normally

#### Scenario: Step event bridge parity
- **GIVEN** a multi-step form is active and bridge mode is `auto` or `enabled`
- **WHEN** the runtime fires a step transition
- **THEN** jQuery listeners for `ff_to_next_page`, `ff_to_prev_page`, and `update_slider` receive
  the same arguments (formId, currentStep, totalSteps) as the current jQuery implementation
- **AND** native CustomEvent listeners on `document` also receive the equivalent event

#### Scenario: Bridge is a no-op when jQuery is absent (Disabled mode)
- **GIVEN** jQuery loading mode is `disabled` AND `window.jQuery` is `undefined` at runtime
- **WHEN** any lifecycle event is dispatched by the vanilla core
- **THEN** the bridge layer silently skips jQuery event emission without throwing a JavaScript error
- **AND** native CustomEvent listeners still receive the event normally

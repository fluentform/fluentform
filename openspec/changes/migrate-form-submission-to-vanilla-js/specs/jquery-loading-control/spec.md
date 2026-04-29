## ADDED Requirements

### Requirement: Runtime exposes jQuery loading mode control
The system SHALL provide an explicit interface to control jQuery loading for public Fluent Forms runtime.

The interface SHALL be a WordPress filter `fluentform/jquery_loading_mode` that accepts a string
value of `'auto'`, `'enabled'`, or `'disabled'` (case-insensitive). The default value SHALL be `'auto'`.

A Global Settings field (key: `ff_jquery_loading_mode`) MAY additionally expose the value as a
persisted option, falling back to the filter result when the option is absent.
The filter ALWAYS takes precedence over the stored option.

The value SHALL be read in `app/Modules/Component/Component.php` before `wp_register_script` /
`wp_enqueue_script` calls to determine whether `['jquery']` is listed as a dependency of the
`fluent-form-submission` script handle.

#### Scenario: Auto mode — jQuery required by an active integration
- **GIVEN** mode is `auto`
- **AND** at least one of the following is true at `wp_enqueue_scripts` time:
  - (a) a registered Fluent Forms Free or Pro public script handle declares `['jquery']` as a dependency, OR
  - (b) the filter `fluentform/jquery_loading_mode_required` returns `true`
- **WHEN** a page containing a Fluent Form loads
- **THEN** WordPress enqueues jQuery before `fluent-form-submission`
- **AND** the bridge emits both native CustomEvents and equivalent jQuery events

#### Scenario: Auto mode — jQuery not required
- **GIVEN** mode is `auto`
- **AND** no active Free or Pro script signals a jQuery requirement via the heuristics above
- **WHEN** a page containing a Fluent Form loads
- **THEN** WordPress does NOT add `jquery` to the dependency list of `fluent-form-submission`
- **AND** the vanilla core runs and native CustomEvents fire normally

#### Scenario: Enabled mode
- **GIVEN** mode is `enabled`
- **WHEN** a page containing a Fluent Form loads
- **THEN** jQuery is always enqueued as a dependency of `fluent-form-submission` regardless of other conditions
- **AND** all legacy jQuery lifecycle events are emitted via the bridge

#### Scenario: Disabled mode
- **GIVEN** mode is `disabled`
- **WHEN** a page containing a Fluent Form loads
- **THEN** `fluent-form-submission` is registered without `jquery` in its dependency list
- **AND** core submission runtime executes using only vanilla DOM/fetch APIs
- **AND** bridge layer silently skips jQuery calls when `window.jQuery` is undefined at runtime

#### Scenario: Disabled mode with active jQuery-dependent Pro consumer
- **GIVEN** mode is `disabled`
- **AND** a Pro script that subscribes to jQuery lifecycle events is active and enqueued
- **WHEN** the page loads
- **THEN** a one-time PHP notice is logged (or surfaced in the admin notices area):
  `"Fluent Forms: jQuery loading is Disabled but [script handle] may require jQuery"`
- **AND** the Pro script continues to be enqueued (it may fail silently at runtime since jQuery is absent)
- **AND** the vanilla core and native events continue to function normally

### Requirement: Dependency and side-effect audit is mandatory before release
The system SHALL produce and pass a dependency audit that covers Free and Pro public scripts
and their jQuery/event expectations.

#### Scenario: Audit coverage
- **GIVEN** the team is preparing a release for this migration
- **WHEN** the audit is complete
- **THEN** there is a verified matrix of every script handle that either (a) declares `jquery` as
  a dependency, or (b) subscribes to a Fluent Forms lifecycle event by name
- **AND** release gating confirms no unreviewed side effects from enqueue dependency changes

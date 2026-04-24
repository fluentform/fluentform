## Why

`resources/assets/public/form-submission.js` is tightly coupled to jQuery, which increases front-end payload, makes future maintenance harder, and blocks progressive migration to modern browser APIs. We need a spec-first migration that preserves existing behavior and Free/Pro integrations while introducing a controlled compatibility path for jQuery-dependent sites.

## What Changes

- Rebuild `form-submission.js` to use plain JavaScript for core form lifecycle, validation flow, ajax submission, captcha reset, error rendering, and reinit flows.
- Preserve all existing Fluent Forms runtime behavior, including current submit/reset handling, success/failure UX, recaptcha/hcaptcha/turnstile handling, and step-form interactions.
- Add an explicit compatibility layer so legacy jQuery lifecycle hooks and events continue to fire with the same event names and payload shape.
- Add a configurable loading option/interface to decide whether jQuery should be loaded for public form runtime.
- Define a dependency and side-effect audit across Free + Pro public scripts to prevent regressions from jQuery dependency changes.

## Capabilities

### New Capabilities
- `public-form-submission-runtime`: Define behaviorally equivalent vanilla JS submission runtime contract for Fluent Forms public forms.
- `jquery-compatibility-bridge`: Define a compatibility contract that continues firing legacy jQuery Fluent Forms events and hooks during/after migration.
- `jquery-loading-control`: Define how users/site owners can control public jQuery loading mode for Fluent Forms runtime.

### Modified Capabilities
- None.

## Impact

- Affected code: `resources/assets/public/form-submission.js`, related public scripts that subscribe to runtime events, and script registration/enqueue logic in `app/Modules/Component/Component.php`.
- Cross-plugin impact: Pro scripts under `/Volumes/Projects/work/forms/wp-content/plugins/fluentformpro/src/assets/public` and `/Volumes/Projects/work/forms/wp-content/plugins/fluentformpro/src/assets/js` that listen to existing jQuery events.
- Dependency impact: potential updates to script dependency declarations (`['jquery']`) and runtime package assumptions.
- QA impact: requires parity validation for Free and Pro flows and explicit regression checks for event consumers and gateway/payment handlers.

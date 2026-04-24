## 1. Discovery and Baseline Mapping

- [x] 1.1 Build a jQuery usage inventory from `resources/assets/public/form-submission.js` (network, event bus, DOM helpers, animation, deferred).
- [x] 1.2 Build Free consumer matrix for lifecycle events (`fluentform_init*`, `fluentform_submission_*`, `fluentform_reset`, `ff_reinit`, step events).
- [x] 1.3 Build Pro consumer matrix in `/Volumes/Projects/work/forms/wp-content/plugins/fluentformpro/src/assets/public` and `src/assets/js` for the same lifecycle events.
- [x] 1.4 Document current script dependency graph (`wp_register_script` / `wp_enqueue_script`) and identify jQuery hard dependencies.

## 2. Vanilla Core Migration (No Behavior Change)

- [x] 2.1 Extract submission runtime internals into native DOM/event/network helpers while keeping public API shape stable.
- [x] 2.2 Replace jQuery ajax/serialize/deferred operations with native equivalents that preserve payload and execution order.
- [ ] 2.3 Preserve existing error rendering, scrolling, captcha lifecycle, reset/reinit, and step interaction behavior.
- [x] 2.4 Keep existing integration entry points (`window.fluentFormApp`, `window.ff_helper`) backwards compatible.

## 3. jQuery Compatibility Bridge

- [x] 3.1 Add a centralized event bridge that dispatches both native events and legacy jQuery events with compatible payloads.
- [ ] 3.2 Verify event order and payload parity for `init`, `success`, `failed`, `reset`, `ff_reinit`, and step events.
- [ ] 3.3 Validate bridge behavior against Free modules (`fluentform-advanced`, `form-save-progress`, payment handler) and Pro modules (payment/chat/gateway scripts).
- [x] 3.4 Validate compatibility for all frontend scripts enqueued during form render (Free + Pro), including jQuery-bound listeners and script-specific next-action handlers.
- [x] 3.5 Validate direct runtime API calls from dependent scripts (`window.fluentFormApp(...)`, `window.ff_helper.*`, `formInstance.sendData/showFormSubmissionProgress/hideFormSubmissionProgress/addGlobalValidator`) remain behaviorally compatible.

## 4. jQuery Loading Option and Interface

- [x] 4.1 Define and implement loading modes: `Auto` (default), `Enabled`, `Disabled`.
- [x] 4.2 Add interface surface (settings/filter contract) to control runtime mode without code edits.
- [x] 4.3 Update script registration/enqueue logic to respect mode while preserving safe defaults.
- [x] 4.4 Add documentation notes for third-party developers about event bridge and mode behavior.
- [x] 4.5 Document the `fluentform/jquery_loading_mode` filter, the `fluentform/jquery_loading_mode_required` filter, the `ff_jquery_loading_mode` settings key, accepted enum values (`auto`/`enabled`/`disabled`), Auto mode heuristic, and bridge no-op behavior in Disabled mode. Place in inline PHPDoc on the enqueue method in `app/Modules/Component/Component.php` and a developer note in `/docs` or the spec readme.

## 5. Side-Effect Validation and Release Readiness

- [ ] 5.1 Run regression checklist for Free forms: simple, conditional, multi-step, captcha, upload, payment initiation, reset.
- [ ] 5.2 Run regression checklist for Pro flows: payment gateways, chat, save-progress, post update, file uploader paths.
- [ ] 5.3 Run build and asset verification for Free and Pro bundles and confirm no unintended package/dependency removals.
- [x] 5.4 Produce final risk log and rollback instructions (switch to `Enabled` mode / restore jQuery dependency path).
- [x] 5.5 Produce a final compatibility matrix mapping each enqueued frontend script (Free + Pro) to: lifecycle events consumed, direct runtime API calls used, validation evidence, and pass/fail status.

## Status Notes

- JS verification now covers bridge dispatch, public globals, instance cache lifecycle, submit success, submit failure, next-action, loading fallback, and the `ff_reinit` recursion guard in `tests/js/form-submission.test.js`.
- Browser verification now also confirms:
  - simple form `383` submits successfully in both `enabled` and `disabled` mode checks
  - the earlier `fluentform-advanced` init crash (`$theForm.attr(...)`) is resolved
  - the earlier payment-handler init crash (`instance.settings`) is resolved
- `2.3`, `3.2`, `3.3`, `5.1`, `5.2`, and `5.3` remain open because step-form parity, file-upload multipart parity, payment next-action/browser fixture coverage, and full Pro runtime verification still need deterministic browser/E2E coverage rather than unit-only checks.

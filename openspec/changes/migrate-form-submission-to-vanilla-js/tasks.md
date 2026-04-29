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
- [x] 2.5 Migrate `resources/assets/public/Pro/slider.js` to plain JS while preserving step navigation order, progress updates, focus/scroll handling, draft-step restore, and legacy step event payloads.

## 3. jQuery Compatibility Bridge

- [x] 3.1 Add a centralized event bridge that dispatches both native events and legacy jQuery events with compatible payloads.
- [ ] 3.2 Verify event order and payload parity for `init`, `success`, `failed`, `reset`, `ff_reinit`, and step events.
- [ ] 3.3 Validate bridge behavior against Free modules (`fluentform-advanced`, `form-save-progress`, payment handler) and Pro modules (payment/chat/gateway scripts).
- [x] 3.6 Close mixed payment-page bootstrap parity on landing page `54`, where the payment handlers are still internally jQuery-backed and must either fully migrate or reliably attach after vanilla runtime initialization.
- [ ] 3.7 Remove jQuery-only async validator/coupon-state assumptions from payment handlers while preserving existing inline gateway behavior and next-action contracts.
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
  - landing page `344` renders without `jquery-core` / `jquery-migrate` for the migrated advanced runtime
  - landing page `240` renders without `jquery-core` / `jquery-migrate`, and next/previous step navigation works after the `slider.js` migration
  - landing page `86` renders date fields without jQuery, and the input receives a live `_flatpickr` instance
  - save-progress runtime works from landing page `54`, even though that page still legitimately loads jQuery for other legacy Pro features
  - save-progress JS coverage now also proves native `ff_to_next_page` tracking and restored-draft slider handoff without jQuery, which closes the step-transition/draft-restore checklist item
  - payment-method radio visibility logic is now migrated off jQuery in the Free shared handler and Pro legacy handler, with focused JS coverage for inline wrapper toggling
  - payment handlers now use native hidden coupon-state helpers, Promise-based inline validator flows, and fetch-based coupon apply requests in the Free shared handler plus the mirrored Pro payment handlers
  - duplicate `payment_method` components on mixed landing page `54` were traced as the reason backend Stripe routing still returned hosted checkout even while inline UI rendered
  - resolving the duplicate `payment_method` conflict restores the expected inline-vs-hosted routing on the enabled/jQuery runtime path
  - disabled-mode payment bootstrap inconsistency on landing page `54` was traced to stale cached payment-handler assets still loading under the unchanged `?ver=6.2.2` URL after local rebuilds
  - payment-handler enqueue versions now use built asset `filemtime(...)` for the Free/Pro payment scripts, which forces the browser onto the rebuilt handler after each local change
  - with the fresh asset URL in place, repeated disabled-mode reload checks on landing page `54` now deterministically show `data-ff-payment-bootstrap=\"done\"`, the hidden coupon-state field (`.__ff_all_applied_coupons`), and a mounted Stripe iframe
  - disabled-mode submit verification on landing page `54` now stays on the inline Stripe path and shows the expected inline validation error (`Your card number is incomplete.`) instead of falling back to hosted checkout or a missing bootstrap state
  - PayPal submit behavior on landing page `54` now matches between `disabled` and `enabled` modes: both return the same business-rule error (`PayPal does not support subscriptions payment and single amount payment at one request`), which narrows the remaining gap to successful paid gateway completion rather than generic payment submit wiring
  - payment summary rendering now matches between `disabled` and `enabled` modes on landing page `54`, including the rendered line items and `$29.99` total while the fallback summary stays hidden
  - invalid coupon behavior now matches between `disabled` and `enabled` modes on landing page `54` (`Coupon could not be applied right now.`)
  - one real Stripe success-path submit was completed on the `disabled` fixture, producing an on-page success state without stack errors or Stripe inline errors
  - one matching Stripe success-path submit was completed on the `enabled` fixture, producing the same on-page success state, the same rendered payment summary, and no stack errors or Stripe inline errors
  - step fixture `240` now has deterministic next/previous event-order proof from the shared slider runtime:
    - `ff_to_next_page` emits to the form target before `document`
    - `ff_to_prev_page` emits to the form target before `document`
  - fixture `240` begins with a dedicated intro `step_start` screen, so the first `Next` intentionally advances without validation; the required `book_title` check starts on the second `Next`, and a regression test now locks that intro-step behavior into the vanilla slider runtime
  - native validator coverage now proves inline error rendering and `scrollToFirstError()` targeting after validation failure, so the remaining step parity gap is browser-level focus/scroll feel rather than missing validation hooks
  - native step-form reset now emits the legacy `update_slider` payload before `fluentform_reset`, and server-side step validation errors now emit the same legacy jump-back `update_slider` payload as the jQuery runtime
  - failed-submit captcha reset coverage now includes all three supported providers in the JS suite: reCAPTCHA, hCaptcha, and Turnstile
  - core file-upload submission coverage now proves uploaded preview references serialize in the existing `<field_name>[]` shape and that submit is blocked while `.ff_uploading` is present
  - live upload fixture `234` now proves the real AJAX uploader accepts a PDF, rejects invalid file types, and removes uploaded temp files through the delete endpoint
  - browser-visible upload proof on fixture `234` now also proves preview rendering, `100% Completed` progress, and remove/reset behavior after fixing the shared `max_file_count = -1` unlimited-upload bug in `resources/assets/public/Pro/file-uploader.js`
  - legacy trace confirms ordinary vanilla-equivalent `Next` / `Previous` navigation should not emit `update_slider`; the event remains a reset/error-step compatibility hook instead of a per-click navigation event
- Current active payment slice:
  - keep the filemtime-based payment asset versioning in place while tracing deeper payment summary / next-action runtime startup on landing page `54`
  - decide whether payment pages can leave the jQuery-required path now that bootstrap, inline validation, summary rendering, coupon behavior, PayPal business-rule behavior, and matching Stripe success-path submits all align between `disabled` and `enabled`
- `2.3`, `3.2`, `3.3`, `3.7`, `5.1`, `5.2`, and `5.3` remain open because browser-level step focus/scroll feel parity, real captcha re-complete/resubmit fixture proof, larger Pro uploader/vendor stack verification, payment next-action/browser fixture coverage, payment-handler async/coupon internals, and full Pro runtime verification still need deterministic browser/E2E coverage rather than unit-only checks.

## Remaining Execution Plan

Purpose: turn the remaining open tasks into an implementation order that closes the highest-risk runtime gaps first, then continues the plain-JS migration of dependent files.

## Current state

Completed foundation:
- Core submission runtime has a vanilla path in `resources/assets/public/form-submission.js`.
- jQuery loading modes (`auto` / `enabled` / `disabled`) are implemented.
- Event bridge emits legacy jQuery events and native events safely.
- Direct runtime APIs remain available: `window.fluentFormApp(...)`, `window.ff_helper`, validator/progress helpers.
- `resources/assets/public/Pro/calculations.js` is migrated to plain JS internally.

Still open at task level:
- `2.3`
- `3.2`
- `3.3`
- `5.1`
- `5.2`
- `5.3`

## Phase 1: Close runtime parity blockers

Goal: prove the current runtime is behaviorally safe before migrating more dependent files.

### 1.1 Step-form parity and landing-page proof

Target concerns:
- `ff_to_next_page`
- `ff_to_prev_page`
- `update_slider`
- progress indicator timing
- keyboard and button navigation order
- landing-page/preview-page script isolation for step fixtures

Files to verify:
- `resources/assets/public/form-submission.js`
- `resources/assets/public/fluentform-advanced.js`
- `resources/assets/public/form-save-progress.js`
- `resources/assets/public/Pro/slider.js`

Required output:
- deterministic browser fixture for a non-conversational multi-step form
- clean Fluent Forms-owned fixture surface (landing page or preview page) that minimizes theme/plugin script noise
- event-order notes added to `enqueued-frontend-js-compat-matrix.md`
- `tasks.md` updates for `2.3` and `3.2` once proven

### 1.2 Captcha failure/reset parity

Target concerns:
- reCAPTCHA reset after failed submit
- hCaptcha reset after failed submit
- Turnstile reset after failed submit
- retry without page reload

Files to verify:
- `resources/assets/public/form-submission.js`

Required output:
- deterministic failed-submit fixture
- evidence note in `enqueued-frontend-js-compat-matrix.md`

### 1.3 File-upload parity

Target concerns:
- multipart payload shape
- pending upload handling
- reset behavior
- uploader-related side effects

Files to verify:
- `resources/assets/public/form-submission.js`
- `resources/assets/public/Pro/file-uploader.js`
- Pro uploader stack handles in `fluentformpro`

Required output:
- fixture with visible file input
- network proof for multipart/form-data parity
- RISK/PASS updates in compatibility matrix

### 1.4 Payment next-action parity

Target concerns:
- Free payment next-action flow
- Pro gateway next-action flow
- validator/progress UI parity

Files to verify:
- `resources/assets/public/payment_handler.js`
- `../fluentformpro/src/assets/public/payment_handler.js`
- `../fluentformpro/src/assets/public/payment_handler_pro.js`
- `../fluentformpro/src/assets/public/razorpay_handler.js`
- `../fluentformpro/src/assets/public/paystack_handler.js`
- `../fluentformpro/src/assets/public/authorizenet_accept_handler.js`

Required output:
- mocked or real gateway fixtures
- event payload notes in compatibility matrix
- honest PASS / STATIC-ONLY / RISK updates

## Phase 2: Migrate next plain-JS dependent files

Only start after Phase 1 produces enough confidence for step/event/runtime behavior.

### 2.1 Migrate `resources/assets/public/Pro/slider.js`

Why next:
- largest remaining Fluent Forms-owned jQuery blocker for ordinary step forms
- directly controls the event sequence other modules depend on
- unlocks real no-jQuery proof for step-form landing pages after core submission runtime

Acceptance:
- no direct jQuery dependency in migrated slider internals
- preserves `ff_to_next_page`, `ff_to_prev_page`, and `update_slider` payload shape and order
- preserves progress indicator timing, keyboard flow, focus/scroll behavior, and step restore behavior
- works in `enabled` and `disabled` modes through the central bridge/runtime APIs
- JS coverage added where practical

### 2.2 Migrate `fluentform-advanced.js`

Why next:
- central internal consumer
- relatively small compared to payment and slider runtimes
- can use `window.fluentFormBridge.onEvent(...)`

Acceptance:
- no direct jQuery calls in migrated code paths
- works in `enabled` and `disabled` modes
- dynamic smartcode and `update_slider` behavior still work
- JS coverage added where practical

### 2.3 Migrate `form-save-progress.js`

Why next:
- clear event-driven module
- depends heavily on step parity already being proven

Acceptance:
- no direct jQuery dependency in module logic
- save-progress still works through step transitions
- draft restore timing verified

### 2.4 Migrate small Pro gateway handlers

Targets:
- `../fluentformpro/src/assets/public/razorpay_handler.js`
- `../fluentformpro/src/assets/public/paystack_handler.js`

Acceptance:
- plain-JS internals
- works with bridge/runtime APIs only
- next-action flow verified

### 2.5 Reassess larger migrations

Do not start until earlier phases are closed:
- `resources/assets/public/payment_handler.js`
- `../fluentformpro/src/assets/public/payment_handler_pro.js`
- `../fluentformpro/src/assets/public/payment_handler.js`
- `../fluentformpro/src/assets/js/fluentformproPostUpdate.js`

## Phase 3: Replacement projects instead of direct migration

These should be handled as dedicated replacements, not line-by-line conversions:
- `resources/assets/libs/jquery.mask.min.js`
- `../fluentformpro/src/assets/libs/rangeslider/rangeslider.js`
- `../fluentformpro/src/assets/libs/jQuery-File-Upload-10.32.0/js/vendor/jquery.ui.widget.js`
- `../fluentformpro/src/assets/libs/jQuery-File-Upload-10.32.0/js/jquery.iframe-transport.js`
- `../fluentformpro/src/assets/libs/jQuery-File-Upload-10.32.0/js/jquery.fileupload.js`
- `../fluentformpro/src/assets/libs/lity/lity.min.js`

## Definition of done for the remaining change

The change is only fully done when all of the following are true:
- `tasks.md` has no open items for `2.3`, `3.2`, `3.3`, `5.1`, `5.2`, `5.3`
- compatibility matrix rows are updated with runtime-backed evidence where required
- remaining plain-JS-now targets are migrated or intentionally deferred with reason
- browser/E2E checks cover steps, captcha reset, file upload, and payment next-actions
- `npm run test:js` passes
- `npm run dev` passes
- rollback remains:

```php
add_filter('fluentform/jquery_loading_mode', fn() => 'enabled');
```

## Immediate next action

Start with Phase 1.1:
- use a Fluent Forms-owned landing page or preview surface for a deterministic step fixture
- prove `ff_to_next_page`, `ff_to_prev_page`, and `update_slider`
- then migrate `resources/assets/public/Pro/slider.js`

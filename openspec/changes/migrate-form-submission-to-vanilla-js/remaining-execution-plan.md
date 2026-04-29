## Remaining Execution Plan

Purpose: turn the remaining open tasks into an implementation order that closes the highest-risk runtime gaps first, then continues the plain-JS migration of dependent files.

Primary execution artifact:
- `verification-checklist.md` is the one-by-one checklist for runtime proof and remaining migration tasks.
- `completion-test-plan.md` is the guarded completion plan: what to migrate now, what to test, and what to defer as replacement work.

## Current state

Completed foundation:
- Core submission runtime has a vanilla path in `resources/assets/public/form-submission.js`.
- jQuery loading modes (`auto` / `enabled` / `disabled`) are implemented.
- Event bridge emits legacy jQuery events and native events safely.
- Direct runtime APIs remain available: `window.fluentFormApp(...)`, `window.ff_helper`, validator/progress helpers.
- `resources/assets/public/Pro/calculations.js` is migrated to plain JS internally.
- `resources/assets/public/Pro/slider.js` is migrated to plain JS internally.
- `resources/assets/public/form-save-progress.js` is migrated to plain JS internally.
- Save-progress evidence now covers live UI on landing fixture `54` plus native step tracking and restored-draft slider handoff in JS coverage.
- Date-field runtime in `app/Services/FormBuilder/Components/DateTime.php` no longer requires jQuery for `flatpickr` init.
- Global Settings now expose the `ff_jquery_loading_mode` control.

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

Current note:
- fixture `240` now has deterministic proof for the shared slider navigation event order:
  - `ff_to_next_page`: form target, then `document`
  - `ff_to_prev_page`: form target, then `document`
- fixture `240` begins with a dedicated intro `step_start` screen, so the first `Next` is expected to advance without validation; required-field validation on `book_title` begins on the second `Next`, and that distinction now has regression coverage
- native validator coverage now proves inline error rendering and `scrollToFirstError()` targeting after validation failure; the remaining open step-runtime question is browser-level focus/scroll feel parity
- native reset now also preserves the legacy `update_slider` contract before `fluentform_reset`
- native submit handling now also preserves the legacy `update_slider` jump-back contract for server-side step validation errors
- legacy trace confirms ordinary vanilla-equivalent `Next` / `Previous` clicks should not emit `update_slider`; that event remains a reset/error-step compatibility hook rather than a per-click navigation event

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

Current note:
- JS coverage now proves failed-submit reset calls for all three supported providers:
  - reCAPTCHA
  - hCaptcha
  - Turnstile
- The remaining work is browser-session proof that a user can re-complete the widget and resubmit without reloading the page.

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

Current note:
- JS coverage now proves the core vanilla submission runtime still:
  - serializes uploaded preview references in the existing `<field_name>[]` shape
  - blocks submit while `.ff_uploading` is present
- upload fixture `?ff_landing=234&ffjqmode=disabled` is now prepared and confirmed to render the visible `file-upload` field on step 2
- real endpoint verification on fixture `234` now proves:
  - multipart upload to `fluentform_file_upload` succeeds with the live nonce
  - invalid file types are rejected by the live validator
  - uploaded temp files can be removed through `fluentform_delete_uploaded_file`
- browser-visible proof on fixture `234` now also proves:
  - selecting `general.pdf` sends the real `admin-ajax.php` upload request
  - preview UI renders with the uploaded file name
  - progress reaches `100% Completed`
  - remove/reset clears the preview list again
- Root cause for the missing browser upload was a shared frontend bug in `resources/assets/public/Pro/file-uploader.js`: `max_file_count = -1` was being treated as “over the limit” instead of “unlimited”, so valid files were cleared before preview/upload started.
- The same live fixture still loads `jquery-core`, `jquery-migrate`, `jquery.ui.widget`, `jquery.iframe-transport`, and `jquery.fileupload` in `disabled` mode, so upload pages remain on the jQuery-required path until the Pro vendor stack is replaced or isolated.
- The remaining work is now the larger Pro uploader/vendor stack validation/replacement rather than the shared preview/progress/reset path.

### 1.4 Payment next-action parity

Target concerns:
- Free payment next-action flow
- Pro gateway next-action flow
- validator/progress UI parity
- late-loader bootstrap parity when jQuery-backed payment scripts attach after the vanilla runtime already initialized the form in `disabled` mode
- duplicate `payment_method` field conflicts that can mask the true processor selection during runtime verification
- inconsistent disabled-mode payment bootstrap timing on mixed landing-page fixtures

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
- proof that already-loaded payment forms still bootstrap when payment scripts load after native form initialization
- explicit decision on which payment paths remain `jquery-required` until their internals are migrated
- proof that mixed fixtures with multiple payment items but a single active `payment_method` field do not regress from inline to hosted routing

## Phase 2: Migrate next plain-JS dependent files

Only start after Phase 1 produces enough confidence for the still-open event/runtime behavior.

### 2.1 Refresh step/event parity evidence after `slider.js` migration

Why next:
- `slider.js` is already migrated, but the compatibility matrix and task list still need deterministic parity evidence for step event order/payloads.
- step forms are now clean on landing-page fixtures, so the remaining work is proof and matrix closure rather than implementation.

Acceptance:
- deterministic evidence for `ff_to_next_page`, `ff_to_prev_page`, and `update_slider`
- compatibility matrix updated with runtime-backed status for `slider.js`
- `tasks.md` reflects the implementation as done and parity proof as still open where applicable

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

### 2.3 Save-progress runtime evidence

Status:
- implementation and proof are now strong enough to treat save-progress as runtime-backed for:
  - live save-progress UI on landing fixture `54`
  - native `ff_to_next_page` step tracking
  - restored-draft slider handoff

Keep watching:
- if a later step/captcha/upload fixture reveals a save-progress timing regression, reopen this item with that concrete fixture rather than treating it as broadly unresolved.

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

Payment-specific note:
- the payment handlers are still heavily jQuery-bound internally, even after bootstrap hardening.
- the earlier disabled-mode fresh-navigation race on landing page `54` was traced to stale cached payment-handler assets loading under the unchanged `?ver=6.2.2` URL after rebuilds; enqueue versions now use built asset `filemtime(...)` for the Free/Pro payment handlers so the browser always fetches the rebuilt script.
- The next internal payment slice is:
  1. decide whether payment pages can leave the jQuery-required path now that landing page `54` has matching `disabled` and `enabled` success-path behavior for the verified Stripe fixture
  2. trace payment summary startup / next-action runtime order only if another payment fixture still diverges
  3. then move back to the remaining non-payment blockers: step events, captcha reset, and file upload parity

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
- `tasks.md` has no open items for `2.3`, `3.2`, `3.3`, `3.7`, `5.1`, `5.2`, `5.3`
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

Current active work:
- keep the plan/docs honest about what is complete vs still risky
- keep the duplicate-payment-method routing fix in place for both Free and Pro payment action classes
- keep the mixed payment-page bootstrap/runtime fix on landing page `54` in place, including the filemtime-based payment-handler asset versioning
- keep the completed payment-handler internal slices in place:
  - coupon-state bootstrap/idempotency helpers
  - async validator Promise conversion
  - coupon AJAX/apply/remove replacement
- follow `completion-test-plan.md` in this order:
  1. close step/captcha/upload runtime parity
  2. decide whether payment pages can leave the jQuery-required path
  3. migrate small owned consumers (`fluentform-advanced`, chat, Razorpay, Paystack)
  4. defer vendor/plugin stacks to replacement projects

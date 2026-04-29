# jQuery to JS Migration Verification Checklist

Purpose: keep the remaining migration work as a single checklist we can complete one item at a time with clear runtime proof.

## Completed runtime checks

- [x] Core submission runtime works in `disabled` mode on a simple landing-page fixture.
- [x] Advanced runtime landing fixture `344` works without `jquery-core` / `jquery-migrate`.
- [x] Step landing fixture `240` works without `jquery-core` / `jquery-migrate`.
- [x] Step next/previous navigation works on landing fixture `240`.
- [x] Date field fixture `86` initializes `flatpickr` without jQuery.
- [x] Save-progress runtime works on landing fixture `54`.
- [x] Mixed payment fixture `54` no longer has the old `instance.settings` payment init crash.
- [x] Duplicate/conflicting `payment_method` routing issue is fixed so inline Stripe is no longer silently routed to hosted checkout by the backend.
- [x] Mixed payment fixture `54` now bootstraps deterministically in `disabled` mode after payment-handler asset versioning switched to built-file `filemtime(...)`.
- [x] Mixed payment fixture `54` now shows:
  - `data-ff-payment-bootstrap="done"`
  - hidden coupon-state field `.__ff_all_applied_coupons`
  - mounted Stripe iframe
- [x] Stripe inline validation path works in `disabled` mode on landing fixture `54`.
- [x] Payment summary render matches between `disabled` and `enabled` modes on landing fixture `54`.
- [x] Invalid coupon response matches between `disabled` and `enabled` modes on landing fixture `54`.
- [x] PayPal business-rule error matches between `disabled` and `enabled` modes on landing fixture `54`.
- [x] One real Stripe success-path submit was completed on landing fixture `54` in `disabled` mode.

## Open verification items

### Completion-plan source

- [x] Use `completion-test-plan.md` as the source for the remaining order: runtime parity, payment decision, small owned migrations, replacement backlog.
- [ ] Keep this checklist in sync when a PASS / STATIC-ONLY / RISK status changes in `enqueued-frontend-js-compat-matrix.md`.

### Payment parity

- [x] Run one matching successful Stripe submit on landing fixture `54` in `enabled` mode and compare final behavior with `disabled`.
- [ ] Decide whether payment pages can leave the jQuery-required path after the `enabled` vs `disabled` success-path comparison and Pro gateway checks.
- [ ] Verify or mock Razorpay next-action behavior without relying on jQuery init timing.
- [ ] Verify or mock Paystack next-action behavior without relying on jQuery init timing.
- [ ] If any payment handle still requires jQuery, record the exact handle and keep that path guarded by Auto/jQuery-required mode.

### Step/runtime parity

- [x] Record deterministic event-order proof for:
  - `ff_to_next_page`
  - `ff_to_prev_page`
- [x] Decide whether `update_slider` is still required during ordinary vanilla `Next` / `Previous` clicks, or should remain a legacy compatibility event for reset/external slider triggers only.
- [ ] Confirm step focus/scroll behavior still matches legacy runtime after validation failure.
- [x] Confirm save-progress through step transitions and restored-draft timing on a step fixture.

### Captcha parity

- [ ] Verify reCAPTCHA reset after failed submit without page reload.
- [ ] Verify hCaptcha reset after failed submit without page reload.
- [ ] Verify Turnstile reset after failed submit without page reload.

### File upload parity

- [x] Verify multipart payload shape on a real upload fixture.
- [x] Verify pending-upload blocking behavior during submit.
- [x] Verify reset behavior after upload flow.

### Remaining migration/replacement targets

- [ ] Reassess `resources/assets/public/payment_handler.js` after final payment parity proof.
- [ ] Reassess `../fluentformpro/src/assets/public/payment_handler_pro.js` after final payment parity proof.
- [ ] Reassess `../fluentformpro/src/assets/public/payment_handler.js` after final payment parity proof.
- [ ] Migrate `resources/assets/public/fluentform-advanced.js` to plain-JS internals.
- [ ] Verify browser focus/scroll proof for migrated `resources/assets/public/Pro/slider.js`.
- [x] Verify runtime proof for migrated `resources/assets/public/form-save-progress.js`.
- [ ] Migrate and verify `../fluentformpro/src/assets/js/chatFieldScript.js`.
- [ ] Migrate and verify:
  - `../fluentformpro/src/assets/public/razorpay_handler.js`
  - `../fluentformpro/src/assets/public/paystack_handler.js`

### Replacement-project backlog

- [ ] Replace or isolate `resources/assets/libs/jquery.mask.min.js`.
- [ ] Replace or isolate `../fluentformpro/src/assets/libs/rangeslider/rangeslider.js`.
- [ ] Replace uploader vendor stack:
  - `../fluentformpro/src/assets/libs/jQuery-File-Upload-10.32.0/js/vendor/jquery.ui.widget.js`
  - `../fluentformpro/src/assets/libs/jQuery-File-Upload-10.32.0/js/jquery.iframe-transport.js`
  - `../fluentformpro/src/assets/libs/jQuery-File-Upload-10.32.0/js/jquery.fileupload.js`
- [ ] Replace or isolate `../fluentformpro/src/assets/libs/lity/lity.min.js`.
- [ ] Keep admin Vue jQuery cleanup out of this public-form migration unless a separate admin refactor is opened.

### Release-readiness checks

- [ ] Run final Free regression checklist:
  - simple
  - conditional
  - multi-step
  - captcha
  - upload
  - payment initiation
  - reset
- [ ] Run final Pro regression checklist:
  - payment gateways
  - chat
  - save-progress
  - post update
  - file uploader paths
- [ ] Run final build and asset verification for Free and Pro.

## Notes

- The strange success-message content on form `54` is fixture configuration, not a runtime migration bug.
- Matching successful Stripe submits now complete in both `disabled` and `enabled` modes on landing fixture `54`, with the same on-page success state, the same summary state, and no stack errors or inline Stripe card errors.
- Step fixture `240` now has runtime-backed proof for the shared slider navigation event order:
  - `ff_to_next_page` emits to the form target first, then to `document`
  - `ff_to_prev_page` emits to the form target first, then to `document`
- Step fixture `240` starts with a real intro `step_start` screen, so the first `Next` is expected to move into the first data step without validation; validation for required field `book_title` begins on the second `Next`, and a regression test now locks that behavior in for the vanilla slider path.
- Native validator coverage now proves inline error rendering plus `scrollToFirstError()` targeting after validation failure; the remaining open piece is browser-level focus/scroll feel parity, not missing validation or missing scroll calls.
- Native step-form reset now emits the legacy `update_slider` payload before `fluentform_reset`, and server-side step validation errors now emit the same legacy `update_slider` jump-back payload used by the jQuery runtime.
- Legacy trace confirms ordinary `Next` / `Previous` clicks did not emit `update_slider`; the event remains a reset/error-step compatibility hook rather than a per-click navigation event.
- Save-progress now has runtime-backed evidence from both sides of the flow:
  - live save-progress UI works on landing fixture `54`
  - JS coverage proves native `ff_to_next_page` step tracking and restored-draft slider handoff without jQuery
- Captcha reset provider logic is now covered in JS for all three supported providers after failed submit:
  - reCAPTCHA
  - hCaptcha
  - Turnstile
- The remaining captcha gap is browser-session proof that a user can re-complete the widget and resubmit in the same page session on a real fixture.
- Core file-upload submission behavior is now covered in JS for the vanilla runtime:
  - uploaded preview references are serialized in the existing `<field_name>[]` shape
  - submit is blocked while `.ff_uploading` is present
- Clean browser upload fixture is now prepared:
  - `?ff_landing=234&ffjqmode=disabled`
  - visible file input `file-upload` renders on the landing page in step 2
- Real upload endpoint proof now exists on fixture `234`:
  - PDF upload to `fluentform_file_upload` succeeds with the real form nonce
  - invalid non-PDF upload is rejected with the expected `allowed_file_types` validation error
  - uploaded temp file can be removed through `fluentform_delete_uploaded_file`
- Browser-visible upload proof now exists on fixture `234` after fixing unlimited-upload handling in `resources/assets/public/Pro/file-uploader.js`:
  - `max_file_count = -1` is now treated as unlimited instead of silently rejecting every file before the AJAX request
  - selecting `general.pdf` now sends the real `admin-ajax.php` upload request
  - preview UI renders the uploaded file name
  - progress reaches `100% Completed`
  - remove/reset clears the preview list again
- The remaining file-upload gap is now concentrated in the larger Pro uploader/vendor stack behavior rather than the shared browser preview/progress/reset flow.

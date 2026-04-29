## Plain JS Migration Backlog

Purpose: classify frontend form-render JS by the safest migration path while preserving legacy jQuery compatibility when jQuery loading mode is `enabled` or `auto`.

Core rule for migratable runtime files:
- Keep business logic and DOM work in plain JS.
- Keep legacy jQuery support behind the compatibility bridge and stable runtime APIs.
- Do not line-by-line convert old third-party jQuery plugin stacks; replace or isolate them instead.

### Group 1: Plain JS now

These files are realistic next-step migration targets because they are mostly event-driven runtime logic, field logic, or DOM updates rather than deep jQuery plugin integrations.

| File | Why it is a good candidate | Main compatibility concerns | Required proof before marking done |
|---|---|---|---|
| `resources/assets/public/fluentform-advanced.js` | Small-to-medium runtime helper; mostly reacts to `fluentform_init` and `update_slider` | Must preserve legacy event arguments and slider update timing | Browser proof for `update_slider` parity on step forms |
| `../fluentformpro/src/assets/js/chatFieldScript.js` | Event-driven UI controller; form submit success/failure reactions are straightforward | Needs the same submit lifecycle payloads and button-state timing | Browser proof on real chat field form |
| `../fluentformpro/src/assets/public/razorpay_handler.js` | Small gateway-specific handler with limited surface area | `fluentform_init_single` and `fluentform_next_action_razorpay` parity | Real gateway next-action fixture or mocked browser flow |
| `../fluentformpro/src/assets/public/paystack_handler.js` | Similar to Razorpay; compact and event-driven | `fluentform_init_single` and `fluentform_next_action_paystack` parity | Real or mocked gateway next-action proof |

### Group 1A: Already migrated to plain JS

These files now run with plain-JS internals and rely on the main runtime for compatibility behavior rather than carrying their own direct jQuery implementation.

| File | Current state | Remaining proof needed |
|---|---|---|
| `resources/assets/public/form-submission.js` | Vanilla runtime path in place; bridge and loading mode implemented | Deterministic runtime proof for steps, captcha reset, file upload, and payment next-action |
| `resources/assets/public/Pro/calculations.js` | Migrated to plain DOM/event APIs; uses `window.fluentFormBridge.onEvent(...)` for cross-mode event subscription | Browser proof on payment + calculated field forms and reset behavior in a full runtime fixture |
| `resources/assets/public/Pro/slider.js` | Migrated to plain JS internals; step landing pages now render without jQuery from Fluent Forms | Deterministic event-order/payload proof for `ff_to_next_page`, `ff_to_prev_page`, and `update_slider` |
| `resources/assets/public/form-save-progress.js` | Migrated to plain JS internals; depends on bridge/runtime instead of direct jQuery | Runtime proof for step transitions and restored-draft timing |
| `app/Services/FormBuilder/Components/DateTime.php` | Date field bootstrap now uses plain JS around `flatpickr` | Date re-init proof is already covered on no-jQuery landing fixture |

### Group 2: Plain JS later

These files can be migrated to plain JS, but they are larger or more behaviorally sensitive and should follow only after the event contract and smaller consumers are stable.

| File | Why it should wait | Main migration risks | Recommended prerequisite |
|---|---|---|---|
| `resources/assets/public/payment_handler.js` | Large payment runtime with totals, coupons, validators, next-action logic, and inline payment state | Event order, validator API parity, next-action flows, field-state sync, and late-loader bootstrap when jQuery appears after initial vanilla form init | Close `3.2`, `3.3`, and payment next-action runtime fixtures first; keep payment pages on the jQuery-required path until live fixtures prove the migrated path |
| `../fluentformpro/src/assets/public/payment_handler_pro.js` | Smaller than legacy handler, but still gateway-sensitive and validator-heavy | Global validator parity, reset behavior, inline gateway state, and late-loader bootstrap on mixed pages | Pro payment fixture coverage and validator runtime assertions; keep jQuery required if mixed landing pages still fail |
| `../fluentformpro/src/assets/public/payment_handler.js` | Legacy Pro payment path with broad jQuery usage and gateway branching | High regression surface across coupons, totals, SCA, inline elements, and late-loader bootstrap on mixed pages | Finish Free payment handler migration pattern first; do not claim no-jQuery support for this path early |
| `../fluentformpro/src/assets/js/fluentformproPostUpdate.js` | Long, stateful DOM updater with post-form population flow | Field mutation order, repeaters, uploader interactions, validation rules | Stable runtime API parity and dedicated post-update fixture |
| `../fluentformpro/src/assets/public/authorizenet_accept_handler.js` | Modal + gateway callback flow with more UI coupling than Razorpay/Paystack | Lity/modal dependency, payment callback sequencing, error rendering | Separate modal replacement or isolation strategy first |
| `../fluentformpro/src/assets/public/ff_address_autocomplete.js` | Third-party API heavy and UI-heavy; large field controller | External callback timing, dynamic field updates, custom parsing triggers | Dedicated fixture plus API-callback-safe adapter plan |

### Group 3: Replace plugin dependency instead of migrate

These files are not good candidates for a direct jQuery-to-plain-JS rewrite. The safer path is replacing the dependency or introducing a new vanilla implementation behind the same feature surface.

| File | Why direct migration is a bad fit | Better direction |
|---|---|---|
| `resources/assets/libs/jquery.mask.min.js` | Vendor jQuery plugin | Replace with a non-jQuery masking library or a small native input-mask adapter |
| `../fluentformpro/src/assets/libs/rangeslider/rangeslider.js` | Vendor jQuery plugin architecture | Replace with a vanilla slider library or native range enhancement |
| `../fluentformpro/src/assets/libs/jQuery-File-Upload-10.32.0/js/vendor/jquery.ui.widget.js` | Core dependency of old jQuery file-upload stack | Replace uploader architecture with a native uploader module |
| `../fluentformpro/src/assets/libs/jQuery-File-Upload-10.32.0/js/jquery.iframe-transport.js` | Legacy jQuery upload transport | Remove with uploader stack replacement |
| `../fluentformpro/src/assets/libs/jQuery-File-Upload-10.32.0/js/jquery.fileupload.js` | Large third-party jQuery plugin ecosystem dependency | Replace with vanilla file upload flow using `FormData`, `fetch`, progress, and chunk support where required |
| `../fluentformpro/src/assets/libs/lity/lity.min.js` | Vendor jQuery modal library | Replace with a vanilla modal/dialog utility |

### Group 4: Keep stable, then reassess

These are not immediate migration targets for this change, either because they are utility/widget-only and low-value to touch now or because they are not central blockers for submission-runtime migration.

| File | Current view |
|---|---|
| `resources/assets/libs/flatpickr/flatpickr.min.js` | Already non-jQuery; leave as-is |
| `resources/assets/libs/choices/choices.min.js` | Already non-jQuery; leave as-is |
| `resources/assets/libs/currency.min.js` | Utility-only; leave as-is |
| `../fluentformpro/src/assets/public/ff_accordion.js` | Lower-priority field UI file; revisit after core runtime and payments |
| `../fluentformpro/src/assets/public/chainedSelectScript.js` | Lower-priority dynamic field file; revisit after core runtime and address autocomplete patterns |
| `../fluentformpro/src/assets/public/dynamicAutocomplete.js` | Lower-priority dynamic field file; revisit after address autocomplete decisions |

## Migration sequence

1. Finish runtime proof for step events, captcha reset, file upload parity, and final payment next-action parity in the current submission runtime.
2. Re-verify step-form fixtures and `update_slider` parity on landing/preview surfaces.
3. Re-verify save-progress through step transitions and draft restore timing.
4. Migrate `fluentform-advanced.js`.
5. Migrate small Pro gateway handlers (`razorpay_handler.js`, `paystack_handler.js`).
6. Reassess payment handlers with the stronger event/runtime guarantees in place, including already-loaded-form bootstrap on mixed pages and the refreshed asset-version strategy that prevents stale cached handler scripts from masking live results.
7. Within payment handlers, prefer this slice order:
   - duplicate/conflicting `payment_method` resolution fixes
   - coupon-state bootstrap/idempotency helpers
   - Deferred-to-Promise validator conversion
   - coupon AJAX/apply/remove replacement
   - then gateway-specific next-action cleanup and mixed-page startup tracing
8. Handle uploader, modal, mask, and slider-library dependencies as replacement projects rather than direct conversions.

## Compatibility contract for every migrated file

Every file moved to plain JS must still satisfy all of the following:
- Runs without requiring jQuery when loading mode is `disabled`.
- Continues working when jQuery is present and loading mode is `enabled`.
- Receives legacy lifecycle events with compatible names, payloads, and timing.
- Continues using stable globals and runtime APIs: `window.fluentFormApp(...)`, `window.ff_helper`, `formInstance.*`.
- Avoids duplicate event firing, duplicate listener attachment, and stale instance leaks.

## Current blockers before broader rollout

- Multi-step `ff_to_next_page`, `ff_to_prev_page`, and `update_slider` parity still need deterministic runtime proof.
- File-upload multipart parity is not fully closed.
- Payment next-action flows still need dedicated runtime fixtures.
- Pro runtime matrix is still partly static-only rather than fully browser-proven.

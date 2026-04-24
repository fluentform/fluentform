## Enqueued Frontend JS Compatibility Matrix (Free + Pro)

Purpose: track every JS asset enqueued on public form render and verify migration safety for both
jQuery event consumers and direct runtime API/function-call consumers.

Status legend:
- `PENDING` = requires explicit parity verification in Phase 3/5
- `PASS` = verified in runtime check
- `RISK` = known incompatibility or degraded path

### Free plugin enqueue surface

| Handle | Enqueue source | Runtime file | Event dependency | Direct runtime API dependency | Status |
|---|---|---|---|---|---|
| `fluent-form-submission` | `Component::renderShortCode()` | `resources/assets/public/form-submission.js` | emits all lifecycle + step events | defines `window.fluentFormApp`, `window.ff_helper` | PENDING |
| `fluentform-advanced` | `Component::maybeHasAdvandedFields()` | `resources/assets/public/fluentform-advanced.js` | listens `fluentform_init`, `update_slider` | uses form instance state | PENDING |
| `form-save-progress` | save-progress component/pro integration | `resources/assets/public/form-save-progress.js` | listens `fluentform_init`, `ff_to_next_page`, `ff_to_prev_page` | uses submit/reset flow | PENDING |
| `fluentform-payment-handler` | `PaymentHandler` on payment forms | `resources/assets/public/payment_handler.js` | listens `fluentform_init_single`, `ff_reinit`, submit events | uses `window.ff_helper`, `window.fluentFormApp(...).sendData`, `formInstance.*` | PENDING |
| `flatpickr` | date-time field | `resources/assets/libs/flatpickr/flatpickr.min.js` | no FF lifecycle binding | input widget only | PENDING |
| `choices` | select/select-country/chained select | `resources/assets/libs/choices/choices.min.js` | no FF lifecycle binding | widget-only | PENDING |
| `jquery-mask` | masked text input | `resources/assets/libs/jquery.mask.min.js` | no FF lifecycle binding | jQuery plugin invocation in form runtime | PENDING |
| `currency` | numeric formatter field | `resources/assets/libs/currency.min.js` | no FF lifecycle binding | formatter utility only | PENDING |

### Pro plugin enqueue surface (public form render)

| Handle | Enqueue source | Runtime file | Event dependency | Direct runtime API dependency | Status |
|---|---|---|---|---|---|
| `fluentformpro-payment-handler` | `Pro PaymentHandler::initNew` | `fluentformpro/public/js/payment_handler_pro.js` | listens `fluentform_init_single`, `ff_reinit`, `fluentform_reset`, submit events | `formInstance.addGlobalValidator`, `show/hideFormSubmissionProgress` | PENDING |
| `fluentform-payment-handler` (Pro old path) | `Pro PaymentHandler::initOld` | `fluentformpro/public/js/payment_handler.js` | listens `fluentform_init_single`, `ff_reinit`, submit events | `window.ff_helper`, `window.fluentFormApp(...).sendData`, `formInstance.*` | PENDING |
| `ff_razorpay_handler` | RazorPay processor | `fluentformpro/public/js/razorpay_handler.js` | listens `fluentform_init_single`, `fluentform_next_action_razorpay` | `formInstance.sendData`, `show/hideFormSubmissionProgress` | PENDING |
| `ff_paystack_handler` | Paystack processor | `fluentformpro/public/js/paystack_handler.js` | listens `fluentform_init_single`, `fluentform_next_action_paystack` | `formInstance.sendData`, `show/hideFormSubmissionProgress` | PENDING |
| `ff_paddle_handler` | Paddle processor | `fluentformpro/public/js/paddle_handler.js` | payment next-action flow | follows payment runtime hooks | PENDING |
| `ff_authorizenet_handler` | Authorize.Net processor | `fluentformpro/public/js/authorizenet_accept_handler.js` | listens `fluentform_init_single`, `fluentform_next_action_authorizenet` | `formInstance.sendData`, `showFormSubmissionProgress` | PENDING |
| `ff_paypal` | PayPal processor delayed check | `fluentformpro/public/js/ff_paypal.js` | payment status check callbacks | async payment polling flow | PENDING |
| `fluentform-chat-field-script` | chat field/controller | `fluentformpro/public/js/chatFieldScript.js` | listens `fluentform_init`, `fluentform_submission_success/failed` | form-level submit toggle behavior | PENDING |
| `ff_address_autocomplete` | AddressAutoComplete | `fluentformpro/public/js/ff_address_autocomplete.js` | field-level interaction | no fluentFormApp direct call | PENDING |
| `ff_accordion` | Accordion component | `fluentformpro/public/js/ff_accordion.js` | field UI behavior | no direct runtime API | PENDING |
| `fluentform-chained-element-script` | ChainedSelect | `fluentformpro/public/js/chainedSelectScript.js` | field init behavior | no direct runtime API | PENDING |
| `fluentform-dynamic-autocomplete` | DynamicField | `fluentformpro/public/js/dynamicAutocomplete.js` | field autocomplete behavior | no direct runtime API | PENDING |
| `fluentformpro_post_update` | PopulatePostForm | `fluentformpro/public/js/fluentformproPostUpdate.js` | post-update flow | uses `window.fluentFormApp($form)` | PENDING |
| `fluentform_tiny_mce_editor` | PostContent | `fluentformpro/public/js/tinyMceInit.js` | field/editor init | no direct runtime API | PENDING |
| `rangeslider` | RangeSliderField | `fluentformpro/public/libs/rangeslider/rangeslider.js` | field UI behavior | jQuery plugin style init | PENDING |
| `intlTelInput` | PhoneField | `fluentformpro/public/libs/intl-tel-input/js/intlTelInputWithUtils.min.js` | field init behavior | no direct runtime API | PENDING |
| `fluentform-uploader-jquery-ui-widget` | Uploader registration | `fluentformpro/public/libs/jQuery-File-Upload-10.32.0/js/vendor/jquery.ui.widget.js` | uploader path | jQuery file-upload dependency | PENDING |
| `fluentform-uploader-iframe-transport` | Uploader registration | `fluentformpro/public/libs/jQuery-File-Upload-10.32.0/js/jquery.iframe-transport.js` | uploader path | jQuery file-upload dependency | PENDING |
| `fluentform-uploader` | Uploader registration | `fluentformpro/public/libs/jQuery-File-Upload-10.32.0/js/jquery.fileupload.js` | uploader path | jQuery file-upload dependency | PENDING |

## Mandatory concerns (blocking)

- Event parity: all legacy jQuery events consumed by these scripts must still fire with equivalent payloads.
- Direct-call parity: global and instance APIs used by these scripts must remain callable and behaviorally equivalent.
- Disabled-mode safety: scripts must not throw fatal errors if jQuery is intentionally not loaded; degradation must be controlled and documented.

## Verification notes (incremental)

- 2026-04-24: Added vanilla runtime API parity support in `resources/assets/public/form-submission.js`:
  - `addGlobalValidator(key, callback)` now stores/executes pre-submit validators.
  - `addFieldValidationRule()` / `removeFieldValidationRule()` now mutate form rule map.
  - pre-submit validator pipeline now runs before AJAX submission and supports async/Promise callbacks.
  - v3 reCAPTCHA pre-submit token path added for forms using `ff_has_v3_recptcha`.
  - This reduces direct-call compatibility risk for payment/chat/post-update dependent scripts; runtime browser validation still pending.
- 2026-04-24: Build/spec verification:
  - OpenSpec strict validation passed for change `migrate-form-submission-to-vanilla-js`.
  - `npm run dev` compiled successfully.
  - Build regenerates `assets/js/fluent_gutenblock.js`; this artifact is explicitly excluded from migration-scope commits.

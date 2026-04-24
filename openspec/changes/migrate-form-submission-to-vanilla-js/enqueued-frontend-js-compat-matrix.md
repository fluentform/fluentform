## Enqueued Frontend JS Compatibility Matrix (Free + Pro)

Purpose: track every JS asset enqueued on public form render and verify migration safety for both
jQuery event consumers and direct runtime API/function-call consumers.

Status legend:
- `PASS (partial runtime)` = observed in browser/runtime checks, but not all scenarios are closed yet
- `STATIC-ONLY` = cross-referenced from source/deps/API usage, but not yet proven in browser fixtures
- `RISK` = known incompatibility, runtime error, or strong jQuery-coupling that still needs dedicated proof

### Free plugin enqueue surface

| Handle | Enqueue source | Runtime file | Event dependency | Direct runtime API dependency | Status |
|---|---|---|---|---|---|
| `fluent-form-submission` | `Component::renderShortCode()` | `resources/assets/public/form-submission.js` | emits all lifecycle + step events | defines `window.fluentFormApp`, `window.ff_helper` | PASS (partial runtime) |
| `fluentform-advanced` | `Component::maybeHasAdvandedFields()` | `resources/assets/public/fluentform-advanced.js` | listens `fluentform_init`, `update_slider` | uses form instance state | PASS (partial runtime) |
| `form-save-progress` | save-progress component/pro integration | `resources/assets/public/form-save-progress.js` | listens `fluentform_init`, `ff_to_next_page`, `ff_to_prev_page` | uses submit/reset flow | STATIC-ONLY |
| `fluentform-payment-handler` | `PaymentHandler` on payment forms | `resources/assets/public/payment_handler.js` | listens `fluentform_init_single`, `ff_reinit`, submit events | uses `window.ff_helper`, `window.fluentFormApp(...).sendData`, `formInstance.*` | PASS (partial runtime) |
| `flatpickr` | date-time field | `resources/assets/libs/flatpickr/flatpickr.min.js` | no FF lifecycle binding | input widget only | STATIC-ONLY |
| `choices` | select/select-country/chained select | `resources/assets/libs/choices/choices.min.js` | no FF lifecycle binding | widget-only | STATIC-ONLY |
| `jquery-mask` | masked text input | `resources/assets/libs/jquery.mask.min.js` | no FF lifecycle binding | jQuery plugin invocation in form runtime | RISK |
| `currency` | numeric formatter field | `resources/assets/libs/currency.min.js` | no FF lifecycle binding | formatter utility only | STATIC-ONLY |

### Pro plugin enqueue surface (public form render)

| Handle | Enqueue source | Runtime file | Event dependency | Direct runtime API dependency | Status |
|---|---|---|---|---|---|
| `fluentformpro-payment-handler` | `Pro PaymentHandler::initNew` | `fluentformpro/public/js/payment_handler_pro.js` | listens `fluentform_init_single`, `ff_reinit`, `fluentform_reset`, submit events | `formInstance.addGlobalValidator`, `show/hideFormSubmissionProgress` | STATIC-ONLY |
| `fluentform-payment-handler` (Pro old path) | `Pro PaymentHandler::initOld` | `fluentformpro/public/js/payment_handler.js` | listens `fluentform_init_single`, `ff_reinit`, submit events | `window.ff_helper`, `window.fluentFormApp(...).sendData`, `formInstance.*` | STATIC-ONLY |
| `ff_razorpay_handler` | RazorPay processor | `fluentformpro/public/js/razorpay_handler.js` | listens `fluentform_init_single`, `fluentform_next_action_razorpay` | `formInstance.sendData`, `show/hideFormSubmissionProgress` | STATIC-ONLY |
| `ff_paystack_handler` | Paystack processor | `fluentformpro/public/js/paystack_handler.js` | listens `fluentform_init_single`, `fluentform_next_action_paystack` | `formInstance.sendData`, `show/hideFormSubmissionProgress` | STATIC-ONLY |
| `ff_paddle_handler` | Paddle processor | `fluentformpro/public/js/paddle_handler.js` | payment next-action flow | follows payment runtime hooks | RISK |
| `ff_authorizenet_handler` | Authorize.Net processor | `fluentformpro/public/js/authorizenet_accept_handler.js` | listens `fluentform_init_single`, `fluentform_next_action_authorizenet` | `formInstance.sendData`, `showFormSubmissionProgress` | STATIC-ONLY |
| `ff_paypal` | PayPal processor delayed check | `fluentformpro/public/js/ff_paypal.js` | payment status check callbacks | async payment polling flow | RISK |
| `fluentform-chat-field-script` | chat field/controller | `fluentformpro/public/js/chatFieldScript.js` | listens `fluentform_init`, `fluentform_submission_success/failed` | form-level submit toggle behavior | STATIC-ONLY |
| `ff_address_autocomplete` | AddressAutoComplete | `fluentformpro/public/js/ff_address_autocomplete.js` | field-level interaction | no fluentFormApp direct call | STATIC-ONLY |
| `ff_accordion` | Accordion component | `fluentformpro/public/js/ff_accordion.js` | field UI behavior | no direct runtime API | STATIC-ONLY |
| `fluentform-chained-element-script` | ChainedSelect | `fluentformpro/public/js/chainedSelectScript.js` | field init behavior | no direct runtime API | STATIC-ONLY |
| `fluentform-dynamic-autocomplete` | DynamicField | `fluentformpro/public/js/dynamicAutocomplete.js` | field autocomplete behavior | no direct runtime API | STATIC-ONLY |
| `fluentformpro_post_update` | PopulatePostForm | `fluentformpro/public/js/fluentformproPostUpdate.js` | post-update flow | uses `window.fluentFormApp($form)` | STATIC-ONLY |
| `fluentform_tiny_mce_editor` | PostContent | `fluentformpro/public/js/tinyMceInit.js` | field/editor init | no direct runtime API | STATIC-ONLY |
| `rangeslider` | RangeSliderField | `fluentformpro/public/libs/rangeslider/rangeslider.js` | field UI behavior | jQuery plugin style init | RISK |
| `intlTelInput` | PhoneField | `fluentformpro/public/libs/intl-tel-input/js/intlTelInputWithUtils.min.js` | field init behavior | no direct runtime API | STATIC-ONLY |
| `fluentform-uploader-jquery-ui-widget` | Uploader registration | `fluentformpro/public/libs/jQuery-File-Upload-10.32.0/js/vendor/jquery.ui.widget.js` | uploader path | jQuery file-upload dependency | RISK |
| `fluentform-uploader-iframe-transport` | Uploader registration | `fluentformpro/public/libs/jQuery-File-Upload-10.32.0/js/jquery.iframe-transport.js` | uploader path | jQuery file-upload dependency | RISK |
| `fluentform-uploader` | Uploader registration | `fluentformpro/public/libs/jQuery-File-Upload-10.32.0/js/jquery.fileupload.js` | uploader path | jQuery file-upload dependency | RISK |

## Mandatory concerns (blocking)

- Event parity: all legacy jQuery events consumed by these scripts must still fire with equivalent payloads.
- Direct-call parity: global and instance APIs used by these scripts must remain callable and behaviorally equivalent.
- Disabled-mode safety: scripts must not throw fatal errors if jQuery is intentionally not loaded; degradation must be controlled and documented.

## Verification notes (incremental)

- 2026-04-24: Matrix rows were cross-referenced against:
  - [phase1-discovery.md](./phase1-discovery.md) consumer tables for Free + Pro event listeners
  - grep-confirmed event call sites in `resources/assets/public`, `../fluentformpro/src/assets/public`, and `../fluentformpro/src/assets/js`
  - PHP enqueue inventory and dependency graph in `Component.php` and Pro enqueue sources
  - local browser/E2E notes for the rows with executed runtime evidence
- 2026-04-24: Bridge compatibility fix:
  - when jQuery is present, the bridge now emits legacy jQuery events first-class and skips duplicate native DOM dispatch for those same event names
  - this prevents legacy `.on(...)` handlers from receiving a native `CustomEvent` with missing positional jQuery arguments before the explicit jQuery trigger
  - JS regression coverage for this behavior lives in `tests/js/form-submission.test.js`
- 2026-04-24: Status interpretation used for this document:
  - `PASS (partial runtime)` only where real browser/runtime evidence exists
  - `STATIC-ONLY` where source/dependency/API linkage is confirmed but browser fixture proof is still missing
  - `RISK` where runtime failures were observed or the handle is strongly jQuery-bound in Disabled mode / next-action / uploader paths

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

## Frontend Render Enqueue Inventory (Pro, verified from PHP enqueue paths)

This list captures Pro JS handles that can be enqueued on public form render paths and therefore must remain compatible with the vanilla migration and jQuery-mode switching.

| Handle | Enqueue source | Frontend render condition | jQuery dependency in enqueue |
|---|---|---|---|
| `fluentformpro-payment-handler` | `src/Payments/PaymentHandler.php` | Pro compatible payment path | Yes |
| `fluentform-payment-handler` | `src/Payments/PaymentHandler.php` | Pro legacy payment path | Yes |
| `ff_razorpay_handler` | `src/Payments/PaymentMethods/RazorPay/RazorPayProcessor.php` | RazorPay-enabled forms | Yes |
| `ff_paystack_handler` | `src/Payments/PaymentMethods/Paystack/PaystackProcessor.php` | Paystack-enabled forms | Yes |
| `ff_paddle_handler` | `src/Payments/PaymentMethods/Paddle/PaddleProcessor.php` | Paddle-enabled forms | Yes |
| `ff_authorizenet_handler` | `src/Payments/PaymentMethods/AuthorizeNet/AuthorizeNetProcessor.php` | Authorize.Net-enabled forms | Yes |
| `ff_paypal` | `src/Payments/PaymentMethods/PayPal/PayPalProcessor.php` | PayPal-enabled forms | Yes |
| `fluentform-chat-field-script` | `src/classes/Chat/ChatFieldController.php`, `src/classes/Chat/ChatField.php` | Chat field present | Yes |
| `ff_address_autocomplete` | `src/classes/AddressAutoComplete.php` | Address autocomplete field present | Yes |
| `fluentform-chained-element-script` | `src/Components/ChainedSelect/ChainedSelect.php` | Chained select field present | Yes |
| `fluentform-dynamic-autocomplete` | `src/Components/DynamicField/DynamicField.php` | Dynamic field present | Yes |
| `ff_accordion` | `src/Components/Accordion.php` | Accordion UI field present | Yes |
| `fluentformpro_post_update` | `src/Components/Post/PopulatePostForm.php` | Post update component present | Yes |
| `fluentform_tiny_mce_editor` | `src/Components/Post/Components/PostContent.php` | Post content field/editor present | Yes |
| `fluentformpro_user_update` | `src/Integrations/UserRegistration/UserUpdateFormHandler.php` | Frontend user update integration active | Yes |
| `fluentform-uploader-jquery-ui-widget` | `src/Components/Uploader.php`, `src/Components/Post/Components/FeaturedImage.php` | Pro uploader/featured image field present | Yes |
| `fluentform-uploader-iframe-transport` | `src/Components/Uploader.php`, `src/Components/Post/Components/FeaturedImage.php` | Pro uploader/featured image field present | Yes |
| `fluentform-uploader` | `src/Components/Uploader.php`, `src/Components/Post/Components/FeaturedImage.php` | Pro uploader/featured image field present | Yes |
| `intlTelInput` | `src/Components/PhoneField.php` | Phone field present | No (enqueue deps) |
| `rangeslider` | `src/Components/RangeSliderField.php` | Range slider field present | Yes |

External script handles also loaded in form render context:

| Handle | Source | Notes |
|---|---|---|
| `razorpay` | RazorPay processor | Gateway SDK |
| `paystack` | Paystack processor | Gateway SDK |
| `paddle` | Paddle processor | Gateway SDK |
| `authorize-net-accept-js` | Authorize.Net processor | Gateway SDK |
| `lity` | Form modal + Authorize.Net modal | Modal dependency; jQuery-based |
| `stripe_elements` | Stripe handler | Stripe SDK (registered with jQuery dep in Pro code) |
| `square-web-sdk` | Square handler | Square SDK (registered with jQuery dep in Pro code) |

## Compatibility Concerns Added To Task Scope

- jQuery event parity for all lifecycle and step events consumed by Free and Pro listeners.
- Direct runtime API call parity (`window.fluentFormApp`, `window.ff_helper`, `formInstance` methods).
- Next-action and gateway callback parity (`fluentform_next_action_*` paths).
- Disabled-mode safety for jQuery-bound scripts: no fatal JS errors in bridge/no-jQuery path.

## Direct Runtime API Static Verification (Task 3.5 precheck)

Status legend for this section:
- `PASS (static)` = call site exists and target API exists in current runtime source
- `PENDING (runtime)` = requires browser/runtime scenario verification

| Consumer file | API call(s) used | Static status | Runtime status |
|---|---|---|---|
| `resources/assets/public/payment_handler.js` | `window.ff_helper.numericVal`, `window.fluentFormApp(...).sendData`, `formInstance.addGlobalValidator`, `addFieldValidationRule`, `removeFieldValidationRule`, `show/hideFormSubmissionProgress` | PASS (static) | PENDING (runtime) |
| `resources/assets/public/Pro/calculations.js` | `window.ff_helper.numericVal`, `window.ff_helper.formatCurrency` | PASS (static) | PENDING (runtime) |
| `resources/assets/public/Pro/slider.js` | `window.fluentFormApp(this.$theForm)` | PASS (static) | PENDING (runtime) |
| `../fluentformpro/src/assets/public/payment_handler.js` | same payment runtime API set as Free handler | PASS (static) | PENDING (runtime) |
| `../fluentformpro/src/assets/public/payment_handler_pro.js` | `formInstance.addGlobalValidator`, `show/hideFormSubmissionProgress`, `fluentFormApp($form)` | PASS (static) | PENDING (runtime) |
| `../fluentformpro/src/assets/public/razorpay_handler.js` | `formInstance.sendData`, `show/hideFormSubmissionProgress` | PASS (static) | PENDING (runtime) |
| `../fluentformpro/src/assets/public/paystack_handler.js` | `formInstance.sendData`, `show/hideFormSubmissionProgress` | PASS (static) | PENDING (runtime) |
| `../fluentformpro/src/assets/public/authorizenet_accept_handler.js` | `formInstance.sendData`, `showFormSubmissionProgress` | PASS (static) | PENDING (runtime) |
| `../fluentformpro/src/assets/js/fluentformproPostUpdate.js` | `window.fluentFormApp($form)`, `addFieldValidationRule`, `removeFieldValidationRule` | PASS (static) | PENDING (runtime) |

Verification evidence source:
- `resources/assets/public/form-submission.js` defines `window.ff_helper` and app methods:
  `sendData`, `addGlobalValidator`, `addFieldValidationRule`, `removeFieldValidationRule`,
  `showFormSubmissionProgress`, `hideFormSubmissionProgress`.
- grep cross-checks confirm consumer call sites in Free and Pro source trees.

## Browser/E2E Runtime Check (Local `forms.test`, 2026-04-24)

Tooling used:
- Playwright 1.58.2 runners at:
  - `/tmp/ff-e2e/run-ff-e2e.mjs` (initial pass)
  - `/tmp/ff-e2e/run-ff-e2e-current.mjs` (current fixture pass)
- Runtime reports:
  - `/tmp/ff-e2e/report-enabled.json`
  - `/tmp/ff-e2e/report-disabled.json`
  - `/tmp/ff-e2e/report-current.json`

Test method:
- Temporary public pages were created with Fluent Form shortcodes.
- jQuery mode was forced with a temporary MU plugin using:
  - `fluentform/jquery_loading_mode => enabled`
  - `fluentform/jquery_loading_mode => disabled`
- For each mode, browser checks recorded:
  - global API presence (`window.fluentFormApp`, `window.ff_helper`)
  - native/jQuery event receipt
  - loaded JS URLs
  - submission POST payload presence
  - console/page JS errors

Key observed results:
- `window.fluentFormApp` and `window.ff_helper` were present in tested pages (`PASS`).
- Simple form `383` submitted successfully in both `enabled` and `disabled` mode checks.
- Step conversational form `186` loaded without JS crash in both modes after the bridge payload fix, and user input advanced the conversational flow to the next question.
- Payment/captcha form `386` loaded without the earlier `instance.settings` crash in both modes after the bridge payload fix.
- In Disabled mode, dependency toggle for `fluent-form-submission` was previously verified from page footer diagnostics:
  - enabled => deps `["jquery"]`
  - disabled => deps `[]`
- Disabled mode may still show `window.jQuery` on some pages due other theme/plugin scripts.
  This is environment-level jQuery presence, not a failure of Fluent Forms dependency resolution by itself.

Runtime PASS/RISK updates from executed checks:

| Handle | Runtime status | Evidence |
|---|---|---|
| `fluent-form-submission` | PASS (partial runtime) | Init + failed submission events observed; ajax payload posted in real browser run; global API present |
| `fluentform-advanced` | PASS (partial runtime) | Current step-form fixture `186` now loads without the prior `fluentform_init` `$theForm.attr(...)` crash in either mode; `update_slider` parity still not proven |
| `fluentform-payment-handler` | PASS (partial runtime) | Current payment form `386` now loads without the prior `instance.settings` init crash in either mode; submit/next-action parity still not proven |

Unresolved runtime gaps (still blocking full assurance):
- Multi-step `ff_to_next_page` / `ff_to_prev_page` / `update_slider` parity is still not proven with a deterministic non-conversational step fixture.
- Captcha reset lifecycle after server failure could not be deterministically asserted.
- File-upload payload parity remains incomplete; current conversational file fixture did not expose a visible file input during the scripted pass.
- Payment next-action parity remains incomplete.
- Pro script matrix remains static-verified, pending full browser proof on dedicated Pro-ready fixtures.

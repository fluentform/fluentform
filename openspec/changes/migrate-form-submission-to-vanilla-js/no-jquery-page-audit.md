# No-jQuery Page Audit

## Goal
Identify which remaining handles still pull `jquery` onto public Fluent Forms pages that otherwise work with the migrated plain-JS runtime.

## Audit method
1. Use Fluent Forms-owned landing pages with `?ffjqmode=disabled` to reduce theme noise.
2. Capture the exact `<script>` tags rendered on the page.
3. Map each remaining jQuery-bearing handle back to its enqueue owner and field/feature trigger.
4. Separate true Fluent Forms blockers from unrelated third-party page scripts.

## Fixture pages checked

### `?ff_landing=344&ffjqmode=disabled`
Observed scripts:
- `fluent-form-submission`
- `fluentform-advanced`
- `akismet-frontend`

Result:
- No `jquery-core` or `jquery-migrate` on the page.
- This is a clean proof that the migrated public runtime plus migrated advanced modules can render without jQuery on a normal landing page.

Field inventory snapshot:
- `input_name`
- `input_email`
- `ratings`
- `textarea`

### `?ff_landing=240&ffjqmode=disabled`
Observed scripts:
- `fluent-form-submission`
- `fluentform-advanced`
- `akismet-frontend`

Result:
- No `jquery-core` or `jquery-migrate` on the page.
- Step forms are no longer forcing jQuery from the Fluent Forms side after the `slider.js` migration.

Field inventory snapshot:
- `step_start`
- `form_step`
- `step_end`
- `ratings`
- standard text/radio/name fields

### `?ff_landing=54&ffjqmode=disabled`
Observed scripts:
- `fluent-form-submission`
- `jquery-core`
- `jquery-migrate`
- `fluentform-uploader-jquery-ui-widget`
- `fluentform-uploader-iframe-transport`
- `fluentform-uploader`
- `stripe_elements`
- `wp-tinymce-root`
- `fluentform_tiny_mce_editor`
- `jquery-mask`
- `form-save-progress`
- `flatpickr`
- `rangeslider`
- `fluentform-advanced`
- `fluentform-payment-handler` (script tag id)
- `akismet-frontend`

Result:
- This page still legitimately pulls jQuery because the form itself uses multiple legacy or vendor-backed features that still enqueue jQuery-dependent handles.
- `form-save-progress` is **not** the reason jQuery is present anymore; it now runs with `fluent-form-submission` as its dependency.

Field inventory snapshot from raw form JSON:
- `save_progress_button: 1`
- `subscription_payment_component: 1`
- `multi_payment_component: 3`
- `payment_method: 2`
- `payment_summary_component: 1`
- `item_quantity_component: 1`
- `payment_coupon: 3`
- `input_file: 2`
- `input_image: 1`
- `input_date: 1`
- masked text inputs: present (`data-mask`)
- `rich_text_input: 1`
- `rangeslider: 1`
- `ratings: 1`

## Remaining Fluent Forms handles that still pull jQuery on pages that need those features

### Free plugin
| Handle | Why it still pulls jQuery | Source |
| --- | --- | --- |
| `flatpickr` | The form contains `input_date`, and core currently registers `flatpickr` with `['jquery']` even though the library itself is non-jQuery. This is a stale dependency and a good cleanup candidate. | `app/Modules/Component/Component.php:125`, `app/Services/FormBuilder/Components/DateTime.php:35` |
| `jquery-mask` | The form contains masked text inputs, and mask support is still provided by the bundled jQuery mask plugin. Keep as vendor-backed for now unless the masking layer is replaced. | `app/Services/FormBuilder/Components/Text.php:52` |

### Pro plugin
| Handle | Why it still pulls jQuery | Source |
| --- | --- | --- |
| `fluentform-uploader-jquery-ui-widget` | Vendor dependency of the jQuery file-upload stack used by file/image upload fields. | `../fluentformpro/src/Components/Uploader.php:105` |
| `fluentform-uploader-iframe-transport` | Vendor dependency of the jQuery file-upload stack used by file/image upload fields. | `../fluentformpro/src/Components/Uploader.php:106` |
| `fluentform-uploader` | Main jQuery file-upload runtime used by `input_file`, `input_image`, and featured-image flows. | `../fluentformpro/src/Components/Uploader.php:107`, `../fluentformpro/src/Components/Post/Components/FeaturedImage.php:162` |
| `stripe_elements` | Registered with `['jquery']` by the Stripe payment integration. | `../fluentformpro/src/Payments/PaymentMethods/Stripe/StripeHandler.php:144` |
| `fluentform-payment-handler` (page script id for `payment_handler_pro.js`) | Pro payment front-end runtime is still jQuery-backed. The landing page currently prints `payment_handler_pro.js` under the older `fluentform-payment-handler` script id. | `../fluentformpro/src/Payments/PaymentHandler.php:80`, `../fluentformpro/src/Payments/PaymentHandler.php:163` |
| `fluentform_tiny_mce_editor` | Rich text input bootstrap is still registered with `['jquery', 'wp-tinymce-root']`. | `../fluentformpro/src/Components/Post/Components/PostContent.php:35` |
| `rangeslider` | Range slider field still uses the jQuery rangeslider plugin and inline jQuery bootstrap. | `../fluentformpro/src/Components/RangeSliderField.php:209` |

## Interpreting the current state

### Pages that no longer need jQuery from Fluent Forms
These are already clean on landing pages tested here:
- ordinary forms using migrated `form-submission.js`
- advanced forms using migrated ratings / NPS / conditional logic / calculations
- step forms after the `slider.js` migration
- save-progress when the form does not also include other legacy Pro features

### Pages that still legitimately need jQuery today
These still bring jQuery because the page is using legacy or vendor-backed features:
- file upload / image upload fields
- range slider fields
- rich text input fields
- legacy payment front-end handlers
- mask-enabled text inputs

## Best next cleanup targets
1. Remove the stale jQuery dependency from `flatpickr` registration in core.
2. Audit Stripe-related dependency declarations to see whether `stripe_elements` truly needs jQuery or only the handler does.
3. Treat uploader, rangeslider, and mask support as vendor/plugin replacement projects rather than quick inline rewrites.
4. Keep using landing pages for no-jQuery verification because they expose Fluent Forms-owned dependencies more clearly than theme pages.

## Bottom line
- `344` and `240` prove that the migrated public runtime can now serve normal and step landing pages without jQuery.
- `54` is not a false alarm; it is a dense legacy-feature form, and the remaining jQuery on that page comes from still-unmigrated or vendor-backed handles, not from the already-migrated save-progress or submission runtimes.

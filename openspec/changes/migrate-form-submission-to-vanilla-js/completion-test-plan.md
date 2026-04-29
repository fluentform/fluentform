# jQuery Dependency Migration Completion Test Plan

Purpose: define what is left to complete the public-form jQuery dependency migration without turning risky vendor/plugin rewrites into this change.

## Scope rule

This migration should remove jQuery as a required dependency for Fluent Forms-owned public form runtime paths where the behavior can be preserved with native DOM APIs and the compatibility bridge.

Do not directly rewrite old third-party jQuery plugin stacks in this change. Keep those paths on the jQuery-required/Auto safety path until they can be replaced behind the same feature surface.

## What is already safe enough to keep

| Area | Current state | Keep/verify |
|---|---|---|
| Core submission runtime | Vanilla path, bridge, loading modes, globals, validators, captcha reset unit coverage | Keep; finish browser parity checks |
| Step slider runtime | Plain-JS internals are in place | Keep; finish browser focus/scroll parity |
| Save progress | Plain-JS internals and runtime-backed step/draft proof | Keep; regress through final step fixture |
| Date field | Native `flatpickr` init path | Keep; one no-jQuery smoke check is enough |
| Shared upload preview/progress/reset | Browser proof exists on fixture `234` | Keep; Pro vendor uploader remains separate risk |
| Mixed Stripe fixture `54` | Disabled/enabled success path now matches for verified Stripe flow | Use as evidence, but do not generalize to every gateway until Pro checks are run |

## What is left to do

### Slice 1: Close open runtime parity

Goal: prove current migrated code does not regress normal form behavior.

Tests:
- Run `npm run test:js`.
- Browser-check step fixture `240` in `enabled` and `disabled` modes:
  - first `Next` moves from intro step without validation
  - second `Next` validates required `book_title`
  - validation error is visible
  - focus/scroll lands on the first error with the same feel as legacy mode
  - reset/server-side step error emits `update_slider` only for reset/error-jump behavior
- Browser-check captcha fixtures in a real page session:
  - failed submit resets reCAPTCHA, hCaptcha, and Turnstile
  - user can complete the widget again and resubmit without reload
- Browser-check upload fixture `234`:
  - selected PDF uploads
  - preview reaches `100% Completed`
  - invalid type rejects
  - remove/reset clears preview
  - note that jQuery is still expected if the Pro uploader vendor stack is loaded

### Slice 2: Decide payment loading mode

Goal: decide whether payment pages can stop forcing jQuery, or whether payment pages stay Auto/jQuery-required until all gateway handlers are migrated.

Tests:
- Keep fixture `54` as the known-good mixed Stripe/PayPal regression fixture.
- Re-run disabled/enabled parity for:
  - inline Stripe validation error
  - successful Stripe submit
  - payment summary rendering
  - invalid coupon response
  - PayPal mixed-subscription business-rule error
- Add mocked or real next-action checks for small Pro gateway handlers:
  - Razorpay
  - Paystack
- If any gateway still depends on jQuery-only init order, keep payment pages on the jQuery-required Auto path and record the exact handle/fixture.

### Slice 3: Migrate small owned consumers

Goal: remove easy jQuery usage from Fluent-owned, event-driven scripts after runtime parity is proven.

Targets:
- `resources/assets/public/fluentform-advanced.js`
- `../fluentformpro/src/assets/js/chatFieldScript.js`
- `../fluentformpro/src/assets/public/razorpay_handler.js`
- `../fluentformpro/src/assets/public/paystack_handler.js`

Tests for each target:
- Unit or jsdom coverage for the migrated helper where practical.
- Browser smoke in `enabled` and `disabled` modes.
- Confirm bridge event payloads match old positional jQuery arguments.
- Confirm no duplicate listener attachment when forms are initialized before the dependent script loads.

### Slice 4: Reassess larger owned files

Goal: avoid broad rewrites until the small targets prove the pattern.

Reassess after Slices 1-3:
- `resources/assets/public/payment_handler.js`
- `../fluentformpro/src/assets/public/payment_handler_pro.js`
- `../fluentformpro/src/assets/public/payment_handler.js`
- `../fluentformpro/src/assets/js/fluentformproPostUpdate.js`
- `../fluentformpro/src/assets/js/fluentformproUserUpdate.js`
- `resources/assets/public/Pro/dom-repeat.js`

Tests:
- Payment: gateway-specific next-action, coupon, summary, validator, reset, late bootstrap.
- Post/User update: repeaters, uploader, prefilled values, validation rule add/remove, successful submit.
- Repeat fields: add/remove rows, validation names/ids, conditional visibility, submit payload shape.

## Defer from this change

These should become replacement/isolation projects, not direct line-by-line migrations:

| Dependency | Reason to defer | Future test contract |
|---|---|---|
| `resources/assets/libs/jquery.mask.min.js` | Vendor jQuery plugin | native mask adapter with data-mask parity and pasted/input composition checks |
| Pro `rangeslider.js` | Vendor jQuery plugin architecture | native slider library or custom range enhancement with value/label parity |
| Pro jQuery File Upload stack | large legacy uploader dependency | native uploader using `FormData`, progress, remove/reset, chunk rules if needed |
| Pro `lity.min.js` / modal paths | modal plugin dependency used by form modal and gateways | native modal/dialog replacement with gateway callback parity |
| Admin Vue jQuery calls | separate wp-admin SPA surface, not public form dependency | handle later as an admin refactor, not as this public runtime migration |

## Release gates

- `openspec validate migrate-form-submission-to-vanilla-js --strict --no-interactive`
- `npm run test:js`
- `npm run dev`
- Free browser checklist: simple, conditional, multi-step, captcha, upload, payment initiation, reset
- Pro browser checklist: payment gateway smoke, chat, save-progress, post/user update, uploader, modal/gateway page
- Compatibility matrix updated with PASS / STATIC-ONLY / RISK for every public form render handle
- Rollback remains documented:

```php
add_filter('fluentform/jquery_loading_mode', fn() => 'enabled');
```

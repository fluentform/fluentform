## Why

A coupon applied while a conditional coupon field is visible is not cleared when that field is later hidden by conditional logic. A user can select a product that offers a discount, apply the coupon, switch to a product that does not, and still receive the discount — on the displayed total, in the conversational form, and in the backend order processing. This is a revenue-loss bug and a server-side trust gap reported in ticket #159913.

## What Changes

- Standard (jQuery) forms clear an applied coupon when its coupon field becomes hidden by conditional logic, so the payment summary table and order total recalculate without the stale discount.
- The backend evaluates the coupon field's own conditional logic before processing `__ff_all_applied_coupons`, so a hidden coupon field never produces a discount — even from a crafted POST. This is the actual enforcement gate.
- Conversational forms clear applied coupon state when the coupon question is skipped by conditional logic.
- No discount is applied when the coupon field is not effectively visible for the submitted answers.

## Capabilities

### New Capabilities

- `payment-coupon-discounts`: Defines how coupon discounts are applied, displayed, and enforced relative to the coupon field's conditional-logic visibility, across standard forms, conversational forms, and backend order processing.

### Modified Capabilities

<!-- None — openspec/specs/ has no existing payment specs; this is the first spec for this capability. -->

## Impact

- `fluentform/resources/assets/public/payment_handler.js` — frontend coupon tracking and purge (the live base class; pro's `payment_handler_pro.js` inherits via `extends`).
- `fluentform/app/Modules/Payments/Classes/PaymentAction.php` — backend conditional-logic gate (the live class; pro's copy is legacy `initOld()` only).
- `fluent-conversational-js/src/form/components/Form.vue` — clear coupon state on skipped coupon question.
- No database changes. No public hook/filter signature changes. Requires webpack builds of `fluentform` and `fluentformpro` (pro bundle includes the free base class) and the conversational form bundle.
- Behaviour change to document: resuming a saved draft now re-evaluates coupon-field conditions and may drop a previously-applied coupon.

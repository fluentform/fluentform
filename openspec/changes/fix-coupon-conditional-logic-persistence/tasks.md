## 1. Standard form JS — `fluentform/resources/assets/public/payment_handler.js`

- [x] 1.1 Add `clearHiddenCouponFields()` — when the coupon field's wrapper is inside `.has-conditions.ff_excluded`, empty `.ff_coupon_responses`, clear `appliedCoupons`, and rewrite `.__ff_all_applied_coupons`
- [x] 1.2 Call `clearHiddenCouponFields()` at the top of `calculatePayments()`
- [x] 1.3 Call `clearHiddenCouponFields()` at the start of the apply-coupon click handler, before the `fluentform_apply_coupon` AJAX call
- [x] 1.4 Rebuild `fluentform` (and `fluentformpro`, whose bundle includes the free base class)

## 2. Backend PHP — `fluentform/app/Modules/Payments/Classes/PaymentAction.php`

- [x] 2.1 Add `isFieldConditionPass($field)` helper (mirrors `isConditionPass()`, short-circuits to visible when no/disabled conditions)
- [x] 2.2 Add `getFieldAncestorContainers()` (walk `columns[].fields[]` to find the coupon's container ancestors) and `isCouponFieldVisible()` (own conditions first — O(1) — then ancestor containers)
- [x] 2.3 Gate the coupon block on `$this->isCouponFieldVisible($couponField)`; only populate `$this->discountCodes` / `$this->couponField` when visible
- [x] 2.4 Keep the `Helper::hasPro()` / `class_exists('FluentFormPro\\...\\CouponModel')` guards intact; `ConditionAssesor` already imported

## 3. Conversational form Vue — `fluent-conversational-js/src/form/components/Form.vue`

- [x] 3.1 After `setQuestionListActivePath()` builds the active path, clear `globalVars.appliedCoupons` (to `null`) and `extra_inputs.__ff_all_applied_coupons` when no `FlowFormCouponType` question is on the path — covering both conditional-logic hide and jump-logic skip
- [x] 3.2 Rebuild the conversational bundle

## 4. Tests & verification

- [x] 4.1 PHP unit test for the backend gate — `dev/tests/test_coupon_field_condition_pass.php` (13 cases: own conditions, conditional container, ancestor walker; passing)
- [x] 4.7 Backend: coupon inside a conditionally hidden container → coupon ignored (covered by the unit test + real-form sanity check)
- [x] 4.2 Standard form (Playwright): apply coupon on eligible product → switch to ineligible product → summary shows no discount; submission records no discount order item
- [x] 4.3 Standard form: apply → switch away → switch back → coupon is gone, user must re-enter
- [x] 4.4 Backend hardening: crafted POST with `__ff_all_applied_coupons` on a form whose coupon-field condition is not met → no discount applied (end-to-end submission)
- [x] 4.5 Regression: coupon field with no conditional logic still applies coupons exactly as before ($187.50 recorded)
- [ ] 4.6 Conversational form: coupon question removed from the active path (conditional or jump) → no discount shown/submitted — not browser-verified (the coupon question did not render in the test form's conversational mode); covered by code review + build

## 5. Release hygiene

- [ ] 5.1 Add CHANGELOG entry under Unreleased (free + pro)
- [ ] 5.2 Note the save-and-resume behaviour change (resumed draft may drop a previously-applied coupon)
- [ ] 5.3 Rebuild `fluentformpro` webpack so `payment_handler_pro.js` picks up the updated base class

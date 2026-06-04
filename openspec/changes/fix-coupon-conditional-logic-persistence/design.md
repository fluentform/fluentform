# Design: Coupon Persistence via Conditional Logic

**Ticket:** [#159913](https://support.wpmanageninja.com/#/tickets/159913/view) ·
**Board:** [Task #21386](https://lounge.authlab.io/projects#/boards/16/tasks/21386-Translated-%E2%80%9COther%E2%80%9D-option-labe)
**Scope:** Frontend JS + Backend PHP + Conversational form Vue. No DB changes.

## Problem

When a coupon field is conditionally hidden after a coupon has been applied, the discount is not cleared. The payment summary table and the backend order processing both keep applying the discount against the wrong product.

**Example** — a sports-camp form:

| Product | Price | Coupon field shown? |
|---|---|---|
| Camp A — Summer Elite | $200 | Yes (`SUMMER20` = 20% off) |
| Camp B — Beginner | $80 | No |

1. Select Camp A → coupon field appears → apply `SUMMER20` → summary shows `$200 − $40 = $160`.
2. Switch to Camp B → coupon field slides away (hidden).
3. Expected: `$80`, no discount. Actual: `$80 − $16 = $64`.
4. Submit → backend charges `$64` and records a `−$16` discount line.

Exploit path: pick a discounted product → apply coupon → switch to a non-discounted product → submit at the wrong price.

## Root Cause — Three Locations

| # | Layer | File | Gap |
|---|---|---|---|
| 1 | Standard form JS | `fluentform/resources/assets/public/payment_handler.js` | `getDiscounts()` returns all of `this.appliedCoupons` with no check for whether the coupon field's wrapper is inside `ff_excluded` |
| 2 | Backend PHP | `fluentform/app/Modules/Payments/Classes/PaymentAction.php:113` | Reads `__ff_all_applied_coupons` without evaluating the coupon field's `conditional_logics`; `isConditionPass()` exists for the payment-method field but is never called for the coupon field |
| 3 | Conversational Vue | `fluent-conversational-js/src/form/components/Form.vue` | `globalVars.appliedCoupons` / `extra_inputs.__ff_all_applied_coupons` are set on apply but never cleared when the coupon question is skipped by `showQuestion()` |

## How Each Layer Currently Works

**Standard form (jQuery):**
- Conditional logic hides a field → `ff_excluded` on `.has-conditions` parent → `do_calculation` fires.
- `calculatePayments()` → `getPaymentItems()` correctly filters via `.ff-el-group:not(.ff_excluded)`.
- `calculatePayments()` → `getDiscounts()` returns raw `Object.values(this.appliedCoupons)` — no visibility check.
- Payment summary table (`ff_dynamic_payment_summary`) and `.ff_order_total` both receive the stale discount.

**Conversational form (Vue):**
- `Form.vue` collects questions in a `do...while` loop; `question.showQuestion(qa)` false → skipped (`++index; continue`), no cleanup.
- `PaymentSummaryType.vue` reads `globalVars.appliedCoupons` → stale `<tfoot>` rows and `totalAmount`.
- `SubmitButton.vue` uses `globalVars.appliedCoupons` for the gateway total.

**Backend (both form types):**
- `setupData()` finds the coupon field in the form schema (present even when hidden), reads `__ff_all_applied_coupons`, populates `$this->discountCodes`.
- `applyDiscountCodes()` applies the discount with no conditional-logic check on the coupon field.

## Proposed Fix

Scope: one coupon field per form (the supported configuration). Multiple coupon fields on a single form is not supported — the coupon apply path already fails with more than one coupon field, independent of this change — so it is out of scope here.

### Fix 1 — Standard form: clear the coupon when its field is hidden

`clearHiddenCouponFields()` drops the applied coupon when the coupon field's wrapper is inside an `ff_excluded` (conditionally hidden) container, then rewrites the hidden `__ff_all_applied_coupons` input so the summary table and `.ff_order_total` recalculate clean:

```js
clearHiddenCouponFields() {
    const $wrapper = this.$form.find('.ff_coupon_wrapper');
    if (!$wrapper.length || !Object.keys(this.appliedCoupons).length) {
        return;
    }
    if ($wrapper.closest('.has-conditions.ff_excluded').length) {
        $wrapper.find('.ff_coupon_responses').empty();
        this.appliedCoupons = {};
        this.$form.find('.__ff_all_applied_coupons').attr('value', JSON.stringify(Object.keys(this.appliedCoupons)));
    }
}
```

Called in two places: the top of `calculatePayments()` (so it runs whenever `do_calculation` fires after a conditional change) and the start of the apply-coupon click handler (so a stale code is not sent as `other_coupons`).

### Fix 2 — Backend: honor the coupon only when its field is effectively visible

A coupon field can be hidden by its own conditional logic *or* by a conditional container it lives in. Gate the coupon block in `setupData()` on `isCouponFieldVisible()`, which checks both:

```php
if ($couponField && $this->isCouponFieldVisible($couponField)) {
    $couponCodes = ArrayHelper::get($this->data, '__ff_all_applied_coupons', '');
    // ... existing coupon processing unchanged ...
}
```

`isCouponFieldVisible()` checks the coupon field's own conditions first (the common case — O(1), no form-tree walk), then walks the form tree only to evaluate any ancestor container's conditions:

```php
public function isCouponFieldVisible($couponField)
{
    if (!$this->isFieldConditionPass($couponField)) {
        return false;
    }
    $formFields = $this->form->form_fields;
    if (is_string($formFields)) {
        $formFields = json_decode($formFields, true);
    }
    $couponName = ArrayHelper::get($couponField, 'attributes.name');
    $ancestors = $this->getFieldAncestorContainers(ArrayHelper::get($formFields, 'fields', []), $couponName);
    foreach ((array) $ancestors as $container) {
        if (!$this->isFieldConditionPass($container)) {
            return false;
        }
    }
    return true;
}
```

`isFieldConditionPass()` evaluates one field's conditional logic via `ConditionAssesor` (short-circuiting to visible when none/disabled). It passes `treatMissingAsEmpty = false` so a missing controlling field is handled with JS parity — matching the frontend visibility evaluator (`Extractor`); otherwise a coupon shown by e.g. `field != ''` would be wrongly rejected when that field is absent from the submission. `getFieldAncestorContainers()` walks `columns[].fields[]` and returns the container chain wrapping the coupon — name-matching only, evaluating no conditions until an ancestor is found. The raw `form_fields` is decoded directly rather than via `FormFieldsParser::getFields()`, which would instantiate the full parser (WordPress `apply_filters` for input types) just for a JSON decode and break the standalone unit test.

### Fix 3 — Conversational form: clear when the coupon question leaves the active path

`setQuestionListActivePath()` in `Form.vue` builds the active question path through conditional logic *and* jump logic. After the path is built, clear the coupon state if the coupon question is not on it — covering both "hidden by conditional logic" and "skipped by jump logic":

```js
if (this.globalVars.appliedCoupons && !questions.some((q) => q.type === 'FlowFormCouponType')) {
    this.globalVars.appliedCoupons = null;   // null, not {} — see Edge Cases
    if (this.globalVars.extra_inputs) {
        this.globalVars.extra_inputs.__ff_all_applied_coupons = '';
    }
}
```

## Files Changed

| File | Change |
|---|---|
| `fluentform/resources/assets/public/payment_handler.js` | `clearHiddenCouponFields()` called from `calculatePayments()` and before the apply-coupon AJAX call |
| `fluentform/app/Modules/Payments/Classes/PaymentAction.php` | `isCouponFieldVisible()` (own conditions + ancestor containers) + `isFieldConditionPass()` / `getFieldAncestorContainers()` helpers; gate the coupon block on effective visibility in `setupData()` |
| `fluentform/dev/tests/test_coupon_field_condition_pass.php` | Unit test for the backend gate (13 cases: own conditions, container ancestor, walker) |
| `fluent-conversational-js/src/form/components/Form.vue` | Clear `globalVars.appliedCoupons`/`__ff_all_applied_coupons` when the coupon question is not on the active path |

**Not changed:**
- `fluentformpro/src/assets/public/payment_handler.js` — legacy standalone, only loaded by `initOld()` for free < 6.0.4.
- `fluentformpro/src/assets/public/payment_handler_pro.js` — extends the free base class via `import`; inherits the fix.
- `fluentformpro/src/Payments/Classes/PaymentAction.php` — legacy copy; coupon processing (including `CouponModel`) runs in free's `PaymentAction`.

**Build:** rebuild `fluentform` and `fluentformpro` webpack (pro bundle includes the free base class) and the conversational form bundle.

## Security

1. **The backend check is the only real enforcement gate.** Any user can bypass the JS with a crafted POST. Fix 2 is what prevents the exploit; Fixes 1 and 3 are display correctness.
2. **`ConditionAssesor::evaluate()` reads already-sanitised data** — the same `$this->data` the payment-method `isConditionPass()` uses. No new input surface.
3. **Server-side re-validation still runs.** `CouponModel::getValidCoupons()` re-checks status, expiry, allowed forms, and min amount. The new check is an additional gate.
4. **`max_use` bypass is NOT fixed here** — missing from `CouponController::validateCoupon()` and `CouponModel::getValidCoupons()`. Tracked separately (MED-08).

## Backward Compatibility

1. **Coupon object shape and the `ff_coupon_applied` event are unchanged** — only `appliedCoupons` membership is cleared; nothing new is stored on coupon objects.
2. **Forms without coupon conditional logic are unaffected** — both the JS (no `ff_excluded` wrapper) and the backend guard (`isFieldConditionPass()` short-circuits to `true`) leave behaviour identical.
3. **`fluentform/submission_order_items` contract unchanged** — the coupon exclusion happens in `setupData()` before `getOrderItems()`.
4. **Save & resume:** resuming re-evaluates the coupon field's conditions; a previously-applied coupon may drop. Document in changelog.

## Edge Cases

| Scenario | Standard form | Conversational form |
|---|---|---|
| Apply → hide field → submit | Purged in `clearHiddenCouponFields()`; backend skips via condition gate | State cleared when coupon question leaves the path; backend skips |
| Hide → show again → re-apply | Works; user must re-enter code | Question re-included; user re-enters code |
| Coupon question skipped by jump logic | N/A | Cleared by the post-path check (not just conditional hide) |
| Payment summary rendering | Empty discounts → product-only total | Cleared to `null` (not `{}`) so the `v-if="appliedCoupons"` discount section does not render |
| Min-amount mismatch (no hiding) | Unchanged; backend `getValidCoupons()` rejects | Same |
| Crafted POST | Condition gate blocks server-side | Same |

## Out of Scope

- **Multiple coupon fields on one form** — not supported (coupon apply already fails with more than one coupon field, pre-existing). Separate effort if ever wanted.
- `max_use` coupon limit bypass (MED-08, separate ticket).
- Frontend/backend total mismatch on min-amount change without field hiding (cosmetic, no discount exploit).

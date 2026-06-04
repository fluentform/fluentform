# Coupon Persistence via Conditional Logic — Quick Review

**Ticket:** [#159913](https://support.wpmanageninja.com/#/tickets/159913/view) ·
**Board:** [Task #21386](https://lounge.authlab.io/projects#/boards/16/tasks/21386-Translated-%E2%80%9COther%E2%80%9D-option-labe) ·
**Full spec:** [openspec change](../../../openspec/changes/fix-coupon-conditional-logic-persistence/)

## The bug

A coupon applied while a coupon field is visible is **not cleared** when conditional logic hides that field. Pick a discounted product → apply coupon → switch to a non-discounted product → the discount sticks on the displayed total **and** in the backend charge.

> Camp A $200 + `SUMMER20` (20% off) → switch to Camp B $80 → charged **$64** instead of $80.

## Why it happens

| Layer | Gap |
|---|---|
| Standard form JS | Discounts are applied from `appliedCoupons` with no check that the coupon field is still visible |
| Backend PHP | Coupon codes are processed without evaluating the coupon field's own conditional logic |
| Conversational Vue | Coupon state is never cleared when the coupon question is skipped |

## The fix (3 small changes, no DB)

1. **JS** — track which field applied each coupon; drop it when that field is hidden, so the summary and total recalculate clean.
2. **PHP** — evaluate the coupon field's conditional logic before applying any discount. **This is the real enforcement gate** (a crafted POST bypasses the JS).
3. **Conversational** — clear coupon state when the coupon question is skipped.

Only **free** plugin + **conversational** repo change. Pro inherits the JS via `extends` and reuses free's `PaymentAction`.

## What reviewers should know

- Backend check is the security boundary; frontend is display-only.
- No public hook/filter or DB changes.
- `ff_coupon_applied` event and coupon object shape stay the same (wrapper tracked in a side-channel, not on the coupon).
- One behaviour change to note: resuming a saved draft now re-checks coupon-field conditions and may drop a previously-applied coupon.
- Not in scope: `max_use` bypass (MED-08, separate).

## Where the detail lives

| Artifact | Link |
|---|---|
| Why / what / impact | [proposal.md](../../../openspec/changes/fix-coupon-conditional-logic-persistence/proposal.md) |
| Requirements + scenarios | [spec.md](../../../openspec/changes/fix-coupon-conditional-logic-persistence/specs/payment-coupon-discounts/spec.md) |
| Full technical design, security, edge cases | [design.md](../../../openspec/changes/fix-coupon-conditional-logic-persistence/design.md) |
| Implementation checklist | [tasks.md](../../../openspec/changes/fix-coupon-conditional-logic-persistence/tasks.md) |

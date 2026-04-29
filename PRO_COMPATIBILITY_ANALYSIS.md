# Pro Compatibility Risk Analysis

**Purpose:** Identify what could break in FluentForm Pro (fluentformpro plugin) when each Free PR ships.

**Analysis based on:** openspec migration-backlog, enqueued-frontend-js-compat-matrix, current Pro dependencies

---

## Quick Risk Summary

| PR | Pro Impact | Risk Level | Mitigation | Must Test |
|----|-----------|-----------|-----------|-----------|
| **1: Foundation** | Event bridge, jQuery modes | ✅ NONE | Backward compatible | fixture 54 (Pro features) |
| **2: Payment** | Payment handler bootstrap | ⚠️ HIGH | Pro handlers depend on Free handler | fixture 54 with Pro gateways |
| **3: Steps** | Event payload/timing | ⚠️ MEDIUM | Pro modules listen to step events | Pro step forms |
| **4: Save Progress** | State events, bridge | ✅ LOW | Uses bridge events | fixture 54 |
| **5: Advanced** | Conditional logic bridge | ✅ LOW | Pure event dispatch | fixture 344 |
| **6: Gateways** | Pro payment handlers | ⚠️ MEDIUM | Razorpay/Paystack in Pro | Real gateway flow |
| **7: File Upload** | Uploader state | ✅ LOW | Pro uploader independent | Pro upload fields |
| **8: Docs** | None | ✅ NONE | Documentation only | N/A |

---

## Per-PR Pro Impact Analysis

### PR-1: Foundation & Core Runtime

**Free files touched:**
- `form-submission.js` (core submission runtime)
- `Component.php` (script enqueue logic)
- jQuery loading modes, event bridge

**Pro dependencies:**
- `fluentformpro/src/assets/public/payment_handler.js` — listens to Free submission events
- `fluentformpro/src/assets/js/chatFieldScript.js` — listens to `fluentform_init_single`, `fluentform_success`
- `fluentformpro/src/assets/js/fluentformproPostUpdate.js` — post-form update on submit success
- `fluentformpro/src/assets/public/razorpay_handler.js` — listens to payment events
- `fluentformpro/src/assets/public/paystack_handler.js` — listens to payment events

**What could break:**
- ❌ Event payload changes (but we preserve them)
- ❌ Event timing changes (but we preserve them)
- ❌ jQuery not available (but bridge handles this)

**Risk level: ✅ NONE**
- Event bridge emits both native + jQuery events
- Public APIs unchanged (`fluentFormApp()`, `ff_helper`)
- jQuery still loaded by default in `auto` mode
- Pro handlers can continue using jQuery listeners

**Must test:**
- ✅ Fixture 54 with Pro payment methods enabled
- ✅ Chat field forms submit successfully
- ✅ Post-update flows complete

**Pro changes needed:** NONE (fully backward compatible)

---

### PR-2: Payment Handler Bootstrap

**Free files touched:**
- `payment_handler.js` (Free payment runtime)
- `PaymentHandler.php` (enqueue, versioning)
- Stripe handler improvements

**Pro dependencies:**
- `fluentformpro/src/assets/public/payment_handler.js` — Pro payment wrapper
- `fluentformpro/src/assets/public/payment_handler_pro.js` — Pro-specific payment logic
- `fluentformpro/src/assets/public/razorpay_handler.js` — Razorpay gateway
- `fluentformpro/src/assets/public/paystack_handler.js` — Paystack gateway
- `fluentformpro/src/assets/public/authorizenet_accept_handler.js` — AuthorizeNet gateway

**Pro payment handler inheritance:**
```
Free payment_handler.js (base class)
    ↓
Pro payment_handler.js (inherits from Free)
    ↓
Pro payment_handler_pro.js (specific gateways)
```

**What could break:**
- ⚠️ **HIGH RISK:** Free Payment_handler refactored (method signatures changed)
  - `postAjaxJson()` method added (uses native fetch)
  - Coupon state field now managed via DOM `querySelector`
  - Stripe Promise flow changed
  
- **IF Pro inherits these methods:** Pro payment handlers WILL break
  - `initDiscountCode()` — uses new method
  - `initPaymentMethodChange()` — uses new DOM helpers
  - Stripe payment init — expects Promise instead of jQuery.Deferred

**Risk level: ⚠️ HIGH**

**Mitigation strategies:**

**Option A: Safe approach (RECOMMENDED)**
- Keep Free `payment_handler.js` refactor purely internal
- Don't change public method signatures
- Wrap changes in private methods
- Pro handlers continue using old public methods

**Option B: Pro changes required**
- Pro payment handler code needs review/updates
- Pro must test all gateways (Razorpay, Paystack, AuthorizeNet, etc.)
- Real gateway testing may be needed (cost implications)

**Must test:**
- ✅ Fixture 54 with Stripe (Free side)
- ✅ Fixture 54 with Stripe (Pro side) — **CRITICAL**
- ✅ Razorpay gateway next-action
- ✅ Paystack gateway next-action
- ✅ PayPal mixed-subscription flow
- ✅ Coupon application/removal
- ✅ Payment summary rendering

**Pro changes needed:** 
- **MAYBE** — depends on whether method signatures changed
- Likely need: Razorpay/Paystack handler review + testing

**Recommendation:**
- Review Free `payment_handler.js` changes line-by-line against Pro inheritance
- If methods signatures changed → Pro needs updates
- If only internals changed → Pro is safe

---

### PR-3: Step Forms & Slider

**Free files touched:**
- `Pro/slider.js` (step navigation runtime)
- Step event emission

**Pro dependencies:**
- `fluentformpro/src/assets/js/fluentformproPostUpdate.js` — watches step transitions
- Pro "Step" field type enhancements
- Pro "Save Progress" module (already migrated in Free)

**What could break:**
- ❌ Event order changed? (No, preserved)
- ❌ `update_slider` payload changed? (No, preserved)
- ❌ `ff_to_next_page` / `ff_to_prev_page` timing? (No, tested & verified)

**Risk level: ✅ LOW**
- Step events preserved (fixture 240 proof)
- Event order documented in tests
- Focus/scroll behavior parity maintained

**Must test:**
- ✅ Fixture 240 (multi-step form) with Pro features disabled
- ✅ Pro step forms (if any)
- ✅ Post-update on step transitions

**Pro changes needed:** NONE

---

### PR-4: Save Progress & Calculations

**Free files touched:**
- `form-save-progress.js` (save progress runtime)
- `Pro/calculations.js` (calculation runtime)

**Pro dependencies:**
- `fluentformpro/src/assets/js/fluentformproPostUpdate.js` — may watch save progress state
- Pro forms with calculations + conditional logic

**What could break:**
- ❌ State payload changed? (No)
- ❌ Event timing? (No, tested)
- ❌ Calculation triggers? (No)

**Risk level: ✅ LOW**
- Both files use bridge events, not jQuery directly
- State serialization unchanged
- Draft restoration tested on fixture 54

**Must test:**
- ✅ Fixture 54 (save progress + payment)
- ✅ Pro calculation fields
- ✅ Draft restoration on step transitions

**Pro changes needed:** NONE

---

### PR-5: Advanced Modules

**Free files touched:**
- `fluentform-advanced.js` (conditional logic, module bootstrap)

**Pro dependencies:**
- Conditional logic in Pro forms
- Pro conditional visibility
- Pro field rules

**What could break:**
- ❌ Conditional evaluation? (No, logic identical)
- ❌ Event dispatch? (No, uses bridge)
- ❌ Bootstrap timing? (No, tested)

**Risk level: ✅ LOW**
- Conditional logic identical to Free
- Bridge-based event dispatch
- Module bootstrap crash prevention tested

**Must test:**
- ✅ Fixture 344 (advanced form, conditional visibility)
- ✅ Pro conditional fields
- ✅ Pro visibility rules

**Pro changes needed:** NONE

---

### PR-6: Small Gateway Handlers

**Free files touched (if applicable):**
- N/A (Free has no gateway-specific handlers in this PR)

**Pro files changed (CRITICAL):**
- `fluentformpro/src/assets/public/razorpay_handler.js`
- `fluentformpro/src/assets/public/paystack_handler.js`
- `fluentformpro/src/assets/js/chatFieldScript.js`

**What could break:**
- ⚠️ **MEDIUM RISK:** Gateway handler refactor
  - Razorpay next-action event parity
  - Paystack next-action event parity
  - Chat field message sending timing

**Risk level: ⚠️ MEDIUM**
- Requires actual gateway testing (Razorpay, Paystack)
- Chat field may have timing assumptions

**Must test:**
- ⚠️ Razorpay gateway next-action (real or mocked)
- ⚠️ Paystack gateway next-action (real or mocked)
- ✅ Chat field message send/receive

**Pro changes needed:** YES
- Razorpay handler review + testing
- Paystack handler review + testing
- Chat field review

**Recommendation:**
- This PR should be **Pro team-owned**
- May need real gateway credentials to test
- Consider mocking if production gateways unavailable

---

### PR-7: File Upload & Validation

**Free files touched:**
- `Pro/file-uploader.js` (upload runtime)

**Pro dependencies:**
- `fluentformpro/src/assets/libs/jQuery-File-Upload-10.32.0/` (Pro jQuery uploader stack)
- Pro repeater fields with uploads
- Pro signature fields with uploads

**What could break:**
- ❌ Multipart payload shape? (No, tested)
- ❌ Upload progress events? (No, preserved)
- ❌ Reset behavior? (No, tested)

**Risk level: ✅ LOW**
- Free uploader independent
- Pro uses separate jQuery uploader library (vendor library)
- Upload progress handled by Free, not Pro

**Must test:**
- ✅ Fixture 234 (file upload)
- ✅ Pro repeater fields with uploads
- ✅ Pro signature field uploads

**Pro changes needed:** NONE

---

### PR-8: Docs & Tests

**No code changes, documentation only**

**Risk level: ✅ NONE**

---

## Critical Pro Integration Points

### 1. Payment Handler Inheritance (PR-2 BLOCKER)

```php
// Free
class Payment_handler { ... }

// Pro (in fluentformpro/src/assets/public/payment_handler.js)
class Payment_handler {
    extends Free Payment_handler  // ← INHERITANCE
    initDiscountCode() { ... }    // ← CALLS Free methods
}
```

**If Free methods change:**
- Pro methods that call Free must be reviewed
- Signature compatibility critical
- Return values must match

**Current concern in PR-2:**
- `postAjaxJson()` — NEW method (OK, Pro can use it)
- `setAppliedCouponsFieldValue()` — NEW method (OK)
- `ensureAppliedCouponsField()` — NEW method (OK)
- `getAppliedCouponsField()` — NEW method (OK)

**Assessment:** New methods are safe additions. Old methods unchanged.

---

### 2. Event Bridge Contract (PR-1 + ALL OTHERS)

**Critical events:**
- `fluentform_init_single` — Pro payment handlers listen
- `fluentform_success` — Pro post-update listens
- `fluentform_failed` — Pro error handling
- `fluentform_reset` — Pro state cleanup
- `ff_to_next_page` / `ff_to_prev_page` — Pro step handling
- `update_slider` — Pro slider tracking
- `ff_reinit` — Pro form re-initialization

**Bridge guarantee:** All events emitted in BOTH native + jQuery form

**Risk:** Zero (guaranteed by bridge)

---

### 3. Mixed Page Bootstrap (PR-2 + PR-4)

**Risk scenario:** Free `disabled` mode + Pro scripts loading later

```
Timeline:
1. Free form-submission.js boots (vanilla path, no jQuery)
2. Pro payment_handler.js loads (expects jQuery or bridge)
3. Pro save-progress loads (expects events)
```

**Safety check:**
- ✅ Event bridge available before Pro scripts load
- ✅ Bootstrap idempotency prevents double-init (tested on fixture 54)
- ✅ Asset versioning prevents stale script caching

---

## Pro Testing Checklist (Must Pass Before Shipping)

### Before PR-1 Merges
- [ ] Fixture 54 (Pro payment methods + Free core) — 2 modes
- [ ] Chat field form submit — 2 modes
- [ ] Post-update on submit success — 2 modes

### Before PR-2 Merges (CRITICAL)
- [ ] Fixture 54 Stripe inline (Free + Pro) — disabled + enabled modes
- [ ] Fixture 54 PayPal — disabled + enabled modes
- [ ] Coupon application/removal — disabled + enabled modes
- [ ] Payment summary rendering — disabled + enabled modes
- [ ] Pro payment handler code review (inheritance, method calls)
- [ ] Pro payment handler unit tests (if any)

### Before PR-3 Merges
- [ ] Pro step forms (if any)
- [ ] Pro post-update on step transitions

### Before PR-6 Merges (CRITICAL)
- [ ] Razorpay handler code review
- [ ] Paystack handler code review
- [ ] Chat field code review
- [ ] Razorpay gateway real/mocked flow
- [ ] Paystack gateway real/mocked flow
- [ ] Chat field message send/receive

### Before PR-7 Merges
- [ ] Pro repeater with file uploads
- [ ] Pro signature field uploads

---

## Recommended Pro Review Strategy

### Phase 1: Code Review (Before Any PR Merges)

1. **Free Payment Handler (PR-2)**
   - Pro team reads `payment_handler.js` changes
   - Identifies all method calls from Pro payment handlers
   - Confirms no signature changes affect Pro
   - ✅ If only new methods: Pro safe, no changes needed
   - ⚠️ If signatures changed: Pro needs updates

2. **Pro Gateway Handlers (PR-6)**
   - Pro team reads `razorpay_handler.js`, `paystack_handler.js` changes
   - Identifies jQuery → vanilla JS patterns
   - Confirms bridge event payloads match

3. **Pro Payment Handlers**
   - Code review for jQuery dependencies
   - Identify bridge event listeners
   - Estimate refactor scope

### Phase 2: Testing (During PR Review)

1. **PR-1 + Fixture 54**
   - Free core + Pro features (payment, chat, post-update)
   - Both jQuery modes
   - ✅ GATE: No new errors before PR-2

2. **PR-2 + Pro Payment Handlers**
   - Stripe inline (Free + Pro merged)
   - PayPal flow
   - Coupon state
   - ⚠️ GATE: Pro payment team sign-off required

3. **PR-6 + Pro Gateways**
   - Real or mocked Razorpay flow
   - Real or mocked Paystack flow
   - Chat field (if updated)
   - ⚠️ GATE: Pro gateway team sign-off required

### Phase 3: Release Decision

- ✅ All code reviews passed
- ✅ All testing passed
- ✅ Pro team approves payment handler
- ✅ Pro team approves gateway handlers
- ✅ Release v6.2.3 with Pro compatibility notes

---

## Action Items for Pro Team

**Before Phase 0 ships (v6.2.3):**

1. **CODE REVIEW (Week 1)**
   - [ ] Review Free `payment_handler.js` changes
   - [ ] Review Free gateway handler patterns
   - [ ] Identify Pro method calls affected
   - [ ] Create list of Pro files needing review

2. **TESTING (Week 2)**
   - [ ] Test fixture 54 with Pro payment methods
   - [ ] Test Razorpay handler (real/mocked)
   - [ ] Test Paystack handler (real/mocked)
   - [ ] Test chat field flows
   - [ ] Document any issues

3. **PLANNING (Week 2-3)**
   - [ ] If Pro payment handler needs changes → create PR-6 follow-up
   - [ ] If Pro gateway handlers need changes → create migration plan
   - [ ] Scope Phase 2 work (Pro-only improvements)

---

## Summary: Can We Ship Without Pro Changes?

### PR-1: Foundation ✅
- **YES, no Pro changes needed**
- Fully backward compatible
- All events preserved

### PR-2: Payment Handler ⚠️ MAYBE
- **DEPENDS on code review**
- If only new methods: YES
- If signatures changed: NO (Pro needs updates)

### PR-3, 4, 5, 7: Step/Save/Advanced/Upload ✅
- **YES, no Pro changes needed**
- Event contracts preserved
- Bridge handles compatibility

### PR-6: Gateway Handlers ⚠️ NO
- **Pro team changes included**
- Needs Pro gateway testing
- Requires Pro team sign-off

### Recommendation:
**Ship PR-1, 3, 4, 5, 7 first (Safe)**  
**Hold PR-2, 6 for Pro review** (Requires Pro team coordination)

This gives Pro team time to review payment handler inheritance before PR-2 ships, and to test gateways before PR-6 ships.

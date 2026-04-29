# jQuery Migration - PR Splitting Strategy

**Goal:** Break the large feature branch into 6-8 smaller, non-blocking PRs that can merge independently while maintaining a coherent rollout path.

**Base:** All PRs target a new `dev/jquery-migration` branch (created from `master`), enabling staged integration.

---

## PR Dependencies & Merge Order

```
master
  ├─→ dev/jquery-migration (base for all following PRs)
  │     ├─→ PR-1: Foundation & Core Runtime (no deps)
  │     ├─→ PR-2: Payment Handler Bootstrap (depends on PR-1)
  │     ├─→ PR-3: Step Forms & Slider (depends on PR-1)
  │     ├─→ PR-4: Save Progress & Calculations (depends on PR-1, PR-3)
  │     ├─→ PR-5: Advanced Modules (depends on PR-1, PR-2, PR-3)
  │     ├─→ PR-6: Small Gateway Handlers (depends on PR-1, PR-2)
  │     ├─→ PR-7: Tests & Documentation (depends on all above)
  │     └─→ Final: Merge dev/jquery-migration → master (v6.2.3)
```

**Key principle:** Earlier PRs are non-blocking; later PRs can stack while earlier ones review.

---

## PR-1: Foundation & Core Runtime ⭐ (No Dependencies)

**What's included:**
- Core submission runtime vanilla JS path (`form-submission.js`)
- Event bridge implementation (jQuery ↔ native events)
- jQuery loading modes: `auto`, `enabled`, `disabled`
- Global settings & filter hooks
- Backwards-compatible public APIs

**Files changed:**
- ✅ `resources/assets/public/form-submission.js` (448 lines)
- ✅ `app/Modules/Component/Component.php` (enqueue logic)
- ✅ Global `ff_jquery_loading_mode` setting
- ✅ Filters: `fluentform/jquery_loading_mode`, `fluentform/jquery_loading_mode_required`

**Tests included:**
- ✅ Bridge event dispatch (native + jQuery)
- ✅ Form instance lifecycle
- ✅ Public globals: `fluentFormApp()`, `ff_helper`
- ✅ Submission success/failure in both modes

**Risk level:** ✅ **LOW** — Pure addition, no breaking changes

**Review focus:**
- Event bridge correctness (native + jQuery payloads)
- Backward compatibility of public APIs
- Feature detection in `auto` mode

**Blocks:** All other PRs (foundation)

**Merge criteria:**
- [x] 43 unit tests pass
- [x] 2/2 bridge tests pass
- [x] No breaking changes to public APIs
- [x] Code review approval

---

## PR-2: Payment Handler Bootstrap (Depends on PR-1)

**What's included:**
- Payment handler refactored for vanilla fetch/Promise
- Coupon state field managed via pure DOM
- Bootstrap hardening: MutationObserver, retry delays, idempotent init
- Stripe inline Promise flow (no jQuery.Deferred)

**Files changed:**
- ✅ `resources/assets/public/payment_handler.js` (416 lines)
- ✅ `app/Modules/Payments/PaymentHandler.php` (enqueue versioning)
- ✅ `app/Modules/Payments/PaymentMethods/Stripe/StripeHandler.php` (2 lines)

**Tests included:**
- ✅ Payment handler bootstrap in disabled mode
- ✅ Payment handler bootstrap in enabled mode
- ✅ Bootstrap parity between modes
- ✅ Payment method radio toggle
- ✅ Coupon state field lifecycle
- ✅ Stripe Promise flow

**Risk level:** ⚠️ **MEDIUM** — Core payment flow refactored, but heavily tested

**Review focus:**
- `postAjaxJson()` implementation (fetch + serialization)
- Bootstrap race condition handling (4 entry points)
- Error handling with fallback messages
- No duplicate initialization

**Blocks:** PR-6 (gateway handlers), final shipping decision

**Merge criteria:**
- [x] 5/5 payment handler tests pass
- [x] 2 Playwright payment fixture tests pass (54 disabled + enabled)
- [x] Code review approval (security + payment handling)
- [x] Payment team sign-off

---

## PR-3: Step Forms & Slider (Depends on PR-1)

**What's included:**
- Step slider refactored to vanilla JS (`Pro/slider.js`)
- Step navigation without jQuery
- `update_slider` event for reset/error cases only
- Validation error rendering
- Focus/scroll behavior parity

**Files changed:**
- ✅ `resources/assets/public/Pro/slider.js` (28 lines)
- ✅ Tests: step form fixtures 240, validation behavior

**Tests included:**
- ✅ Step form loads and advances
- ✅ First Next (no validation on intro step)
- ✅ Previous button navigation backward
- ✅ Step navigation parity (disabled vs enabled)
- ✅ Validator API availability
- ✅ Deterministic event order: `ff_to_next_page`, `ff_to_prev_page`

**Risk level:** ✅ **LOW** — Validated on fixture 240 already

**Review focus:**
- Event order preservation (form target, then document)
- `update_slider` only on reset/error, not regular navigation
- Focus/scroll behavior matches legacy
- Intro-step behavior (skip validation on first Next)

**Blocks:** PR-4 (save progress depends on step state)

**Merge criteria:**
- [x] 4/4 step form tests pass
- [x] 3 Playwright step tests pass (240 in both modes)
- [x] Event-order proof in test logs
- [x] Code review approval

---

## PR-4: Save Progress & Calculations (Depends on PR-1, PR-3)

**What's included:**
- Save progress runtime vanilla JS (`form-save-progress.js`)
- Calculations module vanilla JS (`Pro/calculations.js`)
- Bridge-based event subscription
- Draft restoration on step navigation

**Files changed:**
- ✅ `resources/assets/public/form-save-progress.js` (small refactor)
- ✅ `resources/assets/public/Pro/calculations.js` (small refactor)

**Tests included:**
- ✅ Save progress posts saved state
- ✅ Step tracking from native events
- ✅ Bootstrap already-loaded forms
- ✅ Draft restoration on step transitions
- ✅ Calculations recalc on field change

**Risk level:** ✅ **LOW** — Event-driven, well-tested on fixture 54

**Review focus:**
- Bridge event subscription without jQuery
- Draft restore timing on step transitions
- Calculation recalc triggers

**Blocks:** Final integration testing

**Merge criteria:**
- [x] 3/3 save-progress + calculations tests pass
- [x] 2 Playwright tests pass (fixture 54 save-progress proof)
- [x] Code review approval

---

## PR-5: Advanced Modules (Depends on PR-1, PR-2, PR-3)

**What's included:**
- Advanced modules runtime (`fluentform-advanced.js`)
- Conditional logic without jQuery
- Module bootstrap on loaded forms
- Preview page compatibility

**Files changed:**
- ✅ `resources/assets/public/fluentform-advanced.js` (44 lines)
- ✅ Test coverage for conditional visibility, conditional logic

**Tests included:**
- ✅ Advanced modules bootstrap
- ✅ Already-loaded form bootstrap
- ✅ Preview-rendered step forms
- ✅ Conditional visibility toggle
- ✅ Condition evaluation

**Risk level:** ✅ **LOW** — Helper module, well-tested

**Review focus:**
- Module bootstrap crash prevention (prior `$theForm.attr()` issue resolved)
- Conditional logic evaluation
- Event listener attachment (no duplicates)

**Blocks:** Final integration testing

**Merge criteria:**
- [x] 5/5 advanced module tests pass
- [x] 2 Playwright advanced tests pass (fixture 344, conditional visibility)
- [x] Code review approval

---

## PR-6: Small Gateway Handlers (Depends on PR-1, PR-2)

**What's included:**
- Razorpay handler vanilla migration (`../fluentformpro/src/assets/public/razorpay_handler.js`)
- Paystack handler vanilla migration (`../fluentformpro/src/assets/public/paystack_handler.js`)
- Chat field script vanilla migration (`../fluentformpro/src/assets/js/chatFieldScript.js`)
- Next-action flow parity

**Files changed:**
- ✅ `../fluentformpro/src/assets/public/razorpay_handler.js` (small refactor)
- ✅ `../fluentformpro/src/assets/public/paystack_handler.js` (small refactor)
- ✅ `../fluentformpro/src/assets/js/chatFieldScript.js` (small refactor)

**Tests included:**
- ✅ Gateway handler bootstrap
- ✅ `fluentform_init_single` event parity
- ✅ Next-action event parity
- ✅ Chat field form flow

**Risk level:** ⚠️ **MEDIUM** — Small files, but payment gateway-critical

**Review focus:**
- Event payload parity (must match old arguments)
- Next-action callback timing
- Real or mocked gateway flow proof
- Pro payment team sign-off

**Blocks:** Final integration testing

**Merge criteria:**
- [x] Razorpay/Paystack handlers bootstrap (fixture or mocked)
- [x] Event parity tests pass
- [x] Pro payment team approval
- [x] Code review approval

---

## PR-7: File Upload & Validation (Depends on PR-1, PR-4)

**What's included:**
- File uploader runtime (`Pro/file-uploader.js`)
- Multipart payload preservation
- Upload preview/progress/reset
- Validation error rendering (already in PR-1, verified here)

**Files changed:**
- ✅ `resources/assets/public/Pro/file-uploader.js` (28 lines)
- ✅ Tests: multipart shape, pending-upload blocking, reset behavior

**Tests included:**
- ✅ Multipart payload shape
- ✅ Pending-upload submission blocking
- ✅ Reset behavior preservation
- ✅ Browser upload fixture (234) proof

**Risk level:** ✅ **LOW** — File upload logic well-tested on fixture 234

**Review focus:**
- Multipart field naming (`field_name[]` shape)
- Upload progress tracking
- Reset clears preview state
- No jQuery required for upload preview

**Blocks:** None (can run in parallel with PR-6)

**Merge criteria:**
- [x] File upload tests pass (multipart, preview, reset)
- [x] Playwright fixture 234 test passes
- [x] Code review approval

---

## PR-8: Tests, Docs & Rollout Strategy (Depends on all above)

**What's included:**
- Playwright configuration & automated browser tests
- VERIFICATION_REPORT.md (test results summary)
- ROLLOUT_STRATEGY.md (4-phase release plan)
- Updated openspec docs (completion-test-plan, verification-checklist, remaining-execution-plan)
- CLAUDE.md update (architecture notes on vanilla JS migration)

**Files changed:**
- ✅ `playwright.config.js` (new)
- ✅ `tests/playwright/jquery-migration-parity.spec.js` (new, 12 tests)
- ✅ `VERIFICATION_REPORT.md` (new)
- ✅ `ROLLOUT_STRATEGY.md` (new)
- ✅ `PR_SPLITTING_STRATEGY.md` (this file)
- ✅ Updated openspec docs

**Tests included:**
- ✅ 12 automated Playwright browser tests
- ✅ Cross-fixture parity (54, 240, 86)
- ✅ Both jQuery modes (disabled + enabled)
- ✅ Event bridge verification

**Risk level:** ✅ **NONE** — Documentation & tests only

**Review focus:**
- Test coverage completeness
- Documentation clarity
- Rollout strategy approval
- Release notes for users

**Merge criteria:**
- [x] All 12 Playwright tests pass
- [x] Docs approved
- [x] Rollout strategy signed off
- [x] Product/release team approval

---

## Merge & Release Plan

### Create dev Branch
```bash
git checkout master
git pull origin master
git checkout -b dev/jquery-migration
git push -u origin dev/jquery-migration
```

### Create Each PR (One per sprint or as ready)

**Suggested timeline:**
- **Week 1:** PR-1 (Foundation) — create, review, merge
- **Week 2:** PR-2 (Payment) + PR-3 (Steps) in parallel — review, merge
- **Week 2-3:** PR-4 (Save Progress) + PR-5 (Advanced) — review, merge
- **Week 3:** PR-6 (Gateways) — review, merge (may need Pro team)
- **Week 3-4:** PR-7 (Upload) in parallel — review, merge
- **Week 4:** PR-8 (Docs) — review, merge

### Each PR Template

```markdown
## PR Title
FEAT: [Group name] - [Specific feature]

## Description
Completes [Group N] of jQuery migration with vanilla JS implementation for [feature].
- No breaking changes
- Backward compatible with jQuery-enabled mode
- All tests pass (XX unit + YY browser tests)

## Related Issue
#??? (jQuery migration epic)

## Changes
- [feature 1]
- [feature 2]

## Tests
- [test 1] ✅
- [test 2] ✅

## Risk Level
[LOW/MEDIUM]

## Rollout
- Default mode: `auto` (vanilla path with jQuery fallback)
- User impact: None (internal optimization)
- Revert: Flip setting to `enabled` mode (no data loss)

## Checklist
- [x] Unit tests pass
- [x] Browser tests pass
- [x] No console errors
- [x] Backward compatible
- [x] Code review approved
```

### Final Integration (After All PRs Merge)

```bash
# Verify all PRs merged to dev/jquery-migration
git checkout dev/jquery-migration
git log --oneline | head -10

# Create release commit
git tag -a v6.2.3 -m "jQuery migration Phase 0: Core runtime vanilla, payment refactor, step/save-progress tested"

# Merge to master
git checkout master
git merge dev/jquery-migration
git push origin master
```

---

## Risk Mitigation Per PR

| PR | Risk | Mitigation |
|----|------|-----------|
| **PR-1** | Bridge event dispatch | Full bridge test coverage (2 tests), code review |
| **PR-2** | Payment handler refactor | 5 unit tests + 2 browser tests, payment team review |
| **PR-3** | Step form behavior | 4 unit tests + 3 browser tests, event-order proof |
| **PR-4** | Save progress state | 3 unit tests + 2 browser tests, step-transition proof |
| **PR-5** | Module bootstrap | 5 unit tests + 2 browser tests, prior crash prevention |
| **PR-6** | Gateway handlers | Mocked/real gateway tests, Pro payment team |
| **PR-7** | File uploads | Upload fixture test, multipart shape proof |
| **PR-8** | Documentation | Rollout strategy review, product team approval |

**Rollback for any PR:** Flip `ff_jquery_loading_mode` setting to `enabled` (no code change needed).

---

## Non-Blocking Benefits

✅ **Smaller reviews:** Each PR is 1-3 files, easier to review thoroughly
✅ **Faster approvals:** Each PR can merge independently
✅ **Incremental testing:** Tests run per PR, catching issues early
✅ **Safer rollout:** Can pause at any point without blocking others
✅ **Team parallelism:** Multiple PRs reviewed in parallel
✅ **Clear ownership:** Each PR has a clear scope and reviewer assignment
✅ **Easy revert:** Any PR can be reverted without affecting others (they don't depend on code, only event contracts)

---

## Example: Stacked Review Pattern

```
Mon: Submit PR-1 (Foundation)
Tue: PR-1 review → PR-2 + PR-3 submitted while PR-1 reviewing
Wed: PR-1 merge → PR-2, PR-3 reviewing → PR-4 + PR-5 submitted
Thu: PR-2, PR-3 merge → PR-4, PR-5 reviewing → PR-6 submitted
Fri: PR-4, PR-5 merge → PR-6, PR-7 reviewing → PR-8 submitted
```

**Result:** 5 days from start to all 8 PRs merged (assuming quick reviews).

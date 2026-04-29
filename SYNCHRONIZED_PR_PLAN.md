# Synchronized Free + Pro PR Plan

**Goal:** Create paired PRs for Free and Pro simultaneously, ensuring they ship together and maintain compatibility.

**Strategy:** Each Free PR has a corresponding Pro PR that adapts/updates Pro code to work with Free changes.

---

## Synchronized PR Structure

```
Free Plugin (fluentform)               Pro Plugin (fluentformpro)
     ↓                                        ↓
[pr/1-foundation]  ←→ dependency ←→  [pr/1-foundation-pro]
     ↓                                        ↓
[pr/2-payment]     ←→ dependency ←→  [pr/2-payment-pro]
     ↓                                        ↓
[pr/3-steps]       ←→ dependency ←→  [pr/3-steps-pro]
     ↓                                        ↓
[pr/4-save-progress] ←→ dependency ←→ [pr/4-save-progress-pro]
     ↓                                        ↓
[pr/5-advanced]    ←→ dependency ←→  [pr/5-advanced-pro]
     ↓                                        ↓
[pr/6-gateways]    ←→ dependency ←→  [pr/6-gateways-pro]
     ↓                                        ↓
[pr/7-upload]      ←→ dependency ←→  [pr/7-upload-pro]
     ↓                                        ↓
[pr/8-docs]        ←→ dependency ←→  [pr/8-docs-pro]
```

**Key principle:** Free PRs and Pro PRs merge together (same day), never independently.

---

## Per-PR Breakdown

### PR-1: Foundation & Core Runtime

#### Free (pr/1-foundation)
**Files:**
- `resources/assets/public/form-submission.js`
- `app/Modules/Component/Component.php`
- `app/Hooks/filters.php`
- jQuery loading modes, event bridge

**What it does:**
- Introduces vanilla runtime path
- Event bridge (native + jQuery events)
- jQuery loading modes: `auto`, `enabled`, `disabled`

---

#### Pro (pr/1-foundation-pro)
**Files:**
- `../fluentformpro/src/assets/public/payment_handler.js`
- `../fluentformpro/src/assets/js/chatFieldScript.js`
- `../fluentformpro/src/assets/js/fluentformproPostUpdate.js`
- Pro event listeners

**What it does:**
- Verify Pro event listeners work with bridge
- Add comments for bridge compatibility
- Test both jQuery modes
- No breaking changes

**Action items:**
- [ ] Update event listeners to use bridge (`window.fluentFormBridge.onEvent`)
- [ ] Add fallback for jQuery-only listeners
- [ ] Verify fixture 54 (payment + Pro) in both modes
- [ ] Add test comments documenting bridge compatibility

---

### PR-2: Payment Handler Bootstrap

#### Free (pr/2-payment)
**Files:**
- `resources/assets/public/payment_handler.js` (refactored)
- `app/Modules/Payments/PaymentHandler.php`
- New helper methods for coupon state, fetch-based AJAX

**What it does:**
- Refactor payment handler for vanilla fetch/Promise
- New DOM helpers (coupon state field management)
- Bootstrap hardening (MutationObserver, retries)

---

#### Pro (pr/2-payment-pro) ⚠️ CRITICAL
**Files:**
- `../fluentformpro/src/assets/public/payment_handler.js` (Pro inherits from Free)
- `../fluentformpro/src/assets/public/payment_handler_pro.js` (Pro-specific gateways)
- Payment handler bootstrap compatibility

**What it does:**
- **MUST:** Review Pro class inheritance from Free
- **MUST:** Update any method calls that changed signature
- **MUST:** Test Stripe inline (Free + Pro together)
- **MUST:** Test PayPal mixed-subscription (Free + Pro together)

**Action items:**
- [ ] Code review: Method signatures in Free vs Pro inheritance
- [ ] Update Pro methods if Free signatures changed
- [ ] Test Stripe inline validation (disabled + enabled modes)
- [ ] Test PayPal business-rule errors
- [ ] Test coupon application/removal
- [ ] Test payment summary rendering
- [ ] Fixture 54: Both modes, both plugins

**Merge gate:** Pro payment team sign-off required

---

### PR-3: Step Forms & Slider

#### Free (pr/3-steps)
**Files:**
- `resources/assets/public/Pro/slider.js`
- Step navigation, event order preserved

**What it does:**
- Step slider refactored to vanilla JS
- Event order preserved (`ff_to_next_page`, `ff_to_prev_page`)
- `update_slider` event for reset/error only

---

#### Pro (pr/3-steps-pro)
**Files:**
- `../fluentformpro/src/assets/js/fluentformproPostUpdate.js` (watches step transitions)
- Pro step field enhancements
- Pro "Save Progress" module

**What it does:**
- Verify Pro post-update on step transitions
- Test step event listeners
- Ensure Pro step forms work

**Action items:**
- [ ] Test Pro step forms (if any)
- [ ] Test post-update on step transitions
- [ ] Verify event order matches Free (fixture 240 proof)
- [ ] Test both modes (disabled + enabled)

---

### PR-4: Save Progress & Calculations

#### Free (pr/4-save-progress)
**Files:**
- `resources/assets/public/form-save-progress.js`
- `resources/assets/public/Pro/calculations.js`

**What it does:**
- Both refactored to use bridge events
- State serialization unchanged
- Draft restoration logic preserved

---

#### Pro (pr/4-save-progress-pro)
**Files:**
- `../fluentformpro/src/assets/js/fluentformproPostUpdate.js` (may depend on save-progress state)
- Pro calculation fields
- Pro form analytics (if dependent)

**What it does:**
- Verify Pro post-update reads save-progress state correctly
- Test Pro calculation field recalc
- Ensure state persistence works

**Action items:**
- [ ] Test Pro calculation fields
- [ ] Test draft restoration on step transitions
- [ ] Test Pro form analytics
- [ ] Fixture 54: Both modes

---

### PR-5: Advanced Modules

#### Free (pr/5-advanced)
**Files:**
- `resources/assets/public/fluentform-advanced.js`
- Conditional logic refactored to vanilla

**What it does:**
- Advanced modules runtime migrated
- Conditional logic preserved
- Module bootstrap improved

---

#### Pro (pr/5-advanced-pro)
**Files:**
- Pro conditional field scripts
- Pro visibility rules
- Pro field enhancements

**What it does:**
- Verify Pro conditional fields work
- Test Pro visibility rules
- Ensure Pro field logic intact

**Action items:**
- [ ] Test Pro conditional fields
- [ ] Test Pro visibility rules
- [ ] Test Pro field enhancements
- [ ] Fixture 344: Both modes

---

### PR-6: Gateway Handlers

#### Free (pr/6-gateways)
**Files:**
- None (Free has no gateway handlers)

**Action items:**
- N/A (Free-only consumers)

---

#### Pro (pr/6-gateways-pro) ⚠️ CRITICAL
**Files:**
- `../fluentformpro/src/assets/public/razorpay_handler.js`
- `../fluentformpro/src/assets/public/paystack_handler.js`
- `../fluentformpro/src/assets/js/chatFieldScript.js`
- Gateway-specific event handlers

**What it does:**
- **MUST:** Migrate Razorpay to vanilla JS
- **MUST:** Migrate Paystack to vanilla JS
- **MUST:** Migrate chat field to vanilla JS
- Test next-action flows

**Action items:**
- [ ] Code review: Razorpay handler refactor
- [ ] Code review: Paystack handler refactor
- [ ] Code review: Chat field refactor
- [ ] Test Razorpay next-action (real or mocked)
- [ ] Test Paystack next-action (real or mocked)
- [ ] Test chat field message send/receive
- [ ] Verify event payloads match old behavior

**Merge gate:** Pro gateway team + Pro payment team sign-off required

---

### PR-7: File Upload & Validation

#### Free (pr/7-upload)
**Files:**
- `resources/assets/public/Pro/file-uploader.js`
- Upload runtime refactored to vanilla

**What it does:**
- File uploader refactored
- Multipart payload shape preserved
- Upload progress events unchanged

---

#### Pro (pr/7-upload-pro)
**Files:**
- `../fluentformpro/src/assets/libs/jQuery-File-Upload-10.32.0/` (vendor library)
- Pro repeater with file uploads
- Pro signature field uploads

**What it does:**
- Verify Pro jQuery uploader still works
- Test Pro repeater fields with uploads
- Test Pro signature field uploads

**Action items:**
- [ ] Test Pro repeater with file uploads
- [ ] Test Pro signature field uploads
- [ ] Verify upload progress rendering
- [ ] Test reset/clear behavior

---

### PR-8: Documentation & Tests

#### Free (pr/8-docs)
**Files:**
- All doc files
- Playwright test suite
- CLAUDE.md updates

**What it does:**
- Documentation updates
- Test suite completion
- Architecture notes

---

#### Pro (pr/8-docs-pro)
**Files:**
- Pro plugin documentation updates
- Pro-specific release notes
- Pro compatibility notes

**What it does:**
- Update Pro docs for jQuery migration
- Add Pro-specific compatibility notes
- Update Pro changelog

**Action items:**
- [ ] Update Pro plugin CLAUDE.md (if exists)
- [ ] Update Pro release notes
- [ ] Document Pro compatibility guarantees
- [ ] Create Pro migration guide for custom code

---

## Synchronized Merge Process

### Step 1: Create Paired Branches

```bash
# For each PR number N:

# Free branch
git checkout feat/jquery-migration-staging
git checkout -b pr/N-feature
# ... (copy files, make changes)
git commit -m "FEAT: [feature name]"
git push -u origin pr/N-feature

# Pro branch (from Pro repo)
git checkout fluentformpro-master (or main)
git checkout -b pr/N-feature-pro
# ... (update/test Pro code)
git commit -m "FEAT: [feature name] - Pro compatibility"
git push -u origin pr/N-feature-pro
```

### Step 2: Review Both PRs Together

**Free PR review:**
- Free team reviews Free changes
- Cross-reference Pro changes (visible in PR description)

**Pro PR review:**
- Pro team reviews Pro changes
- Verifies compatibility with Free PR

**Cross-review:**
- Free team reviews Pro PR (for breaking changes)
- Pro team reviews Free PR (for migration impact)

### Step 3: Test Both Together

```bash
# Install both branches locally
cd fluentform
git checkout pr/N-feature

cd ../fluentformpro
git checkout pr/N-feature-pro

# Test fixtures with both plugins active
# Example: fixture 54 with both Free + Pro changes
https://forms.test/?ff_landing=54&ffjqmode=disabled
https://forms.test/?ff_landing=54&ffjqmode=enabled
```

### Step 4: Merge Both Together (Same Day)

```bash
# Both PRs must be approved before either merges
# Free first, then Pro (within same day)

# Free merge
git checkout master
git merge origin/pr/N-feature

# Pro merge
cd ../fluentformpro
git checkout master
git merge origin/pr/N-feature-pro
```

**Critical rule:** Never merge Free without merging Pro (same day), and vice versa.

---

## Dependency Tracking

### Safe Dependencies (Free → Pro)

These Free changes are safe for Pro to depend on:
- ✅ PR-1: Foundation (event bridge, jQuery modes)
- ✅ PR-3: Steps (event order preserved)
- ✅ PR-4: Save Progress (state serialization preserved)
- ✅ PR-5: Advanced (conditional logic preserved)
- ✅ PR-7: Upload (multipart shape preserved)
- ✅ PR-8: Docs (no code changes)

### Risky Dependencies (Free → Pro)

These Free changes require Pro updates:
- ⚠️ PR-2: Payment Handler (method signatures may change)
- ⚠️ PR-6: Gateways (Pro files being migrated)

---

## Testing Matrix

### For Each Paired PR

**Minimum testing required:**

| Fixture | Disabled Mode | Enabled Mode | With Pro | Notes |
|---------|---------------|--------------|----------|-------|
| **54** (Payment) | ✅ | ✅ | ✅ | All PRs, critical for payment |
| **240** (Steps) | ✅ | ✅ | ❌ | PR-3, 4 only |
| **344** (Advanced) | ✅ | ✅ | ❌ | PR-5 only |
| **234** (Upload) | ✅ | ✅ | ✅ | PR-7, test Pro repeater |
| **Pro step form** | ✅ | ✅ | ✅ | PR-3, if Pro has one |
| **Pro chat form** | ✅ | ✅ | ✅ | PR-1, PR-6 (chat field) |
| **Pro calc field** | ✅ | ✅ | ✅ | PR-4, Pro calculation fields |

---

## PR Description Template (Synchronized)

### Free PR

```markdown
## FEAT: [Feature Name]

### Free Changes
- [change 1]
- [change 2]

### Coordinated Pro Changes
See: [pro-pr-link]

### Tests
- 43 unit tests pass ✅
- X browser tests pass ✅

### Testing
Tested with:
- Both jQuery modes (disabled + enabled)
- Pro plugin active (fixture 54)

### Risk Level
[LOW/MEDIUM]

### Rollback
If needed: `update_option('ff_jquery_loading_mode', 'enabled')`

### Related PR
Paired with: [pro-pr-number]
Must merge together on [date]
```

### Pro PR

```markdown
## FEAT: [Feature Name] - Pro Compatibility

### Pro Changes
- [change 1]
- [change 2]

### Depends On
Free PR: [free-pr-link]

### Testing
- Fixture 54 (both modes) with Free changes
- Pro-specific fixtures (e.g., Razorpay)
- Gateway testing (if applicable)

### Risk Level
[LOW/MEDIUM]

### Merge Gate
Must merge with Free PR [free-pr-number]
Merge date: [date] (same day as Free)
```

---

## Timeline: Synchronized Release

### Week 1

```
Monday:
  - Create pr/1-foundation (Free)
  - Create pr/1-foundation-pro (Pro)
  - Submit both PRs
  
Tuesday-Wednesday:
  - Free team reviews Free PR
  - Pro team reviews Pro PR
  - Cross-team review
  
Thursday:
  - Both PRs approved
  - Final testing on shared fixture 54
  
Friday:
  - Merge pr/1-foundation → Free master
  - Merge pr/1-foundation-pro → Pro master (same day)
```

### Week 2-3

```
Repeat for PR-3, 4, 5, 7 (low-risk PRs)
- Create paired branches
- Review both together
- Test on shared fixtures
- Merge together (same day)
```

### Week 3-4 (High-Risk PRs)

```
PR-2 (Payment) + PR-2-pro (Payment Pro)
  - Extended review (payment handling critical)
  - Full Stripe/PayPal testing
  - Pro payment team sign-off
  - Merge together
  
PR-6 (Gateways) + PR-6-pro (Gateways Pro)
  - Extended review (gateway-specific)
  - Real/mocked Razorpay testing
  - Real/mocked Paystack testing
  - Pro gateway team sign-off
  - Merge together
```

### Week 4

```
PR-8 (Docs) + PR-8-pro (Docs Pro)
  - Documentation review
  - Changelog updates
  - Release notes
  - Merge together
  
Tag v6.2.3 (Free + Pro both)
Release to production
```

---

## Rollback Strategy (Synchronized)

**If something breaks after merge:**

### For Free Only Issues

```bash
# Only Free has the issue
git revert [free-commit] -m 1
git push
```

### For Pro Only Issues

```bash
# Only Pro has the issue (rare)
# Revert Pro-specific changes in Pro PR
```

### For Shared Issues

```bash
# Both Free + Pro have the issue
# Revert both PRs (same day)

# Free
git revert [free-commit] -m 1

# Pro
git revert [pro-commit] -m 1

# Both pushed same day
```

**Zero-data-loss revert:** Users can flip `ff_jquery_loading_mode` to `enabled` while rollback happens

---

## Communication Plan

### To Teams (Before Starting PR-1)

```
Subject: jQuery Migration - Coordinated Free + Pro Release

We're releasing a jQuery migration in 8 synchronized PR pairs.

Each Free PR has a corresponding Pro PR that must merge together (same day).

Timeline:
- Week 1-2: Low-risk PRs (1, 3, 4, 5, 7, 8) - ~3 PRs/week
- Week 3-4: High-risk PRs (2, 6) - extended review

All changes backward compatible. jQuery still loads by default.
Fully reversible via settings (no code change to revert).

Process:
1. Create paired PR (Free + Pro)
2. Review both together
3. Test on shared fixtures (54, etc.)
4. Both approved → Merge together (same day)

Expected completion: v6.2.3 in 3-4 weeks
```

---

## Merge Gate Checklist

### Before Each Pair Merges

- [ ] Free PR approved
- [ ] Pro PR approved
- [ ] Fixture 54 tested in both modes
- [ ] Required Pro team sign-off (if applicable)
- [ ] No new console errors
- [ ] All tests passing
- [ ] Cross-team review complete

### Final Merge (Both Together)

```bash
# NEVER merge Free without Pro on same day
# NEVER merge Pro without Free on same day

# Free first
git checkout master
git pull
git merge origin/pr/N-feature
git push

# Pro immediately after (within 1 hour)
cd ../fluentformpro
git checkout master
git pull
git merge origin/pr/N-feature-pro
git push

# Both tagged together
git tag -a v6.2.3-free v6.2.3-pro
```

---

## Summary: Synchronized Shipping Benefits

✅ **Zero desync:** Free + Pro always in sync
✅ **Safe dependencies:** Pro knows what Free changed
✅ **Better testing:** Shared fixtures tested with both
✅ **Faster reviews:** Both teams review together
✅ **Easy rollback:** Revert both if needed
✅ **Clear timeline:** All PRs have same schedule
✅ **No surprises:** Pro team sees Free changes in advance
✅ **Production confidence:** Both plugins deployed together

---

## Next Steps

1. ✅ Approve synchronized PR strategy
2. ⏳ Create PR-1 (Free) + PR-1-pro (Pro) paired branches
3. ⏳ Submit both PRs together
4. ⏳ Cross-team review
5. ⏳ Test on fixture 54 (both plugins)
6. ⏳ Merge both together (same day)
7. ⏳ Repeat for PR-2 through PR-8
8. ✅ Release v6.2.3 (Free + Pro synchronized)

**Ready to start PR-1 pair?**

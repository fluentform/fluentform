# jQuery Migration - Implementation Plan

**Status:** Ready for PR Splitting & Staged Rollout  
**Current Branch:** `feature/plan-jquery-to-js-migration` (fully tested, ready to split)  
**Target Base Branch:** `dev/jquery-migration` (new, for staged PRs)  
**Final Destination:** `master` (after all 8 PRs merge)

---

## What We Have

✅ **Verified & Tested:**
- 43 unit tests passing
- 12 Playwright browser tests passing
- Payment handler refactored & safe
- Step forms working in both jQuery modes
- Event bridge working correctly
- All public APIs backward compatible

✅ **Documentation Complete:**
- `ROLLOUT_STRATEGY.md` — 4-phase release plan
- `PR_SPLITTING_STRATEGY.md` — 8-PR structure
- `VERIFICATION_REPORT.md` — Test results
- `openspec/` — Risk assessment & migration backlog

✅ **Risk Mitigation in Place:**
- jQuery loading modes (`auto`, `enabled`, `disabled`)
- Per-site configuration via filters
- Reversible via settings (no code changes to revert)
- Feature detection in `auto` mode

---

## Immediate Next Steps

### Option 1: Implement PR Splitting Now (RECOMMENDED)

**What we do:**
1. Create `dev/jquery-migration` branch from `master`
2. Cherry-pick commits from `feature/plan-jquery-to-js-migration` into 8 focused PRs
3. Each PR reviewed & merged independently
4. After all 8 merge, merge `dev/jquery-migration` → `master` as v6.2.3

**Timeline:** ~5 days (with parallel reviews)

**Benefits:**
- ✅ Smaller, focused reviews (easier to approve)
- ✅ Incremental testing per PR
- ✅ Safe to pause/rollback at any point
- ✅ Team parallelism (multiple reviews in parallel)
- ✅ Each PR independently reversible

**Implementation:**
```bash
# 1. Create dev branch
git checkout master
git pull origin master
git checkout -b dev/jquery-migration
git push -u origin dev/jquery-migration

# 2. For each PR group, cherry-pick commits from feature branch
# (or manually split files and create new commits)
```

### Option 2: Merge Large PR as-is (NOT RECOMMENDED)

**What we do:**
- Create PR directly from `feature/plan-jquery-to-js-migration` → `master`
- Single large PR with all 8 groups included
- One review, one merge

**Risks:**
- ❌ Large diff (25 files, 12K+ lines) hard to review thoroughly
- ❌ Payment handler refactor mixed with other changes
- ❌ Harder to identify which change caused issues
- ❌ Can't pause/rollback individual features
- ❌ Blocks team while one massive review happens

**Not recommended for such a large feature.**

---

## Breaking Down into 8 PRs

### Group Structure (from PR_SPLITTING_STRATEGY.md)

| PR | Name | Files | Tests | Risk | Deps |
|----|------|-------|-------|------|------|
| 1 | Foundation & Core Runtime | 3 | 43 unit + 2 browser | ✅ LOW | None |
| 2 | Payment Handler Bootstrap | 3 | 5 unit + 2 browser | ⚠️ MED | PR-1 |
| 3 | Step Forms & Slider | 2 | 4 unit + 3 browser | ✅ LOW | PR-1 |
| 4 | Save Progress & Calculations | 2 | 3 unit + 2 browser | ✅ LOW | PR-1, 3 |
| 5 | Advanced Modules | 2 | 5 unit + 2 browser | ✅ LOW | PR-1, 2, 3 |
| 6 | Gateway Handlers (Pro) | 3 | 3 unit + tests | ⚠️ MED | PR-1, 2 |
| 7 | File Upload & Validation | 2 | 4 unit + 1 browser | ✅ LOW | PR-1, 4 |
| 8 | Tests, Docs, Rollout | 8 | 12 browser | ✅ NONE | All above |

**Total:** 25 files → split across 8 focused PRs

---

## What Could Break (Risk Assessment)

Based on `openspec/migration-backlog.md` analysis:

### Critical Paths (Highest Risk)
1. **Payment handler refactor** (PR-2)
   - Stripe inline validation
   - PayPal next-action
   - Coupon state management
   - **Mitigation:** 7 dedicated tests, payment team review, fixture 54 proof

2. **Step form navigation** (PR-3)
   - Form advancing/validation
   - `update_slider` event timing
   - Focus/scroll behavior
   - **Mitigation:** 7 dedicated tests, fixture 240 proof

### Medium-Risk Paths
1. **Pro gateway handlers** (PR-6)
   - Razorpay next-action
   - Paystack next-action
   - **Mitigation:** Mocked/real gateway tests, Pro team review

2. **Mixed pages** (PR-2, fixture 54)
   - Save progress + payment on same page
   - **Mitigation:** Fixture 54 daily testing during Phase 1

### Low-Risk Paths
1. **Core runtime** (PR-1) — Pure addition, fully backward compatible
2. **Save progress** (PR-4) — Event-driven, already tested
3. **Advanced modules** (PR-5) — Helper module, non-critical path
4. **File uploads** (PR-7) — Well-tested on fixture 234

---

## Phase 0 Release Scope

**Ship in v6.2.3 (after all 8 PRs merge):**

✅ **Included:**
- Core submission runtime vanilla path
- Event bridge (jQuery ↔ native)
- jQuery loading modes (`auto`, `enabled`, `disabled`)
- Payment handler refactored
- Step forms vanilla
- Save progress vanilla
- All 12 tests automated

✅ **Default Behavior:**
- `auto` mode (vanilla with jQuery fallback)
- Forms work exactly as before
- Early adopters can test `disabled` mode
- Any issues → flip back to `enabled` mode

✅ **NOT included yet (Phase 2+):**
- Pro gateway migrations (tested first)
- Large file rewrites (post-update, repeaters, etc.)
- Vendor library replacements (mask, rangeslider)
- Full jQuery removal (v7.0 only)

---

## Rollback Plan

**If any PR causes issues:**

1. **During review:** Block merge, request changes
2. **After merge to dev:** Revert commit, rework in new PR
3. **After merge to master:** Flip setting to `enabled` mode (no code change):
   ```php
   update_option('ff_jquery_loading_mode', 'enabled');
   ```
4. **User-level:** Admin can change setting in plugin settings page

**No data loss, no form reconfiguration needed.**

---

## Decision Point

**We recommend: Option 1 (PR Splitting)**

This provides:
- ✅ Safer reviews (smaller diffs)
- ✅ Faster approvals (parallel reviews)
- ✅ Better traceability (which PR caused issue)
- ✅ Team clarity (clear ownership per PR)
- ✅ Rollback safety (any PR independently reversible)

---

## What You Decide

### Path A: Split into 8 PRs (RECOMMENDED)
- [ ] Create `dev/jquery-migration` branch
- [ ] Split feature branch into 8 focused PRs
- [ ] Review & merge PRs over 5 days
- [ ] Merge `dev/jquery-migration` → `master` as v6.2.3

### Path B: Single Large PR
- [ ] Create PR: `feature/plan-jquery-to-js-migration` → `master`
- [ ] One large review
- [ ] One merge

### Path C: Continue Development
- [ ] Don't merge yet
- [ ] Continue work on Pro module migrations (Phase 2)
- [ ] Test more thoroughly before PR

---

## Questions for You

1. **PR splitting:** Do you want to implement the 8-PR structure?
2. **Timeline:** When should this land in `master` (v6.2.3 or v6.3)?
3. **Testing:** Should we add additional manual testing steps before Phase 1?
4. **Team:** Who should review each PR (backend, payment, Pro team)?
5. **Release:** When should Phase 1 (gradual adoption) begin?

**Recommendation:** Implement Path A (PR splitting) with v6.2.3 target.

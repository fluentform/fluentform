# PR Splitting Execution Guide

**Staging Branch:** `feat/jquery-migration-staging` (ready for splitting)  
**Target:** 8 non-blocking PRs, each independently testable and reviewable

---

## Current State

✅ **Staging branch created:** `feat/jquery-migration-staging`  
✅ **All commits merged in:** 20K+ lines of changes across 52 files  
✅ **All tests passing:** 43 unit + 12 browser tests  
✅ **Documentation complete:** Risk analysis, rollout plan, splitting strategy

---

## PR Splitting Process

Each PR will be created from `feat/jquery-migration-staging` by cherry-picking or manually splitting commits.

### PR-1: Foundation & Core Runtime

**Files to include:**
- `resources/assets/public/form-submission.js`
- `app/Modules/Component/Component.php`
- `app/Hooks/filters.php` (jQuery loading mode hooks)
- `app/Services/FormBuilder/Components/DateTime.php` (date field enqueue)
- `app/Modules/GlobalSettings/GlobalSettingsHelper.php`
- `playwright.config.js` (if including browser test config)

**Tests included:**
- 43 unit tests (all core submission + bridge tests)
- 2 browser tests (fixture 54, 86 bridge checks)

**How to create:**
```bash
# 1. Create new branch from staging
git checkout feat/jquery-migration-staging
git checkout -b pr/1-foundation

# 2. Reset to master (start fresh)
git reset --hard origin/master

# 3. Cherry-pick core commits (see commit log below)
# Or manually copy files from staging:
git checkout feat/jquery-migration-staging -- resources/assets/public/form-submission.js
git checkout feat/jquery-migration-staging -- app/Modules/Component/Component.php
# ... etc

# 4. Commit with clear message
git commit -m "FEAT: Core submission runtime - vanilla JS path with jQuery bridge"

# 5. Push & create PR
git push -u origin pr/1-foundation
```

**PR Description Template:**
```markdown
## FEAT: Core Submission Runtime - Vanilla JS Path with jQuery Bridge

Completes Foundation phase of jQuery migration.

### Changes
- ✅ Form submission runtime: vanilla DOM/fetch implementation
- ✅ jQuery event bridge: native ↔ jQuery event dispatch
- ✅ jQuery loading modes: `auto`, `enabled`, `disabled`
- ✅ Global setting: `ff_jquery_loading_mode` in admin
- ✅ Filter hooks: `fluentform/jquery_loading_mode`, `fluentform/jquery_loading_mode_required`
- ✅ Backwards compatible: all public APIs unchanged

### Tests (43 unit + 2 browser)
- ✅ Bridge event dispatch (native + jQuery)
- ✅ Form instance lifecycle
- ✅ Public globals: `fluentFormApp()`, `ff_helper`
- ✅ Submission success/failure in both modes
- ✅ Browser: fixture 54, 86 loading checks

### Risk Level
✅ **LOW** — Pure addition, no breaking changes. jQuery still available as fallback.

### Default Behavior
- Default mode: `auto` (vanilla with jQuery fallback)
- Users see zero changes
- No data loss, fully reversible

### Rollback
If needed: `update_option('ff_jquery_loading_mode', 'enabled')`
```

---

### PR-2: Payment Handler Bootstrap

**Files to include:**
- `resources/assets/public/payment_handler.js`
- `app/Modules/Payments/PaymentHandler.php`
- `app/Modules/Payments/PaymentMethods/Stripe/StripeHandler.php`

**Tests included:**
- 5 unit tests (payment handler bootstrap scenarios)
- 2 browser tests (fixture 54 disabled + enabled mode parity)

**Depends on:** PR-1 (must be merged first)

**Note:** This PR has the largest refactor. Key changes:
- `postAjaxJson()` method (native fetch)
- Coupon state field managed via DOM `querySelector`
- Stripe Promise flow (no jQuery.Deferred)
- Bootstrap hardening (MutationObserver, retries, idempotent init)

---

### PR-3: Step Forms & Slider

**Files to include:**
- `resources/assets/public/Pro/slider.js`
- Related test files

**Tests included:**
- 4 unit tests (step navigation scenarios)
- 3 browser tests (fixture 240 navigation + parity)

**Depends on:** PR-1

---

### PR-4: Save Progress & Calculations

**Files to include:**
- `resources/assets/public/form-save-progress.js`
- `resources/assets/public/Pro/calculations.js`

**Tests included:**
- 3 unit tests (save progress, calculations)
- 2 browser tests (fixture 54 save-progress proof)

**Depends on:** PR-1, PR-3

---

### PR-5: Advanced Modules

**Files to include:**
- `resources/assets/public/fluentform-advanced.js`

**Tests included:**
- 5 unit tests (advanced module bootstrap, conditional logic)
- 2 browser tests (fixture 344 advanced, conditional visibility)

**Depends on:** PR-1, PR-2, PR-3

---

### PR-6: Small Gateway Handlers (Pro)

**Files to include:**
- `../fluentformpro/src/assets/public/razorpay_handler.js`
- `../fluentformpro/src/assets/public/paystack_handler.js`
- `../fluentformpro/src/assets/js/chatFieldScript.js`

**Tests included:**
- 3 unit tests (gateway bootstrap scenarios)
- Tests for next-action event parity

**Depends on:** PR-1, PR-2

**Note:** Requires Pro payment team review

---

### PR-7: File Upload & Validation

**Files to include:**
- `resources/assets/public/Pro/file-uploader.js`

**Tests included:**
- 4 unit tests (upload, validation, reset)
- 1 browser test (fixture 234 upload proof)

**Depends on:** PR-1, PR-4

---

### PR-8: Tests, Docs & Rollout Strategy

**Files to include:**
- `playwright.config.js` (if not in PR-1)
- `tests/playwright/jquery-migration-parity.spec.js`
- `VERIFICATION_REPORT.md`
- `ROLLOUT_STRATEGY.md`
- `PR_SPLITTING_STRATEGY.md`
- `IMPLEMENTATION_PLAN.md`
- `PR_SPLITTING_EXECUTION_GUIDE.md`
- Updated `openspec/` docs
- Updated `CLAUDE.md`

**Tests included:**
- 12 Playwright browser tests (cross-fixture parity)

**Depends on:** All above PRs

---

## Commit Extraction Guide

### From Staging Branch Log

```
20e11d6c DOCS: Add implementation plan with decision matrix
c493f6fe DOCS: Add PR splitting strategy for staged jQuery migration rollout
97e9a06c DOCS: Add phased rollout strategy for jQuery dependency migration
c676e37c FEAT: Complete jQuery to vanilla JS migration with payment handler refactor
ea2d7628 FEAT: add global jquery loading mode setting
f674d4e6 REFACTOR: remove jquery dependency from flatpickr date init
dc0887c4 DOCS: add focused no-jquery page audit
a2439b9f REFACTOR: migrate save progress runtime off jquery
8c292476 REFACTOR: migrate step slider runtime off jquery
a28ebaae DOCS: plan slider step-runtime migration in openspec
b53b9a54 REFACTOR: make advanced runtime jquery-optional for migrated modules
1e5350c9 REFACTOR: migrate conditional runtime to plain js
5cb928f0 REFACTOR: migrate rating and net promoter modules to plain js
f88b718d DOCS: add remaining migration execution plan
7a11ea31 REFACTOR: migrate calculations runtime to plain js
e64343bf DOCS: add plain js migration backlog
1f53bedb FIX: preserve legacy jquery event compatibility during bridge dispatch
449cc626 DOCS: classify frontend compatibility matrix evidence status
dba75ea3 FIX: guard ff_reinit recursion and add JS runtime tests
d1961ad4 STYLE: normalize legacy submission flow formatting
```

### Suggested Groupings for Each PR

**PR-1 Foundation:** Commits 1f53bedb, dba75ea3, d1961ad4 + form-submission.js changes
**PR-2 Payment:** Commit c676e37c (payment handler parts)
**PR-3 Steps:** Commit 8c292476 + slider changes
**PR-4 Save Progress:** Commit a2439b9f + save-progress changes
**PR-5 Advanced:** Commit b53b9a54 + advanced.js changes
**PR-6 Gateways:** Gateway handler migrations
**PR-7 Upload:** Commit e64343bf + file-uploader changes
**PR-8 Docs:** All doc commits (20e11d6c, c493f6fe, 97e9a06c, etc.)

---

## Testing Each PR Before Merge

### For Code PRs (PR-1 to PR-7)

```bash
# 1. Check out PR branch
git checkout pr/N-name

# 2. Run unit tests
npm run test:js

# 3. Run browser tests (Playwright)
npx playwright test tests/playwright/jquery-migration-parity.spec.js

# 4. Check for console errors
# Load a test form in browser:
# https://forms.test/?ff_landing=54&ffjqmode=disabled
# https://forms.test/?ff_landing=240&ffjqmode=disabled

# 5. Verify no regressions
# Test both modes: ?ffjqmode=disabled AND ?ffjqmode=enabled
```

### For Documentation PR (PR-8)

```bash
# 1. Verify all markdown files render correctly
# 2. Check cross-references between docs
# 3. Validate rollout strategy approval
```

---

## Review Assignment Suggestion

| PR | Primary Reviewer | Secondary | Notes |
|----|------------------|-----------|-------|
| PR-1 | Backend lead | QA | Foundation approval critical |
| PR-2 | Payment team | Backend lead | Stripe/PayPal flows |
| PR-3 | Frontend lead | QA | Step form behavior |
| PR-4 | Frontend lead | Backend | State persistence |
| PR-5 | Frontend lead | QA | Module bootstrap |
| PR-6 | Pro payment team | Backend | Gateway handlers |
| PR-7 | QA lead | Frontend | Upload flows |
| PR-8 | Product/Release | Tech lead | Rollout strategy sign-off |

---

## Timeline Estimate

| Week | PRs | Parallel | Notes |
|------|-----|----------|-------|
| **Week 1** | PR-1 | Solo | Foundation, requires slow careful review |
| **Week 1-2** | PR-2, PR-3 | Yes | Can review in parallel (no deps on each other) |
| **Week 2** | PR-4, PR-5 | Yes | Both depend on PR-1,3 which should be merged |
| **Week 2-3** | PR-6, PR-7 | Yes | Can run in parallel |
| **Week 3** | PR-8 | Solo | Final review of docs/strategy |
| **Week 3** | Merge all | Solo | `feat/jquery-migration-staging` → `master` as v6.2.3 |

**Total:** ~3 weeks with parallel reviews, 1-2 weeks sequential alone

---

## Merge Strategy

### Individual PR Merges

```bash
# For each PR once approved:
git checkout master
git pull origin master
git merge origin/pr/N-name
git push origin master
```

### Final Integration

```bash
# After all 8 PRs merged to master individually:
git tag -a v6.2.3 -m "jQuery migration Phase 0: Core runtime vanilla, payment refactor, step/save-progress tested. 43 unit + 12 browser tests passing."
git push origin v6.2.3

# Create GitHub release from tag
```

---

## Risk Mitigation Checklist

- [ ] PR-1 reviewed & approved (foundation critical)
- [ ] PR-2 reviewed & approved by payment team (Stripe/PayPal flows)
- [ ] PR-3 reviewed & approved (step form parity)
- [ ] All browser tests passing on each PR
- [ ] No new console errors observed
- [ ] QA signs off on regression testing
- [ ] Product team approves rollout strategy
- [ ] Release notes prepared
- [ ] Monitoring dashboard set up for Phase 1

---

## Rollback Procedure (If Needed)

**Before Merge:**
- Reject PR during review, request changes

**After Merge (Day 1-7):**
- Revert commit: `git revert <commit-hash>`
- Push new revert commit
- Issue new PR explaining revert

**After Release (v6.2.3 shipped):**
- Instruct site admins: `update_option('ff_jquery_loading_mode', 'enabled')`
- Publish post-mortem
- Root cause analysis
- New PR to fix issue

---

## Next Steps

1. ✅ Staging branch ready: `feat/jquery-migration-staging`
2. ⏳ Create PR-1 from staging (Foundation)
3. ⏳ Submit PR-1 for review
4. ⏳ Once PR-1 approved, create PR-2 & PR-3
5. ⏳ Continue stacked review until all 8 PRs done
6. ✅ Merge all to `master` as v6.2.3
7. ✅ Release to production with Phase 1 monitoring

**Ready to start PR-1?**

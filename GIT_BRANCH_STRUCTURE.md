# Git Branch Structure (Free + Pro)

**Goal:** Clear branch organization for synchronized Free + Pro release

---

## Current State

### Free Plugin (fluentform)

```
origin/master (production branch)
    ↑
    └─ feat/jquery-migration-staging (staging branch, ready to split)
         ├─ All code changes (20K+ lines)
         ├─ All tests
         └─ All docs
```

**Ready to create PRs from:** `feat/jquery-migration-staging`

---

### Pro Plugin (fluentformpro)

```
origin/master (production branch)
    ↑
    └─ ??? (needs to be created)
```

**Current status:** Pro plugin doesn't have staged changes yet

---

## Solution: Create Pro Staging Branch

### Step 1: Create Pro Staging Branch (Same as Free)

```bash
# Switch to Pro repo
cd ../fluentformpro

# Create staging branch from master
git checkout master
git pull origin master
git checkout -b feat/jquery-migration-staging
git push -u origin feat/jquery-migration-staging
```

**Result:** Pro now has parallel staging branch

---

## Branch Strategy

### Free Plugin Branches

```
Free (fluentform):

origin/master (production)
    ↑
    │ (PR-1 branches come from feat/jquery-migration-staging)
    │
    ├─ pr/1-foundation
    ├─ pr/2-payment
    ├─ pr/3-steps
    ├─ pr/4-save-progress
    ├─ pr/5-advanced
    ├─ pr/6-gateways (empty for Free, exists in Pro)
    ├─ pr/7-upload
    └─ pr/8-docs

All PR branches:
  - Created FROM: feat/jquery-migration-staging (or reset --hard master + cherry-pick)
  - Target: master
  - Naming: pr/N-feature
```

---

### Pro Plugin Branches

```
Pro (fluentformpro):

origin/master (production)
    ↑
    │ (PR-1-pro branches come from feat/jquery-migration-staging-pro)
    │
    ├─ pr/1-foundation-pro (verification only, no code changes)
    ├─ pr/2-payment-pro (code review, maybe minor changes)
    ├─ pr/3-steps-pro (verification, no code changes)
    ├─ pr/4-save-progress-pro (verification, no code changes)
    ├─ pr/5-advanced-pro (verification, no code changes)
    ├─ pr/6-gateways-pro (REFACTOR: razorpay, paystack, chat field)
    ├─ pr/7-upload-pro (verification, no code changes)
    └─ pr/8-docs-pro (documentation only)

All PR branches:
  - Created FROM: feat/jquery-migration-staging-pro (from Pro master)
  - Target: master (Pro)
  - Naming: pr/N-feature-pro
```

---

## Step-by-Step: Creating PR Pair for PR-1

### Create Free PR-1 Branch

```bash
cd fluentform

# 1. Create from staging
git checkout feat/jquery-migration-staging
git checkout -b pr/1-foundation

# 2. Filter to only Free PR-1 files
git reset --hard origin/master
git checkout feat/jquery-migration-staging -- \
  resources/assets/public/form-submission.js \
  app/Modules/Component/Component.php \
  app/Hooks/filters.php \
  app/Services/FormBuilder/Components/DateTime.php \
  app/Modules/GlobalSettings/GlobalSettingsHelper.php

# 3. Commit
git commit -m "FEAT: Core submission runtime - vanilla JS with jQuery bridge"

# 4. Push
git push -u origin pr/1-foundation
```

**Result:** `pr/1-foundation` → targets `master`

---

### Create Pro PR-1 Branch

```bash
cd ../fluentformpro

# 1. Create from staging
git checkout feat/jquery-migration-staging
git checkout -b pr/1-foundation-pro

# 2. Add verification comments (no code changes for PR-1)
# Edit fluentformpro/src/assets/public/payment_handler.js:
#   - Add comment: "// Verified: Uses bridge events, compatible with Free changes"

# 3. Commit
git commit -m "FEAT: Core submission runtime - Pro compatibility verification"

# 4. Push
git push -u origin pr/1-foundation-pro
```

**Result:** `pr/1-foundation-pro` → targets `master`

---

## Complete Branch Map (All 8 PR Pairs)

### PR-1: Foundation

**Free:**
```bash
git checkout feat/jquery-migration-staging
git checkout -b pr/1-foundation
# Copy Free foundation files
git commit -m "FEAT: Core submission runtime..."
git push -u origin pr/1-foundation
# Create PR: pr/1-foundation → master
```

**Pro:**
```bash
git checkout feat/jquery-migration-staging (in Pro repo)
git checkout -b pr/1-foundation-pro
# Add verification comments only
git commit -m "FEAT: Core submission runtime - Pro verification"
git push -u origin pr/1-foundation-pro
# Create PR: pr/1-foundation-pro → master
```

---

### PR-2: Payment Handler

**Free:**
```bash
git checkout feat/jquery-migration-staging
git checkout -b pr/2-payment
# Copy Free payment files
git commit -m "FEAT: Payment handler bootstrap..."
git push -u origin pr/2-payment
# Create PR: pr/2-payment → master
```

**Pro:**
```bash
git checkout feat/jquery-migration-staging (in Pro repo)
git checkout -b pr/2-payment-pro
# Verify Pro payment handler inheritance
# Maybe minor changes if method signatures changed
git commit -m "FEAT: Payment handler - Pro compatibility review"
git push -u origin pr/2-payment-pro
# Create PR: pr/2-payment-pro → master
```

---

### PR-3 through PR-7: (Similar pattern)

Each follows:
1. Create Free branch from `feat/jquery-migration-staging`
2. Create Pro branch from `feat/jquery-migration-staging` (in Pro repo)
3. Free: Copy relevant files, commit, push
4. Pro: Verification or refactoring, commit, push
5. Both target `master` of respective repo

---

### PR-6: Gateway Handlers (Pro-heavy)

**Free:**
```bash
git checkout feat/jquery-migration-staging
git checkout -b pr/6-gateways
# No Free changes (gateway handlers are Pro-only)
# Maybe just doc updates
git commit -m "FEAT: Gateway handlers - Pro preparation"
git push -u origin pr/6-gateways
# Create PR: pr/6-gateways → master (minimal changes)
```

**Pro:**
```bash
git checkout feat/jquery-migration-staging (in Pro repo)
git checkout -b pr/6-gateways-pro
# Major refactor: razorpay, paystack, chat field
# jQuery → bridge events, jQuery.post() → fetch()
git commit -m "FEAT: Gateway handlers - jQuery to vanilla migration"
git push -u origin pr/6-gateways-pro
# Create PR: pr/6-gateways-pro → master
```

---

### PR-8: Documentation

**Free:**
```bash
git checkout feat/jquery-migration-staging
git checkout -b pr/8-docs
# Copy doc updates
git commit -m "DOCS: jQuery migration documentation"
git push -u origin pr/8-docs
# Create PR: pr/8-docs → master
```

**Pro:**
```bash
git checkout feat/jquery-migration-staging (in Pro repo)
git checkout -b pr/8-docs-pro
# Pro-specific docs, CLAUDE.md, changelog
git commit -m "DOCS: jQuery migration documentation (Pro)"
git push -u origin pr/8-docs-pro
# Create PR: pr/8-docs-pro → master
```

---

## GitHub PR Creation

### For Each PR Pair:

**Free PR Description:**
```markdown
## FEAT: [Feature Name]

### Free Changes
- [change 1]
- [change 2]

### Coordinated Pro PR
See: fluentformpro#[PR-number]

### Tests
- 43 unit tests pass ✅
- X browser tests pass ✅

### Risk Level
[LOW/MEDIUM]

### Merge Gate
Must merge with Pro PR [pr/N-feature-pro]
Merge date: [date] (same day)

### Rollback
If needed: `update_option('ff_jquery_loading_mode', 'enabled')`
```

**Pro PR Description:**
```markdown
## FEAT: [Feature Name] - Pro Compatibility

### Pro Changes
- [change 1]
- [change 2]

### Paired with Free PR
fluentform#[PR-number]

### Risk Level
[LOW/MEDIUM]

### Merge Gate
Must merge with Free PR [pr/N-feature]
Merge date: [date] (same day)
Merge order: Free first, then Pro (within 1 hour)
```

---

## Merge Process (Both Repos)

### Same-Day Merge Procedure

```bash
# STEP 1: Merge Free PR (wait for Pro PR approval first)
cd fluentform
git checkout master
git pull origin master
git merge origin/pr/1-foundation
git push origin master

# STEP 2: Immediately merge Pro PR (within 1 hour)
cd ../fluentformpro
git checkout master
git pull origin master
git merge origin/pr/1-foundation-pro
git push origin master

# STEP 3: Confirm both merged
# Check GitHub: fluentform master commit + fluentformpro master commit
```

**Critical:** Never merge Free without Pro (or vice versa) on same day

---

## Summary: Branch Naming Convention

**Free Plugin:**
- Staging: `feat/jquery-migration-staging`
- PRs: `pr/N-feature` (e.g., `pr/1-foundation`, `pr/2-payment`)
- Target: `master`

**Pro Plugin:**
- Staging: `feat/jquery-migration-staging` (same name, different repo)
- PRs: `pr/N-feature-pro` (e.g., `pr/1-foundation-pro`, `pr/2-payment-pro`)
- Target: `master`

**Golden rule:** Free and Pro branch names mirror each other, adding `-pro` suffix to Pro branches

---

## Quick Reference

```
FREE PLUGIN (fluentform):
feat/jquery-migration-staging
  ├─ pr/1-foundation → master
  ├─ pr/2-payment → master
  ├─ pr/3-steps → master
  ├─ pr/4-save-progress → master
  ├─ pr/5-advanced → master
  ├─ pr/6-gateways → master
  ├─ pr/7-upload → master
  └─ pr/8-docs → master

PRO PLUGIN (fluentformpro):
feat/jquery-migration-staging
  ├─ pr/1-foundation-pro → master
  ├─ pr/2-payment-pro → master
  ├─ pr/3-steps-pro → master
  ├─ pr/4-save-progress-pro → master
  ├─ pr/5-advanced-pro → master
  ├─ pr/6-gateways-pro → master
  ├─ pr/7-upload-pro → master
  └─ pr/8-docs-pro → master

MERGE: Same day, Free first, Pro within 1 hour
```

---

## Next Action

**Create Pro Staging Branch:**

```bash
cd ../fluentformpro
git checkout master
git pull origin master
git checkout -b feat/jquery-migration-staging
git push -u origin feat/jquery-migration-staging
```

**Then:** Ready to create PR-1 pair (Free + Pro)

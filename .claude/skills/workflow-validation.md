# Validation Workflow Skill

**When to read:** Before committing code, before pushing branches, before creating PRs

---

## Quick Summary

Every PR goes through pre-commit validation:

1. **Run unit tests** → All must pass
2. **Run review skills** → Document findings
3. **Create validation checklist** → Track issues
4. **Fix HIGH priority issues** → Security/quality blocking
5. **Document MEDIUM/LOW issues** → With rationale
6. **Commit validation file** → With resolved status
7. **Push branch** → Ready for code review

---

## Available Review Skills

### 1. plugin-audit
**Purpose:** Security + optimization review

**What it finds:**
- XSS vulnerabilities (innerHTML, eval, unsafe DOM)
- SQL injection (direct DB access, string concatenation)
- CSRF vulnerabilities (missing nonce verification)
- Input validation gaps (unsanitized $_GET, $_POST)
- Dead code and unused imports
- Performance anti-patterns (N+1 queries, memory leaks)

**How to use:**
```
/plugin-audit
```

**In validation checklist:**
```markdown
## Security (plugin-audit)
- [ ] HIGH: XSS in success message (FIXED)
- [ ] MEDIUM: Unvalidated event names (FIXED)
- [ ] LOW: Dead jQuery code (DOCUMENT)
```

---

### 2. debugger
**Purpose:** Edge case and bug discovery

**What it finds:**
- Race conditions in async code
- Memory leaks (uncleaned listeners, circular refs)
- State inconsistencies
- Off-by-one errors
- Stale closures
- Unhandled edge cases

**How to use:**
```
/debugger
```

**In validation checklist:**
```markdown
## Edge Cases (debugger)
- [ ] Race condition in payment submission (FIXED)
- [ ] Memory leak in event listeners (FIXED)
- [ ] Bootstrap timing issue (VERIFY)
```

---

### 3. php-cs-fixer-style
**Purpose:** Code style compliance

**What it checks:**
- Indentation consistency (spaces vs tabs)
- Naming conventions (snake_case PHP, camelCase JS)
- Line length limits
- Function/method length
- Comment clarity
- Code organization

**How to use:**
```
/php-cs-fixer-style
```

**In validation checklist:**
```markdown
## Code Style (php-cs-fixer-style)
- [ ] PHP indentation (FIXED)
- [ ] JavaScript naming (FIXED)
- [ ] Comment clarity (minor, ACCEPT)
```

---

### 4. pr-descriptor
**Purpose:** Generate professional PR descriptions

**What it creates:**
- Why-first narrative (problem, motivation, context)
- What changed (features, not implementation)
- Testing approach
- Risk assessment
- Pro/third-party impact
- Merge dependencies

**How to use:**
```
/pr-descriptor
```

**When to run:** After code approval, before merge

**Output:** Copy directly to GitHub PR body

---

### 5. agents-onboarding
**Purpose:** Architecture documentation

**What it updates:**
- AGENTS.md (agent responsibilities, onboarding)
- Architecture docs (system flows, patterns)
- Getting started guides
- Key concepts explained

**How to use:**
```
/agents-onboarding
```

**When to use:** Major architecture changes, significant refactors

---

## Workflow Steps

### Step 1: Run Unit Tests
```bash
node --test tests/js/*.test.js
```

**Must pass:** All tests  
**If failing:** Fix code before proceeding

---

### Step 2: Run Review Skills

**Run all at once:**
```bash
/plugin-audit
/debugger         (if critical logic)
/php-cs-fixer-style
```

**OR run individually:** `/plugin-audit`, `/debugger`, etc.

---

### Step 3: Create Validation Checklist

**File:** `openspec/PR-N-VALIDATION-CHECKLIST.md`

**Template:**
```markdown
# [Feature Name] Validation Checklist

**Branch:** feat/your-feature
**Date:** YYYY-MM-DD
**Status:** IN PROGRESS

## Security Review (plugin-audit)
- [ ] Input validation: [status]
- [ ] XSS prevention: [status]
- [ ] SQL injection: [status]

## Edge Cases (debugger)
- [ ] Race conditions: [status]
- [ ] Memory management: [status]

## Code Quality (php-cs-fixer-style)
- [ ] PHP style: [status]
- [ ] JavaScript style: [status]

## Testing
- [x] Unit tests: 43/43 pass
- [ ] Browser tests: TBD
- [ ] Pro compatibility: [status]

## Completion Status
Overall: X% complete
Ready for Draft PR: YES/NO
Ready for Production: NO (pending review)
```

---

### Step 4: Fix HIGH Priority Issues

Any HIGH severity issue found by skills:

```bash
# Fix the issue
git add [files]
git commit -m "SECURITY: [description]"
# or
git commit -m "QUALITY: [description]"
```

Update checklist:
```markdown
- [x] HIGH: XSS in innerHTML (FIXED)
```

---

### Step 5: Document MEDIUM/LOW Issues

If not fixing, document rationale:

```markdown
## MEDIUM Priority
- [ ] Event deduplication (DEFER to v6.3 - performance OK)
- [ ] Comment clarity (ACCEPT - clear enough)

## LOW Priority
- [ ] Code style minor (DOCUMENT for future)
```

---

### Step 6: Update Checklist Status

```markdown
## Completion Status
**Overall:** 90% complete (all critical, 1 medium deferred)
**Ready for Draft PR:** YES ✅
**Ready for Production:** NO (pending review)
```

---

### Step 7: Commit Validation File

```bash
git add openspec/PR-N-VALIDATION-CHECKLIST.md
git commit -m "CHORE: Add validation checklist - all critical issues fixed"
git push -u origin feat/your-feature
```

---

## For jQuery Migration Specifically

### PR-1 (Core Submission Runtime)

Skills to run:
1. `/plugin-audit` → Security focus (event bridge, XSS)
2. `/debugger` → Edge cases (dual listeners, memory leaks)
3. `/php-cs-fixer-style` → Style check

Expected findings:
- XSS in innerHTML (2 HIGH)
- Event validation missing (1 MEDIUM)
- Dual listener deduplication (1 MEDIUM)
- Style issues in filters.php (1 MEDIUM)

---

### PR-2 (Payment Handler)

Skills to run:
1. `/plugin-audit` → Deep security (payment flow, AJAX)
2. `/debugger` → Critical (Stripe, PayPal flows)
3. `/php-cs-fixer-style` → Style check

Note: Pro team required for code review + testing

---

### PR-6 (Gateway Handlers - Pro)

Skills to run:
1. `/plugin-audit` → Gateway security (Razorpay, Paystack)
2. `/debugger` → Critical (next-action flow)
3. `/php-cs-fixer-style` → Style check

Note: Pro team required for testing

---

## Best Practices

✅ **DO:**
- Run skills BEFORE pushing
- Document ALL findings
- Fix all HIGH issues
- Ask for rationale on MEDIUM/LOW deferral
- Create validation checklist file
- Commit checklist as part of PR

❌ **DON'T:**
- Push without running skills
- Ignore security findings
- Defer HIGH priority issues
- Skip validation for "simple" changes
- Leave validation checklist uncommitted

---

## FAQ

**Q: Do I have to run all 5 skills?**  
A: No. Minimum: `plugin-audit` + `php-cs-fixer-style`. Add `debugger` for complex logic.

**Q: What if a skill finds nothing?**  
A: Great! Document "No critical issues found" in checklist.

**Q: Can I skip a skill?**  
A: Yes, if documented. Note: "Skipped debugger - simple change, no async code"

**Q: What if tests fail?**  
A: Fix code, re-run tests. Don't proceed to skills until tests pass.

**Q: How long does validation take?**  
A: Typically 10-20 minutes total (skills + checklist + fixes)

**Q: Can I defer all issues?**  
A: No. HIGH priority issues must be fixed. MEDIUM/LOW can be deferred with documented rationale.

---

## Integration Points

**Connects to:**
- PRECOMMIT-WORKFLOW.md (workflow details)
- SKILLS-REFERENCE.md (detailed skill info)
- PR_REVIEW_SKILLS_GUIDE.md (jQuery migration specific)
- CLAUDE.md (project coding rules)

**Used for:**
- All feature branches before push
- All bug fixes before PR
- All refactors before merge
- Pre-commit hook (optional)

---

## Next Actions

1. Before pushing any branch: Run skills
2. Document findings in validation checklist
3. Fix HIGH issues
4. Commit checklist and push
5. Reference checklist findings in code review

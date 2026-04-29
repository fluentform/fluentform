# Pre-Commit Review Workflow (Generic)

**Applies to:** All feature branches and PRs  
**Purpose:** Catch security, quality, and compatibility issues BEFORE pushing to remote  
**Tools:** Agent skills (plugin-audit, debugger, pr-descriptor) + WordPress best practices

---

## Quick Summary

For every feature branch before push:
1. Run automated validation (unit tests, plugin-audit, debugger)
2. Create validation checklist documenting findings
3. Fix all HIGH priority security/quality issues
4. Document MEDIUM/LOW issues with rationale
5. Commit validation file with resolved status
6. Push branch with confidence

---

## Detailed Workflow

### Step 1: Create Feature Branch

```bash
git checkout dev
git pull origin dev
git checkout -b feat/your-feature-name
```

### Step 2: Implement Feature

Write code, test locally, follow coding rules in CLAUDE.md.

### Step 3: Run Automated Validation

#### 3a. Unit Tests
```bash
# All tests
node --test tests/js/*.test.js

# Specific test file
node --test tests/js/your-test.test.js

# Expected: All tests pass
```

#### 3b. Security Audit (Plugin-Audit Agent Skill)
```
Delegate to agent:
- Security review (XSS, SQL injection, CSRF, etc.)
- Performance optimization opportunities
- Dead code detection
- Traceability verification
```

**What it finds:**
- Input validation issues
- Unsafe data handling (serialize/deserialize)
- Missing sanitization (`sanitize_text_field()`, `wp_kses_post()`, etc.)
- DOM XSS vulnerabilities (innerHTML, eval, etc.)
- jQuery-specific security patterns
- Performance anti-patterns
- Unused code/imports

#### 3c. Edge Case Detection (Debugger Agent Skill)
```
Delegate to agent:
- Bug discovery (Finder → Verifier loop)
- Edge case identification
- Race condition detection
- State management issues
- Event ordering problems
```

**What it finds:**
- Off-by-one errors
- Race conditions in async code
- Stale closures
- Circular dependencies
- Missing error handling
- State consistency issues

#### 3d. Code Style (php-cs-fixer-style Agent Skill)
```bash
# PHP style compliance (if available)
# JavaScript style (ESLint, if available)
```

**What it checks:**
- Consistent indentation
- Naming conventions (snake_case for PHP, camelCase for JS)
- Function/method length
- Comment clarity
- Code organization

### Step 4: Create Validation Checklist

**File location:** Project-relative, discoverable location  
**Suggested:** `openspec/PR-VALIDATION-CHECKLIST.md` or `docs/[FEATURE]-VALIDATION.md`

**Template:**

```markdown
# [Feature Name] Validation Checklist

**Branch:** `feat/your-feature-name`  
**Date:** YYYY-MM-DD  
**Feature:** [Brief description]  
**Status:** IN PROGRESS

---

## Security Review

### HIGH Priority Issues (BLOCKING)
- [ ] Input validation: All user inputs sanitized with appropriate WP functions
  - `sanitize_text_field()` for text
  - `sanitize_url()` for URLs
  - `intval()` / `floatval()` for numbers
  - `wp_kses_post()` for rich text
- [ ] XSS Prevention: No innerHTML with untrusted data (use textContent or wp_kses)
- [ ] SQL Injection: All DB queries use wpFluent() query builder or prepared statements
- [ ] CSRF: All forms include nonce verification
- [ ] No eval() or Function() constructors with dynamic code
- [ ] No unserialize() with untrusted data
- [ ] Event/Hook validation: Custom events have validated names

### MEDIUM Priority Issues (SHOULD FIX)
- [ ] Performance: No N+1 queries in loops
- [ ] Memory: No circular references, proper event cleanup
- [ ] Complexity: Functions under 50 lines (rule of thumb)
- [ ] Dependencies: No unnecessary jQuery (consider vanilla JS alternatives)

### LOW Priority Issues (DOCUMENT)
- [ ] Code style consistency
- [ ] Documentation clarity
- [ ] Logging/debugging statements cleaned up

---

## Code Quality Review

### PHP Code
- [ ] Follows CLAUDE.md coding rules
- [ ] Uses WPFluent framework patterns (app, addFilter, addCustomFilter, etc.)
- [ ] Proper namespacing (FluentForm\...)
- [ ] No direct global variable access (use wpFluentForm() or dependency injection)
- [ ] Comments explain WHY, not WHAT (code should be self-documenting)

### JavaScript Code
- [ ] No jQuery dependencies unless necessary (consider vanilla JS)
- [ ] Proper event listener cleanup (addEventListener + removeEventListener pairs)
- [ ] No memory leaks (detached DOM, circular refs, etc.)
- [ ] Modern syntax (ES6+, const/let not var)
- [ ] Async operations properly handled (promises, error handling)

### WordPress Compatibility
- [ ] Uses standard WP functions (get_option, add_filter, do_action, etc.)
- [ ] Respects user capabilities (current_user_can checks)
- [ ] No hardcoded paths (use WP constants: ABSPATH, PLUGIN_DIR, etc.)
- [ ] Proper escaping on output (esc_attr, esc_html, wp_kses_post, etc.)
- [ ] Uses appropriate text domain for translations ('fluentform')

---

## Testing

### Unit Tests
- [x] All tests pass: X/X
  - Vanilla JS mode: ✓
  - jQuery compatibility: ✓
- [ ] New functionality covered by tests
- [ ] Edge cases tested

### Browser/Integration Tests
- [ ] Manual testing done
- [ ] Pro compatibility verified (if applicable)
- [ ] Known fixtures tested

### Security Testing
- [ ] XSS payload injection tests
- [ ] Invalid input handling
- [ ] Boundary value testing
- [ ] Race condition scenarios (if async)

---

## Agent Skill Findings

### plugin-audit Results
**Status:** [COMPLETE/PENDING]

Findings summary:
- Security: [X HIGH / X MEDIUM / X LOW]
- Performance: [X issues found]
- Dead code: [X files affected]
- Traceability: [GOOD/GAPS]

Issues fixed:
- [x] HIGH: [Description of fix]
- [x] MEDIUM: [Description or rationale for deferral]
- [ ] LOW: [Documented for future]

### debugger Results
**Status:** [COMPLETE/PENDING]

Edge cases found:
- [x] [Issue 1] - FIXED
- [ ] [Issue 2] - ACCEPTED (reason: performance tradeoff)
- [ ] [Issue 3] - DEFERRED (reason: v6.3.0)

### Code Style (php-cs-fixer-style)
**Status:** [COMPLETE/PENDING]

Style issues:
- [x] Indentation consistent
- [x] Naming conventions followed
- [ ] Line length acceptable

---

## Files Changed

| File | Changes | LOC | Tests |
|------|---------|-----|-------|
| file1.php | [description] | +X | ✓ |
| file2.js | [description] | +X | ✓ |
| test1.test.js | [new] | +X | ✓ |

**Total:** X files, +X LOC

---

## Pro Plugin Compatibility

**Status:** [COMPATIBLE/REVIEW NEEDED/INCOMPATIBLE]

Impact on Pro:
- Payment handlers: [NO CHANGE / REVIEW / REFACTOR]
- Gateway handlers: [NO CHANGE / REVIEW / REFACTOR]
- Advanced modules: [NO CHANGE / REVIEW / REFACTOR]
- Custom fields: [NO CHANGE / REVIEW / REFACTOR]

Actions needed:
- [ ] Pro team code review (if applicable)
- [ ] Pro team testing (if applicable)
- [ ] Pro documentation update (if applicable)

---

## Completion Status

**Overall:** X% complete

**Critical Path:**
- [x] Unit tests pass
- [x] Security issues fixed (HIGH priority)
- [ ] Code review approval
- [ ] Pro team sign-off (if applicable)

**Ready for Draft PR:** YES/NO  
**Ready for Production:** NO (always pending final human review)

---

## Decision Log

| Issue | Decision | Rationale |
|-------|----------|-----------|
| [Issue 1] | FIX | Security blocking |
| [Issue 2] | DEFER to v6.3 | Backwards compatibility |
| [Issue 3] | ACCEPT | Performance tradeoff acceptable |

---

## Notes

- [Any important findings or decisions]
```

### Step 5: Run Review Skills on Branch

```
# Delegate to agents using specialized skills:

Agent 1: plugin-audit
- Analyze for security, performance, dead code
- Output findings section of checklist

Agent 2: debugger  
- Identify edge cases and potential bugs
- Output findings section of checklist

Agent 3: pr-descriptor (when ready)
- Generate PR description
- Use for GitHub PR body
```

### Step 6: Fix Issues Based on Findings

#### HIGH Priority (BLOCKING)
Must fix before pushing:
```bash
# Fix the issue
git add [changed files]
git commit -m "SECURITY: [description]"
# or
git commit -m "QUALITY: [description]"
```

#### MEDIUM Priority (RECOMMENDED)
Fix if possible, document rationale if deferring:
```markdown
## MEDIUM Priority
- [x] Memory leak in listener cleanup (FIXED)
- [ ] Unnecessary jQuery call (DEFER to v6.3.0 - performance OK for now)
```

#### LOW Priority (DOCUMENT)
Document in checklist, no action needed:
```markdown
## LOW Priority
- [ ] Code style improvement (logged for future cleanup)
```

### Step 7: Update Checklist Status

Mark all findings as addressed:
```markdown
## Completion Status
**Overall:** 85% → 100% (all critical issues fixed)
**Ready for Draft PR:** YES ✅
**Ready for Production:** NO (pending human code review)
```

### Step 8: Commit Validation File

```bash
# Stage validation checklist
git add openspec/PR-VALIDATION-CHECKLIST.md
# or
git add docs/[FEATURE]-VALIDATION.md

# Commit
git commit -m "CHORE: Add validation checklist - all critical issues fixed

Security: ✅ 2 HIGH issues fixed (XSS mitigation)
Quality: ✅ 3 MEDIUM issues resolved or deferred
Testing: ✅ All 43 unit tests pass
Pro compatibility: ✅ Zero impact (verified)

Ready for code review and draft PR creation."
```

### Step 9: Final Verification

Ensure checklist shows:
- ✅ All HIGH security/quality issues resolved
- ✅ MEDIUM/LOW issues documented with reasoning
- ✅ All critical tests passing
- ✅ Agent skill findings documented
- ✅ Pro compatibility verified (if applicable)
- ✅ Status: "Ready for Draft PR: YES"

### Step 10: Push Branch

```bash
git push -u origin feat/your-feature-name
```

**Result:** Remote branch ready for draft PR creation with full audit trail

---

## Validation File Lifecycle

**Location:** Project-discoverable (e.g., `openspec/`, `docs/`, or PR-specific folder)

**Purpose:**
- Audit trail of findings and decisions
- Reference for code reviewers
- Due diligence documentation
- Knowledge sharing

**Lifecycle:**
- **Created:** During feature development
- **Updated:** As issues are found and fixed
- **Committed:** Part of feature branch
- **Reviewed:** By code reviewers (as context)
- **Optional retention:** Keep or remove after merge (not in main branch)

---

## Available Review Skills

All features can use these agent skills:

| Skill | Purpose | Use When |
|-------|---------|----------|
| **plugin-audit** | Security + optimization review | All PRs (security review) |
| **debugger** | Edge case and bug discovery | High-risk features, complex logic |
| **php-cs-fixer-style** | PHP code style compliance | After code written (style check) |
| **pr-descriptor** | Generate PR descriptions | After approval (create PR body) |
| **agents-onboarding** | Architecture/AGENTS.md updates | Major features or refactors |

---

## WordPress Security Checklist

Use this for every PR involving forms, user input, or database:

- [ ] **Input Validation**: `sanitize_text_field()`, `sanitize_url()`, `intval()`, `wp_kses_post()`
- [ ] **Output Escaping**: `esc_attr()`, `esc_html()`, `wp_kses_post()`
- [ ] **Database Safety**: wpFluent() query builder or prepared statements, no string concatenation
- [ ] **CSRF Protection**: nonce verification on all form submissions
- [ ] **User Capabilities**: `current_user_can()` checks before sensitive operations
- [ ] **No eval()**: Never use `eval()`, `Function()`, `$_GET[$var]`
- [ ] **No unserialize()**: Never unserialize untrusted data
- [ ] **Path Safety**: Use `ABSPATH`, `PLUGIN_DIR` constants, not hardcoded paths
- [ ] **jQuery Safety**: No `html()` with untrusted data, use `text()` or vanilla JS

---

## Before You Push

Verification checklist:
- ✅ Tests: All critical tests pass
- ✅ Security: No HIGH priority issues
- ✅ Quality: MEDIUM/LOW issues documented
- ✅ Skills: plugin-audit + debugger run (documented)
- ✅ Checklist: All sections complete
- ✅ Commit: Checklist file included
- ✅ Status: "Ready for Draft PR: YES"

---

## Review by Code Reviewer

Code reviewers will:
1. Read validation checklist first (findings summary)
2. Understand security/quality decisions made
3. Ask about accepted risks or deferred items
4. Spot-check HIGH priority fixes
5. Review code for architectural soundness
6. Approve or request changes

---

## FAQ

**Q: Do I need to fix ALL issues?**  
A: No. Fix all HIGH (security-blocking). Document MEDIUM/LOW with reasoning and impact.

**Q: How do I use the agent skills?**  
A: Delegate to specialized agents. Provide branch/PR info. Document findings in checklist.

**Q: What if agent skills find nothing?**  
A: Document "plugin-audit: No critical issues found" in checklist. Good sign!

**Q: Can I defer an issue to v6.3.0?**  
A: Yes, if you document it: "DEFER: v6.3.0, reason: [backwards compatibility / low priority]"

**Q: What if tests fail?**  
A: Fix the code, re-run tests, update checklist. Don't push if tests fail.

**Q: Is this just for jQuery migration?**  
A: No! This applies to ANY feature branch (bug fixes, new features, refactors, etc.)

**Q: What's the difference from human code review?**  
A: This is **automated/skill-based pre-review** (catch issues early). Human review is **architectural/design review** (correctness, patterns, reasoning).

**Q: Where should the validation file live?**  
A: Flexible - `openspec/`, `docs/`, or feature-specific folder. Make it discoverable.

---

## Next Actions

1. Create your feature branch: `git checkout -b feat/your-feature`
2. Write your code following CLAUDE.md rules
3. Run validation: unit tests + agent skills
4. Create validation checklist documenting findings
5. Fix HIGH priority issues, document others
6. Commit checklist file
7. Push branch: `git push -u origin feat/your-feature`

**Then:** Code reviewers use checklist as context for PR review

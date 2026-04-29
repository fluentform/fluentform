# Review Skills Reference

**When to read:** When running validation skills, before pushing branches, during code review

**Skills location:** Global `~/.claude/skills/` (auto-loaded by Claude Code)

**Setup:** See `SETUP-AGENT-SKILLS.md` for one-time global setup.

These 5 skills are available globally to all projects:
- `plugin-audit` — Security + optimization review
- `debugger` — Bug discovery with finder→verifier loop
- `php-cs-fixer-style` — PHP/JS code style compliance
- `pr-descriptor` — Why-first PR description generation
- `agents-onboarding` — Architecture documentation

**Invoke in conversation:** "Use the plugin-audit skill to..." or "Use the debugger skill to..."

---

## The 5 Agent Review Skills

Available for direct invocation during development:

### 1. /plugin-audit

**Purpose:** Comprehensive security and optimization review

**Finds:**
- Security vulnerabilities (XSS, SQL injection, CSRF, unsafe patterns)
- Performance issues (N+1 queries, memory leaks, inefficient code)
- Dead code (unused functions, imports, variables)
- Traceability gaps (undocumented APIs, unclear migration paths)

**Use when:**
- Every PR (security critical)
- Payment/gateway handlers (critical path)
- Public API changes
- New third-party integrations

**Example:**
```
/plugin-audit
```

**Output includes:**
```
## SECURITY FINDINGS

### HIGH Priority (BLOCKING)
- Issue 1: XSS vulnerability
  Location: form-submission.js:941
  Risk: Malicious message injection
  Fix: Use textContent instead of innerHTML

### MEDIUM Priority (RECOMMENDED)
- Issue 1: Unvalidated event names
  Location: emitEvent() function
  Risk: Prototype pollution
  Fix: Add regex validation

### LOW Priority (DOCUMENT)
- Issue 1: Dead jQuery code
  Location: Multiple locations
  Impact: ~20KB bundle bloat
```

**How to use findings:**
1. Copy HIGH issues to validation checklist
2. Fix before committing
3. Document MEDIUM/LOW with rationale

---

### 2. /debugger

**Purpose:** Edge case and bug discovery using Finder → Verifier loop

**Finds:**
- Race conditions in async code
- Memory leaks (uncleaned event listeners, circular refs)
- State inconsistencies
- Off-by-one errors
- Unhandled edge cases
- Stale closures

**Use when:**
- Complex async logic (payment flows, form submission)
- Event listener management
- State transitions (multi-step forms)
- Critical features (PR-2, PR-6 in jQuery migration)

**Example:**
```
/debugger
```

**Output includes:**
```
## VERIFIED BUGS

1. Dual Listener Execution
   Location: onEvent() function
   Trigger: When jQuery is present, both jQuery and native listeners register
   Impact: Handlers fire twice, state updates duplicate
   Severity: High
   Fix: Use XOR pattern (jQuery when available, else native)

2. Memory Leak in Event Cleanup
   Location: Event listener removal missing
   Trigger: Form removed from DOM without cleanup
   Impact: Memory accumulates over time
   Severity: High
   Fix: Add removeEventListener for all addEventListener calls

## UNVERIFIED FINDINGS
[Issues that need further investigation]

## FALSE POSITIVES
[Issues that are not real bugs with explanation]
```

**How to use findings:**
1. Review verified bugs
2. Fix in code
3. Verify fix with debugger again (if needed)
4. Document in validation checklist

---

### 3. /php-cs-fixer-style

**Purpose:** Code style and formatting compliance

**Checks:**
- PHP indentation (spaces vs tabs consistency)
- PHP naming (snake_case for functions/variables, PascalCase for classes)
- JavaScript indentation (consistent spacing)
- JavaScript naming (camelCase for functions, PascalCase for classes)
- Line length limits
- Function/method length (>50 lines is too long)
- Comment clarity and relevance
- Code organization and structure

**Use when:**
- Every PR (quick style pass)
- After major refactors
- When inheriting code from others

**Example:**
```
/php-cs-fixer-style
```

**Output includes:**
```
## PHP Style Issues

- filters.php:45
  Inconsistent indentation (mix of spaces and tabs)
  
- Component.php:89
  Function too long (67 lines, recommend <50)
  
- filters.php:56
  Use snake_case for function name

## JavaScript Style Issues

- form-submission.js:23
  Use const instead of var
  
- form-submission.js:45
  Missing semicolon (JavaScript)
  
- form-submission.js:100
  Use camelCase for variable name (use jQueryTarget)

## Recommendations

1. Run php-cs-fixer (if installed)
2. Manual fixes for naming inconsistencies
3. Break long functions into smaller ones
```

**How to use findings:**
1. Review style issues
2. Fix in code (manual or with fixer)
3. Run again to verify
4. Document in validation checklist

---

### 4. /pr-descriptor

**Purpose:** Generate professional, why-first PR descriptions

**Creates:**
- Executive summary (problem statement, motivation)
- Change summary (what changed, not how)
- Testing approach
- Risk assessment
- Impact analysis (Pro plugin, third-party)
- Merge dependencies

**Use when:**
- After code is approved
- Before creating/updating GitHub PR
- When ready to merge

**Example:**
```
/pr-descriptor
```

**Output format:**
```markdown
## Why

[Problem statement and motivation]

## What Changed

- feature1: [description]
- feature2: [description]
- tests: [description]

## Testing

- [ ] Step 1: [test instruction]
- [ ] Step 2: [test instruction]
- [ ] Verify: [expected result]

## Risk Assessment

[What could go wrong, mitigation strategy]

## Pro Impact

[Impact on Pro plugin, actions needed]

## Merge Gate

[Dependencies, timing, coordination needs]

## Success Criteria

[What successful looks like]
```

**How to use:**
1. Run /pr-descriptor when code approved
2. Copy output to GitHub PR description
3. Check all items in testing checklist before merge

---

### 5. /agents-onboarding

**Purpose:** Create/update architecture and onboarding documentation

**Updates:**
- AGENTS.md (agent responsibilities, decision framework)
- Architecture docs (system design, patterns used)
- Getting started guides
- Key concepts and terminology

**Use when:**
- Major architecture changes
- Significant refactors (core system)
- New integration patterns
- When introducing new modules/systems

**When NOT to use:**
- Small bug fixes
- Minor optimizations
- Simple feature additions

**Example:**
```
/agents-onboarding
```

**Output includes:**
```markdown
## AGENTS.md

[Updated agent responsibilities and onboarding]

## Architecture Documentation

[System flows, design patterns, key concepts]

## Getting Started

[Updated setup and contribution guide]

## Decision Framework

[How architectural decisions are made]
```

**How to use:**
1. Run /agents-onboarding for major changes
2. Review generated documentation
3. Integrate into AGENTS.md and architecture docs
4. Commit with feature branch

---

## Skill Usage Matrix

| PR Type | plugin-audit | debugger | php-cs-fixer-style | pr-descriptor | agents-onboarding |
|---------|--------------|----------|-------------------|---------------|-------------------|
| Bug fix | ✅ | ⏳ | ✅ | ✅ | ❌ |
| New feature | ✅ | ✅ | ✅ | ✅ | ⏳ |
| Refactor | ✅ | ✅ | ✅ | ✅ | ✅ |
| Security | ✅ | ✅ | ✅ | ✅ | ❌ |
| Payment/Gateway | ✅ | ✅ | ✅ | ✅ | ❌ |
| Architecture | ✅ | ⏳ | ✅ | ✅ | ✅ |
| Docs/Config | ❌ | ❌ | ✅ | ✅ | ❌ |

**Legend:** ✅ Required | ⏳ Recommended | ❌ Not needed

---

## For jQuery Migration

### PR-1: Core Submission Runtime
```
/plugin-audit     → Security issues (XSS, event validation)
/debugger         → Edge cases (dual listeners, memory leaks)
/php-cs-fixer-style → Style verification
/pr-descriptor    → PR body (after approval)
```

**Expected findings:**
- 2 HIGH: XSS vulnerabilities (innerHTML)
- 2 MEDIUM: Event validation, dual listeners
- 1 LOW: Dead code

---

### PR-2: Payment Handler
```
/plugin-audit     → Deep security review (payment flow)
/debugger         → Critical flow (Stripe, PayPal)
/php-cs-fixer-style → Style check
/pr-descriptor    → PR body (after approval)
```

**Note:** Pro team required for full testing

---

### PR-6: Gateway Handlers (Pro)
```
/plugin-audit     → Gateway security (Razorpay, Paystack)
/debugger         → Critical (next-action flow)
/php-cs-fixer-style → Style check
/pr-descriptor    → PR body (after approval)
```

**Note:** Pro team required for testing + sign-off

---

## Integration with Validation Workflow

1. **Run skills:** `/plugin-audit`, `/debugger`, `/php-cs-fixer-style`
2. **Document findings:** Create validation checklist
3. **Fix issues:** Commit fixes with skill findings
4. **Run pr-descriptor:** Generate PR body
5. **Submit PR:** With checklist findings in description

---

## Quick Commands

| Task | Command |
|------|---------|
| Security audit | `/plugin-audit` |
| Find bugs | `/debugger` |
| Check style | `/php-cs-fixer-style` |
| Create PR body | `/pr-descriptor` |
| Update architecture | `/agents-onboarding` |

---

## Common Scenarios

### Scenario: Simple Bug Fix
```
1. Fix the bug
2. Run: /plugin-audit (quick scan)
3. Run: /php-cs-fixer-style
4. Create validation checklist
5. Commit and push
```

### Scenario: Payment Feature
```
1. Implement feature
2. Run: /plugin-audit (deep dive)
3. Run: /debugger (critical flows)
4. Run: /php-cs-fixer-style
5. Create validation checklist (document findings)
6. Fix HIGH issues
7. Get Pro team review
8. Run: /pr-descriptor
9. Submit PR
```

### Scenario: Complex Refactor
```
1. Refactor code
2. Run: /plugin-audit
3. Run: /debugger (state/flow changes)
4. Run: /php-cs-fixer-style
5. Run: /agents-onboarding (document changes)
6. Create validation checklist
7. Update architecture docs
8. Get peer review
9. Run: /pr-descriptor
10. Submit PR
```

---

## Tips

✅ **DO:**
- Run skills early and often
- Fix issues as you code (don't defer)
- Document rationale for deferred issues
- Use findings to improve code quality
- Reference validation checklist in PR

❌ **DON'T:**
- Defer all findings to "future work"
- Run skills AFTER pushing (run before)
- Ignore HIGH priority issues
- Skip debugger for async/complex code
- Create PR without findings documented

---

## Next Steps

1. Select a branch to validate
2. Run `/plugin-audit` for security review
3. Run `/debugger` for edge cases (if needed)
4. Run `/php-cs-fixer-style` for style check
5. Create validation checklist with findings
6. Fix HIGH priority issues
7. Commit checklist and push
8. Create PR with findings summary

# Agent Skills Reference

**Location:** `/Volumes/Projects/Tools/agent-skills-standalone/`  
**Purpose:** Comprehensive guide to invoking and using all available review skills

---

## Quick Reference Table

| Skill | Purpose | Invocation | Risk Level | Use For |
|-------|---------|-----------|-----------|---------|
| plugin-audit | Security + optimization | Agent delegation | LOW | All PRs |
| debugger | Edge cases + bugs | Agent delegation | LOW | Critical PRs |
| php-cs-fixer-style | Code style | CLI or manual | LOW | All PRs |
| pr-descriptor | PR descriptions | Agent delegation | LOW | After approval |
| agents-onboarding | Architecture docs | Agent delegation | LOW | Major features |

---

## 1. plugin-audit

**Purpose:** Comprehensive WordPress plugin security and optimization review

**Location:** `/Volumes/Projects/Tools/agent-skills-standalone/plugin-audit/`

### What It Does
- **Security Review**
  - XSS vulnerabilities (innerHTML, eval, unsafe DOM manipulation)
  - SQL injection (direct DB access, string concatenation)
  - CSRF vulnerabilities (missing nonce verification)
  - Input validation gaps (unsanitized $_GET, $_POST)
  - Unsafe deserialization (unserialize with untrusted data)
  - Privilege escalation (missing capability checks)

- **Performance Optimization**
  - N+1 query detection
  - Unnecessary database queries
  - Missing caching opportunities
  - Memory leaks
  - Inefficient loops

- **Dead Code Analysis**
  - Unused functions
  - Unused imports/requires
  - Unused variables
  - Unreachable code

- **Traceability Verification**
  - All hooks documented
  - All filters documented
  - Public API documentation complete
  - Migration paths clear

### How to Invoke

#### Method 1: Direct Agent Delegation (RECOMMENDED)
```python
Agent(
    description="Security audit for [PR-NAME]",
    subagent_type="general-purpose",
    prompt="""Run plugin-audit on fluentform [PR-NAME] branch.

Focus on:
1. Security: [specific concerns, e.g., "event bridge event validation"]
2. Performance: [specific concerns]
3. Dead code: [specific concerns]
4. Traceability: [specific concerns]

Branch: [branch-name]
Files changed: [list key files]

Output: Security findings, optimization opportunities, risk assessment"""
)
```

#### Method 2: Manual Command (if CLI available)
```bash
cd /Volumes/Projects/work/forms/wp-content/plugins/fluentform

# Check current branch
git branch

# Run audit (if available as CLI)
/Volumes/Projects/Tools/agent-skills-standalone/plugin-audit \
  --repository fluentform \
  --branch feat/your-branch \
  --output-path ./plugin-audit-report.md
```

### What It Outputs

**Report structure:**
```markdown
## SECURITY FINDINGS

### HIGH Priority (BLOCKING)
- Issue 1: [Description]
  - Location: [File:line]
  - Risk: [What could go wrong]
  - Fix: [How to fix]

### MEDIUM Priority (RECOMMENDED)
- Issue 1: [Description]

### LOW Priority (DOCUMENT)
- Issue 1: [Description]

## PERFORMANCE ISSUES

## DEAD CODE

## TRACEABILITY ANALYSIS
```

### How to Use Findings

**In Validation Checklist:**
```markdown
## Security Review

### plugin-audit Results

Findings:
- [ ] HIGH: [Issue 1] - [FIX/ACCEPT]
- [ ] MEDIUM: [Issue 2] - [FIX/DEFER]
- [ ] LOW: [Issue 3] - [DOCUMENT]

Status: [X/X issues fixed]
```

**Action Items:**
1. Copy HIGH issues to validation checklist
2. Fix all HIGH issues before push
3. Document MEDIUM/LOW with rationale
4. Update status in checklist

### Example Usage (jQuery Migration)

**PR-1: Core Submission Runtime**
```
Agent prompt:
"Run plugin-audit on fluentform pr/1-foundation branch.

Focus on:
1. Security: Event bridge security, jQuery bridge event validation, XSS in DOM rendering
2. Performance: Form submission hot path efficiency, memory usage
3. Dead code: Unreachable jQuery fallback code
4. Traceability: Event bridge events documented, jQuery mode persistence clear

Output: Security findings, optimization opportunities"
```

**Expected findings:**
- XSS vulnerabilities (innerHTML without escaping)
- Event validation gaps
- Memory leaks (dual listeners)
- Dead jQuery code

---

## 2. debugger

**Purpose:** Evidence-first bug discovery using Finder → Verifier feedback loop

**Location:** `/Volumes/Projects/Tools/agent-skills-standalone/debugger/`

### What It Does
- **Bug Discovery (Finder)**
  - Trace code execution paths
  - Identify edge cases
  - Find race conditions
  - Detect state inconsistencies
  - Spot circular dependencies
  - Reveal off-by-one errors

- **Verification (Verifier)**
  - Confirm bugs are real (not false positives)
  - Classify severity
  - Find reproduction steps
  - Suggest fixes

- **Feedback Loop**
  - Find issue → Verify → Report findings
  - Minimize false positives
  - Provide actionable intelligence

### How to Invoke

#### Method 1: Agent Delegation (RECOMMENDED)
```python
Agent(
    description="Edge case discovery for [PR-NAME]",
    subagent_type="general-purpose",
    prompt="""Use debugger skill on fluentform [PR-NAME] branch.

Focus on edge cases:
1. [Specific edge case 1, e.g., "jQuery not present at runtime"]
2. [Specific edge case 2, e.g., "Payment handler bootstrap before form loaded"]
3. [Specific edge case 3, e.g., "Multiple simultaneous form submissions"]

Branch: [branch-name]
Files changed: [key files]

Approach: Finder → Verifier → Feedback loop
- Trace execution paths for edge cases
- Verify findings are real bugs (not false positives)
- Classify severity
- Provide actionable insights

Output: Bug findings, verification results, recommended fixes"""
)
```

#### Method 2: Manual Code Tracing
```bash
# Review code for edge cases
cd /Volumes/Projects/work/forms/wp-content/plugins/fluentform

# Check for common issues
grep -n "TODO\|FIXME\|HACK" resources/assets/public/form-submission.js
grep -n "async\|Promise\|setTimeout" resources/assets/public/form-submission.js
grep -n "addEventListener\|removeEventListener" resources/assets/public/form-submission.js
```

### What It Outputs

**Report structure:**
```markdown
## BUGS FOUND

### Real Bugs (Verified)
1. Bug: [Description]
   - Location: [File:line]
   - Trigger: [How to reproduce]
   - Impact: [What goes wrong]
   - Fix: [Suggested fix]
   - Severity: [Critical/High/Medium]

### Potential Issues (Unverified)
1. Issue: [Description]
   - Investigation needed

### False Positives (Not Real Issues)
1. [Description]
   - Reason: [Why it's not a bug]

## VERIFICATION RESULTS
- [X] Real bugs: N confirmed
- [ ] False positives: N filtered
- [ ] Actionable insights: N provided
```

### How to Use Findings

**In Validation Checklist:**
```markdown
## Debugger Results

Edge cases found and verified:
- [ ] Race condition in payment handler (FIXED)
- [ ] Memory leak in event listeners (FIXED)
- [ ] State inconsistency on step transition (DEFERRED)

Status: [X/X issues addressed]
```

### Example Usage (jQuery Migration)

**PR-1: Core Submission Runtime**
```
Agent prompt:
"Use debugger on fluentform pr/1-foundation branch.

Focus on edge cases:
1. jQuery not present during form initialization
2. Multiple simultaneous form submissions
3. Event bridge listener cleanup on form removal
4. Dual listener (jQuery + native) deduplication
5. Race conditions in promise chain

Branch: pr/1-foundation
Files: form-submission.js, Component.php

Approach: Trace execution for each edge case.
Verify which are real bugs vs false alarms.

Output: Verified bugs, reproduction steps, fixes"
```

**Expected findings:**
- Dual listeners cause double handler execution
- Memory leaks from unclean event listeners
- Race conditions in async submission flow

---

## 3. php-cs-fixer-style

**Purpose:** PHP and JavaScript code style compliance

**Location:** `/Volumes/Projects/Tools/agent-skills-standalone/php-cs-fixer-style/`

### What It Does
- **PHP Style**
  - Indentation consistency (spaces vs tabs)
  - Naming conventions (snake_case for functions, PascalCase for classes)
  - Line length limits
  - Method/function length
  - Comment clarity
  - Import organization

- **JavaScript Style**
  - Consistent indentation
  - Naming conventions (camelCase for functions, PascalCase for classes)
  - Semicolon usage
  - Quote consistency
  - Arrow function vs function declarations
  - Variable declarations (const/let vs var)

- **General**
  - Code organization
  - Comment quality
  - Trailing whitespace
  - File formatting

### How to Invoke

#### Method 1: Manual Code Review
```bash
cd /Volumes/Projects/work/forms/wp-content/plugins/fluentform

# Check PHP files for obvious style issues
git diff dev..HEAD -- '*.php' | grep '^+'

# Check JavaScript files
git diff dev..HEAD -- '*.js' | grep '^+'

# Look for:
# - Inconsistent indentation
# - Missing semicolons
# - var instead of const/let
# - Inconsistent naming
```

#### Method 2: Agent Delegation
```python
Agent(
    description="Code style verification for [PR-NAME]",
    subagent_type="general-purpose",
    prompt="""Check code style for fluentform [PR-NAME] branch.

Files to check:
- [PHP files changed]
- [JavaScript files changed]

Check for:
1. PHP: Indentation, naming (snake_case), line length, function organization
2. JavaScript: Indentation, naming (camelCase), var→const/let, semicolons
3. Both: Comment clarity, code organization, trailing whitespace

Branch: [branch-name]

Output: Style issues found, recommendations for consistency"""
)
```

### What It Outputs

**Report:**
```markdown
## Code Style Issues

### PHP Files
- file1.php:
  - Line 45: Use snake_case for function names
  - Lines 50-100: Function too long (>50 lines)
  - Line 78: Inconsistent indentation (tabs vs spaces)

### JavaScript Files
- form-submission.js:
  - Line 23: Use const instead of var
  - Line 45: Missing semicolon
  - Line 89: Use camelCase naming

### Recommendations
1. Run php-cs-fixer (if available)
2. Run prettier or ESLint (if configured)
3. Manual fixes for style issues
```

### How to Use Findings

**In Validation Checklist:**
```markdown
## Code Style (php-cs-fixer-style)

Issues found:
- [ ] PHP indentation (FIXED)
- [ ] JavaScript var → const (FIXED)
- [ ] Comment clarity (minor, ACCEPT)

Status: Style compliant
```

### Example Usage (jQuery Migration)

**PR-1: Core Submission Runtime**
```
Check files:
- resources/assets/public/form-submission.js (2,900 lines)
- app/Hooks/filters.php (refactored)
- app/Modules/Component/Component.php

For:
- Consistent indentation
- Naming conventions consistency
- Function length (break long functions)
```

---

## 4. pr-descriptor

**Purpose:** Generate professional, why-first PR descriptions

**Location:** `/Volumes/Projects/Tools/agent-skills-standalone/pr-descriptor/`

### What It Does
- **Why-First Narrative**
  - Lead with motivation (why this PR exists)
  - Explain problem being solved
  - Justify technical approach

- **Change Summary**
  - List files modified
  - Describe what changed (without implementation details)
  - Highlight non-obvious changes

- **Context for Reviewers**
  - Risk assessment
  - Testing approach
  - Pro/third-party impact
  - Dependencies

- **Structured Format**
  - Clear sections
  - Actionable checklists
  - Links to related issues
  - Testing instructions

### How to Invoke

#### Method 1: Agent Delegation (After Code Approval)
```python
Agent(
    description="Generate PR description for [PR-NAME]",
    subagent_type="general-purpose",
    prompt="""Generate PR description for fluentform [PR-NAME] using pr-descriptor pattern.

Branch: [branch-name]
Target: dev

Commits on this branch:
- [List commits from git log]

Files changed:
- [Key files]

What to include:
1. Why-first narrative: Why this PR, what problem it solves
2. What changed: Summary of changes (not implementation)
3. Risk assessment: What could break
4. Testing: How to test this PR
5. Pro impact: Does it affect Pro plugin?
6. Merge gate: Any dependencies?

Output: Professional PR description ready for GitHub"""
)
```

#### Method 2: Template from Code
```bash
# Get commit messages to understand changes
git log dev..HEAD --oneline

# Get changed files for summary
git diff --stat dev..HEAD

# Get file changes for detail
git diff dev..HEAD -- [key files] | head -100
```

### What It Outputs

**PR Description Structure:**
```markdown
## Why

[Problem statement, motivation, business context]

## What Changed

[Summary of changes - WHAT changed, not HOW]

- feature1: [description]
- feature2: [description]

## Testing

[How to verify this works]

- [ ] Step 1: [test step]
- [ ] Step 2: [test step]

## Risk Assessment

[What could go wrong, mitigation]

## Pro Impact

[Does Pro plugin need changes?]

## Merge Gate

[Dependencies, timing, coordination needs]
```

### How to Use

**Integration with Workflow:**
1. Code is written and tested
2. Validation checklist complete
3. Code approval received
4. Run pr-descriptor
5. Copy output to GitHub PR body
6. Submit PR

### Example Usage (jQuery Migration)

**PR-1: Core Submission Runtime**
```
Agent prompt:
"Generate PR description for fluentform Commit 1 (PR-1 Foundation).

Branch: feat/jquery-migration (Commit 1 section)

Commits:
- FEAT: Core submission runtime - vanilla JS with jQuery bridge

Changes:
- form-submission.js: Vanilla JS runtime + event bridge
- Component.php: jQuery load mode control
- filters.php: Mode filter
- Tests: 43 unit tests

Focus on:
- Why: 10-30% performance improvement, reduce jQuery dependency
- What: Core runtime migrated to vanilla JS, bridge for compatibility
- Risk: Event bridge correctness, jQuery fallback verification
- Pro: Zero impact (event bridge compatible)
- Test: Both jQuery and vanilla modes verified

Output: Professional PR description"
```

---

## 5. agents-onboarding

**Purpose:** Create/update AGENTS.md and architecture documentation

**Location:** `/Volumes/Projects/Tools/agent-skills-standalone/agents-onboarding/`

### What It Does
- **AGENTS.md Creation/Update**
  - Document agent responsibilities
  - Define onboarding for new team members
  - Clarify decision-making process

- **Architecture Documentation**
  - Update architecture diagrams
  - Document system flows
  - Explain key patterns
  - Clarify dependencies

- **Repository Onboarding**
  - Repository overview
  - Getting started guide
  - Key concepts explained
  - Team decision points

### How to Invoke

#### Method 1: Agent Delegation
```python
Agent(
    description="Update architecture docs for [PR-NAME]",
    subagent_type="general-purpose",
    prompt="""Update AGENTS.md or architecture docs for fluentform [PR-NAME].

Branch: [branch-name]

Changes:
- [Brief description of what changed]

Update:
1. AGENTS.md: [New agent roles or responsibilities]
2. Architecture docs: [New patterns or flows]
3. Getting started: [New setup steps if applicable]

Output: Updated documentation ready to commit"""
)
```

### When to Use

**Use agents-onboarding when:**
- Adding major new feature (new architecture pattern)
- Refactoring core system
- Significant change to event flow
- New agent role introduced
- Significant decision point

**Don't use when:**
- Small bug fix
- Optimization
- Documentation typo fix

---

## Integration: Using Skills Together

### Typical Workflow

```
1. WRITE CODE
   git checkout -b feat/your-feature
   [write code, tests]

2. RUN UNIT TESTS
   node --test tests/js/*.test.js
   [verify all pass]

3. RUN SECURITY AUDIT (plugin-audit)
   Agent(description="Security audit", prompt=...)
   [review findings, fix HIGH issues]

4. RUN EDGE CASE DETECTION (debugger)
   Agent(description="Edge case discovery", prompt=...)
   [review findings, verify bugs]

5. CHECK CODE STYLE (php-cs-fixer-style)
   [manual review for style issues]
   [fix any obvious issues]

6. CREATE VALIDATION CHECKLIST
   [document all findings and status]
   [commit checklist file]

7. GENERATE PR DESCRIPTION (pr-descriptor)
   Agent(description="Generate PR description", prompt=...)
   [copy to GitHub]

8. PUSH BRANCH
   git push -u origin feat/your-feature
   [ready for code review]

9. UPDATE ARCHITECTURE (agents-onboarding) - IF NEEDED
   [only for major changes]
```

### For jQuery Migration Specifically

**Commit 1 (PR-1):**
```
Unit tests → plugin-audit → debugger → style check → 
validation checklist → pr-descriptor → push
```

**Commit 2 (PR-2):**
```
Unit tests → plugin-audit → debugger (critical) → style check → 
validation checklist → pr-descriptor → push
```

**Commits 3-5, 7-8:**
```
Unit tests → plugin-audit → style check → 
validation checklist → pr-descriptor → push
```

**Commit 6 (PR-6):**
```
Unit tests → plugin-audit → debugger (critical) → style check → 
validation checklist → pr-descriptor → push
```

---

## Skill Best Practices

### 1. plugin-audit
- ✅ Run on every PR (security critical)
- ✅ Focus on specific concerns in prompt (XSS, injection, etc.)
- ✅ Document all findings in validation checklist
- ❌ Don't ignore LOW priority issues (still good to know)

### 2. debugger
- ✅ Run on critical/complex logic (payment, events, state)
- ✅ Ask for specific edge cases
- ✅ Request verification of findings (avoid false positives)
- ❌ Don't skip for "simple" features (bugs hide there)

### 3. php-cs-fixer-style
- ✅ Run quick manual check before push
- ✅ Look for consistency issues
- ✅ Reference CLAUDE.md coding rules
- ❌ Don't be overly strict (pragmatic > perfect)

### 4. pr-descriptor
- ✅ Run after code approval (final step before merge)
- ✅ Use actual commits/changes for accuracy
- ✅ Copy output directly to GitHub
- ❌ Don't run before code is stable (waste of effort)

### 5. agents-onboarding
- ✅ Run for major architecture changes
- ✅ Update AGENTS.md alongside code
- ❌ Don't use for minor changes (overkill)

---

## FAQ

**Q: Do I have to use all 5 skills?**  
A: No. Use what fits:
- Security-critical: plugin-audit required
- Complex logic: debugger recommended
- All PRs: Style check + pr-descriptor

**Q: Can skills be run locally?**  
A: Varies by skill. Some have CLI tools, but most are agent-delegated.

**Q: How do I report a skill issue?**  
A: Document in validation checklist. If false positive, note reasoning.

**Q: Can I skip a skill?**  
A: Yes, if risk is acceptable. Document in checklist why it was skipped.

**Q: Which skill should I run first?**  
A: Unit tests first (fast feedback), then plugin-audit (security), then debugger (edge cases).

---

## Examples by Scenario

### Scenario 1: Simple Bug Fix
```
Unit tests → plugin-audit (quick scan) → PR-descriptor
Risk: LOW, skills: Minimal
```

### Scenario 2: New Feature
```
Unit tests → plugin-audit (full review) → debugger (edge cases) →
style check → validation checklist → PR-descriptor
Risk: MEDIUM, skills: All
```

### Scenario 3: Payment Handler (Critical)
```
Unit tests → plugin-audit (deep dive) → debugger (comprehensive) →
style check → validation checklist → Pro testing → PR-descriptor
Risk: HIGH, skills: All + manual testing
```

### Scenario 4: Documentation
```
PR-descriptor only (or none if obvious)
Risk: NONE, skills: Minimal
```

---

## Next Steps

1. ✅ Reference this guide when running skills
2. ✅ Document skill execution in validation checklist
3. ✅ Use agent prompts as templates for your PRs
4. ✅ Adapt prompts to your specific feature/branch
5. ✅ Commit validation checklist with findings documented

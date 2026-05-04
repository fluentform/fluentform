# Skill: JS Migration Review

Use this skill to review any jQuery → vanilla JS migration (or any dual-runtime JS architecture) from all software engineering angles: breaking changes, regression risk, code smells, bundling, and WordPress-specific concerns.

## When to invoke

- Any PR that adds a vanilla JS alternative to a jQuery-dependent feature
- Any PR that introduces a conditional runtime loader (`if jQueryAvailable then ... else ...`)
- Any PR that adds a dual-event bridge (firing both `$.trigger()` and `CustomEvent`)
- Any PR that extracts jQuery code into a separate file while keeping the jQuery path

## How to invoke

```
/workflow-js-migration-review
```

Or delegate to an agent:
> "Run the JS migration review skill on the files changed in this PR"

---

## Review Dimensions

Run each dimension as a separate pass. Each pass has a specific question to answer.

---

### Pass 1 — Feature Parity Audit

**Question:** Does the vanilla path implement everything the jQuery path does?

Steps:
1. List every function, event emission, and feature initialization in the jQuery runtime
2. Check each one against the vanilla runtime
3. Flag any that are missing or have different behavior

**Common gaps to look for:**
- Third-party library initializations (Choices.js, input masks, flatpickr, Cleave.js)
- Spam/CSRF token generation
- CAPTCHA lazy rendering triggered by user interaction events
- "Other option" checkbox/radio special behavior
- Conditional field show/hide initialization
- Multi-step form progress tracking
- Analytics/tracking calls

**Output:** a table — feature, jQuery path line, vanilla path line (or MISSING)

---

### Pass 2 — Event Parity Audit

**Question:** Are all custom events emitted by the jQuery path also emitted by the vanilla path, with the same payload shape?

Steps:
1. Grep for every `trigger(`, `emitEvent(`, `dispatchEvent(` in both runtimes
2. Build a side-by-side table of event names and payloads
3. Flag: missing events, payload shape mismatches, bubbling difference

**Known jQuery vs CustomEvent incompatibilities:**
- jQuery `.trigger('name', [arg1, arg2])` → handler gets `function(e, arg1, arg2)`
- Native `new CustomEvent('name', { detail: data })` → handler gets `e.detail`
- These are **incompatible shapes** — third-party code written for one breaks on the other
- `e.preventDefault()` on a CustomEvent does NOT cancel the jQuery event (and vice versa) — `stopPropagation()` is similarly isolated
- Confirmed WONTFIX: jQuery custom events are NOT received by native `addEventListener` (jQuery Bug #11047)

---

### Pass 3 — Crash Path Audit

**Question:** What crashes (ReferenceError, TypeError, null dereference) occur when jQuery is not defined?

Steps:
1. Search all PHP files that emit inline `<script>` blocks for `jQuery(` — these are unconditional crash points
2. Search all JS files for `jQuery(` not inside a `typeof jQuery !== 'undefined'` guard
3. Search for any module that uses `$()` without a noConflict wrapper

**High-risk locations in WordPress plugins:**
- Inline scripts emitted by `wp_add_inline_script()` or manual `echo "<script>"`
- Page builder integration hooks (Elementor popup init, Divi, Beaver Builder)
- AJAX re-initialization handlers (forms loaded into modal/popup after page load)
- Third-party plugin integration scripts appended in `wp_footer`

---

### Pass 4 — DOM Timing Audit

**Question:** Does every initialization path wait for the DOM to be ready?

Check:
- jQuery path uses `$(document).ready()` ✅ — guaranteed DOM-ready
- Vanilla path: does it use `DOMContentLoaded`? Does it check `document.readyState`?
- Is the detection check (`typeof jQuery !== 'undefined'`) made before or after DOM-ready? If before, jQuery loaded with `defer` will not be detected
- Are forms added dynamically (AJAX, Elementor, shortcodes in tabs) re-initialized?

**Correct vanilla DOM-ready pattern:**
```js
function init() {
    document.querySelectorAll('.my-form').forEach(initForm);
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init(); // already ready
}
```

---

### Pass 5 — WordPress Enqueue Audit

**Question:** Do any scripts still hardcode `['jquery']` as a dependency, defeating the conditional loading?

Steps:
1. Grep `app/Modules/Component/Component.php` (and any other enqueue files) for `'jquery'` as a hardcoded string
2. Check every `wp_register_script()` and `wp_enqueue_script()` call
3. Flag any that are not using the conditional `$jQueryDeps` pattern

**Commonly missed:**
- `flatpickr` / date pickers
- `form-save-progress`
- Signature pad
- Payment gateway scripts (Stripe, RazorPay)
- Any inline script added via `wp_add_inline_script()` that uses `jQuery`

---

### Pass 6 — PHP Helper Hygiene

**Question:** Is the PHP side clean and idiomatic for this codebase?

Check:
- `get_option()` called once per request — use a `static $cache = null` pattern like `isTabIndexEnabled()` in `Helper.php`
- `ArrayHelper::get($settings, 'dotted.key', 'default')` used instead of nested `isset()` ternaries
- No multi-line docblocks describing what the code already says
- PHP option key used in the helper matches exactly the key saved by the Vue admin form
- Verify end-to-end: `Helper::getX()` key → `fluentFormVars.x` in JS → Vue `v-model` binding → sanitizer allows the values

---

### Pass 7 — Bundling Audit

**Question:** What is the actual bundle impact, and is code splitting working as intended?

Check:
- `require()` inside `if/else` → webpack bundles BOTH files regardless of branch (CommonJS is resolved statically)
- `import()` (dynamic) → webpack creates separate chunks, loaded on demand — only this enables true code splitting
- Run `npx webpack-bundle-analyzer` or check output size with `npm run production` to see actual file sizes
- Check `webpack.mix.js` for `optimization.splitChunks` or `output.chunkFilename` — without these, dynamic imports fall back to inline bundling

**Rule of thumb:**
- If the setting can change at runtime (PHP option), both paths MUST be bundled → `require()` is acceptable, document it
- If only one path is ever needed per page load → use dynamic `import()` with chunk config

---

### Pass 8 — Dead Code Audit

**Question:** Are all extracted modules actually used?

Check:
- Every `require()` / `import` at the top of a file — is the imported symbol actually called?
- Inner functions with the same name as imported symbols — they shadow the import silently
- Extracted modules that replicate logic already present inline — one of them is dead
- Any `.plain.js` or `-jquery.js` file that is neither an entry point nor `require()`d by one

---

### Pass 9 — Regression Test Checklist

Manual tests to run before marking the PR ready:

**Functional:**
- [ ] Standard form submission (text, email, textarea) — both jQuery and vanilla modes
- [ ] Multi-step form: forward/back navigation, conditional steps
- [ ] File upload with progress bar
- [ ] Required field validation — inline errors appear, clear on fix
- [ ] Required range slider — no false failure before user touches it
- [ ] Tabular grid with required fields — validation fails correctly
- [ ] Phone field with dial-code prefix — correct value submitted
- [ ] "Other" option on radio/checkbox — text input appears/disappears

**Integration:**
- [ ] reCAPTCHA / hCaptcha / Turnstile — lazy-rendered on first interaction
- [ ] Multi-select with Choices.js — opens, selects, submits correctly
- [ ] Input mask fields — mask applies, unmasked value submitted
- [ ] Date field (flatpickr) — opens, value submitted correctly
- [ ] Spam token protection — submission accepted server-side
- [ ] Save progress / resume — works without jQuery

**Loading scenarios:**
- [ ] Form in Elementor popup — initializes after popup opens
- [ ] Form loaded via AJAX (WP AJAX, Fetch, htmx) — initializes correctly
- [ ] Form in a tab (initially hidden) — initializes when tab becomes visible
- [ ] Page with jQuery loaded by another plugin — auto mode picks correct path
- [ ] Page with no jQuery — auto mode falls back to vanilla without error

**Third-party compatibility:**
- [ ] Plugin listening to `fluentform_submission_success` via jQuery `.on()` still fires
- [ ] Plugin listening via native `addEventListener('fluentform_submission_success')` still fires
- [ ] `e.preventDefault()` in a jQuery handler blocks the vanilla path submission (or is documented as not working)

---

### Pass 10 — WordPress Future Compatibility

- [ ] Audit jQuery wrapper for removed APIs in jQuery 4.0 (shipping in WordPress 6.8):
  - `jQuery.isArray` → use `Array.isArray`
  - `jQuery.parseJSON` → use `JSON.parse`
  - `jQuery.trim` → use `String.prototype.trim`
  - `jQuery.type` → use `typeof` / `instanceof`
  - `jQuery.now` → use `Date.now`
  - `jQuery.isNumeric` → use `!isNaN(parseFloat(n)) && isFinite(n)`
  - `jQuery.isFunction` → use `typeof fn === 'function'`
- [ ] Check for `.live()`, `.die()`, `.bind()`, `.unbind()`, `.delegate()`, `.undelegate()` — removed in jQuery 3.x, may still appear in older copied code

---

## Output Format

Write findings to:
```
openspec/changes/<feature-name>/ENGINEERING-REVIEW.md
```

Structure:
1. Severity summary table
2. Critical findings (C-01, C-02 …)
3. High findings (H-01, H-02 …)
4. Medium findings (M-01 …)
5. Code smells (S-01 …)
6. Verification checklist (checkbox per Critical/High item)

---

## Severity Definitions

| Severity | Definition |
|---|---|
| **Critical** | Will actively break in production for real users — crash, silent wrong behavior, data not submitted |
| **High** | Significant regression — a documented feature stops working or behaves differently between paths |
| **Medium** | Performance, maintainability, or correctness issue that does not break core functionality |
| **Code Smell** | Design issue, dead code, or pattern inconsistency — no immediate user impact |

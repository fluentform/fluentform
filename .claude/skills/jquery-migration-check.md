# Skill: jquery-migration-check

Run this skill any time to re-verify the specific issues found in the engineering review of the jQuery → vanilla JS migration (branch `feat/jquery-migration-start`, reviewed 2026-05-01).

For each issue: grep or read the relevant file, report FIXED / STILL OPEN / NEEDS MANUAL TEST.

---

## How to invoke

```
/jquery-migration-check
```

Or: "run the jquery migration check skill"

The skill checks each finding in order and produces a status table at the end.

---

## Automated Checks (grep-verifiable)

Run these greps against the current working tree. Each one either confirms a fix or flags it as still open.

### C-01: AJAX inline script jQuery crash
```bash
grep -n "jQuery(" app/Modules/Component/Component.php | grep -v "//\|shouldLoadJQuery\|jQueryMode"
```
**FIXED if:** the line around 775 (`ajax_formInstance = window.fluentFormApp(jQuery(...))`) is gone or wrapped in a `shouldLoadJQuery()` guard.
**STILL OPEN if:** raw `jQuery(` appears in any inline script block without a PHP condition.

### C-02: Elementor popup jQuery crash
```bash
grep -n "jQuery\." app/Modules/Component/Component.php | grep -i "elementor\|popup"
```
**FIXED if:** no results, or results are inside `if (Helper::shouldLoadJQuery())`.

### C-04: flatpickr / form-save-progress hardcode `['jquery']`
```bash
grep -n "'jquery'" app/Modules/Component/Component.php
```
**FIXED if:** every `'jquery'` occurrence uses the `$jQueryDeps` variable, not a hardcoded string literal.

### H-02: Dead imports in form-submission.plain.js
```bash
grep -n "createErrorHandler\|createVanillaValidator" resources/assets/public/modules/form-submission.plain.js
```
**FIXED if:** the import at line 8-9 is gone AND the inline inner function definition is gone — replaced by actual calls to the imported factories.
**STILL OPEN if:** the symbol appears as both an `import/require` AND a `function` definition (shadow).

### M-01: get_option() double-read
```bash
grep -n "get_option.*_fluentform_global_form_settings" app/Helpers/Helper.php
```
**FIXED if:** only one occurrence (in a shared private method), not two separate occurrences in `shouldLoadJQuery` and `getJQueryLoadingMode`.

### M-04: Magic string 'auto' in multiple files
```bash
grep -rn "': 'auto'\|\"auto\"\|= 'auto'" \
  app/Helpers/Helper.php \
  resources/assets/public/form-submission.js \
  resources/assets/public/modules/event-bridge.js \
  "resources/assets/admin/components/settings/FormSettings/Layout.vue"
```
**FIXED if:** a single constant is defined once and referenced everywhere else.

### M-03: jQuery detection inconsistency
```bash
grep -rn "typeof jQuery\|typeof window.jQuery" \
  resources/assets/public/form-submission.js \
  resources/assets/public/modules/
```
**FIXED if:** all occurrences use the same form consistently.

### S-04: jQuery 4.0 deprecated API usage in jQuery wrapper
```bash
grep -n "jQuery\.isArray\|jQuery\.parseJSON\|jQuery\.trim\|jQuery\.type\|jQuery\.now\|jQuery\.isNumeric\|jQuery\.isFunction\|\.live(\|\.die(\|\.bind(\|\.unbind(\|\.delegate(\|\.undelegate(" \
  resources/assets/public/form-submission-jquery.js
```
**FIXED if:** no results.

---

## Manual Verification Required

These cannot be confirmed by grep alone. For each, read the relevant file section and reason about the behavior.

### C-03: Spam token protection in vanilla path
- **Check:** Does `resources/assets/public/modules/form-submission.plain.js` contain a `fetch()`-based equivalent of `maybeInitSpamTokenProtection()`?
- **Or:** Does the admin UI show a warning when token protection is enabled and jQuery mode is disabled?
- **Reference:** Original implementation in `resources/assets/public/form-submission-jquery.js:1150–1182`

### C-05: DOM-ready guard in vanilla path
- **Check:** Does `resources/assets/public/modules/form-submission.plain.js` initialization use `DOMContentLoaded` or check `document.readyState`?
- **Look for:**
  ```js
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
  } else {
      init();
  }
  ```
- **STILL OPEN if:** initialization runs at module evaluation time with no readiness check.

### C-06: fluentFormCommonActions vanilla equivalent
- **Check:** Does the vanilla path initialize Choices.js multi-selects, input masks, and "Other" option behavior?
- **Look for:** References to `Choices`, `jQuery.fn.mask` equivalent, `ff_other_opt` handling in `form-submission.plain.js`

### H-01: Missing validation events + CAPTCHA trigger
- **Check:** Does `form-submission.plain.js` emit `fluentform_validation_failed`, `fluentform_error_in_stack`, `fluentform_error_below_element`, and `fluentform_first_interaction`?
- **Grep helper:**
  ```bash
  grep -n "fluentform_validation_failed\|fluentform_error_in_stack\|fluentform_error_below_element\|fluentform_first_interaction" \
    resources/assets/public/modules/form-submission.plain.js
  ```
- **FIXED if:** all four appear with an `emitEvent()` call at the correct points.

### H-03: Event payload shape consistency
- **Check:** Does `fluentform_init` emit the same payload shape in both paths?
- **jQuery path:** `resources/assets/public/form-submission-jquery.js` — grep for `fluentform_init`
- **Vanilla path:** `resources/assets/public/modules/form-submission.plain.js` — grep for `fluentform_init`
- **FIXED if:** both emit `{ form: formEl, config: formConfig }` as the detail object.

### H-04: Tabular grid validation in vanilla
- **Check:** Does the vanilla validator handle `per_row` for `input_radio`/`input_checkbox` inside tabular grids?
- **Reference:** jQuery implementation at `form-submission-jquery.js:1512–1515`

### H-05: Range slider `is-changed` check in vanilla
- **Check:** Does the vanilla required validator check for `data-is-changed="false"` on range sliders before marking them as required-but-empty?
- **Reference:** jQuery implementation at `form-submission-jquery.js:1534`

### H-06: Path decision deferred to DOM-ready
- **Check:** Is the `typeof jQuery !== 'undefined'` check in `form-submission.js` inside a `DOMContentLoaded` callback, or does it run synchronously at parse time?
- **FIXED if:** the detection is wrapped in a DOM-ready guard so deferred jQuery loads are detected correctly.

---

## Output Format

After running all checks, produce this table:

| ID | Finding | Status | Notes |
|---|---|---|---|
| C-01 | AJAX inline jQuery crash | FIXED / STILL OPEN | |
| C-02 | Elementor popup jQuery crash | FIXED / STILL OPEN / NEEDS MANUAL TEST | |
| C-03 | Spam token protection missing | FIXED / STILL OPEN / NEEDS MANUAL TEST | |
| C-04 | flatpickr/save-progress force jQuery | FIXED / STILL OPEN | |
| C-05 | No DOM-ready guard | FIXED / STILL OPEN / NEEDS MANUAL TEST | |
| C-06 | fluentFormCommonActions missing | FIXED / STILL OPEN / NEEDS MANUAL TEST | |
| H-01 | Missing validation events + CAPTCHA | FIXED / STILL OPEN / NEEDS MANUAL TEST | |
| H-02 | Dead imports / shadow | FIXED / STILL OPEN | |
| H-03 | Event payload shape mismatch | FIXED / STILL OPEN / NEEDS MANUAL TEST | |
| H-04 | per_row tabular validation | FIXED / STILL OPEN / NEEDS MANUAL TEST | |
| H-05 | Range slider is-changed check | FIXED / STILL OPEN / NEEDS MANUAL TEST | |
| H-06 | Auto-mode detection timing | FIXED / STILL OPEN / NEEDS MANUAL TEST | |
| M-01 | get_option() double-read | FIXED / STILL OPEN | |
| M-03 | jQuery detection inconsistency | FIXED / STILL OPEN | |
| M-04 | Magic string 'auto' × 5 | FIXED / STILL OPEN | |
| S-04 | jQuery 4.0 deprecated APIs | FIXED / STILL OPEN | |

End with a count: **X of 16 findings resolved. Y critical issues remain.**

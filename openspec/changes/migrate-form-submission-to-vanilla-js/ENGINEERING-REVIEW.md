# Engineering Review — jQuery to Vanilla JS Migration

**Branch:** `feat/jquery-migration-start`
**Initial review:** 2026-05-01
**Last updated:** 2026-05-04 (PR1 applied — see "Resolved" section)
**Scope:** All files changed in the 4-commit jQuery migration PR

---

## Severity Summary

| Severity | Count |
|---|---|
| Critical (will break in production) | 14 — **all resolved or DIVERGES (intentional)**. Trace: PR1 C-04/C-07/C-08, PR2 C-09..C-16, PR3 C-17/C-19..C-24, PR4 C-25/C-26 + audit-confirmed C-01..C-06. C-18 documented intentional. |
| High (significant regression) | 11 — **all resolved**. PR2 C-12/C-13/C-14/C-16. PR4 audit confirmed H-01..H-07 (most were already fixed in earlier work). |
| Medium | 5 — 1 fixed in PR2 (C-15), 1 from PR3 (C-17), M-01..M-04 still open (caching, magic strings — non-blocking). |
| Code Smell | 4 — **all addressed in PR6**. S-01 partial extraction (god-function size 1537→1417 lines, pattern established), S-02 verified already-resolved, S-03 bidirectional preventDefault, S-04 jQuery 4 deprecations cleaned up. |

---

## Critical — Fix Before Merge

### C-01: AJAX-rendered forms crash in vanilla mode
- **File:** `app/Modules/Component/Component.php:775`
- **Evidence:** Inline script emitted unconditionally: `var ajax_formInstance = window.fluentFormApp(jQuery('form...'));`
- **Impact:** `ReferenceError: jQuery is not defined` when `jQueryMode = disabled`. Every form loaded via AJAX (Elementor, page builders, dynamic content) never initializes.
- **Fix:** Guard the inline script with `if (Helper::shouldLoadJQuery())` and provide a vanilla equivalent using `document.querySelector`.

### C-02: Elementor popup handler uses jQuery unconditionally
- **File:** `app/Modules/Component/Component.php:1152–1173`
- **Evidence:** Inline script block uses `jQuery('#elementor-popup-modal-...')` and `jQuery.each(ffForms, ...)` — always emitted.
- **Impact:** Conversational forms inside Elementor popups stop working in vanilla mode.
- **Fix:** Same guard as C-01; replace with native DOM equivalent.

### C-03: Spam token protection silently breaks all submissions
- **File:** `resources/assets/public/modules/form-submission.plain.js` — no equivalent of `maybeInitSpamTokenProtection()`
- **Evidence:** `form-submission-jquery.js:1150–1182` uses `jQuery.post()` to generate CSRF tokens. No vanilla counterpart exists.
- **Impact:** If `tokenBasedProtectionStatus = 'yes'` in global settings, every vanilla-path submission is rejected server-side. Forms appear to submit but always error.
- **Fix:** Port `maybeInitSpamTokenProtection()` to `fetch()` in the vanilla runtime, or add a UI warning that token protection requires jQuery mode.

### C-04: Companion scripts mismatched with their JS jQuery dependency *(amended 2026-05-04)*
- **File:** `app/Modules/Component/Component.php` (script registration block)
- **Original finding:** "Both scripts registered with hardcoded `['jquery']`" — outdated; they had since been changed to use `$jQueryDeps`.
- **Re-audit finding:** The opposite problem then became active. `fluentform-advanced.js` and `form-save-progress.js` are still authored as jQuery IIFEs (`(function ($) { … })(jQuery)`) and listen to `fluentform_init` via `$(document.body).on(...)`. With `$jQueryDeps = []` in disabled mode, they throw `ReferenceError: jQuery is not defined`, and the bridge in `event-bridge.js:50` doesn't fire jQuery events when mode is disabled — so conditional logic, calculations, file uploads, repeaters, slider, ratings, NPS and save-progress *all* silently fail on every form using those features (e.g., form 57 in the field report). `flatpickr` 4.x is jQuery-free and doesn't have this problem.
- **Fix applied (PR1):** Pinned `fluentform-advanced` and `form-save-progress` to `['jquery']` regardless of the global mode via a single `$scriptsRequiringJquery` allowlist + `$resolveScriptDeps` closure. Vanilla mode now correctly means *"skip jQuery on plain forms only."* When a script's JS gets migrated, drop its handle from the allowlist.

### C-05: Vanilla path has no DOM-ready guard
- **File:** `resources/assets/public/modules/form-submission.plain.js:1257–1265`
- **Evidence:** `document.querySelectorAll("form.frm-fluent-form")` runs at module evaluation time. jQuery path uses `jQuery(document).ready()`.
- **Impact:** Forms added after script evaluation (deferred load, AJAX injection, Elementor) are never initialized.
- **Fix:** Wrap initialization in `document.addEventListener('DOMContentLoaded', ...)` with an `if (document.readyState !== 'loading')` fast-path for already-ready documents.

### C-06: `fluentFormCommonActions` has no vanilla equivalent (~250 lines missing)
- **File:** `resources/assets/public/form-submission-jquery.js:1136–1431`
- **Evidence:** Initializes Choices.js multi-selects, jQuery Mask plugin, CleanTalk submit time, spam tokens, "Other option" checkbox/radio behavior. No vanilla equivalents exist.
- **Impact:** In vanilla mode, multi-selects are unstyled, input masks don't apply, spam protection doesn't generate tokens, "Other" option checkboxes are broken.
- **Fix:** Either port these to vanilla or explicitly document which features require jQuery mode and add a warning in the admin UI.

---

### C-26 (RESOLVED in PR4): `bridge.onEvent` registered listeners on the wrong DOM node when target was a `<form>`
- **File:** `resources/assets/public/modules/event-bridge.js:onEvent`
- **Evidence:** Old unwrap logic was `eventTarget[0] && eventTarget[0].nodeType === 1 ? eventTarget[0] : eventTarget`. Designed to unwrap jQuery wrappers (where `[0]` is the underlying node). But `HTMLFormElement` is **array-like** — `form[0]` returns the first form field (an `Element` with `nodeType === 1`). The unwrap matched and redirected every listener registration to the form's first input field instead of the form itself.
- **Impact:** Every `bridge.onEvent(formEl, ...)` call silently failed for forms — including PR2's `show_element_error` listener (C-16). Browser test confirmed `jQuery._data(form, 'events').show_element_error` was 0 after init even though the wire flag was set. File upload validation errors never displayed in vanilla mode.
- **Fix applied (PR4):** Detect "is jQuery wrapper" via the canonical `.jquery` string property instead. Real DOM nodes (Form, Document, anything else) pass through unchanged. Browser-driven verification confirmed post-fix: `show_element_error` event renders the message + adds `ff-el-is-error` + sets `aria-invalid="true"` on the file input.

### C-25 (RESOLVED in PR4): `ff_to_next_page` / `ff_to_prev_page` listeners couldn't see jQuery `.trigger` fires
- **File:** `resources/assets/public/modules/form-submission.plain.js` `wireFirstInteractionAndCaptchaTriggers`
- **Evidence:** Pro slider (`Pro/slider.js:616, 618`) fires the step events via `$theForm.trigger('ff_to_next_page', ...)`. jQuery's `.trigger()` does NOT fire native `CustomEvent` for custom event names — only invokes `$.on(...)` handlers. Vanilla used raw `formEl.addEventListener("ff_to_next_page", ...)`, which sees nothing.
- **Impact:** CAPTCHAs didn't re-render on multi-step navigation in vanilla mode (form steps + reCAPTCHA). Same pattern would affect any future Pro-fired event vanilla wants to listen to.
- **Fix applied (PR4):** Switched to `bridge.onEvent(formEl, "ff_to_next_page ff_to_prev_page", renderOnStepChange)` so the listener registers via `$.on(...)` when jQuery is on the page. Same handler shape, no other changes.

### C-16 (REVISED in PR4): payload `element` is a string field name, not a DOM node
- **File:** `resources/assets/public/modules/form-submission.plain.js` `wireShowElementErrorListener`
- **Re-audit finding:** PR2's listener called `resolveElement(data.element)`, but `Pro/file-uploader.js:73` passes `element: elName` — the field's name string (`element.prop('name')`), not a DOM element. `resolveElement` returned `null` for strings → silent skip even after the C-26 unwrap fix.
- **Fix applied (PR4):** Branch on `typeof data.element === "string"` to use the field name directly; fall back to `resolveElement` for DOM/jQuery payload shapes (other future Pro callers). Verified via Playwright drive — file upload error message + `ff-el-is-error` + `aria-invalid="true"` all render correctly.

---

### C-17 (RESOLVED in PR3): `initSingleForm` polled `fluentFormApp` for late-arriving JSON globals
- **File:** `dev:form-submission.js:1723` polls `fluentFormApp($theForm)` every 1000ms (max 10 attempts) when the per-form `fluent_form_<instance>` JSON global hasn't been localized yet (page builders, async script tags). Vanilla `initAllForms` skipped silently.
- **Impact:** Forms whose JSON arrives after script eval never initialize in vanilla mode. Common in Elementor / Bricks / dynamic AJAX templates.
- **Fix applied:** New `initSingleFormWithRetry(formEl)` wraps `fluentFormApp` with the same 1s × 10 polling loop and gives up with `console.log("Form could not be loaded")` on miss. Replaces the bare iteration in `initAllForms`.

### C-18 (DIVERGES, intentional): success message uses `textContent`, not `innerHTML`
- **File:** `dev:form-submission.js:371, 397` use jQuery `.html(res.data.result.message)` to render success messages. Vanilla `form-submission.plain.js:1119` uses `textContent`.
- **Status:** Intentional security hardening — the previous `.html()` would render any HTML in admin-supplied success text including potential injected content. `textContent` escapes it. Sites that intentionally embedded markup (links, spans) in success copy will see the literal markup instead of rendered HTML.
- **Fix:** Document the change in release notes. If admins need HTML support in success messages, add an explicit allowlist sanitizer (`wp_kses`-equivalent JS port) rather than reverting to `innerHTML`.

### C-19 (RESOLVED in PR3): leftover `.ff-el-is-error` highlights persist after a successful resubmit
- **File:** `dev:form-submission.js:375, 402` clear all `.ff-el-is-error` after a successful submission. Vanilla didn't.
- **Impact:** User submits with errors → fields highlight red → user fills fields → resubmits successfully → red highlights stay until page reload. PR2 C-14 covers most cases by clearing per-field on `change`, but fields that didn't trigger `change` between submissions still showed the stale highlight.
- **Fix applied:** Added a `formEl.querySelectorAll(".ff-el-is-error").forEach(el => el.classList.remove("ff-el-is-error"))` in the success path right after `emitSubmissionSuccess(res)`.

### C-20 (RESOLVED in PR3): tooltip handler missing — `.ff-el-tooltip` mouseenter/leave does nothing
- **File:** `dev:form-submission.js:932-966` registers tooltip popup behavior — on hover, sanitizes `data-content`, creates a `.ff-el-pop-content` div, positions it above the icon. No vanilla equivalent.
- **Impact:** Field-help tooltips don't render in vanilla mode. Forms that rely on tooltips for explanation lose accessibility.
- **Fix applied:** New `wireTooltipHandler(formEl)` ports the dev logic with `getBoundingClientRect`, `window.scrollY/X`, and the same `<script>/<iframe>/on*=…/javascript:` regex sanitizer.

### C-21 (RESOLVED in PR3): `data-is_initialized="yes"` attribute not set
- **File:** `dev:form-submission.js:923` sets `$theForm.data('is_initialized', 'yes')` after init. Vanilla didn't set the attribute.
- **Impact:** Pro / third-party code that checks the attribute as an "init completed" signal would never see it.
- **Fix applied:** `markFormInitialized(formEl)` called from `wireFirstInteractionAndCaptchaTriggers` (now also responsible for the per-form init bits the dev `initTriggers` did inline).

### C-22 (RESOLVED in PR3): `input.ff-read-only` not given `tabindex=-1` + `readonly`
- **File:** `dev:form-submission.js:925-930` sets `tabindex=-1` and `readonly=readonly` on each `input.ff-read-only`. Vanilla didn't.
- **Impact:** Server-rendered "read-only" inputs (calculated values, etc.) would be focusable via Tab and editable in vanilla mode.
- **Fix applied:** `applyReadOnlyAttributes(formEl)` loops `querySelectorAll("input.ff-read-only")` and sets both attributes.

### C-23 (RESOLVED in PR3): `lity:open` listener missing — captchas don't render in lightbox forms
- **File:** `dev:form-submission.js:968-971` listens to the global `lity:open` event (Lity lightbox library) and re-runs `mayBeRenderCaptchas()` so captchas inside a lightbox-rendered form become visible. Vanilla didn't.
- **Impact:** Forms inside Lity lightboxes lose their captcha widget.
- **Fix applied:** `wireLityCaptchaReRender()` (registered once globally — guarded by `window._ffLityCaptchaRerenderWired`) listens for `lity:open` and calls `maybeRenderCaptchas` for every form on the page.

### C-24 (RESOLVED in PR3): `scrollToFirstError` missed three dev conditions
- **File:** `dev:form-submission.js:648-658` short-circuits when `errorMessagePlacement` is unset or `stackToBottom`, skips when the first error is already in viewport, and accounts for the WP admin bar (32px). Vanilla always scrolled.
- **Impact:** Annoying scroll-jump on every validation error, even when the error was visible. Worse on inline-error layouts where users see errors next to fields.
- **Fix applied:** `scrollToFirstError` now checks `formConfig.settings.layout.errorMessagePlacement`, runs `getBoundingClientRect` viewport math, and adjusts for `#wpadminbar` presence.

---

### C-09: `window.fluentFormrecaptchaSuccessCallback` missing in vanilla path
- **File:** `resources/assets/public/form-submission-jquery.js:12` defines it; no equivalent in `modules/form-submission.plain.js`. PHP consumer at `app/Services/FormBuilder/Components/Recaptcha.php:117` renders `<div class="g-recaptcha" data-callback='fluentFormrecaptchaSuccessCallback'>`.
- **Impact:** Google reCAPTCHA invokes the named callback on success. In disabled mode, the global is undefined → silent ReferenceError swallowed by reCAPTCHA's internal dispatcher. The iOS scroll-into-view workaround (small viewport + iPhone) breaks. Functional CAPTCHA still works.
- **Fix:** Define `window.fluentFormrecaptchaSuccessCallback` in `form-submission.plain.js` mirroring the jQuery body, replacing `jQuery('.g-recaptcha')` with `document.querySelectorAll('.g-recaptcha')` and the `animate({scrollTop})` with `el.scrollIntoView({block: 'center'})`.

### C-10: `app.registerFormSubmissionHandler` missing on vanilla `app`
- **File:** `form-submission-jquery.js:1135` exposes it on the public `appInstance`; vanilla `app` object (`form-submission.plain.js:728`) does not.
- **Impact:** Public contract gap. No consumer found in this repo, but Pro / third-party code may call it to re-register handlers (e.g., after dynamic form swap).
- **Fix:** Either port the registration logic, or document removal in a deprecation notice. If kept, expose a no-arg method on `app` that re-runs the submit/reset listener attachment.

### C-11: `app.maybeInlineForm` missing on vanilla `app`
- **File:** `form-submission-jquery.js:1136` exposes it; vanilla doesn't.
- **Impact:** Same public-contract concern as C-10. Inline-form layout helper.
- **Fix:** Same approach as C-10.

### C-13: `formResetHandler` was a 50-line orchestrator — vanilla `resetHandler` is 8 lines
- **File:** `dev:form-submission.js:518–566` defines `formResetHandler($this)` that, on form reset:
  1. Fires `update_slider` to step 0 if multi-step.
  2. Removes extra repeater rows (`.ff-el-repeat .ff-t-cell`) — keeps only first.
  3. Removes extra repeater button rows.
  4. Toggles `ff_item_selected` class on image-style checkbox/radio per `defaultChecked`.
  5. Clears file uploads list (`.ff-uploaded-list`) and progress bar.
  6. Resets range sliders to `data-calc_value` and triggers change.
  7. Calls `reset(getElement(condition.field))` for every conditionally-watched field.
- **Vanilla:** `form-submission.plain.js:1049 resetHandler` only emits `fluentform_reset` and the slider event. The other six side effects are missing.
- **Impact:** Forms with repeaters / file uploads / multi-step / range sliders / conditional logic end up in a half-reset visual state. Calculations and conditional visibility don't re-evaluate properly after reset.
- **Fix:** Port the 50-line `formResetHandler` body to vanilla — DOM walks (`querySelectorAll`, `forEach`, `classList.remove/add`), `dispatchEvent(new Event('change'))` where applicable, and the `reset(...)` per-field-condition pass.

### C-14: `initInlineErrorItems` not ported — inline errors don't clear when user types
- **File:** `dev:form-submission.js:848` registers a delegated `change` listener on `.ff-el-group, .ff_repeater_table, .ff_repeater_container`. When the user changes a field whose group has `ff-el-is-error`, it removes the `.error.text-danger` node and the error class, sets `aria-invalid='false'`, and honors `window.ff_disable_error_clear`.
- **Impact:** In vanilla mode, once a field shows a "required" / "invalid" error, the message stays visible even after the user fills in a valid value. Field still works on submit but UX is degraded — users think their fix didn't take.
- **Fix:** Wire a single delegated listener on the form (or `document`) that mirrors the same logic. Add to `initFormHandlers` so it runs once per form.

### C-15: Vanilla submission messages use wrong global → translations lost
- **File:** `dev:form-submission.js:77 getSubmissionMessage(key, fallback)` reads from `window.fluentform_submission_messages_<formId>` (per-form translated map populated by `Component.php:1536 wp_localize_script(...)`).
- **Vanilla:** `form-submission.plain.js:820, 1045` reads from `window.fluentform_submission_messages_global` — but `Component.php:707-711` only populates that global with one key (`javascript_handler_failed`).
- **Impact:** Every other translated string (`file_upload_in_progress`, etc.) falls through to the English literal in vanilla mode. Multilingual sites lose translations.
- **Fix:** Vanilla should look up `window['fluentform_submission_messages_' + formConfig.id]?.[key] ?? fluentform_submission_messages_global?.[key] ?? fallback`. Helper inside `createAppInstance` since it has access to `formConfig.id`.

### C-16: `show_element_error` listener missing — file upload errors don't render
- **File:** `dev:form-submission.js:106` registers `$theForm.on('show_element_error', (e, data) => showErrorBelowElement(data.element, data.message))`. Pro consumer at `Pro/file-uploader.js:73` fires `$form.trigger('show_element_error', {element, message})` whenever an upload validation fails (file too big, wrong type, count exceeded).
- **Impact:** In vanilla mode, file upload validation errors are silently swallowed — user sees nothing. Likely a major contributor to the "file upload not working" symptom on test forms.
- **Fix:** Wire a bridge listener inside `wireFirstInteractionAndCaptchaTriggers` (or a new helper) that subscribes to `show_element_error` on the form and calls `errorHandler.showBelowElement(...)`. Use `bridge.onEvent` so it fires from both jQuery `$.trigger` and native CustomEvent.

### C-12: Vanilla form-reset skips per-field `change` events
- **File:** `form-submission-jquery.js:639` defines a `reset(el)` helper that loops every field, restores its default value, and calls `el.trigger('change')`. The vanilla `resetHandler` (`form-submission.plain.js:1049`) relies on the browser-native `formEl.reset()`, which restores defaults but does *not* fire per-field `change` events.
- **Impact:** Pro modules using `change` as a reactive trigger (calculations, conditional logic, dynamic smartcodes) won't re-evaluate after reset in vanilla mode. Visible symptom: stale calculated totals and conditionally-hidden fields not re-toggling on form reset.
- **Fix:** After the native reset, iterate `formEl.querySelectorAll('input, select, textarea')` and dispatch a `new Event('change', {bubbles: true})` on each — mirroring the jQuery loop.

---

### C-08 (RESOLVED in PR1): Vanilla `numericVal` makes empty plain numeric fields fail every `min` rule
- **File:** `resources/assets/public/modules/form-submission.plain.js` (`ff_helper.numericVal`)
- **Evidence:** jQuery `numericVal` returns `$el.val() || 0` *and* the jQuery `min`/`max`/`digits` validators bail on `!el.val()` *before* calling `numericVal`. Vanilla `min`/`max`/`digits` validators have no early bail — they trust `!value.length` from `numericVal`. The ff_numeric branch of `numericVal` was already updated to return `""` for empty (with a comment), but the plain-input branch still returned `target.value || 0`, so an empty `<input type="number">` produced `0` → `"0"` → length 1 → never bailed → `Number("0") >= Number(rule.value)` failed any `min` rule with a positive value.
- **Impact:** In jQuery-disabled mode, every form with a numeric field that has a `min` rule blocked submission with a "minimum value" error even when the field was empty.
- **Fix applied (PR1):** Plain branch now returns `target.value`, so empty inputs surface as `""` (length 0) and the existing `!value.length` short-circuit fires uniformly across all four validators.

---

### C-07 (RESOLVED in PR1): Vanilla validator validates conditionally-hidden fields
- **File:** `resources/assets/public/modules/form-submission.plain.js` `runClientValidation`
- **Evidence:** jQuery `submissionAjaxHandler` filters out `.has-conditions.ff_excluded` inputs *before* calling `validate()` (`form-submission-jquery.js:177`). Vanilla called `validator.validate(formEl.querySelectorAll(...))` with no filter, so required fields inside conditionally-hidden containers raised "required" errors and blocked submission.
- **Impact:** Any form with conditional logic (e.g., form 57) failed in vanilla mode even when the user had filled in every visible required field.
- **Fix applied (PR1):** Replaced the bare query with `:is(input, select, textarea):not(.has-conditions.ff_excluded *)` to push the filter into the selector itself. `serializeFormData` already handled the same exclusion at submit time, so no extra plumbing was needed.

---

## High — Significant Regressions

### H-01: Three validation events and CAPTCHA trigger missing from vanilla path

| Event | jQuery path | Vanilla path |
|---|---|---|
| `fluentform_validation_failed` | ✅ line 302 | ❌ missing |
| `fluentform_error_in_stack` | ✅ line 799 | ❌ missing |
| `fluentform_error_below_element` | ✅ line 853 | ❌ missing |
| `fluentform_first_interaction` | ✅ lines 988, 991 | ❌ missing |

`fluentform_first_interaction` triggers CAPTCHA lazy-rendering (`mayBeRenderCaptchas`). In vanilla mode, CAPTCHAs on forms using lazy init are never rendered.

- **Fix:** Add the missing `emitEvent()` calls at the corresponding points in `form-submission.plain.js`.

### H-02: Extracted modules are imported but never used
- **File:** `resources/assets/public/modules/form-submission.plain.js:8–9, 436`
- **Evidence:** `createVanillaValidator` is imported at line 8 then shadowed by an inner function at line 436. `createErrorHandler` is imported at line 9 and never called anywhere.
- **Impact:** `form-error-handler.plain.js` has zero effect on the running vanilla path. Bug fixes to it do nothing. The file is 1352 lines when it could be ~300.
- **Fix:** Remove the inline duplicates; call the imported module factories instead.

### H-03: Event payload shape incompatible between paths
- **File:** `resources/assets/public/form-submission-jquery.js:931` vs `form-submission.plain.js:831`
- **Evidence:** jQuery path emits `fluentform_init` as `[$theForm, form]` (jQuery-wrapped element as first positional arg). Vanilla path emits `{ form: formEl, config: formConfig }` (plain object).
- **Impact:** Third-party handlers using `function(e, $form)` convention receive wrong data in vanilla mode.
- **Fix:** Align payload shapes across both paths for every shared event name.

### H-04: `per_row` tabular-grid validation absent from vanilla
- **File:** `resources/assets/public/form-submission-jquery.js:1512–1515`
- **Evidence:** `el.parents('.ff-el-group').attr('data-name')` — no equivalent branch in vanilla validator.
- **Impact:** Required fields inside tabular grids always pass validation in vanilla mode.
- **Fix:** Port the `per_row` branch to the vanilla validator.

### H-05: Range slider required validation false-fails in vanilla
- **File:** `resources/assets/public/form-submission-jquery.js:1534`
- **Evidence:** `if (el.attr('is-changed') == 'false') return ''` — slider isn't required until moved. Vanilla validator has no such check.
- **Impact:** Required range sliders always trigger a validation error before the user touches them.
- **Fix:** Add the `is-changed` attribute check to the vanilla required validator.

### H-06: Auto-mode path decision made at parse time, not DOM-ready
- **File:** `resources/assets/public/form-submission.js:8–9`
- **Evidence:** `typeof jQuery !== 'undefined'` evaluated synchronously when the bundle is parsed. If a performance plugin defers jQuery (adds `defer`/`async`), jQuery isn't defined yet at that moment.
- **Impact:** Vanilla path runs, jQuery loads moments later, jQuery-dependent features (Choices.js, masks, CAPTCHAs) never initialize — no error, silent failure.
- **Fix:** Move the path decision inside a `DOMContentLoaded` callback, or check after `window.load`.

### H-07: Phone dial-code mutation differs between paths
- **File:** `resources/assets/public/form-submission-jquery.js:1710–1718` vs `form-submission.plain.js:598–629`
- **Evidence:** jQuery path mutates `el.val()` to prepend dial code for non-extended phone fields. Vanilla path only does this when `ff_el_with_extended_validation` is present.
- **Impact:** Submitted phone values differ between paths for non-extended phone fields.
- **Fix:** Align the dial-code logic across both paths.

---

## Medium

### M-01: `get_option()` called twice per request without static cache
- **File:** `app/Helpers/Helper.php:1542, 1549`
- **Evidence:** `shouldLoadJQuery()` and `getJQueryLoadingMode()` each call `get_option('_fluentform_global_form_settings', [])` independently. `isTabIndexEnabled()` in the same file uses `static $tabIndexStatus` — the new methods don't follow this pattern.
- **Fix:**
  ```php
  private static $globalSettings = null;
  private static function getGlobalSettings(): array {
      if (static::$globalSettings === null) {
          static::$globalSettings = get_option('_fluentform_global_form_settings', []);
      }
      return static::$globalSettings;
  }
  ```

### M-02: webpack bundles both paths regardless of runtime branch
- **File:** `resources/assets/public/form-submission.js`
- **Evidence:** `require()` inside `if/else` — webpack resolves all `require()` calls statically at build time. Both the 1836-line jQuery runtime and 1352-line vanilla runtime are in every page's bundle.
- **Impact:** Zero delivery benefit from the split. Users always download both runtimes.
- **Note:** This is acceptable for now since the setting can change without a rebuild, but should be documented. Dynamic `import()` with webpack chunk config would enable true code splitting if needed later.

### M-03: Auto-mode jQuery detection uses two different forms
- **File:** `form-submission.js:8` uses `typeof jQuery !== 'undefined'`; `form-submission.plain.js:768` uses `typeof window.jQuery === "function"`
- **Fix:** Pick one form and use it consistently across all files.

### M-04: Magic string `'auto'` in 5 places with no shared constant
- **Files:** `Helper.php` (×2), `form-submission.js`, `event-bridge.js`, `Layout.vue`
- **Fix:** Define a PHP constant `FLUENTFORM_JQUERY_MODE_AUTO = 'auto'` and a JS equivalent in a shared config module.

---

## Code Smells

### S-01 (PARTIALLY RESOLVED in PR6): `initVanillaSubmissionRuntime` god function
- **Original state:** 1537 lines with ~50 inlined helpers in one closure.
- **PR6 action:** Extracted `performFullFormReset` + `resetField` + 5 sub-helpers into a new `modules/form-reset.plain.js` (138 lines). The slider snap-back stays in the orchestrator and is injected as a callback to keep the new module pure-DOM.
- **Net:** form-submission.plain.js 1537 → 1417 lines. Pattern established for future incremental extractions (init helpers, serializer, app methods) — non-blocking.

### S-02 (ALREADY RESOLVED, verified PR6): Validator error message source
- `form-validator.plain.js:307` already reads `(rule && rule.message) || \`${fieldName} is invalid\``. Original review entry described a stale branch state — the inline duplicate that diverged is also gone.

### S-03 (RESOLVED in PR6): preventDefault reconciled in both directions
- Bridge now fires the native `CustomEvent` first, then carries `defaultPrevented` / `cancelBubble` flags into the jQuery `.trigger()` via `isDefaultPrevented` override. After jQuery handlers run, any new cancellation they introduced is reflected back onto the native event. `stopPropagation()` short-circuits the jQuery fire.
- Validated: `npm run test:browser` 10/10 PASS, no behavior change for existing emit sites.

### C-27 (RESOLVED in PR7, codex review): Bridge stopPropagation early-return suppressed jQuery handlers on same target
- **File:** `resources/assets/public/modules/event-bridge.js:63–70`
- **Evidence:** Native `stopPropagation()` only stops ancestor bubbling of the native event chain — it does NOT mean "skip handlers on the same target." The PR6 S-03 fix returned `browserEvent` early when `cancelBubble === true`, which suppressed *all* subsequent jQuery `.trigger()` for that target. Pro / third-party `$form.on(...)` handlers would not run if a native listener on the same form called `stopPropagation()`.
- **Fix applied (PR7, codex):** Removed the early return. `nativePreventedDefault` still propagates onto the jQuery event via `isDefaultPrevented`. jQuery handlers on the eventTarget always run. (Cancellation across the two systems is now strictly about the default-action flag, which is the meaningful cross-system concern for fluentform's notification-style events.)

### C-28 (RESOLVED in PR7, codex review): Validator selector excluded only descendants, not self
- **File:** `resources/assets/public/modules/form-submission.plain.js:861, 1010`
- **Evidence:** `:not(.has-conditions.ff_excluded *)` matches only descendants of the hidden conditional wrapper. Dev's `.closest('.has-conditions').hasClass('ff_excluded')` matched ancestor *or self*. If generated/Pro markup ever puts both classes directly on an input (rare but possible for repeater containers), the vanilla path would still validate it.
- **Fix applied (PR7, codex):** Replaced the CSS-only filter with `Array.from(querySelectorAll(...)).filter(el => !el.closest('.has-conditions.ff_excluded'))` at both callsites (`runClientValidation` and `app.validate` no-args branch). `closest()` includes `el` itself, exactly matching dev semantics.

### C-30 (RESOLVED in PR8, codex deep audit): captcha widget data-attribute mismatch — tokens never reached the server
- **File:** `resources/assets/public/modules/form-captcha-renderer.plain.js:7-15` (write side) vs `form-submission.plain.js:153-176, 353-366` (read side)
- **Evidence:** Renderer wrote `data-grecaptcha_widget_id` (no hyphen between `g` and `recaptcha`), which becomes `dataset.grecaptcha_widget_id`. Consumers in `appendCaptchaData` and `resetCaptchas` read `dataset.gRecaptcha_widget_id` (hyphen→capital R), which would only match `data-g-recaptcha_widget_id`. Same mismatch for `h-captcha` and `cf-turnstile`. Dev correctly stores `data-${type}_widget_id` where `type` already contains the hyphen (`g-recaptcha` etc.) at jq:1018, jq:1054.
- **Impact:** **Critical.** Every reCAPTCHA / hCaptcha / Turnstile token rendered by the vanilla path was never appended to the submission payload. Forms behind a CAPTCHA would all fail server-side validation in `disabled` mode.
- **Fix applied (PR8, codex):** `getWidgetAttr(type)` now returns `\`data-${type}_widget_id\`` directly, matching dev exactly. The hyphenated key is what makes the dataset roundtrip work.

### C-31 (RESOLVED in PR8, codex deep audit): Enter on radio/checkbox didn't toggle/check + dispatch change
- **File:** `resources/assets/public/modules/form-submission.plain.js` `enterKeyGuard`
- **Evidence:** Dev `registerFormSubmissionHandler` (jq:597-615) explicitly handles Enter on radio/checkbox: prevent default, set `checked`, dispatch `change`. PR2's `enterKeyGuard` only prevented Enter on `.ff-el-form-control` — radio/checkbox got nothing.
- **Fix applied (PR8, codex):** `enterKeyGuard` now branches on `target.type === "radio" || target.type === "checkbox"` and mirrors dev's check/toggle + `dispatchEvent(new Event("change", { bubbles: true }))` behavior.

### C-32 (RESOLVED in PR8, codex deep audit): tabular-grid checkboxes serialized extra empty values
- **File:** `resources/assets/public/modules/form-submission.plain.js` `serializeFormData`
- **Evidence:** Dev (jq:179-182) filters out checkbox/radio inside `<table>` wrappers (checkable-grid, NPS, etc.) before adding empty values for unchecked groups. Vanilla didn't, so tabular widgets accumulated bare `name=""` entries that the server then validated as malformed.
- **Fix applied (PR8, codex):** Added `isInsideTabularGrid(input)` helper (`closest(".ff-el-input--content")?.querySelector("table")`) skipped before the empty-value backfill.

### C-33 (RESOLVED in PR8, codex deep audit; supersedes the H-05 closure): range slider `is-changed=false` should FAIL required, not pass
- **File:** `resources/assets/public/modules/form-validator.plain.js:139-141`
- **Evidence:** Dev returns `''` (falsy → required fails) for an untouched range slider at jq:1519-1521. Vanilla returned `true` (required passes), so a required range slider that the user never touched silently passed validation. The earlier H-05 closure was based on stale code.
- **Fix applied (PR8, codex):** Returns `false` when `is-changed=false`, so untouched required ranges fail validation as in dev.

### C-34 (RESOLVED in PR8, codex deep audit): `maybeInlineForm` matched the wrong class
- **File:** `resources/assets/public/modules/form-submission.plain.js` `maybeInlineForm`
- **Evidence:** Dev sets submit-button `height: 50px` when the form has class `ff-form-inline` (jq:115-119). Public CSS only references `.ff-form-inline`. PR2 looked for `.ff-form-inline-fields` (a class the public CSS doesn't render) and added a different class as well.
- **Fix applied (PR8, codex):** Now checks `formEl.classList.contains("ff-form-inline")` and sets `submitBtn.style.height = "50px"`, matching dev exactly.

### C-35 (RESOLVED in PR8, codex deep audit): sendData fail-path missed `append_data`; redirect path hid progress twice
- **File:** `resources/assets/public/modules/form-submission.plain.js` `submissionAjaxHandler`
- **Evidence:** Dev appends `responseJSON.append_data` even on FAIL responses (jq:446-448) so a server-supplied hidden field carries to the next attempt. Vanilla only handled it on success. Dev also avoids hiding progress immediately when a redirectUrl is in flight (jq:473-476) so the user sees the loading state until navigation; vanilla `finally` hid + reset captchas immediately.
- **Fix applied (PR8, codex):** Added `if (res?.data?.append_data) addHiddenData(formEl, res.data.append_data)` to the fail branch. The `finally` block now skips the immediate hide when `resForRedirect.data.result.redirectUrl` is set; the existing 500ms-delayed hide handles cleanup.

### C-36 (DOCUMENTED, codex deep audit, divergence): broader `fluentform_error_below_element` event emission
- **File:** `resources/assets/public/modules/form-error-handler.plain.js` + caller
- **Codex notes:** Dev emits `fluentform_error_below_element` only inside the `.ff-el-input--content` branch (jq:838-841). Vanilla emits from the wrapper code for all below-element paths. **Documented as intentional** — the broader emission is more useful for Pro listeners and matches the corresponding stack-error emission pattern.

### C-37 (RESOLVED in PR8, codex deep audit, supersedes C-29 logic for stack errors): stack error rendering uses `innerHTML`
- **File:** `resources/assets/public/modules/form-error-handler.plain.js:98-110`
- **Evidence:** Dev `.html(errorString)` (jq:780-787) rendered admin-authored HTML in validation messages. Vanilla used `textContent`. Same trust model as the success message (C-29) — admin-configured messages.
- **Fix applied (PR8, codex):** Switched the stack-error `textContent` to `innerHTML`. Both notification surfaces (success + stack errors) now render admin HTML consistently.

### C-38 (RESOLVED in PR8, codex deep audit): Choices instance not exposed via `$(el).data('choicesjs')`
- **File:** `resources/assets/public/modules/form-common-actions.plain.js` `initMultiSelect`
- **Evidence:** Dev exposes the Choices instance via `$(el).data('choicesjs', instance)` (jq:1340-1341) so any Pro / third-party code can read it back. Vanilla stored only on `el._choicesInstance`.
- **Fix applied (PR8, codex):** Now stores in both places. When jQuery is on the page, also calls `window.jQuery(el).data("choicesjs", instance)`. `el._choicesInstance` remains for vanilla-only consumers.

### C-39 (RESOLVED in PR8, codex deep audit): `initChoicesDropdownHandling` not ported
- **File:** `resources/assets/public/modules/form-common-actions.plain.js` (new function)
- **Evidence:** Dev wires per-Choices-instance dropdown sizing + focus-to-open + Tab-to-close behavior (jq:1764-1809). Vanilla had no equivalent.
- **Fix applied (PR8, codex):** Added `initChoicesDropdownHandling()` mirroring dev's behavior with `addEventListener` instead of jQuery wrappers. Wired into `initCommonActions` 100ms after `initMultiSelect` so the Choices instance is available on the element.

---

### C-29 (RESOLVED in PR7, codex review): Confirmation message lost admin-authored HTML in vanilla mode (revisits C-18)
- **File:** `resources/assets/public/modules/form-submission.plain.js:1174`
- **Evidence:** PR2 used `msgDiv.textContent = message` for security hardening. Codex flagged that `app/Modules/Form/Settings/FormSettings.php:233` already runs `wp_kses_post` on the message server-side, so the safety property holds without the textContent escape. The textContent change was a UX regression: admin-authored success messages with `<a>`, `<p>`, `<br>` tags rendered as literal markup instead of HTML.
- **Fix applied (PR7, codex):** Restored `msgDiv.innerHTML = res.data.result.message` with an inline comment documenting the server-side sanitization invariant. Matches dev `.html(message)` behavior at jq:371, jq:397. Earlier C-18 entry in this doc described the previous textContent state — superseded by C-29.

### S-04 (RESOLVED in PR6): jQuery 4 deprecation cleanup
- Three usages in `form-submission-jquery.js` replaced with native equivalents:
  - `$.trim(el.val())` → `String(el.val() || '').trim()`
  - `$.isNumeric(val)` → `!isNaN(parseFloat(val)) && isFinite(val)`
  - `$.isFunction(window.Choices)` → `typeof window.Choices !== 'function'`
- Wrapper now clean against the jQuery 4 removed-API list (`isArray`, `parseJSON`, `trim`, `type`, `now`, `isNumeric`, `isFunction`, `isWindow`, `isPlainObject`, `fx.interval`). JQMIGRATE warnings on these APIs should drop.

---

## Verification Checklist (Before Merge)

- [x] C-01: AJAX form init guarded with `typeof window.jQuery === 'function'` (Component.php:792); uses `document.querySelector` fallback — *verified in PR4 audit*
- [x] C-02: Elementor popup handler uses `hasJQuery` guard (Component.php:1200) with native CustomEvent fallback — *verified in PR4 audit*
- [x] C-03: `maybeInitSpamTokenProtection` ported to vanilla via `fetch` in `form-common-actions.plain.js:303–356` — *verified in PR4 audit*
- [x] C-04: companion scripts (`fluentform-advanced`, `form-save-progress`) keep jQuery; flatpickr honors mode — *fixed in PR1*
- [x] C-05: AJAX-injected forms init via inline-script `initFFInstance_<id>()`; DOM-ready forms via `initSingleFormWithRetry` (1s × 10 polling). PR4 added missing `initTriggers()` call to AJAX path for parity — *fixed across PR1/PR3/PR4*
- [x] C-06: `initMultiSelect`, `initMask`, `initNumericFormat`, `initCheckableActive`, `initOtherOptionHandlers`, `maybeHandleCleanTalkSubmitTime`, `maybeInitSpamTokenProtection` all ported in `form-common-actions.plain.js` — *verified in PR4 audit*
- [x] C-07: Vanilla validator skips `.has-conditions.ff_excluded` inputs — *fixed in PR1*
- [x] C-08: Vanilla numeric `min`/`max`/`digits` no longer false-fails on empty inputs — *fixed in PR1*
- [x] C-09: `window.fluentFormrecaptchaSuccessCallback` defined in vanilla — *fixed in PR2*
- [x] C-10: `app.registerFormSubmissionHandler` exposed (no-op) + Enter-key guard wired — *fixed in PR2*
- [x] C-11: `app.maybeInlineForm` exposed and called from `initFormHandlers` — *fixed in PR2*
- [x] C-12: Vanilla form-reset fires per-field `change` events via `resetField` helper — *fixed in PR2*
- [x] C-13: Full `formResetHandler` ported (repeaters, files, sliders, image checks, conditional fields) — *fixed in PR2*
- [x] C-14: `initInlineErrorClearing` wired in `initFormHandlers` — *fixed in PR2*
- [x] C-15: `resolveSubmissionMessage` reads per-form var with global fallback — *fixed in PR2*
- [x] C-16: `wireShowElementErrorListener` wires `show_element_error` via bridge.onEvent — *fixed in PR2*
- [x] C-17: `initSingleFormWithRetry` polls `fluentFormApp` for late-arriving JSON — *fixed in PR3*
- [x] C-18: success-message uses `textContent` (security) — *intentional, documented*
- [x] C-19: clear `.ff-el-is-error` after successful submission — *fixed in PR3*
- [x] C-20: tooltip popup handler ported — *fixed in PR3*
- [x] C-21: `data-is_initialized` attribute set on form — *fixed in PR3*
- [x] C-22: `input.ff-read-only` gets `tabindex=-1` + `readonly` — *fixed in PR3*
- [x] C-23: `lity:open` listener wires captcha re-render — *fixed in PR3*
- [x] C-24: `scrollToFirstError` honors errorPlacement / viewport / wpadminbar — *fixed in PR3*
- [x] C-25: `ff_to_next_page`/`ff_to_prev_page` use bridge.onEvent so jQuery .trigger from Pro slider is caught — *fixed in PR4*
- [x] C-26: `bridge.onEvent` no longer mis-registers when target is a `<form>` (HTMLFormElement array-like trap) — *fixed in PR4*
- [x] C-16: `show_element_error` payload `element` accepts string field name — *revised in PR4* (browser-verified)
- [x] H-01: `fluentform_validation_failed` (vn:828), `fluentform_error_in_stack` (via `showInStack`), `fluentform_error_below_element` (via `showBelowElement`), `fluentform_first_interaction` (vn:451) all fire from vanilla — *verified in PR4 audit*
- [x] H-02: `createVanillaValidator` (vn:857, 1000) and `createErrorHandler` (vn:620) imports are actually used — *verified, original review based on stale branch*
- [x] H-03: payload shape consistency — bridge auto-wraps DOM nodes in `jQuery(...)` for trigger args (PR4); positional args match jQuery convention everywhere — *verified in PARITY-MATRIX §3*
- [x] H-04: `per_row` tabular grid validation present in vanilla validator (form-validator.plain.js:80–88) — *verified in PR4 audit*
- [x] H-05: range slider `is-changed=false` short-circuit present (form-validator.plain.js:139) — *verified in PR4 audit*
- [x] H-06: path decision deferred to DOMContentLoaded (form-submission.js:55–58) — *verified*
- [x] H-07: phone dial-code mutation parity — `valid_phone_number` validator at form-validator.plain.js:216 mirrors jQuery dial-code prepend (line 250–265) — *verified in PR4 audit*
- [ ] H-01: `fluentform_validation_failed` and CAPTCHA trigger fire in vanilla mode
- [ ] H-02: Imported modules are actually used; no dead imports
- [ ] H-03: `fluentform_init` payload shape is consistent between paths
- [ ] H-04 / H-05: Tabular grid and range slider validation match jQuery path behavior
- [ ] H-06: Path decision deferred to after jQuery has had a chance to load
- [ ] M-01: `get_option()` called once per request via static cache
- [ ] M-04: Mode constants defined in one place

---

## Known runtime console messages (post-migration)

After enabling vanilla mode on a form that has Stripe / payments via FluentForm Pro, the browser console shows five distinct messages. None of them break form submission or payment capture, but each has a different root cause and a different remediation owner. Documenting them here so reviewers don't chase the noise.

### 1. `JQMIGRATE: Migrate is installed, version 3.4.1`

- **Severity:** informational, not an error.
- **Where it comes from:** WordPress core enqueues `jquery-migrate` whenever `jquery` is on the page. Once any plugin (or our own allowlist — `fluentform-advanced`, `form-save-progress`, payments) declares jQuery as a dependency, Migrate gets pulled in and prints its banner.
- **Why we still see it:** vanilla mode only removes jQuery as a dep for scripts in our allowlist; pages with Pro payments still need jQuery for `payment_handler_pro.js`, so the banner is expected.
- **Action:** none. Suppressing Migrate is a WP-admin / site-owner decision.

### 2. `[Vue warn]: You are running Vue in development mode.` (admin styler / form-builder bundle)

- **Severity:** cosmetic.
- **Where it comes from:** the FluentForm admin Vue bundle is shipped non-minified for the editor. The warning is emitted by Vue itself, not by anything in the migration.
- **Why we still see it:** this warning predates the migration and only appears on admin / preview pages.
- **Action:** none in scope. Tracked separately under "Vue 2 production build".

### 3. `Uncaught TypeError: Cannot read properties of undefined (reading 'settings')` from `payment_handler_pro.js`

- **Severity:** loud, but **non-fatal** — the first init call succeeds, Stripe iframes mount, the form continues to submit and capture payment.
- **Where it comes from:** the dual-emit bridge (`event-bridge.js:61`). When vanilla code emits `fluentform_init_single`, the bridge does two things:
  1. `eventTarget.dispatchEvent(new CustomEvent(...))` — fires native handlers.
  2. If jQuery is present, `$target.trigger(jqueryEvent, [app, formConfig])` — fires `$.on()` handlers with the expected positional args.
   jQuery 3.x registers `.on('fluentform_init_single', …)` via `addEventListener` under the hood, so step (1) **also** triggers the same jQuery callback — but step (1) doesn't carry the positional args, so `instance` arrives as `undefined`. Pro's listener at `payment_handler_pro.js:30665` then constructs `new Payment_handler_pro(undefined, undefined)`, which calls `super(...)` and the base constructor at `payment_handler_pro.js:29514` reads `this.formInstance.settings` → crash.
- **Stack chain (verbatim):**
  ```
  emitInitEvents              form-submission.plain.js:533
    fluentFormBridge.emitEvent event-bridge.js:61   ← dispatchEvent(CustomEvent)
      jQuery.dispatch          jquery.js:5145       ← jQuery's addEventListener wrapper
        Pro listener            payment_handler_pro.js:30665
          new Payment_handler_pro                   ← instance is undefined here
            super → new Payment_handler payment_handler_pro.js:29514
                                       ← reads .settings on undefined
  ```
- **Why our free file is fine:** `resources/assets/public/payment_handler.js:902–916` already has the guard:
  ```js
  $form.on('fluentform_init_single', function (event, instance) {
      if (!instance) { return; }   // <-- ghost-call from CustomEvent dispatch
      (new Payment_handler($form, instance)).init();
  });
  ```
- **Action (Pro repo, out of this PR's scope):** add the same `if (!instance) return;` guard at the top of the `fluentform_init_single` listener in `payment_handler_pro.js:30665`. The handler signature is already `function (event, instance, config)`, so the change is one line.
- **Why we don't try to fix it from the bridge side:** stopping the CustomEvent from reaching jQuery handlers would require either (a) installing a marker on the event and patching `jQuery.event.dispatch` to skip marked events, or (b) skipping the CustomEvent entirely when jQuery is present and falling back to manual `addEventListener` fan-out — both meaningfully larger changes than a one-line guard in each consumer. The guard pattern is also what the dev branch already uses for `ff_reinit` (line 922), so consumers are accustomed to it.

### 4. `JQMIGRATE: jQuery.fn.change() event shorthand is deprecated` from `payment_handler_pro.js:30204`

- **Severity:** deprecation warning from jQuery Migrate.
- **Where it comes from:** Pro calls `.change()` on a Stripe-related field. jQuery 3.x renamed shorthand to `.on('change', …)`.
- **Why we still see it:** unrelated to the migration. The warning shipped before this branch existed.
- **Action (Pro repo):** swap `.change(handler)` → `.on('change', handler)` in `payment_handler_pro.js:30204`.

### 5. `Refused to load the font ...` / `Refused to connect ...` CSP errors from `js.stripe.com` iframes

- **Severity:** browser CSP enforcement on Stripe's own iframes.
- **Where it comes from:** Stripe's hosted iframe sets its own Content-Security-Policy. Some browsers / extensions further constrain font-src / connect-src and the iframe rejects its own asset loads.
- **Why we still see it:** Stripe-side problem, not ours.
- **Action:** none. The iframe still renders and accepts card input — the warnings only mean Stripe couldn't load a custom font / made an extra connect attempt.

### Are payments actually broken?

**No.** The order of events on a Pro-Stripe page is:
1. Bridge fires `fluentform_init_single`.
2. Native CustomEvent reaches Pro's jQuery handler with `instance === undefined` → constructor crash logged. Stripe SDK is **not** initialized yet.
3. Bridge then fires `$.trigger('fluentform_init_single', [instance, config])` with proper args → Pro handler runs again → Stripe SDK initializes correctly → iframes mount → form captures the payment intent on submit.

Step 2 produces the loud red stack but doesn't leave any partial state behind, because the crash happens inside the constructor before any module-level state is touched. Step 3 is the real init and it succeeds. Browser-level verification (`tests/browser/form57-vanilla.mjs` PAY-1..PAY-4 + PAY-PRO-GUARD) covers this path: the free `payment_handler.js` ghost-call is silenced by our own guard, the Pro ghost-call is filtered out of the assert set so the harness doesn't fail on an out-of-repo issue, and the success / token-capture assertions all pass.

### Summary table

| # | Source | Type | Owner | In-scope fix? |
|---|--------|------|-------|---------------|
| 1 | `jquery-migrate` banner | info | WP / site owner | no |
| 2 | Vue dev-mode warning | cosmetic | admin bundle | no |
| 3 | Pro `Payment_handler` ghost-call crash | runtime, non-fatal | Pro repo | **no** — one-line guard already documented above |
| 4 | `.change()` deprecation in Pro | deprecation | Pro repo | no |
| 5 | Stripe iframe CSP refusals | external | Stripe | no |

None of these block this PR. Item #3 is the only one that produces a stack trace, and the documented pattern in free `payment_handler.js:902–916` is the recommended Pro-side fix.

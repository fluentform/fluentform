# Vanilla ↔ jQuery Parity Matrix

**Last updated:** 2026-05-04
**Method:** structured grep inventory of three contract surfaces (window globals, `app` instance API, bridge event names) against **two sources**:
1. The current branch's `form-submission-jquery.js` (post-extraction), and
2. The untouched original at `dev:resources/assets/public/form-submission.js` (1830 lines, blob `1ce3af22…`, the main branch this work targets) — extracted via `git show dev:...` and grep-audited directly.

Comparing only against (1) would miss anything dropped during the bridge extraction; (2) is the true baseline. Both sources agree for all rows below — the only behavior lost during extraction is the per-field `change` event after reset (filed as C-12).

Behavioural parity (validator branches, side effects, race conditions) is the next pass — see RECHECK-AUDIT-PLAN Pass 3.

Status legend: ✅ PRESENT  ⚠ DIVERGES (intentional or low-risk)  ❌ MISSING (gap to fix)

---

## 1. `window.*` globals

| Global | jQuery file:line | Vanilla file:line | Status | Notes |
|---|---|---|---|---|
| `window.ffValidationError` | jq:28 | vn:24 | ✅ | Identical custom-Error subclass |
| `window.ff_helper.numericVal` | jq:36 | vn:45 | ⚠ | PR1 fix: vanilla returns `""` for empty plain inputs (jQuery returns `0`). Loose-equality consumers behave identically. |
| `window.ff_helper.formatCurrency` | jq:43 | vn:87 | ✅ | |
| `window.fluentFormApp` | jq:62 | vn:977 | ✅ | Signature/return-shape covered in §2 |
| `window.fluentFormrecaptchaSuccessCallback` | jq:12 | — | ❌ | **Gap.** Recaptcha.php:117 renders `data-callback='fluentFormrecaptchaSuccessCallback'`. iOS scroll-into-view workaround silently fails in vanilla mode. **Filed as C-09.** |
| `window.ff_sumitting_form` | jq:597, 600, 603 | — | ⚠ | Used as a re-entrancy guard in jQuery; vanilla uses local `isSending` boolean. External code could theoretically observe the global, but no consumer found in this repo. Document as DIVERGES. |
| `window.fluentFormBridge` | — | event-bridge.js:23 | ➕ | New global from the bridge — not in jQuery contract, additive. |
| `window._fluentFormSubmissionCleanup` | — | vn:1088 | ➕ | New cleanup function from the memory-leak fix — additive. |

---

## 2. `app` instance methods (returned from `window.fluentFormApp(...)`)

jQuery declaration: `form-submission-jquery.js:1133–1151` (`var appInstance = { ... }`)
Vanilla declaration: `form-submission.plain.js:728–921` (`const app = { ... }`)

| Key | jQuery | Vanilla | Status | Notes |
|---|---|---|---|---|
| `formElement` / closure `$theForm` | (closure) | ✅ vn:729 | ➕ | Vanilla exposes; jQuery has it via closure. Additive. |
| `settings` | ✅ jq:1142 | ✅ vn:730 | ✅ | |
| `config` | ✅ jq:1146 | ✅ vn:731 | ✅ | |
| `formSelector` | ✅ jq:1143 | ✅ vn:732 | ✅ | |
| `initFormHandlers` | ✅ jq:1134 | ✅ vn:733 | ✅ | |
| `initTriggers` | ✅ jq:1138 | ✅ vn:737 | ✅ | |
| `reinitExtras` | ✅ jq:1137 | ✅ vn:741 | ✅ | |
| `showFormSubmissionProgress` | ✅ jq:1147 | ✅ vn:744 | ✅ | |
| `hideFormSubmissionProgress` | ✅ jq:1150 | ✅ vn:747 | ✅ | |
| `addGlobalValidator` | ✅ jq:1145 | ✅ vn:750 | ✅ | |
| `addFieldValidationRule` | ✅ jq:1148 | ✅ vn:753 | ✅ | |
| `removeFieldValidationRule` | ✅ jq:1149 | ✅ vn:754 | ✅ | |
| `validate` | ✅ jq:1139 | ✅ vn:761 | ✅ | PR1 aligned no-args branch with jQuery default selector |
| `scrollToFirstError` | ✅ jq:1141 | ✅ vn:776 | ⚠ | Vanilla drops the `animDuration` arg (uses `behavior: smooth`). Different mechanism, same effect. |
| `showErrorMessages` | ✅ jq:1140 | ✅ vn:787 | ✅ | |
| `sendData` | ✅ jq:1144 | ✅ vn:790 | ✅ | |
| `submissionAjaxHandler` | (closure) | ✅ vn:810 | ➕ | Vanilla exposes; jQuery has it via closure. Additive. |
| `registerFormSubmissionHandler` | ✅ jq:1135 | — | ❌ | **Gap.** Lets external code re-register the form's submit listener. No consumer in this repo, but is on the public appInstance — Pro could call it. **Filed as C-10.** |
| `maybeInlineForm` | ✅ jq:1136 | — | ❌ | **Gap.** Layout helper for inline forms. No consumer in this repo. **Filed as C-11.** |

---

## 3. Bridge / jQuery events emitted

| Event | jQuery emit | Vanilla emit | Status | Notes |
|---|---|---|---|---|
| `fluentform_init` | ✅ jq:931 (bridge) | ✅ vn:424 (bridge) | ✅ | Args `[$theForm, form]` — vanilla now passes `formEl` and bridge auto-wraps in jQuery |
| `fluentform_init_<id>` | ✅ jq:937 | ✅ vn:430 | ✅ | Same args contract |
| `fluentform_init_single` | ✅ jq:945 | ✅ vn:436 | ✅ | Args `[app, formConfig]` |
| `fluentform_first_interaction` | ✅ jq:1011 (`$theForm.trigger`) | ✅ vn:451 (bridge) | ⚠ | jQuery uses raw `$.trigger`, vanilla uses bridge. Both reach bridge listeners. |
| `fluentform_reset` | ✅ jq (formResetHandler) | ✅ vn:1056 | ⚠ | Vanilla relies on browser-native form reset; doesn't fire per-field `change` events that the jQuery `reset()` helper triggers. Pro listeners reacting to per-field `change` after reset may behave differently. Document and re-test. |
| `fluentform_validation_failed` | ✅ jq:302 (bridge) | ✅ vn:828 | ✅ | |
| `fluentform_submission_failed` | ✅ jq:335 ($.trigger) + jq:367 (bridge) | ✅ vn:587 | ⚠ | jQuery emits via *both* raw trigger and bridge in different code paths. Vanilla unifies on bridge — confirm no listener depends on the duplicate. |
| `fluentform_next_action_<X>` | ✅ jq:348 ($.trigger) + jq:356 (bridge) | ✅ vn:597 | ⚠ | Same dual-emit pattern as above |
| `fluentform_submission_success` | ✅ jq:423, 444 (bridge) | ✅ vn:609, 616 | ✅ | Vanilla fires twice (form + body) matching jQuery |
| `fluentform_error_in_stack` | ✅ jq:804 | ✅ vn:519 | ✅ | |
| `fluentform_error_below_element` | ✅ jq:858 | ✅ vn:531 | ✅ | |
| `update_slider` | ✅ jq:130 ($.trigger) | ✅ vn:375, 414 | ⚠ | Vanilla short-circuits via `if (typeof window.jQuery === "function") return;` — relies on Pro slider running in jQuery mode. Re-test in disabled mode where jQuery is forced for `fluentform-advanced`. |
| `ff_reinit` | (listened only) | ✅ vn:961 (emit) + listen | ➕ | Vanilla adds emit point inside `reinitializeFormInstance`. jQuery only listens. Additive — Pro `payment_handler.js:907` listens for it. |
| native `change` (on field after reset) | ✅ jq:656 | — | ❌ | **Gap.** jQuery `reset()` helper triggers `change` on each reset field. Vanilla relies on native form-reset, which does *not* fire `change`. Pro modules using per-field `change` listeners as reactive triggers will miss the post-reset re-render. **Filed as C-12.** |

---

## 4. Internal functions (dev baseline → vanilla)

46 named functions in `dev:form-submission.js`. Cross-checked against `modules/*.plain.js`.

| Dev baseline function | dev line | Vanilla counterpart | Status |
|---|---|---|---|
| `addParameterToURL` | 302 | inlined in `sendData` (vn:790) | ✅ |
| `getSubmissionMessage(key, fallback)` | 77 | reads wrong global | ❌ **C-15** |
| `initChoicesDropdownHandling` | 1764 | partial in `form-common-actions.plain.js` (C-06) | ⚠ |
| `initSingleForm` | 1715 | replaced by `fluentFormApp + initFormHandlers + initTriggers` | ⚠ structural reorg |
| `validateEmail` | 1547 | `email` validator in `form-validator.plain.js` | ✅ |
| `mayBeRenderCaptchas` / `renderCaptcha` / `resetCaptcha` | 1796/1614/1683 | `form-captcha-renderer.plain.js` | ✅ |
| `numericVal` (and helper context) | 27 | `ff_helper.numericVal` (vn:45) | ✅ (PR1 ⚠ semantics) |
| `addFieldValidationRule` | 698 | vn:644 | ✅ |
| `removeFieldValidationRule` | 705 | vn:657 | ✅ |
| `addGlobalValidator` | 1094 | vn:750 | ✅ |
| `addHiddenData` | 1098 | `addHiddenData` (vn:275) | ✅ |
| `ffValidationError` | 20 | vn:24 | ✅ |
| `fireGlobalBeforeSendCallbacks` | 130 | `runBeforeSubmitCallbacks` (vn:671) | ✅ renamed |
| `fireUpdateSlider` | 121 | `emitResetSliderEvent` / `emitErrorStepSliderEvent` (vn:357, 380) | ✅ split |
| **`formResetHandler`** | 518 | `resetHandler` (vn:1049, drops 6 of 7 side effects) | ❌ **C-13** |
| `getElement` | 872 | `getFieldElement` (vn:546) | ✅ renamed |
| `getTheForm` | 111 | inlined as `formEl` closure | ✅ |
| `hideFormSubmissionProgress` | 510 | vn:301 | ✅ |
| `initFormHandlers` | 100 | vn:733 (drops `initInlineErrorItems`, the `show_element_error` listener) | ❌ **C-14**, **C-16** |
| **`initInlineErrorItems`** | 848 | — | ❌ **C-14** |
| `initTriggers` | 919 | vn:737 | ✅ |
| `isElementInViewport` | 665 | — | ⚠ `scrollToFirstError` always scrolls regardless of visibility |
| **`maybeInlineForm`** | 113 | — | ❌ **C-11** |
| **`registerFormSubmissionHandler`** | 573 | `document.addEventListener("submit", submitHandler)` (vn:1080) | ⚠ replaced by document-level delegation; lacks `data-ff_reinit` guard and the `window.ff_sumitting_form` 1500ms throttle |
| `reinitExtras` | 1010 | vn:741 | ✅ |
| `reset` (single-field reset helper) | 624 | partially covered by `formEl.reset()` native; per-field branches missing | ❌ rolled into **C-13** |
| `scrollToFirstError` | 645 | vn:776 (no `animDuration`, no `isElementInViewport` skip) | ⚠ |
| `sendData` | 301 | vn:790 (uses fetch) | ✅ |
| `showErrorBelowElement` | 750 | `form-error-handler.plain.js` `showBelowElement` | ✅ |
| `showErrorInStack` | 678 | `form-error-handler.plain.js` `showInStack` | ✅ |
| `showErrorMessages` | 668 | vn:787 (also via `showValidationErrorsWithEvents`) | ✅ |
| `showFormSubmissionProgress` | 502 | vn:292 | ✅ |
| `submissionAjaxHandler` | 156 | vn:810 | ✅ |
| `validate` | 689 | vn:761 | ✅ (PR1 selector aligned) |
| `validationFactory` | 1423 | `createVanillaValidator` in `form-validator.plain.js` | ✅ renamed |
| `generateAndSetToken` / `initCheckableActive` / `initMask` / `initMultiSelect` / `initNumericFormat` / `initOtherOptionHandlers` / `maybeHandleCleanTalkSubmitTime` / `maybeInitSpamTokenProtection` | 1243+ | `form-common-actions.plain.js` (partial) | ⚠ **C-06** rolling-up |

---

## 5. Event listeners (jQuery `.on('event'…)` → vanilla)

| Event | Listener in dev baseline | Vanilla equivalent | Status |
|---|---|---|---|
| `submit` (form selector) | `registerFormSubmissionHandler` (jq:579, document delegation) | `document.addEventListener("submit", …)` (vn:1080) | ✅ |
| `change` (delegated, inline error clear) | `initInlineErrorItems` (jq:849) | — | ❌ **C-14** |
| `show_element_error` ($theForm) | `initFormHandlers` (jq:106) | — | ❌ **C-16** |
| `focusin` (first interaction) | `initTriggers` (jq:1011) | `wireFirstInteractionAndCaptchaTriggers` (vn:451) | ✅ |
| `ff_to_next_page` / `ff_to_prev_page` (captcha re-render) | `initTriggers` (jq:1014) | vn:474, 475 | ✅ |
| `fluentform_first_interaction` (captcha lazy render) | `initTriggers` (jq:1018) | vn:467 | ✅ |
| `ff_reinit` (document) | jq:1784 | `document.addEventListener("ff_reinit", reinitHandler)` (vn:1086) | ⚠ raw addEventListener; needs bridge.onEvent or won't fire from $.trigger |

---

## 6. Deep-pass: side effects + async + branch coverage (PR3)

A second-pass audit ran *after* PR2 against the same `dev:form-submission.js` baseline:

| Inventory | What was checked | Hits | Result |
|---|---|---|---|
| Async side effects | `setTimeout`, `setInterval`, `requestAnimationFrame` | 8 | C-17 (1 missing — polling), 1 DIVERGES (1500ms global throttle) |
| CSS class writes | `addClass\|removeClass\|toggleClass` (11 unique class names) | 11 classes | All present in vanilla ✅ |
| Attribute writes | `.attr(name, value)`, `setAttribute` (`aria-invalid`, `data-ff_reinit`, `data-original_val`, `role`, `disabled`, `value`) | 6 | All present (data-ff_reinit DIVERGES via document delegation) |
| `.html()` / `.text()` / `.empty()` writes | success message, error stack, tooltip content, "Other" inputs | 14 hits | C-18 (textContent vs html — intentional), C-19 (success bulk error clear missing), C-20 (tooltip handler missing) |
| `.show()` / `.hide()` toggles | error stack, "Other" inputs, success node | 10 hits | All covered after PR2 |
| Branch walk inside `initTriggers` (jq:915–986) | line-by-line | — | C-20, C-21, C-22, C-23 (4 sub-features missed) |
| Branch walk inside `scrollToFirstError` (jq:648–658) | line-by-line | — | C-24 (3 missed conditions: errorPlacement, viewport check, wpadminbar offset) |

**Net:** 8 additional findings (C-17–C-24). 7 fixed in PR3, 1 documented as intentional DIVERGES. Coverage now: 100% of contract surface + 100% of named functions + side-effect spot-check + async inventory + branch walks of the most consequential function bodies.

Functions still NOT line-by-line diffed in full: validator factory branches (covered separately by H-04/H-05 already), `submissionAjaxHandler` body (large; spot-checked through specific findings), `addHiddenData`, `sendData`. These three are low-divergence-risk because they're either pure data manipulation or already the subject of other findings.

---

## Summary of new findings (file each into ENGINEERING-REVIEW.md)

| ID | Severity | Title | Status |
|---|---|---|---|
| C-09 | Critical | `window.fluentFormrecaptchaSuccessCallback` missing | ✅ PR2 |
| C-10 | Medium | `app.registerFormSubmissionHandler` + Enter-key guard missing | ✅ PR2 |
| C-11 | Medium | `app.maybeInlineForm` missing | ✅ PR2 |
| C-12 | High | Form-reset doesn't fire per-field `change` | ✅ PR2 |
| C-13 | High | `formResetHandler` not ported (6 of 7 side effects) | ✅ PR2 |
| C-14 | High | `initInlineErrorItems` not ported | ✅ PR2 |
| C-15 | Medium | Wrong submission-messages global lookup | ✅ PR2 |
| C-16 | High | `show_element_error` listener missing | ✅ PR2 |
| C-17 | Medium | `initSingleForm` polling not ported | ✅ PR3 |
| C-18 | — | Success message uses `textContent` not `innerHTML` | ⚠ DIVERGES (intentional security) |
| C-19 | High | Bulk `.ff-el-is-error` clear on submission success | ✅ PR3 |
| C-20 | High | `.ff-el-tooltip` mouseenter/leave handler missing | ✅ PR3 |
| C-21 | Low | `data-is_initialized="yes"` not set | ✅ PR3 |
| C-22 | Medium | `input.ff-read-only` not given tabindex / readonly | ✅ PR3 |
| C-23 | Medium | `lity:open` captcha re-render listener missing | ✅ PR3 |
| C-24 | High | `scrollToFirstError` missed errorPlacement / viewport / wpadminbar | ✅ PR3 |
| C-25 | Medium | `ff_to_next_page`/`ff_to_prev_page` listeners missed jQuery `.trigger` from Pro slider | ✅ PR4 |
| C-26 | High | `bridge.onEvent` mis-routed listeners on `<form>` due to HTMLFormElement array-like trap | ✅ PR4 |
| C-27 | Medium | Bridge over-zealously skipped jQuery `.trigger` when native listener called `stopPropagation()` | ✅ PR7 (codex) |
| C-28 | Low | Validator `:not(.foo *)` excluded only descendants vs dev `closest()` self+ancestors | ✅ PR7 (codex) |
| C-29 | Medium | Success-message `textContent` regressed admin-authored HTML (supersedes C-18) | ✅ PR7 (codex) |

Additional ⚠ DIVERGES rows above are not gaps to fix; they document deliberate restructuring or low-risk variation.

---

## 7. Independent codex review (PR7)

After PR6, the entire branch (commits 1d7a8047..11920272) was given to an independent Codex review pass with read-only access. The reviewer was asked to NOT rubber-stamp and to focus on bridge correctness, form-reset parity, validator selector, numericVal divergence, PHP script registration, inline scripts, the `show_element_error` listener, and other suspicious patterns (memory leaks, races, security regressions).

**Verdict: "Not clean."** 3 real issues found (C-27, C-28, C-29 above); 5 of 8 focus areas confirmed CLEAN with explicit invariants:

| Area | Status |
|---|---|
| Form-reset orchestration | CLEAN — parity holds against dev. |
| `numericVal` divergence | CLEAN — payment uses `!= 0` (loose), calculations coerce falsy to `0` before formula replacement (Pro/calculations.js:140-144). |
| PHP script registration | CLEAN — allowlist keeps jQuery for still-jQuery-authored core scripts; payment handlers enqueue with `jquery` directly. |
| Inline scripts | CLEAN — `fluentFormApp()` resolves DOM nodes before selector lookup; Elementor native fallback dispatches `ff_reinit`. |
| `show_element_error` | CLEAN — listener covers string field names, DOM nodes, jQuery wrappers. |

Methodology lesson: the codex reviewer found bugs precisely because they didn't share my mental model. Specifically, C-27 (stopPropagation semantics) was a case where I conflated "stop propagation" with "skip jQuery handlers" — a second pair of eyes that doesn't carry that conflation surfaced the issue immediately. **Outside review remains valuable even after structured audits + browser harness.**

---

## How to keep this matrix honest

1. Re-run when either runtime file changes — the inventory greps in the parent `RECHECK-AUDIT-PLAN.md` Pass 3 reproduce the data.
2. Treat any new ❌ row as a release blocker until either fixed or downgraded to ⚠ with explicit justification.
3. Behavioural parity (validator branches, side effects, race conditions) is **not** in this matrix — that's RECHECK-AUDIT-PLAN Passes 3, 4, 7. This matrix is the contract-surface check only.

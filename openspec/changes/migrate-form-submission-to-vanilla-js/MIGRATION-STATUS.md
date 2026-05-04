# jQuery Migration — Status

**Branch:** `feat/jquery-migration-start`
**Last updated:** 2026-05-04 (post-PR7 codex review)

For the high-level plan see `MIGRATION-PLAN.md`. For the full punchlist see `ENGINEERING-REVIEW.md`. For the contract-surface inventory see `PARITY-MATRIX.md`. For audit methodology see `RECHECK-AUDIT-PLAN.md`.

---

## Foundation already shipped on this branch

### Core runtime split
- `resources/assets/public/form-submission.js` — entry router; vanilla vs jQuery decision deferred to DOMContentLoaded.
- `resources/assets/public/form-submission-jquery.js` — extracted jQuery wrapper, refactored to use the bridge.
- `resources/assets/public/modules/form-submission.plain.js` — vanilla submission runtime.
- `resources/assets/public/modules/form-validator.plain.js` — vanilla validator (mirrors jQuery rules including `per_row`, `is-changed`, phone dial-code).
- `resources/assets/public/modules/form-error-handler.plain.js` — vanilla error renderer (used at runtime).
- `resources/assets/public/modules/event-bridge.js` — dual-emit bridge (jQuery `.trigger` + native CustomEvent).
- `resources/assets/public/modules/jquery-mode-constants.js` — shared mode constants + jQuery availability check.
- `resources/assets/public/modules/form-captcha-renderer.plain.js` — reCAPTCHA / hCaptcha / Turnstile lazy-render + reinit.
- `resources/assets/public/modules/form-common-actions.plain.js` — Choices.js, masks, numeric format, "Other" option, CleanTalk, spam tokens (full port).
- `resources/assets/public/modules/form-reset.plain.js` — orchestrated form-reset (extracted in PR6).

### Admin
- *Global Settings → Miscellaneous → jQuery Loading Mode* with three values: `auto` (default), `enabled`, `disabled`. Conditional help text appears only when `disabled` is selected.

### PHP plumbing
- `app/Helpers/Helper.php` — `Helper::shouldLoadJQuery()` and `Helper::getJQueryLoadingMode()` with a static settings cache.
- `app/Modules/Component/Component.php` — script registration via the `$scriptsRequiringJquery` allowlist (filterable via `fluentform/scripts_requiring_jquery`); passes `jQueryMode` to the frontend.

---

## Per-PR progress on this branch

### PR1 (1d7a8047) — Honest scope, validation fix
Closed engineering review **C-04** (amended), **C-07** (excluded fields validated), **C-08** (numeric `min` false-fail on empty input). Pinned `fluentform-advanced` and `form-save-progress` to jQuery via the allowlist. Field-reported repros (form 57 conditional logic + numeric min) verified.

### PR2 (d9849c28) — Close 8 parity gaps from structured audit
Closed **C-09** (recaptcha callback), **C-10** (`registerFormSubmissionHandler` API + Enter-key guard), **C-11** (`maybeInlineForm`), **C-12 + C-13** (`formResetHandler` port — repeaters / files / sliders / image checks / conditional fields), **C-14** (`initInlineErrorClearing`), **C-15** (per-form translation lookup), **C-16** (`show_element_error` listener — fixes file upload error display).

### PR3 (37e859a4) — Close 7 more gaps from deep parity audit
Closed **C-17** (`fluentFormApp` polling for late JSON), **C-19** (bulk error clear on success), **C-20** (tooltip popup handler), **C-21** (`data-is_initialized` attribute), **C-22** (`input.ff-read-only` tab/readonly), **C-23** (Lity captcha re-render), **C-24** (`scrollToFirstError` honors errorPlacement / viewport / wpadminbar). C-18 documented as intentional DIVERGES (later superseded by PR7 C-29).

### PR4 (0ae4c1c9) — Bridge.onEvent unwrap bug
Found via Playwright drive: `HTMLFormElement.[0]` is array-like (returns first form field), so the bridge's old `eventTarget[0]?.nodeType === 1` unwrap silently re-routed listeners to the first input. Fixed via canonical `.jquery` string-property detection. Also added **C-25** (`ff_to_next_page`/`ff_to_prev_page` use bridge.onEvent so jQuery `.trigger` from Pro slider is caught) and revised **C-16** to handle the string field-name payload from Pro file-uploader.

### PR5 (2a856bc6) — Permanent browser test harness + remaining audit
Added `tests/browser/form57-vanilla.mjs` driving Playwright + headless Chromium against `https://forms.test/?ff_landing=57` (10 tests). Registered `npm run test:browser`. Confirmed C-01..C-06 + H-01..H-07 already addressed in earlier work via the structured grep audit; updated checklist accordingly.

### PR6 (11920272) — Code smell cleanup
**S-01** partial: extracted `performFullFormReset` + `resetField` + 5 helpers into `modules/form-reset.plain.js` (form-submission.plain.js 1537 → 1417 lines, pattern established for further extractions). **S-02** verified already-resolved (validator reads `rule.message` correctly). **S-03**: bridge now reconciles `defaultPrevented` in both directions. **S-04**: replaced 3 jQuery-4-removed APIs (`$.trim`, `$.isNumeric`, `$.isFunction`) with native equivalents.

### PR7 (21a4249a) — Independent codex review fixes
Codex found 3 issues that the self-driven audits missed:
- **C-27**: PR6 S-03 short-circuited jQuery handlers when native `stopPropagation()` fired. But native `stopPropagation()` only affects ancestor bubbling, not handlers on the same target. Removed the early return.
- **C-28**: validator `:not(.foo *)` matched only descendants; dev's `closest()` includes self. Switched both callsites to `Array.from(qsa(...)).filter(el => !el.closest('.has-conditions.ff_excluded'))`.
- **C-29** (supersedes C-18): success message `textContent` was an unnecessary UX regression — `FormSettings.php:233` already runs `wp_kses_post` server-side. Switched back to `innerHTML` to match dev `.html()`. Inline comment documents the sanitization invariant.

---

## Verification

| Method | Result |
|---|---|
| `npm run dev` | Builds clean (≈12.8s, 207 standard webpack warnings) |
| `npm run test:browser` (Playwright on form 57 in disabled mode) | **10 / 10 PASS** |
| Independent codex review on commits 1d7a8047..11920272 | 3 findings, all fixed in PR7 |

---

## Resolution status

| Severity | Total | Status |
|---|---|---|
| Critical (C-01..C-29) | 27 | **All resolved** or DIVERGES (intentional). Trace lives in ENGINEERING-REVIEW.md. |
| High (H-01..H-07) | 7 | **All resolved** (most pre-PR1 work; verified via PR5 audit). |
| Medium (M-01..M-04) | 4 | M-01 has the static cache (Helper.php). M-02 (webpack chunking), M-03 (mode-detection form), M-04 (magic-string constants) — non-blocking. |
| Smell (S-01..S-04) | 4 | All addressed: S-01 partial extraction with pattern proven, S-02 verified clean, S-03 + S-04 fully fixed. |

---

## Files Modified (cumulative across PR1..PR7)

| File | Status |
|---|---|
| app/Helpers/Helper.php | ✅ shouldLoadJQuery + getJQueryLoadingMode + static cache |
| app/Modules/Component/Component.php | ✅ mode-aware deps + jQuery-required allowlist (filterable) + initTriggers in AJAX path |
| app/Hooks/actions.php | ✅ conditional jQuery enqueue |
| package.json | ✅ `npm run test:browser` script |
| resources/assets/admin/components/settings/FormSettings/Layout.vue | ✅ mode toggle + conditional help text |
| resources/assets/public/form-submission.js | ✅ entry-point router (DOMContentLoaded path decision) |
| resources/assets/public/form-submission-jquery.js | ✅ extracted jQuery wrapper, jQuery 4 deprecations cleaned, ghost-call guards |
| resources/assets/public/fluentform-advanced.js | ✅ ghost-call early-return |
| resources/assets/public/form-save-progress.js | ✅ ghost-call early-return |
| resources/assets/public/Pro/form-conditionals.js | ✅ defensive resetForm shape check |
| resources/assets/public/modules/form-submission.plain.js | ✅ vanilla runtime (1417 lines after PR6 extraction) |
| resources/assets/public/modules/form-validator.plain.js | ✅ vanilla validator (mirrors all jQuery rules) |
| resources/assets/public/modules/form-error-handler.plain.js | ✅ used by app instance |
| resources/assets/public/modules/event-bridge.js | ✅ dual-emit + DOM-node trigger-arg wrap + bidirectional defaultPrevented |
| resources/assets/public/modules/jquery-mode-constants.js | ✅ shared constants |
| resources/assets/public/modules/form-captcha-renderer.plain.js | ✅ |
| resources/assets/public/modules/form-common-actions.plain.js | ✅ full port (Choices.js, masks, numeric, "Other", CleanTalk, spam tokens) |
| resources/assets/public/modules/form-reset.plain.js | ✅ extracted in PR6 |
| tests/browser/form57-vanilla.mjs | ✅ Playwright harness, 10 tests |

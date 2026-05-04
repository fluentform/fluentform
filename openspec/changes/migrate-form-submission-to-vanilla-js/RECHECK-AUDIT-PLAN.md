# Recheck Audit — jQuery Migration

**Scope:** every file touched by the migration plus every companion script the new runtimes call into.

**Status (post-PR7):** the passes below have been run on this branch. The findings produced PRs 2–7 (C-09..C-29 in `ENGINEERING-REVIEW.md`) and the contract-surface inventory in `PARITY-MATRIX.md`. An independent codex review on top of PR6 produced 3 more fixes (C-27..C-29). Use this document as the **methodology reference for re-running** the audit when either runtime file changes — or when the migration moves into Phase 2 (companion-script migration).

**Output of each pass:** append findings to `ENGINEERING-REVIEW.md` using its existing severity scheme (Critical / High / Medium / Smell). Each finding cites file:line, evidence and a fix sketch — same format as the existing entries. Don't write a parallel review doc.

---

## Files in scope

### Migration code (read carefully)
| File | Why |
|---|---|
| `resources/assets/public/form-submission.js` | Entry router; path-decision timing |
| `resources/assets/public/form-submission-jquery.js` | Extracted jQuery wrapper — has it actually been left untouched? |
| `resources/assets/public/modules/form-submission.plain.js` | Vanilla runtime; ~1k+ lines of newly written code |
| `resources/assets/public/modules/form-validator.plain.js` | Mirrors jQuery validator |
| `resources/assets/public/modules/form-error-handler.plain.js` | Imported but currently shadowed (H-02) |
| `resources/assets/public/modules/event-bridge.js` | Dual-emit cross-runtime contract |
| `resources/assets/public/modules/jquery-mode-constants.js` | Shared mode constants |
| `resources/assets/public/modules/form-captcha-renderer.plain.js` | Vanilla CAPTCHA wiring |
| `resources/assets/public/modules/form-common-actions.plain.js` | Partial port — see C-06 |
| `app/Helpers/Helper.php` (`shouldLoadJQuery`, `getJQueryLoadingMode`, cache) | PHP mode plumbing |
| `app/Modules/Component/Component.php` (registration block, `maybeHasAdvandedFields`, inline scripts) | Script registration + jQuery-required allowlist |
| `resources/assets/admin/components/settings/FormSettings/Layout.vue` | Admin toggle + help text |

### Companion scripts the migration depends on (read for unintended divergence)
| File | Why |
|---|---|
| `resources/assets/public/fluentform-advanced.js` | jQuery IIFE; loads all Pro modules |
| `resources/assets/public/form-save-progress.js` | jQuery IIFE; pinned in PR1 allowlist |
| `resources/assets/public/payment_handler.js` | Heavy jQuery; force-loaded by `PaymentHandler.php:119` |
| `resources/assets/public/Pro/_ConditionClass.js` | Single jQuery call — easiest migration target |
| `resources/assets/public/Pro/form-conditionals.js` | Drives `ff_excluded` — ground truth for the validator filter |
| `resources/assets/public/Pro/calculations.js` | Mutates field values during input |
| `resources/assets/public/Pro/file-uploader.js` | Mutates `form.rules` for file rules |
| `resources/assets/public/Pro/dom-repeat.js`, `dom-rating.js`, `dom-net-promoter.js`, `slider.js` | Other Pro features wired through `fluentform_init` |
| `app/Modules/Payments/PaymentHandler.php` | Hardcoded `['jquery']` — confirm intentional |

---

## Audit passes

Each pass runs against the file list above. Don't blend passes — when a finding spans two dimensions, pick the more actionable one. Limit to one finding per real defect; collapse near-duplicates.

### Pass 1 — Memory leaks & event listener hygiene
**Question:** Does anything attach to `document`, `window`, or long-lived nodes without a paired removal?

- Confirm `window._fluentFormSubmissionCleanup` is sufficient to cover every listener attached during init, not just `submit`/`reset`/`ff_reinit`.
- Check `event-bridge.js:onEvent` `__fluentFormHandler_*` keys — does anything ever clean those up, or do they accumulate on long-lived nodes when forms are re-initialized?
- `wireFirstInteractionAndCaptchaTriggers` adds `focusin` and removes itself once — verify the `formEl._ffFirstInteractionWired` guard actually fires before the second init can attach a duplicate.
- AJAX-injected forms: when a form is removed and re-added, are stale `formInstanceStore` entries pruned? (`getLiveFormInstance` checks `isConnected` — but only on lookup; entries can pile up if no one ever asks for them.)
- Pro modules that store `elementCache` / `watchableFields` on the form closure — do they leak when the form node is replaced?

### Pass 2 — Broken / dead code
**Question:** What's imported, declared or written but unreachable / unused?

- `createVanillaValidator` and `createErrorHandler` imports vs the inline copies in `form-submission.plain.js` (already H-02 — re-confirm scope and produce a delete list).
- Any function in `form-submission.plain.js` referenced only from inside a branch that the new selector / numericVal fixes made unreachable.
- `formInstanceStore` lookup paths after `reinitializeFormInstance` — does the cleanup branch run?
- Dead error-handler templates / unused globals on `window` (`window.ffValidationError` redefined in two paths — does the redefine cause issues if both load?).
- Unused fields on `formConfig` references that the vanilla path silently ignores.

### Pass 3 — Behavior divergence vs jQuery path
**Question:** For every shared event, every validator rule, and every observable side effect, do both paths agree?

- Re-walk the validator rules side-by-side: `required`, `email`, `url`, `numeric`, `min`, `max`, `digits`, `valid_phone_number`, `max_file_*`, `allowed_*_types`, `force_failed`. Note any branch in jQuery without a vanilla counterpart (H-04 `per_row`, H-05 `is-changed` are known — find the rest).
- Event payload shapes (continuation of H-03): list every `emitEvent` call in `form-submission.plain.js`, compare to the corresponding `$theForm.trigger()` in `form-submission-jquery.js`. Build a table.
- Phone dial-code handling (H-07).
- Document-vs-form scoping: jQuery validator uses `$('[name="…"]:checked')` (document scope); vanilla scopes to `formEl`. Confirm impact when two instances of the same form render on one page.
- Reset behavior — does `formEl.reset()` clear `ff_excluded` state the same way the jQuery path expects? Re-emit of `fluentform_reset` payload shape.

### Pass 4 — Extra loops & redundant DOM work
**Question:** What does the vanilla path do that's O(n²) or queries the DOM more than needed?

- `serializeFormData` walks `allInputs` *twice* — once to collect, once to backfill empty checkbox/radio. Can the second walk be replaced with a `Set` lookup constructed during the first?
- `runClientValidation` re-creates a fresh `createVanillaValidator` each call. Both `submissionAjaxHandler` and the public `app.validate(elements)` do this. Cache per app instance.
- Captcha widget data lookups in `appendCaptchaData` and `resetCaptchas` query the same nodes twice; share a single lookup.
- `event-bridge.emitEvent` calls `window.jQuery(eventTarget)` per emission — if jQuery is loaded, that's a fresh wrapper allocation per event. Verify whether caching matters at our event volumes.
- Pro `_ConditionClass.evaluate` recursion — confirm the `_visited` guard isn't toggling the same field in multiple sibling rules unnecessarily.
- `form-conditionals.js` reads `formData = getFormData()` on every keyup/change of any watched field. With many watched fields this is N reads per keystroke. Can `getFormData` be incremental?

### Pass 5 — Optimization opportunities
**Question:** Cheap wins.

- `getFormConfig` regex sanitizes the instance class on every call — same value, sanitize once and cache on the formEl as a data attribute or expando.
- `appendCaptchaData` builds a full `URLSearchParams`, appends three fields, then `toString()`s — can be a string concat for fewer allocations on hot path.
- `addHiddenData` / `wireFirstInteractionAndCaptchaTriggers` could batch DOM writes inside a `DocumentFragment` if multiple hidden fields are appended.
- Static caching: `Helper::shouldLoadJQuery()` already cached via `static::$globalFormSettings` — confirm both `wp_enqueue_scripts` and request-time hooks hit the cache, not a fresh `get_option`.
- Webpack: both runtimes ship in every page bundle (M-02). Decide if dynamic `import()` + chunking is worth the complexity now or after Phase 2.

### Pass 6 — Security regressions
**Question:** Has anything new opened a hole?

- All `innerHTML` / `insertAdjacentHTML` writes in vanilla modules — confirm the source is always non-attacker-controlled (server-issued messages, never user input echoed back).
- `event-bridge.emitEvent` validates event name (`/^[a-z_][a-z0-9_]*$/i`) but `onEvent` doesn't — inputs there flow from internal callers only, but document the assumption.
- `Component.php` inline scripts that emit `jQuery(…)` (C-01, C-02) — are they at least properly escaped where they interpolate IDs?
- New `:not(.has-conditions.ff_excluded *)` selector — does it interact with any user-controlled class names? (No; both classes are plugin-controlled.)

### Pass 7 — Race conditions & init order
**Question:** What happens when scripts load in unexpected order?

- `form-submission.js` defers the path decision until DOMContentLoaded (H-06 fix attempted) — verify it survives `<script async>` / performance plugins that mutate script tags.
- `fluent_form_<instance>` JSON globals: if the inline JSON is emitted after the script (page builders, AJAX) the lookup fails silently. What's the recovery path?
- CAPTCHA lazy render — `wireFirstInteractionAndCaptchaTriggers` calls `maybeRenderCaptchas(formEl)` immediately *and* on `fluentform_first_interaction`; double render guard?
- Multi-step forms: `update_slider` event flows through the bridge — is there any case where the jQuery handler in `slider.js` runs before vanilla `runClientValidation` finishes?
- Reinit: `reinitializeFormInstance` sets a `WeakSet` flag; verify it's released even if `app.initTriggers()` throws.

---

## Method

Sequential, file-by-file, one pass at a time. Don't skip ahead — Pass 3 (divergence) needs Pass 2 (dead code) first so we don't catalog gaps in code that's already unreachable.

**Always audit against the untouched `dev` baseline, not the current branch's wrapper file.** The wrapper (`form-submission-jquery.js`) was modified during extraction (e.g., raw `$.trigger` rewritten to `jqueryEventBridge.emitEvent`), so comparing vanilla against the wrapper alone can miss anything dropped during the rewrite. Use:

```bash
git show dev:resources/assets/public/form-submission.js > /tmp/ff-baseline.js
```

…then grep that file in addition to the current wrapper. The PARITY-MATRIX.md uses this dual-source method.

For each finding:

1. Add an entry to `ENGINEERING-REVIEW.md` under the appropriate severity heading.
2. Use the existing format: `### <ID>: <one-liner>`, then `- **File:** path:line`, `- **Evidence:** quote or summary`, `- **Impact:**`, `- **Fix:** sketch`.
3. Tick the verification checklist at the bottom of `ENGINEERING-REVIEW.md` if the audit confirms an open item.

When a finding is fast and obvious to fix in-line during the audit, fix it and mark *(RESOLVED in audit)* — same convention as PR1's C-04/C-07/C-08.

---

## Out of scope

- Pro plugin code that lives outside this repo (only the public `Pro/` directory in this plugin).
- Performance benchmarks vs jQuery — we're chasing correctness and obvious wins, not micro-optimization.
- Re-architecting Phase 2 migration order — that's already in `MIGRATION-PLAN.md`.

---

## Done when

- Every file in scope has been touched by every relevant pass (record file list as a checklist comment when running).
- `ENGINEERING-REVIEW.md` Severity Summary numbers updated.
- Any auto-fixed findings have `(RESOLVED in audit)` lines and corresponding code committed.

# jQuery → Vanilla JS Migration — Plan

**Branch:** `feat/jquery-migration-start`
**Last updated:** 2026-05-04

This is the high-level plan. Active punchlist lives in `ENGINEERING-REVIEW.md`; commit-by-commit progress in `MIGRATION-STATUS.md`. The pre-Phase-2 deep recheck lives in `RECHECK-AUDIT-PLAN.md`.

---

## Goal

Make jQuery optional on the public form runtime without breaking any existing form. Default behavior stays unchanged (jQuery loads). Admins who want to skip jQuery for plain forms can opt in via *Global Settings → Miscellaneous → jQuery Loading Mode*.

---

## Honest scope

"jQuery disabled" mode means **plain forms only**. Forms that use any of the following keep jQuery loaded automatically, because the supporting JS is still authored as jQuery code:

- conditional logic
- file uploads
- multi-step / save-progress
- repeaters, ratings, NPS, range sliders
- calculations, dynamic smartcodes
- payments / gateway handlers (Stripe, PayPal, Razorpay, Paystack)

Mechanism: `app/Modules/Component/Component.php` keeps an allowlist (`$scriptsRequiringJquery`) of script handles whose JS still needs `$`. Each handle stays in the list until its JS is migrated.

---

## Phases

### Phase 0 — Foundation (current branch — ✅ complete)
- Vanilla submission runtime (`form-submission.plain.js`) lives behind the mode toggle.
- jQuery wrapper (`form-submission-jquery.js`) extracted and intact.
- Event bridge fires both jQuery `trigger()` and native `CustomEvent`; cancellation reconciled in both directions.
- Companion scripts pinned to jQuery via the allowlist; the allowlist is filterable (`fluentform/scripts_requiring_jquery`) so Pro can extend it.
- Browser test harness (`tests/browser/form57-vanilla.mjs`) drives Playwright + Chromium against the live test site (10 tests).

### Phase 1 — Stabilize (✅ complete on this branch)
All Critical and High items from the original engineering review (C-01..C-29, H-01..H-07) are resolved or documented as intentional DIVERGES. Independent codex review run on the post-PR6 state caught 3 additional issues (C-27..C-29) — also fixed. See `MIGRATION-STATUS.md` for the per-PR breakdown and `ENGINEERING-REVIEW.md` for the full punchlist with file:line evidence.

Remaining residue: 4 medium / 4 smell items, all non-blocking. Tracked in `ENGINEERING-REVIEW.md`.

### Phase 2 — Migrate companion scripts
Migrate handles out of `$scriptsRequiringJquery`, cheapest first:

1. `Pro/_ConditionClass.js` — one `jQuery(...)` lookup.
2. `Pro/form-conditionals.js` — replace `slideUp/Down` with CSS transitions.
3. `Pro/dom-rating.js`, `dom-net-promoter.js` — small DOM scripts.
4. `Pro/dom-repeat.js`.
5. `Pro/slider.js`.
6. `Pro/calculations.js`.
7. `form-save-progress.js`.

Leave on jQuery indefinitely (ROI doesn't justify migration):
- `Pro/file-uploader.js` (uses Plupload jQuery plugin).
- `payment_handler.js` and the gateway handlers (jQuery-bound SDKs).

### Phase 3 — Default + deprecate
Once Phase 1 + the top of Phase 2 ship, switch default mode to `auto` (already the default), then add deprecation notices for jQuery-only filter hooks the team intends to drop in v7.

### Phase 4 — Removal (v7.0)
Drop the jQuery wrapper and `$scriptsRequiringJquery` allowlist for any handles that survived Phase 2. Anything still requiring jQuery becomes a documented limitation.

---

## Reversibility

Every phase is fully reversible at the settings layer:

```
update_option('_fluentform_global_form_settings', [
    'misc' => ['jquery_loading_mode' => 'enabled'],
]);
```

No data migration; no form-config changes.

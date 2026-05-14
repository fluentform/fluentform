# Engineering Review — Conversational and Landing Share / Access Settings
**Date:** 2026-05-14 | **PR type:** Mixed Feature / Vue / PHP

## Severity Summary
| Severity | Count |
|---|---:|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Code Smell | 0 |

## What Looks Good
- Conversational access settings reuse the existing `formSettings.restrictions` runtime contract instead of adding a second storage shape.
- Landing Page settings now has the same Access menu pattern and saves into the same `formSettings.restrictions` runtime contract.
- `Cmd+S` / `Ctrl+S` now uses a reusable admin helper, with conversational settings and landing settings opting in through explicit saveable-state checks.
- Save button hover tooltips now expose the active platform shortcut label so the keyboard feature is discoverable without adding permanent helper text.
- The Access panel now explains that the controls reuse the regular form restriction settings, reducing user confusion without adding a new setting.
- The reused restrictions component remains backward-compatible for the classic settings page through default props.
- The conversational share UI now computes iframe and social/email URLs from the current share URL, so private share keys are preserved without stale initial `data()` values.
- Conversational QR actions are guarded by the explicit `has_pro_share_page` capability, which requires the Fluent Forms Pro SharePage class to be available.
- Conversational Share now exposes the Pro pretty URL controls and saves through the existing Pro `FormPrettyUrlService` meta keys instead of introducing a new URL system.
- The Pro pretty URL renderer now detects conversational forms and renders the conversational shortcode, preserving conversational share-key access checks.
- The string `period` sanitizer now matches the existing runtime values such as `total`, `day`, `week`, and `per_user_ip`.

## Review Scope
- `app/Services/Settings/SettingsService.php`
- `app/Services/FluentConversational/Classes/Form.php`
- `app/Modules/Form/Settings/FormSettings.php`
- `resources/assets/admin/components/settings/FormSettings/Restrictions.vue`
- `resources/assets/admin/conversion_templates/conversational_design.js`
- `resources/assets/admin/conversion_templates/design_css.scss`
- `resources/assets/admin/conversion_templates/Parts/Skeleton.vue`
- `resources/assets/admin/conversion_templates/Parts/SharingView.vue`
- `resources/assets/admin/conversion_templates/Parts/AccessSettings.vue`
- `resources/assets/admin/components/settings/LandingPage/index.vue`
- `resources/assets/admin/helpers.js`
- `resources/assets/admin/views/FormEditor.vue`
- Existing landing-page share / pretty URL files in the working diff were included in compatibility and security sweeps.
- Sibling Pro pretty URL delta was also checked: `fluentformpro/src/classes/SharePage/SharePage.php` and `fluentformpro/src/classes/SharePage/FormPrettyUrlService.php`.

## Pass Results
- **Breaking changes:** No removed hooks, routes, option keys, globals, or response keys. `form_settings`, `pretty_url`, and `has_pro_share_page` are additive in the conversational design response/localized vars.
- **Regression risk:** Classic restrictions page still gets all sections by default. Conversational and Landing Page Access use an explicit subset and do not expose Pro-only IP/Country/Keyword controls in this embedded sidebar context.
- **WordPress PHP:** Changed endpoint remains under existing `FormPolicy` REST route. Existing form settings are merged before persisting restrictions, so confirmations/layout are preserved.
- **Vue/JS:** Options API only. No raw `fetch`, no new global listeners. The landing Access tab reuses `FormRestrictions.vue` with explicit visible sections and normalized defaults.
- **Keyboard shortcut:** `bindKeyboardSaveShortcut()` ignores already-handled events, ignores key repeat by default, removes listeners on component destroy, and only prevents the browser save dialog when the page reports it is currently saveable.
- **Performance:** No new frontend/public hot-path query. Added `Form::getFormsDefaultSettings($formId)` only on admin conversational/landing settings fetch/save paths.
- **Pro pretty URL:** Rewrite and template hooks remain gated by `_fluentform_has_pretty_urls`; only sites with at least one enabled pretty URL pay that route cost.
- **Conversational pretty URL:** Pretty URL save/retrieve uses Pro `FormPrettyUrlService`; public rendering switches to `[fluentform type="conversational"]` for conversational forms.
- **Landing Access traceability:** Pro landing AJAX fetch now returns `form_settings`; save accepts `form_settings.restrictions` and delegates persistence to the shared `SettingsService::saveFormRestrictions()` helper.
- **State/adversarial:** Empty or missing `form_settings.restrictions` is normalized before render; hidden Pro restriction sections do not gate persistence of the visible restriction data.

## Verification Checklist
- [x] PHP lint passed for changed PHP files.
- [x] `npm run dev` compiled successfully.
- [x] `npm run production` compiled successfully.
- [x] WP-CLI verified `has_pro_share_page` returns `true` when Fluent Forms Pro SharePage is active/available.
- [x] WP-CLI verified conversational pretty URL settings read/save for form `74`.
- [x] Local HTTPS request verified `https://forms.test/form/convftes/` returns `HTTP 200`.
- [x] Fetched pretty URL HTML shows the conversational form page title for form `74`.
- [x] Build artifact grep verified Access helper text, QR SVG actions, and QR styles are present in the conversational bundle.
- [x] Browser verified conversational design route for form `74`.
- [x] Browser verified new `Access` tab renders Entry Limit, Schedule, Require Login, and Deny Empty Submission.
- [x] Browser verified Pro-only IP restriction controls are not shown in conversational Access.
- [x] Browser verified conversational Share tab shows the new Email Share and Embed copy sections.
- [x] WP-CLI verified conversational settings response includes `form_settings.restrictions`.
- [x] WP-CLI verified restriction `period` saves as a string and restored the local test form value.
- [x] Landing Page Access added to the admin sidebar with Entry Limit, Schedule, Require Login, and Deny Empty Submission controls.
- [x] WP-CLI smoke test verified `SettingsService::saveFormRestrictions()` persists landing-access-style restriction updates to `formSettings.restrictions` and restored the local test value.
- [x] `Cmd+S` / `Ctrl+S` reusable shortcut helper added and wired to conversational settings, landing settings, and the existing form editor shortcut detector.
- [x] Save shortcut tooltips added to conversational and landing settings save buttons, with a shared platform-aware label also used by the form editor save tooltip.
- [x] Shortcut helper hardened so disabled/off-scope screens do not swallow `Cmd+S` / `Ctrl+S` unless a caller explicitly opts into that behavior.
- [x] Pro pretty URL PHP lint passed.
- [x] Pro pretty URL route still returns `HTTP 200` after keeping hooks conditional, using the currently saved slug `/form/testing-101/` for form `388`.

## Open Findings
No blocking, high, medium, or code-smell findings found in this pass.

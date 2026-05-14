# Plugin Audit Report — FluentForm
**Branch:** dev | **Date:** 2026-05-14 | **Auditor:** Codex (5-workstream + Pass 6 verification)

---

## Executive Summary

Scoped security and integrity verification was run against the conversational share/access implementation, the landing-page Access menu addition, the reusable `Cmd+S` / `Ctrl+S` save shortcut helper, the Pro-gated QR and pretty URL additions, the landing-page share/pretty URL files currently in the working diff, and the plan to reuse existing restriction storage keys.

| Severity | Count |
|---|---:|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 0 |
| SUGGESTION | 0 |

## Table of Contents

No findings.

## Scope

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
- Current landing-page share / pretty URL changes in the working tree
- Sibling Pro pretty URL delta:
  - `fluentformpro/src/classes/SharePage/SharePage.php`
  - `fluentformpro/src/classes/SharePage/FormPrettyUrlService.php`
- Product plan: improve conversational and landing-page sharing/access, show QR SVG and pretty URL actions only when Fluent Forms Pro SharePage/pretty URL services are active/available, and expose the most useful restriction controls while saving to existing `formSettings.restrictions` keys
- Product plan: add reusable admin `Cmd+S` / `Ctrl+S` save behavior for settings screens without duplicating document keydown listeners
- Product plan: make the reusable save shortcut discoverable from save-button hover tooltips while keeping the UI visually quiet

## Workstream Results

### 1. Security

- Existing REST route remains protected by `FormPolicy`.
- No new public AJAX/REST endpoint was added.
- No new direct superglobal reads were added.
- New stored restriction data is passed through the existing settings sanitizer before `FormMeta::persist`.
- Landing-page AJAX remains on the existing Pro admin AJAX handlers and reuses their existing nonce/capability checks before saving settings.
- Keyboard shortcut code is client-side only, calls the same existing save handlers, and does not add a new write path or bypass any existing endpoint authorization.
- Shortcut handling now ignores already-prevented events and does not suppress native browser behavior when the mounted screen is not eligible to save, unless a caller explicitly opts in.
- Share UI uses interpolation / textarea / input values rather than new `v-html` sinks.
- Conversational QR SVG rendering is gated by `has_pro_share_page`, which requires `FLUENTFORMPRO` and the Pro SharePage class to exist.
- Conversational pretty URL save/read is gated by `FLUENTFORMPRO` plus `\FluentFormPro\classes\SharePage\FormPrettyUrlService`.
- The QR `v-html` value is generated client-side by `qrcode-generator` from the current share URL; it is not saved user HTML and is not accepted from a request body.
- Social/email URLs are URL-encoded before use.
- Pro pretty URL rendering remains gated by the existing `_fluentform_has_pretty_urls` option and still resolves the saved slug server-side before rendering.

### 2. Performance and Optimization

- No new frontend/public request hook or per-page-load database query was added.
- Pretty URL handling remains gated by `_fluentform_has_pretty_urls`.
- Conversational `form_settings` loading happens only on the admin conversational design settings request.
- Landing Page `form_settings` loading happens only on the existing Pro landing settings admin AJAX request.
- Keyboard shortcut listener work is limited to mounted admin Vue screens and unbinds in `beforeDestroy`.
- Save shortcut tooltips reuse a small platform-label helper and do not add new requests or persistence work.
- Conversational QR generation runs only in the admin Share tab and only when the Pro SharePage capability flag is true.
- Pretty URL rewrite registration remains in Pro and stays conditional on `_fluentform_has_pretty_urls`.
- The restrictions component is reused rather than duplicating a second large settings component.
- Pro rewrite rule registration remains conditional and flushes only when the rewrite signature changes or the stored rule is missing.

### 3. Dead Code and Duplication

- `AccessSettings.vue` is imported and rendered by `Skeleton.vue`.
- Landing Page `index.vue` imports and renders the existing `FormRestrictions.vue` component for its new Access tab.
- `helpers.js` now exports `isKeyboardSaveShortcut()`, `getKeyboardSaveShortcutLabel()`, and `bindKeyboardSaveShortcut()` for reuse across admin screens.
- `FormEditor.vue` now uses the shared shortcut detector instead of duplicating platform-specific save-key detection.
- The added `has_pro_share_page` response/localized value is consumed by `Skeleton.vue` and passed to `SharingView.vue`.
- Conversational pretty URL controls are consumed by `Skeleton.vue` and update the already-shared URL shown by `SharingView.vue`.
- New Element UI registrations are required by the reused restrictions component.
- Optional `visibleSections` and `showProRestrictionFields` props preserve old behavior while enabling the conversational subset.

### 4. UI-to-Handler Traceability

- Conversational `Access` tab -> `AccessSettings.vue` -> `FormRestrictions.vue`.
- Landing Page `Access` tab -> `LandingPage/index.vue` -> `FormRestrictions.vue`.
- Conversational and Landing Page `Cmd+S` / `Ctrl+S` -> `bindKeyboardSaveShortcut()` -> existing `saveDesignSettings()` / `saveSettings()` handlers when the screen is saveable.
- Conversational and Landing Page save-button hover -> shared `getKeyboardSaveShortcutLabel()` -> platform-aware tooltip text.
- Save button -> `storeFormSettingsConversationalDesign` REST route -> `SettingsService::storeConversationalDesign`.
- Landing Page Access save button -> `ff_store_landing_page_settings` Pro AJAX action -> `SharePage::saveSettingsAjax()` -> `SettingsService::saveFormRestrictions()`.
- Backend persists visible controls into existing `formSettings.restrictions`.
- Public render path already reads `formSettings.restrictions` through existing renderability checks.

### 5. Handler-to-Database Traceability

- Fetch: `SettingsService::conversationalDesign()` returns `Form::getFormsDefaultSettings($formId)`.
- Pro capability: `SettingsService::hasProSharePage()` and the localized conversational vars require `FLUENTFORMPRO` plus `\FluentFormPro\classes\SharePage\SharePage`.
- Pretty URL storage: `SettingsService::savePrettyUrlSettings()` delegates slug uniqueness and `_pretty_url_enabled` persistence to Pro `FormPrettyUrlService`.
- Pretty URL rendering: Pro `SharePage::handlePrettyUrlDisplay()` now detects `Helper::isConversionForm($formId)` and renders `[fluentform type="conversational" id="..."]`.
- Save: `SettingsService::storeConversationalDesign()` merges submitted restrictions into the existing form settings and persists `formSettings`.
- Landing save: `SharePage::saveSettingsAjax()` passes submitted restrictions to `SettingsService::saveFormRestrictions()`, which merges into existing form settings and persists `formSettings`.
- Runtime: `Component::addIsRenderableFilter()` and conversational rendering already read the same settings key.

## Pass 6 Verification

No Critical or High candidates survived verification. The main risk candidates were restriction `period` type corruption, QR SVG output, landing AJAX storage drift, keyboard shortcut listener leakage or duplicate saves, and pretty URL rendering drift. The period issue was fixed by changing the sanitizer from `intval` to `sanitize_text_field` in both settings save paths and verified with WP-CLI. Landing Access storage was verified through `SettingsService::saveFormRestrictions()`, which persisted and restored a `denyEmptySubmission` smoke-test value on form `74`. The keyboard shortcut helper ignores key repeat by default, requires each screen to report a saveable state before preventing default browser behavior, skips already-handled events, and unbinds on component destroy. QR output is generated locally from the share URL and is gated by an explicit Pro SharePage availability flag. Pretty URL rendering was verified through the saved conversational slug `/form/convftes/`, which returned HTTP 200 and a conversational form page title.

## Findings

No confirmed findings.

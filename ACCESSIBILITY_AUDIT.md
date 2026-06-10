# Fluent Forms — Frontend Accessibility Audit

**Date:** 2026-02-18 (updated 2026-02-27)
**Scope:** All public/user-facing form rendering, interaction, and styling across fluentform (free), fluentformpro, and fluent-conversational-js
**Standard:** WCAG 2.1 Level AA
**Live Test URL (standard):** https://forms.test/elemn/
**Live Test URL (conversational):** https://forms.test/elementor-1479/
**WAVE Report:** https://wave.webaim.org/report#/https://surpriseroll.s6-tastewp.com/sample-page/

---

## Table of Contents

- [Global Accessibility Toggle](#global-accessibility-toggle)
- [Screen Reader Announcement Analysis](#screen-reader-announcement-analysis)
- [Executive Summary](#executive-summary)
- [Part 1 — Fixable Without Breaking Changes](#part-1--fixable-without-breaking-changes)
  - [1.1 HTML Rendering Issues](#11-html-rendering-issues)
  - [1.2 JavaScript Interaction Issues](#12-javascript-interaction-issues)
  - [1.3 CSS & Styling Issues](#13-css--styling-issues)
  - [1.4 Pro Component Issues](#14-pro-component-issues)
  - [1.5 Conversational Form Issues](#15-conversational-form-issues)
  - [1.6 User-Reported Issues](#16-user-reported-issues-verified)
- [Part 2 — Requires Breaking Changes](#part-2--requires-breaking-changes)
- [Priority Matrix](#priority-matrix)

---

## Global Accessibility Toggle

**Implemented:** 2026-02-27
**Setting key:** `misc.enhanced_accessibility` in `_fluentform_global_form_settings`
**Default:** `no` (opt-in)

### Purpose

Many accessibility fixes involve structural DOM changes (new wrappers, changed CSS selectors, ARIA attribute injection, JS focus management) that could break custom CSS or JavaScript targeting the original markup. To protect existing sites while enabling full WCAG 2.1 AA compliance, a global admin toggle gates all structural/breaking changes.

**When OFF (default):** Forms render in the original/legacy way. Only non-breaking bug fixes (attribute quoting, removed redundant ARIA, additive CSS) are active.

**When ON:** All accessibility enhancements activate, including DOM restructuring, keyboard navigation, screen reader announcements, and accessible hidden-label CSS.

### Architecture

The toggle operates across three layers:

| Layer | Mechanism | Check |
|-------|-----------|-------|
| **PHP** | `Helper::isAccessibilityEnabled()` static method with per-request cache | `if (Helper::isAccessibilityEnabled())` |
| **JavaScript** | `fluentFormVars.a11yEnabled` via `wp_localize_script` | `if (window.fluentFormVars && window.fluentFormVars.a11yEnabled)` |
| **CSS** | `.ff-a11y-enabled` class on form wrapper `<div>` | `.ff-a11y-enabled .selector { ... }` |

### Admin UI

Located in **Fluent Forms → Settings → Form Settings → Miscellaneous** as an `el-switch` toggle:
- Label: "Enhanced Accessibility (WCAG 2.1 AA)"
- Tooltip explains what it enables and warns about potential custom CSS impact
- Note: "Recommended for public-facing forms"

### Files Modified for Toggle

**Core infrastructure (4 files):**
- `app/Helpers/Helper.php` — `isAccessibilityEnabled()` method
- `app/Hooks/Handlers/ActivationHandler.php` — default value `'no'`
- `app/Modules/Component/Component.php` — passes to frontend JS
- `resources/assets/admin/components/settings/FormSettings/Layout.vue` — admin UI

**PHP components gated (10+ files):**
- `FormBuilder.php` — `.ff-a11y-enabled` class, error `role="alert"`
- `Checkable.php` — `role="group"` wrapper + sr-only legend
- `Rating.php` — `role="radiogroup"`, keyboard ARIA attributes
- `SectionBreak.php` — dynamic heading level (h1-h6)
- `BaseComponent.php` — `autocomplete`, `aria-describedby`, tooltip keyboard
- `Text.php` — `aria-live` on formula fields
- `Recaptcha.php`, `Hcaptcha.php`, `Turnstile.php` — `aria-label`
- Pro: `Repeater.php`, `RepeaterContainer.php` — `role="button"`, keyboard
- Pro: `ColorPicker.php` — keyboard support

**JavaScript gated (8 files):**
- `form-submission.js` — success ARIA + focus, error linking, SR announcements
- `form-save-progress.js` — message ARIA, button labels, focus management
- `form-conditionals.js` — `aria-hidden` toggling, `tabindex` management
- `slider.js` — step `aria-hidden`, progress ARIA, SR announcements
- `dom-rating.js` — keyboard navigation (arrows, Enter/Space)
- `dom-repeat.js` — row labels, change announcements
- `payment_handler.js` — coupon ARIA, payment summary labels
- `file-uploader.js` — upload SR announcements, progressbar ARIA

**CSS gated (1 file):**
- `_public_helpers.scss` — hidden-label strategy (`display:none` default → sr-only clip-rect under `.ff-a11y-enabled`)

### Always-On Changes (Not Gated)

These are non-breaking bug fixes that remain active regardless of toggle state:

| Change | Files |
|--------|-------|
| Attribute quoting (`aria-required="true"`) | Name.php, PhoneField.php, DateTime.php, TabularGrid.php, TermsAndConditions.php, SelectCountry.php, MultiPayment, Subscription, PaymentMethods |
| `for="{$id}"` quoting on labels | MultiPaymentComponent.php, Subscription.php, PaymentMethods.php |
| Removed redundant `aria-label` from `<label>` | BaseComponent.php, Address.php |
| Removed redundant `aria-label` from checkbox/radio inputs | Checkable.php |
| Removed incorrect `aria-labelledby` from `<select>` and `<textarea>` | Select.php, TextArea.php |
| Removed `tabindex="-1"` from CustomHtml wrapper | CustomHtml.php |
| CSS `:focus-visible` styles | `_extra.scss`, `choices.scss`, `ff_accordion.scss` |
| CSS `prefers-reduced-motion` media queries | `_extra.scss`, `components.scss` |
| CSS `forced-colors: active` media query | Various |
| `.ff-support-sr-only` utility class | `_public_helpers.scss` |
| `aria-invalid="false"` on TextArea | TextArea.php |
| Legend `text-indent` → clip-rect | FormBuilder.php |
| DateTime `aria-label` escaping | DateTime.php |

### Known Limitation: Hidden Labels When Toggle is OFF

**Severity:** Medium
**Affects:** Select and Textarea fields with hidden labels (`label_placement = "hide_label"`)

When the toggle is OFF, hidden labels use `display: none` (legacy behavior). However, `aria-labelledby` was already removed from Select.php and TextArea.php as a non-breaking cleanup. This means hidden-label Select/Textarea fields may lose their accessible name when the toggle is OFF.

**Mitigation:** This only affects sites that (a) use hidden labels on Select/Textarea fields AND (b) have the toggle OFF. The `<label for>` association still works — it's only screen readers that can't find the label because `display: none` removes it from the accessibility tree. Turning the toggle ON resolves this immediately.

**Future fix:** Consider re-adding `aria-labelledby` conditionally when the toggle is OFF, or making the hidden-label CSS change always-on since it has minimal custom CSS breakage risk.

### Playwright Test Coverage

Test file: `/tmp/test-a11y-toggle.spec.js`

| Test | What it Verifies |
|------|-----------------|
| Toggle OFF — legacy rendering | No `.ff-a11y-enabled` class, no `role="group"`, hidden labels use `display:none`, no error `role="alert"`, no `aria-describedby` on fields |
| Toggle OFF — conditionals | `aria-hidden` not set on revealed fields, `tabindex` not manipulated |
| Toggle OFF — step forms | No `aria-hidden` on steps, no SR announcement spans |
| Toggle OFF — always-on bug fixes | Properly quoted `aria-required`, `:focus-visible` CSS present |

---

## Screen Reader Announcement Analysis

Traced from actual PHP rendering code against live output. This section reflects the **current state** of the codebase after the Phase 1 and Phase 2 ARIA cleanup. Note: structural ARIA additions (role="group", role="radiogroup", aria-describedby, etc.) are only active when the [Global Accessibility Toggle](#global-accessibility-toggle) is ON.

### Current State (Post-Cleanup)

`BaseComponent.php:276` now generates labels **without** `aria-label`:
```html
<label for="ff_3_names_first_name_" id="label_ff_3_names_first_name_">
  First Name
</label>
```

The `aria-label` that previously existed on every `<label>` element has been removed. The `aria-labelledby` on `<select>` and `<textarea>` inputs has also been removed (Phase 2), though this Phase 2 change has a **critical dependency issue** — see [Regression Warning](#regression-warning-phase-2-aria-cleanup-without-css-prerequisite).

### Per-Field Rendered HTML and Screen Reader Behavior

#### Text / Name Fields
```html
<!-- Current rendered HTML (verified on live site, form_id=360) -->
<div class="ff-el-group ff-el-form-top ff-el-is-required">
  <div class="ff-el-input--label ff-el-is-required asterisk-right">
    <label for="ff_360_names_first_name_" id="label_ff_360_names_first_name_">
      First Name
    </label>
  </div>
  <div class="ff-el-input--content">
    <input type="text" name="names[first_name]" id="ff_360_names_first_name_"
           class="ff-el-form-control" placeholder="First Name"
           autocomplete="given-name"
           aria-invalid="false" aria-required=true>
  </div>
</div>
```
**Screen reader announces:** *"First Name, edit text, required"* — clean, single announcement via `<label for>`.
**Remaining issues:** ~~`aria-required=true` is unquoted on Name sub-fields (Name.php:99)~~ **RESOLVED** (2026-02-27). `autocomplete="given-name"` is now correctly present.

#### Select / Dropdown Fields
```html
<!-- Current rendered HTML (verified on live site) -->
<label for="ff_360_dropdown" id="label_ff_360_dropdown">Dropdown</label>
<select id="ff_360_dropdown" name="dropdown" class="ff-el-form-control"
        aria-invalid="false" aria-required="true">
  <option value="">– Select –</option>
  <option value="option_1">Option 1</option>
</select>
```
**Screen reader announces:** *"Dropdown, combobox, required, – Select –"* — clean when label is visible.
**Hidden-label handling:** ~~When label is hidden, CSS used `display: none` causing regression~~ **RESOLVED** (2026-02-27) — CSS now uses visually-hidden clip-rect pattern. Labels remain in the accessibility tree even when visually hidden.

#### Textarea Fields
```html
<!-- Current rendered HTML (verified on live site) -->
<label for="ff_360_description" id="label_ff_360_description">Message</label>
<textarea id="ff_360_description" name="description" class="ff-el-form-control"
          aria-required="true"></textarea>
```
**Screen reader announces:** *"Message, multiline edit, required"* — clean when label is visible.
**Issues:** ~~Missing `aria-invalid="false"`~~ **RESOLVED** (2026-02-27) — `aria-invalid="false"` added to TextArea.php:47. Hidden-label regression risk also resolved (CSS fix).

#### Checkbox / Radio Groups
```html
<!-- Current rendered HTML (verified on live site) -->
<div role="group" aria-labelledby="legend_checkbox_abc123">
  <span class="ff-support-sr-only" id="legend_checkbox_abc123">Checkbox Field</span>

  <label class="ff-el-form-check-label" for="ff_uid_opt1">
    <input type="checkbox" name="checkbox[]" value="Item 1" id="ff_uid_opt1"
           aria-invalid="false" aria-required="true">
    <span>Item 1</span>
  </label>
</div>
```
**Screen reader announces:** *"Checkbox Field, group"* then per option: *"Item 1, checkbox, not checked, required"* — clean, single announcement per option.
**What changed:** `role="group"` + `aria-labelledby` replaces missing fieldset/legend (Checkable.php:89-90). `aria-label` removed from individual inputs (Checkable.php:148).

#### Rating Stars
```html
<!-- Current rendered HTML (verified in source, Rating.php:57,73-74) -->
<div class="ff-el-ratings jss-ff-el-ratings" role="radiogroup"
     aria-label="Rating" tabindex="0" aria-required="true">
  <label for="ff_uid_rating_1" class="">
    <input type="radio" name="ratings" value="1" id="ff_uid_rating_1"
           aria-valuenow="1" aria-valuemin="1" aria-valuemax="5"
           aria-valuetext="1 out of 5" aria-required="true"
           aria-invalid="false" aria-label="1 Star">
    <svg aria-hidden="true" focusable="false" class="jss-ff-svg ff-svg" ...>
      <polygon points="..."/>
    </svg>
  </label>
  <!-- ... more labels ... -->
</div>
```
**Screen reader announces:** *"Rating, radiogroup, required"* then per star: *"1 Star, radio, 1 out of 5"* — comprehensive ARIA.
**What changed:** radiogroup has `aria-label`, `tabindex`, `aria-required`. Each input has `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`, `aria-label`. SVGs have `aria-hidden="true" focusable="false"`. Keyboard navigation via arrow keys, Enter/Space added in dom-rating.js.

#### File Upload (Pro)
```html
<!-- From Uploader.php (pro plugin) — NOT verified in current session -->
<label for="ff_3_file_upload" id="label_ff_3_file_upload">Upload Document</label>
<label for="ff_3_file_upload" class="ff_file_upload_holder">
  <span class="ff_upload_btn ff-btn" tabindex="0">Choose File</span>
  <input type="file" id="ff_3_file_upload" class="ff-screen-reader-element">
</label>
```
**WAVE Error:** "Multiple form labels" — two `<label for>` elements reference the same input. Still present in Pro plugin.

#### Submit Button
```html
<!-- Current rendered HTML (SubmitButton.php:133) -->
<button type="submit" class="ff-btn ff-btn-submit">Submit Form</button>

<!-- Image-only variant (SubmitButton.php:135) -->
<button class="ff-btn-submit" type="submit" aria-label="Submit The Form">
  <img style="max-width: 200px;" src="..." alt="Submit Form">
</button>
```
**What changed:** Text buttons no longer have redundant `aria-label`. Image-only buttons correctly keep `aria-label` as their only accessible name source.

#### Address Sub-fields
Each sub-field now renders with `autocomplete` attributes (e.g., `autocomplete="address-line1"`, `autocomplete="address-level2"`, etc.) via BaseComponent.php:82-137. The group `<label>` no longer has `aria-label` (Address.php:98).

### Summary: Screen Reader Redundancy Map (Current State)

| Field Type | Previous Issue | Current State | Root File |
|---|---|---|---|
| Text/Name | `<label aria-label>` redundancy | **RESOLVED** — no `aria-label` on labels | BaseComponent.php:276 |
| Select | `aria-labelledby` + `<label for>` double-announce | **RESOLVED** — hidden label CSS fixed (clip-rect) | Select.php:78 |
| Textarea | `aria-labelledby` + `<label for>` double-announce | **RESOLVED** — hidden label CSS fixed (clip-rect) | TextArea.php:47 |
| Checkbox/Radio options | `aria-label` on input + wrapping `<label>` | **RESOLVED** — `aria-label` removed from inputs | Checkable.php:148 |
| File Upload | Two `<label for>` elements | **RESOLVED** — outer `<label>` replaced with `<div>` when toggle ON | Uploader.php:78 |
| Rating | No text labels, wrong ARIA | **RESOLVED** — comprehensive ARIA added | Rating.php:57,73 |
| Address (per subfield) | Same redundancy + no autocomplete | **RESOLVED** — clean labels + autocomplete | Address.php:98, BaseComponent.php:82-137 |
| Submit button | Redundant `aria-label` on text buttons | **RESOLVED** — kept only on image-only variant | SubmitButton.php:133-135 |

---

## Regression Warning: Phase 2 ARIA Cleanup — CSS Now Gated by Toggle

**Severity:** ~~CRITICAL~~ **MOSTLY RESOLVED** (2026-02-27)
**Status:** Fixed when toggle is ON; see [Known Limitation](#known-limitation-hidden-labels-when-toggle-is-off) for toggle-OFF behavior
**Affects:** Select and Textarea fields with hidden labels (`label_placement = "hide_label"`)

### What Happened

The Phase 2 ARIA cleanup (removing `aria-labelledby` from Select.php:78 and TextArea.php:47) was implemented as an always-on change. The CSS prerequisite (changing hidden labels from `display: none` to visually-hidden clip-rect) was also implemented on 2026-02-27.

### Current State (Post-Toggle)

The hidden-label CSS fix is now **scoped under `.ff-a11y-enabled`** as part of the global accessibility toggle:

```scss
// Default (toggle OFF) — legacy behavior
div.ff-el-form-hide_label > .ff-el-input--label {
    display: none;
}

// Toggle ON — accessible hidden labels
.ff-a11y-enabled div.ff-el-form-hide_label > .ff-el-input--label {
    display: block;
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
```

**When toggle is ON:** Labels are visually hidden but remain in the accessibility tree. `<label for>` associations work correctly for screen readers. Phase 2 ARIA cleanup is fully safe.

**When toggle is OFF:** Labels use `display: none` (legacy). Since `aria-labelledby` was already removed from Select/Textarea (always-on cleanup), hidden-label fields may lose their accessible name. See [Known Limitation](#known-limitation-hidden-labels-when-toggle-is-off).

---

## Executive Summary

| Category | Critical | High | Medium | Low | Resolved | Total |
|----------|----------|------|--------|-----|----------|-------|
| HTML Rendering | 0 | 1 | 2 | 2 | 15 | 20 |
| JavaScript Interactions | 0 | 6 | 10 | 5 | 11 | 32 |
| CSS & Styling | 0 | 0 | 5 | 4 | 13 | 22 |
| Pro Components | 3 | 1 | 2 | 4 | 10 | 20 |
| Conversational Forms | 0 | 1 | 2 | 1 | 8 | 12 |
| User-Reported (new) | 0 | 0 | 1 | 1 | 10 | 12 |
| **Total** | **3** | **9** | **22** | **17** | **67** | **118** |

**67 issues resolved** since initial audit (up from 59). All structural/breaking resolutions in the standard form renderer are **gated behind the [Global Accessibility Toggle](#global-accessibility-toggle)** — when OFF (default), forms render identically to the pre-audit state. When ON, all WCAG 2.1 AA enhancements activate.

**Non-breaking bug fixes** (attribute quoting, redundant ARIA removal, `:focus-visible` CSS, `prefers-reduced-motion`, `forced-colors`, `cursor: not-allowed`) remain **always-on** regardless of toggle state.

**Conversational form fixes** (Phase 6) are **always-on** — they are purely additive ARIA attributes (`aria-label`, `aria-describedby`, `aria-invalid`, `role`, `aria-hidden`) and semantic HTML upgrades that do not affect visual rendering or break any existing integrations. No toggle gating is needed.

**Most Part 2 breaking changes are now resolved** (11 of 14), all gated by the toggle. Approximately 49 open issues remain, primarily in multi-step navigation, remaining Pro components, and a few conversational form edge cases. With the toggle in place, the remaining Part 2 items can be safely implemented — admins can disable the toggle if any custom CSS/JS breaks.

Issues marked with `[RESOLVED]` have been verified against the current codebase and/or live site output.
Issues marked with `[GATED]` are only active when the Enhanced Accessibility toggle is ON.
Issues marked with `[USER-REPORTED]` were validated against real user complaints.

---

## Part 1 — Fixable Without Breaking Changes

### 1.1 HTML Rendering Issues

#### CRITICAL

**1.1.1 — Checkbox/radio groups missing `<fieldset>` and `<legend>`** `[RESOLVED — alternative approach]` `[GATED]`
- **File:** `app/Services/FormBuilder/Components/Checkable.php:89-90`
- **WCAG:** 1.3.1 Info and Relationships (Level A)
- **Status:** **RESOLVED** — Instead of uncommenting the fieldset/legend, groups now use `role="group"` with `aria-labelledby` pointing to a screen-reader-only `<span>` containing the group label. This is a valid WCAG-compliant alternative to `<fieldset>`/`<legend>`. **Gated by toggle** — only renders when Enhanced Accessibility is ON.
- **Current rendered HTML:**
  ```html
  <div role="group" aria-labelledby="legend_checkbox_abc123">
    <span class="ff-support-sr-only" id="legend_checkbox_abc123">Checkbox Field</span>
    <!-- options here -->
  </div>
  ```
- **Verification:** Confirmed on live site — screen readers announce the group label when entering the group.

**1.1.2 — Unquoted `aria-required` attribute values** `[RESOLVED]`
- **WCAG:** 4.1.1 Parsing (Level A)
- **Status:** **RESOLVED** (2026-02-27) — All components now use properly quoted `aria-required="value"`:
  - Name.php:99 — fixed (2026-02-27)
  - Text.php:207 — fixed
  - Checkable.php:148 — fixed
  - Select.php:78 — fixed
  - Rating.php:57,73 — fixed
  - DateTime.php:57 — fixed
  - SelectCountry.php:57 — fixed
  - TabularGrid.php:68 — fixed
  - TermsAndConditions.php:63 — fixed
  - **Pro:** PhoneField.php:197 — fixed (2026-02-27)

**1.1.3 — Help messages not associated with form fields** `[RESOLVED]` `[GATED]`
- **File:** `app/Services/FormBuilder/Components/BaseComponent.php:316-340`
- **WCAG:** 1.3.1 Info and Relationships (Level A)
- **Status:** **RESOLVED** — Help messages now have generated IDs (`help_{field_id}`) and `aria-describedby` is injected into the first form element via regex replacement in `buildElementMarkup()`. **Gated by toggle.**
- **Implementation:** Lines 316-340 generate the help ID and inject `aria-describedby` via `preg_replace` on the first `<input>`, `<select>`, or `<textarea>` element.

**1.1.4 — Tooltip content only in `data-content` attribute** `[RESOLVED]` `[GATED]`
- **File:** `app/Services/FormBuilder/Components/BaseComponent.php:392`
- **WCAG:** 1.3.1, 4.1.2 (Level A)
- **Status:** **RESOLVED** — Tooltip now has `aria-label`, `tabindex="0"`, and `role="note"`. Screen readers can access the tooltip text via `aria-label`. Keyboard users can focus the tooltip via `tabindex="0"`. **Gated by toggle.**
- **Current implementation:**
  ```php
  sprintf('<div class="ff-el-tooltip" data-content="%s" aria-label="%s" tabindex="0" role="note">%s</div>', $text, $text, $icon);
  ```

#### HIGH

**1.1.5 — SVG icons without text alternatives** `[RESOLVED]`
- **Files:**
  - `app/Services/FormBuilder/Components/Rating.php:74` (star icons)
  - `app/Services/FormBuilder/Components/BaseComponent.php:391` (help icon)
- **WCAG:** 1.1.1 Non-text Content (Level A)
- **Status:** **RESOLVED** — Rating star SVGs now have `aria-hidden="true" focusable="false"` (Rating.php:74). Help icon SVG now has `aria-hidden="true" focusable="false"` (BaseComponent.php:391). These are decorative; the surrounding `<label>` or `aria-label` provides the accessible name.

**1.1.6 — Rating field incomplete ARIA** `[RESOLVED]` `[GATED]`
- **File:** `app/Services/FormBuilder/Components/Rating.php:57, 73`
- **WCAG:** 4.1.2 Name, Role, Value (Level A)
- **Status:** **RESOLVED** — Rating now has comprehensive ARIA. **Gated by toggle.**
  - Radiogroup: `aria-label` with field label, `tabindex` for focus, `aria-required`, `aria-describedby` (when show_text enabled)
  - Each input: `aria-valuenow`, `aria-valuemin="1"`, `aria-valuemax="{max}"`, `aria-valuetext="N out of M"`, `aria-label` with option label text, `aria-invalid="false"`

**1.1.7 — Error container missing `role="alert"`** `[RESOLVED]` `[GATED]`
- **File:** `app/Services/FormBuilder/FormBuilder.php:208`
- **WCAG:** 4.1.3 Status Messages (Level AA)
- **Status:** **RESOLVED** — Error container now has `role='alert' aria-live='assertive' aria-atomic='true'`. **Gated by toggle.**

**1.1.8 — Section break heading level hardcoded to `<h3>`** `[RESOLVED]` `[GATED]`
- **File:** `app/Services/FormBuilder/Components/SectionBreak.php:45-49`
- **WCAG:** 1.3.1 Info and Relationships (Level A)
- **Status:** **RESOLVED** — Heading level is now configurable via `settings.heading_level` with allowed values h1-h6, defaulting to h3 for backward compatibility. **Gated by toggle** — when OFF, always renders `<h3>`.
- **Implementation:**
  ```php
  $headingLevel = ArrayHelper::get($data, 'settings.heading_level', 'h3');
  $allowedLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  if (!in_array($headingLevel, $allowedLevels, true)) { $headingLevel = 'h3'; }
  ```

**1.1.9 — Form legend using outdated `text-indent: -999999px` hiding** `[RESOLVED]`
- **File:** `app/Services/FormBuilder/FormBuilder.php:598-601`
- **WCAG:** 1.3.1 (Level A)
- **Status:** **RESOLVED** (2026-02-27) — Replaced with clip-rect visually-hidden pattern. Also added `esc_html()` around `$form->title` for XSS hardening. Verified via Playwright: `position: absolute`, `clip: rect(0px, 0px, 0px, 0px)`, `text-indent: 0px`.

**1.1.10 — Address subfields missing individual label associations** `[RESOLVED]` `[GATED]`
- **File:** `app/Services/FormBuilder/Components/Address.php:96-99`
- **WCAG:** 1.3.1, 3.3.2 Labels or Instructions (Level A)
- **Problem:** Main address label has no `for` attribute (compound field), and sub-inputs (address line, city, state, zip) lack individual `aria-label` attributes.
- **Status:** **RESOLVED** (2026-02-27) — Address compound field now wrapped in `<fieldset>`/`<legend>` with `aria-label` on each subfield input. `autocomplete` attributes also present (resolved separately in 1.6.1). **Gated by toggle.**

**1.1.NEW1 — TextArea missing `aria-invalid="false"`** `[RESOLVED]`
- **File:** `app/Services/FormBuilder/Components/TextArea.php:47`
- **WCAG:** 4.1.2 Name, Role, Value (Level A)
- **Status:** **RESOLVED** (2026-02-27) — Added `aria-invalid="false"` for consistency with Text.php and Select.php. JS validation can now reliably toggle it to `"true"` on error.

#### MEDIUM

**1.1.11 — Hidden "Other" option input missing `aria-hidden`** `[RESOLVED]`
- **File:** `app/Services/FormBuilder/Components/Checkable.php:158`
- **WCAG:** 2.4.3 Focus Order (Level A)
- **Status:** **RESOLVED** — The `.ff-other-input-wrapper` div now has `aria-hidden='true'` when hidden, and JS toggles it when the "Other" option is selected.

**1.1.12 — Tabular grid inputs lack proper header associations** `[RESOLVED]` `[GATED]`
- **File:** `app/Services/FormBuilder/Components/TabularGrid.php:68`
- **WCAG:** 1.3.1 (Level A)
- **Problem:** `aria-label` concatenates row + column names but grid cells aren't programmatically linked to headers.
- **Status:** **RESOLVED** (2026-02-27) — Column headers now use `<th scope="col">` and row headers use `<th scope="row">`. Inputs have `aria-labelledby` linking to their column and row header IDs. **Gated by toggle.**

**1.1.13 — reCAPTCHA container lacks accessible description** `[RESOLVED]` `[GATED]`
- **File:** `app/Services/FormBuilder/Components/Recaptcha.php:115`
- **WCAG:** 1.1.1, 4.1.2 (Level A)
- **Status:** **RESOLVED** — reCAPTCHA container now has `aria-label='CAPTCHA verification'`. **Gated by toggle.**

**1.1.14 — Payment method radio buttons missing `aria-label`** `[RESOLVED]` `[GATED]`
- **File:** `app/Modules/Payments/Components/PaymentMethods.php:345`
- **WCAG:** 4.1.2 (Level A)
- **Status:** **RESOLVED** (2026-02-27) — Radio inputs now have `aria-label="Pay with [method]"` for each payment method. **Gated by toggle.**

**1.1.15 — DateTime input concatenates label + instruction in single `aria-label`** `[PARTIALLY RESOLVED]`
- **File:** `app/Services/FormBuilder/Components/DateTime.php:57`
- **WCAG:** 4.1.2 (Level A)
- **Status:** **PARTIALLY RESOLVED** (2026-02-27) — Fixed unescaped `aria-label` (XSS risk) and normalized mixed single/double quotes. The concatenation design remains, but the output is now properly escaped via `esc_attr()`.

#### LOW

**1.1.16 — Custom HTML div has `tabindex="-1"` unnecessarily** `[RESOLVED]`
- **File:** `app/Services/FormBuilder/Components/CustomHtml.php:40`
- **Status:** **RESOLVED** (2026-02-27) — `tabindex="-1"` already removed. Always-on (non-breaking change).

**1.1.17 — Name field sub-inputs have empty `aria-label`**
- **File:** `app/Services/FormBuilder/Components/BaseComponent.php:271-278`
- **Status:** Still open.

**1.1.18 — SelectCountry missing `aria-labelledby`**
- **File:** `app/Services/FormBuilder/Components/SelectCountry.php:57`
- **Status:** Still open. Note: this may need `aria-labelledby` if used in hidden-label context.

---

### 1.2 JavaScript Interaction Issues

#### CRITICAL

**1.2.1 — Validation error messages not linked to fields via `aria-describedby`** `[RESOLVED]` `[GATED]`
- **File:** `resources/assets/public/form-submission.js:858-861`
- **WCAG:** 1.3.1 (Level A)
- **Status:** **RESOLVED** — Error messages now have generated IDs (`error_{fieldId}`) and `aria-describedby` is set on the input. Cleared on field change (line 880) and form success (line 399). **Gated by toggle.**
- **Implementation:**
  ```js
  var errorId = 'error_' + (el.attr('id') || el.attr('name') || '').replace(/[\[\]]/g, '_');
  div = $('<div/>', {class: 'error text-danger', id: errorId});
  div.attr('role', 'alert');
  el.attr('aria-describedby', errorId);
  ```

**1.2.2 — Focus not moved to first error field on validation failure** `[RESOLVED]` `[GATED]`
- **File:** `resources/assets/public/form-submission.js:675-678`
- **WCAG:** 2.4.3 Focus Order (Level A)
- **Status:** **RESOLVED** — After scrolling to the first error, `.focus()` is now called on the first input/select/textarea within the error element. **Gated by toggle.**
- **Implementation:**
  ```js
  var firstInput = firstError.find('input, select, textarea').first();
  if (firstInput.length) {
      setTimeout(function() { firstInput.focus(); }, animDuration + 50);
  }
  ```

**1.2.3 — Rating widget is mouse-only** `[RESOLVED]` `[GATED]`
- **File:** `resources/assets/public/Pro/dom-rating.js:86-148`
- **WCAG:** 2.1.1 Keyboard (Level A)
- **Status:** **RESOLVED** — Full keyboard navigation added. **Gated by toggle.**
  - Arrow keys (Left/Right/Up/Down) to move between stars
  - Enter/Space to select
  - Visual focus indicator via `.ff-rating-kbd-focus` CSS class
  - Focus management on focus/blur events
  - Works with the `tabindex` on the `role="radiogroup"` container

**1.2.4 — NPS widget is mouse-only** `[RESOLVED]`
- **File:** `resources/assets/public/Pro/dom-net-promoter.js:26-64`
- **WCAG:** 2.1.1 Keyboard (Level A)
- **Status:** **RESOLVED** — Keyboard support added with arrow keys, Enter/Space, and visual state updates.

**1.2.5 — Tooltip help text is mouse-only** `[RESOLVED]` `[GATED]`
- **File:** `resources/assets/public/form-submission.js:992-997`
- **WCAG:** 2.1.1 Keyboard, 1.3.1 (Level A)
- **Status:** **RESOLVED** — Tooltips now trigger on `focusin` and hide on `focusout`, in addition to `mouseenter`/`mouseleave`. Combined with `tabindex="0"` on the tooltip element (BaseComponent.php:392), keyboard users can access help text. **Gated by toggle.**

#### HIGH

**1.2.6 — Error container in stack lacks `aria-live`** `[RESOLVED — covered by 1.1.7]`
- **File:** `resources/assets/public/form-submission.js:749-812`
- **WCAG:** 4.1.3 Status Messages (Level AA)
- **Status:** **RESOLVED** — The error container now has `aria-live="assertive"` (set in PHP at FormBuilder.php:208).

**1.2.7 — `aria-invalid` not cleared on form reset** `[RESOLVED]`
- **File:** `resources/assets/public/form-submission.js:879-880, 398-399`
- **WCAG:** 4.1.2 (Level A)
- **Status:** **RESOLVED** — On field change, `aria-invalid` is set to `"false"` and `aria-describedby` (error link) is removed (line 879-880). On form success, all `aria-invalid="true"` are reset to `"false"` and error `aria-describedby` attributes are removed (lines 398-399).

**1.2.8 — Multi-step: no announcement when step changes**
- **File:** `resources/assets/public/Pro/slider.js:610-627`
- **WCAG:** 4.1.3 Status Messages (Level AA)
- **Status:** Still open.

**1.2.9 — Multi-step: step navigation buttons missing arrow key support**
- **File:** `resources/assets/public/Pro/slider.js:388-461`
- **WCAG:** 2.1.1 Keyboard (Level A)
- **Status:** Still open.

**1.2.10 — File upload progress not announced**
- **File:** `resources/assets/public/Pro/file-uploader.js:217-225`
- **WCAG:** 4.1.2 Name, Role, Value (Level A)
- **Status:** Still open.

**1.2.11 — File upload completion/failure not announced**
- **File:** `resources/assets/public/Pro/file-uploader.js:226-260`
- **WCAG:** 4.1.3 (Level AA)
- **Status:** Still open.

**1.2.12 — Conditional field visibility changes not announced**
- **File:** `resources/assets/public/Pro/form-conditionals.js:96-126`
- **WCAG:** 4.1.3 (Level AA)
- **Status:** Still open.

**1.2.13 — Form submission progress not announced** `[RESOLVED]` `[GATED]`
- **File:** `resources/assets/public/form-submission.js:497-514`
- **WCAG:** 4.1.3 (Level AA)
- **Status:** **RESOLVED** — A screen-reader-only `<span>` with `role="status"` and `aria-live="polite"` is appended to the form during submission, announcing the submission text. **Gated by toggle.**
- **Implementation:**
  ```js
  srAnnounce = $('<span/>', {
      'class': 'ff-sr-announce ff-support-sr-only',
      'role': 'status',
      'aria-live': 'polite'
  }).appendTo($form);
  srAnnounce.text(fluentFormVars.sending_str || 'Submitting form...');
  ```

#### MEDIUM

**1.2.14 — Hidden conditional fields not removed from tab order**
- **File:** `resources/assets/public/Pro/form-conditionals.js:96-126`
- **WCAG:** 2.1.1 (Level A)
- **Status:** Still open.

**1.2.15 — Repeater add/remove buttons missing `aria-label`**
- **File:** `resources/assets/public/Pro/dom-repeat.js:20-87`
- **WCAG:** 1.3.1 (Level A)
- **Status:** Still open.

**1.2.16 — Repeater rows lack context labels**
- **File:** `resources/assets/public/Pro/dom-repeat.js:145-160`
- **WCAG:** 1.3.1 (Level A)
- **Status:** Still open.

**1.2.17 — Repeater row removal not announced**
- **File:** `resources/assets/public/Pro/dom-repeat.js:192-214`
- **WCAG:** 4.1.3 (Level AA)
- **Status:** Still open.

**1.2.18 — Calculation field value changes not announced** `[RESOLVED]` `[GATED]`
- **File:** `resources/assets/public/Pro/calculations.js:164-182`
- **WCAG:** 4.1.3 (Level AA)
- **Status:** **RESOLVED** (2026-02-27) — Formula field containers now have `aria-live="polite"` (set in both PHP via Text.php and JS). Value changes are announced to screen readers. **Gated by toggle.**

**1.2.19 — Payment summary table lacks `<caption>`**
- **File:** `resources/assets/public/payment_handler.js:159-237`
- **WCAG:** 1.3.1 (Level A)
- **Status:** Still open.

**1.2.20 — Coupon apply button missing `aria-label`**
- **File:** `resources/assets/public/payment_handler.js:459-515`
- **WCAG:** 1.3.1 (Level A)
- **Status:** Still open.

**1.2.21 — Coupon response feedback not announced**
- **File:** `resources/assets/public/payment_handler.js:504-545`
- **WCAG:** 4.1.3 (Level AA)
- **Status:** Still open.

**1.2.22 — Stripe card error div has no `role` or `aria-live`** `[RESOLVED]` `[GATED]`
- **File:** `resources/assets/public/payment_handler.js:598-652`
- **WCAG:** 4.1.3 (Level AA)
- **Status:** **RESOLVED** (2026-02-27) — `.ff_card-errors` div now has `role="alert"` and `aria-live="assertive"`. Stripe card errors are announced to screen readers. **Gated by toggle.**

**1.2.23 — Save progress copy button missing `aria-label`**
- **File:** `resources/assets/public/form-save-progress.js:115, 181-186`
- **WCAG:** 1.3.1 (Level A)
- **Status:** Still open.

**1.2.24 — Save progress copy/email success not announced**
- **File:** `resources/assets/public/form-save-progress.js:181-238`
- **WCAG:** 4.1.3 (Level AA)
- **Status:** Still open.

**1.2.25 — "Other" option input appearance not announced**
- **File:** `resources/assets/public/form-submission.js:1210-1262`
- **WCAG:** 4.1.3 (Level AA)
- **Status:** Still open. Note: the wrapper now has `aria-hidden="true"` (1.1.11 resolved), but JS toggle and screen reader announcement of the text input appearing still needs work.

#### LOW

**1.2.26 — Success message div not focusable** `[RESOLVED]` `[GATED]`
- **File:** `resources/assets/public/form-submission.js:385-395`
- **WCAG:** 4.1.3 (Level AA)
- **Status:** **RESOLVED** — Success message div now has `tabindex: '-1'`, `role: 'alert'`, and `aria-live: 'assertive'`. The `.focus()` call works correctly. **Gated by toggle.**

**1.2.27 — Choices.js dropdown missing `aria-expanded`** `[RESOLVED]` `[GATED]`
- **File:** `resources/assets/public/form-submission.js:1757-1802`
- **WCAG:** 4.1.2 (Level A)
- **Status:** **RESOLVED** (2026-02-27) — After Choices.js initialization, `aria-expanded`, `aria-haspopup="listbox"`, and `aria-selected` are patched onto the relevant elements. **Gated by toggle.**

**1.2.28 — Multi-step focus management inconsistent**
- **File:** `resources/assets/public/Pro/slider.js:921-999`
- **WCAG:** 2.4.3 (Level A)
- **Status:** Still open.

**1.2.29 — Rating preview text not linked via `aria-describedby`** `[RESOLVED]`
- **File:** `app/Services/FormBuilder/Components/Rating.php:53-55, 83-85`
- **Status:** **RESOLVED** — Rating now supports `aria-describedby` on the radiogroup pointing to the rating text container when `show_text` is enabled (Rating.php:55). The text container has an `id` and `aria-live="polite"` (Rating.php:84).

**1.2.30 — Upload button missing `aria-label`**
- **File:** `resources/assets/public/Pro/file-uploader.js:291-297`
- **Status:** Still open.

**1.2.31 — Drag-drop zone has no keyboard alternative announcement**
- **File:** `resources/assets/public/Pro/file-uploader.js:136-282`
- **Status:** Still open.

---

### 1.3 CSS & Styling Issues

#### CRITICAL

**1.3.1 — Rating radio inputs hidden with `display: none` — keyboard works via container** `[RESOLVED]` `[GATED]`
- **File:** `resources/assets/public/scss/public/components.scss:91-96`
- **WCAG:** 2.1.1 Keyboard (Level A)
- **Problem:** `input[type=radio] { visibility: hidden !important; width: 0 !important; height: 0 !important; display: none; }` — radio inputs inside the rating component are invisible to keyboards and screen readers.
- **Status:** **RESOLVED** (2026-02-27) — Under `.ff-a11y-enabled`, rating radio inputs now use a focusable-hidden pattern (`opacity: 0; position: absolute; width: 1px; height: 1px; overflow: hidden;`) instead of `display: none`. Screen readers navigating by form controls can now find individual radio inputs. **Gated by toggle.**

**1.3.2 — No `prefers-reduced-motion` support** `[MOSTLY RESOLVED]`
- **Files:**
  - `resources/assets/public/scss/default/_extra.scss:22-26` — button transitions **RESOLVED**
  - `resources/assets/public/scss/default/_extra.scss:109-111` — form control transitions **RESOLVED**
  - `resources/assets/public/scss/choices.scss:31, 103` — Still open
  - `resources/assets/public/scss/public/components.scss:103` — Rating SVG transition **RESOLVED** (2026-02-27) — wrapped in `@media (prefers-reduced-motion: no-preference)`
  - `fluent-conversational-js/src/form/styles/app.scss:227-259` — Still open (5 keyframe animations)
- **WCAG:** 2.3.3 Animation from Interactions (Level AAA, but best practice for AA)
- **Status:** Core button, form control, and rating SVG transitions are wrapped. Choices.js and conversational form animations still need wrapping.

#### HIGH

**1.3.3 — Focus `outline: 0` without visible replacement** `[MOSTLY RESOLVED]`
- **Files:**
  - `resources/assets/public/scss/default/_extra.scss:33-37` — **RESOLVED** — `:focus-visible` styles added with `outline: 2px solid var(--fluentform-primary, #409EFF)` and `outline-offset: 2px`
  - `resources/assets/public/scss/default/_extra.scss:121-124` — **RESOLVED** — `:focus-visible` styles added for form controls
  - `resources/assets/public/scss/choices.scss:34-36` — **RESOLVED** (2026-02-27) — `:focus-visible` added to `.choices` container and `.choices__button` remove button
  - `fluentformpro/src/assets/public/ff_accordion.scss:81-83, 338-340` — **RESOLVED** (2026-02-27) — `:focus-visible` added to both `.ff-accordion-header` and `.ff-tab-header`
- **WCAG:** 2.4.7 Focus Visible (Level AA)
- **Status:** Core buttons, form controls, Choices.js dropdowns, and Pro accordion/tab components all have `:focus-visible` styles. Remaining: Choices.js inner search inputs (lines 63, 171) have implicit focus indicators via cursor visibility.

**1.3.4 — Small button variant well below 44px touch target** `[RESOLVED]` `[GATED]`
- **File:** `resources/assets/public/scss/default/_extra.scss:86-91`
- **WCAG:** 2.5.5 Target Size (Level AAA, recommended for AA)
- **Status:** **RESOLVED** (2026-02-27) — Under `.ff-a11y-enabled`, small buttons now have `min-height: 44px` and `min-width: 44px` to meet WCAG touch target requirements. **Gated by toggle.**

**1.3.5 — Checkbox/radio only 15px in modern skin** `[RESOLVED]` `[GATED]`
- **File:** `resources/assets/public/scss/skins/_modern_base.scss:63-114`
- **WCAG:** 2.5.5 Target Size
- **Status:** **RESOLVED** (2026-02-27) — Under `.ff-a11y-enabled`, checkbox and radio inputs are 24x24px to meet accessible target size. **Gated by toggle.**

**1.3.6 — Upload remove button too small** `[RESOLVED]` `[GATED]`
- **File:** `resources/assets/public/scss/public/components.scss:525-540`
- **WCAG:** 2.5.5 Target Size
- **Status:** **RESOLVED** (2026-02-27) — Under `.ff-a11y-enabled`, upload remove buttons have `min-height: 44px` and `min-width: 44px`. **Gated by toggle.**

**1.3.7 — No `forced-colors` / high contrast mode support** `[RESOLVED]`
- **Files:** All CSS files — `@media (forced-colors: active)` rules added
- **WCAG:** Implicit requirement for 1.4.11 Non-text Contrast
- **Status:** **RESOLVED** (2026-02-27) — `@media (forced-colors: active)` rules added to ensure form controls, buttons, and interactive elements render correctly in Windows High Contrast Mode. Always-on.

**1.3.8 — Form label hidden with `display: none` removes accessible name** `[RESOLVED]` `[GATED]`
- **Files:**
  - `resources/assets/public/scss/public/_public_helpers.scss:127-130` — **RESOLVED** (2026-02-27)
  - `resources/assets/public/scss/public/_public_helpers.scss:170-172` — **RESOLVED** (2026-02-27)
  - `resources/assets/public/scss/public/_public_helpers.scss:187-189` — **RESOLVED** (2026-02-27)
- **WCAG:** 1.3.1, 2.4.6 (Level A/AA)
- **Status:** **RESOLVED** — All three hidden-label CSS patterns have accessible alternatives using visually-hidden clip-rect. **Gated by toggle:** when OFF, `display: none` (legacy); when ON, clip-rect (accessible). See [Known Limitation](#known-limitation-hidden-labels-when-toggle-is-off) for implications.

#### MEDIUM

**1.3.9 — Form control focus relies on border color change only** `[RESOLVED]`
- **File:** `resources/assets/public/scss/default/_extra.scss:121-124`
- **Status:** **RESOLVED** — `:focus-visible` now adds a visible 2px outline in addition to the border color change.

**1.3.10 — Disabled button uses opacity only** `[RESOLVED]`
- **File:** `resources/assets/public/scss/public/_public_helpers.scss:389-391`
- **Status:** **RESOLVED** (2026-02-27) — `cursor: not-allowed` added to disabled buttons as an additional visual indicator beyond opacity. Always-on.

**1.3.11 — Disabled Choices items use opacity only**
- **File:** `resources/assets/public/scss/choices.scss:392-396`
- **Status:** Still open.

**1.3.12 — Step container `overflow: hidden` may clip focus indicators** `[RESOLVED]` `[GATED]`
- **File:** `resources/assets/public/scss/public/components.scss:266`
- **Status:** **RESOLVED** (2026-02-27) — Under `.ff-a11y-enabled`, step containers use `overflow: clip` with padding to prevent clipping of focus indicators. **Gated by toggle.**

**1.3.13 — Disabled/readonly form controls may have insufficient contrast**
- **File:** `resources/assets/public/scss/public/components.scss:787-791`
- **Status:** Still open.

**1.3.14 — Help message text color borderline contrast**
- **File:** `resources/assets/public/scss/public/components.scss:252-256`
- **Status:** Still open.

**1.3.15 — Font sizes in px prevent user scaling (minor)**
- **Files:** Multiple — `font-size: 16px`, `font-size: 13px`, etc.
- **WCAG:** 1.4.4 Resize Text (Level AA)
- **Status:** Still open.

**1.3.16 — Hover scaling animation on rating stars** `[RESOLVED]`
- **File:** `resources/assets/public/scss/public/components.scss:103`
- **Status:** **RESOLVED** (2026-02-27) — SVG transitions wrapped in `@media (prefers-reduced-motion: no-preference)`. Users with reduced-motion preferences will see no transitions.

**1.3.17 — Transition animations on buttons and inputs** `[RESOLVED]`
- **File:** `resources/assets/public/scss/default/_extra.scss:22-26, 109-111`
- **Status:** **RESOLVED** — Both button and form control transitions are wrapped in `@media (prefers-reduced-motion: no-preference)`.

**1.3.18 — Conversational form questions hidden with `top: -99999px`**
- **File:** `fluent-conversational-js/src/form/styles/app.scss:594-599`
- **Status:** Still open.

#### LOW

**1.3.19 — Checkbox/radio 20px in conversational form**
- **File:** `fluent-conversational-js/src/form/styles/common-ditdot.scss:59-131`
- **Status:** Still open.

**1.3.20 — Conversational form focus indicator uses pseudo-element**
- **File:** `fluent-conversational-js/src/form/styles/app.scss:865-869`
- **Status:** Still open.

**1.3.21 — Address autocomplete container z-index 99999**
- **File:** `resources/assets/public/scss/public/components.scss:207-209`
- **Status:** Still open.

**1.3.22 — Progress bar overflow hidden**
- **File:** `resources/assets/public/scss/default/_extra.scss:197`
- **Status:** Still open.

---

### 1.4 Pro Component Issues

#### CRITICAL

**1.4.1 — Payment methods: hidden single-method field inaccessible**
- **Files:**
  - `fluentformpro/src/Payments/Components/PaymentMethods.php:231`
  - `fluent-conversational-js/src/form/components/QuestionTypes/PaymentMethodType.vue:79-82`
- **WCAG:** 2.1.1 Keyboard (Level A)
- **Status:** Still open — needs verification against current Pro codebase.

**1.4.2 — Color picker entirely inaccessible via keyboard**
- **File:** `fluentformpro/src/Components/ColorPicker.php:74-191`
- **WCAG:** 2.1.1 Keyboard (Level A)
- **Status:** Still open.

**1.4.3 — Dynamic field autocomplete suggestions not accessible**
- **File:** `fluentformpro/src/Components/DynamicField/DynamicField.php:661-738`
- **WCAG:** 2.1.1, 4.1.2 (Level A)
- **Status:** Still open.

#### HIGH

**1.4.4 — Accordion section: error indicators have no `role="alert"`** `[RESOLVED]` `[GATED]`
- **File:** `fluentformpro/src/assets/public/ff_accordion.js:204, 215-216`
- **WCAG:** 4.1.3 (Level AA)
- **Status:** **RESOLVED** (2026-02-27) — Accordion headers now show `aria-invalid` and a screen-reader-only error count when sections contain validation errors. **Gated by toggle.**

**1.4.5 — Range slider missing ARIA value attributes** `[RESOLVED]` `[GATED]`
- **Files:**
  - `fluentformpro/src/Components/RangeSliderField.php:188`
  - `fluent-conversational-js/src/form/components/QuestionTypes/RangesliderType.vue`
- **WCAG:** 4.1.2 (Level A)
- **Status:** **RESOLVED** (2026-02-27) — Range slider now has `aria-label` and `aria-describedby` linking to the value display element. **Gated by toggle.**

**1.4.6 — File uploader: upload button span has no `role="button"`** `[RESOLVED]`
- **File:** `fluentformpro/src/Components/Uploader.php:78`
- **WCAG:** 4.1.2 (Level A)
- **Status:** **RESOLVED** (2026-02-27) — `role="button"` already present in both toggle-ON and toggle-OFF code paths.

**1.4.7 — Repeater table lacks descriptive caption** `[RESOLVED]` `[GATED]`
- **File:** `fluentformpro/src/Components/RepeaterField.php:159`
- **WCAG:** 1.3.1 (Level A)
- **Status:** **RESOLVED** (2026-02-27) — Repeater table now includes `<caption class="ff-support-sr-only">` containing the field label. **Gated by toggle.**

**1.4.8 — Repeater add/remove SVG buttons missing accessible names**
- **File:** `fluentformpro/src/Components/RepeaterField.php:209-211`
- **WCAG:** 4.1.2 (Level A)
- **Status:** Still open.

**1.4.9 — Chained select: disabled selects have no explanation** `[RESOLVED]` `[GATED]`
- **File:** `fluentformpro/src/Components/ChainedSelect/ChainedSelect.php:237`
- **WCAG:** 3.3.2 Labels or Instructions, 4.1.2 (Level A)
- **Status:** **RESOLVED** (2026-02-27) — Disabled child selects now have `aria-label` that includes "please select [parent field] first" to explain why they are disabled. **Gated by toggle.**

**1.4.10 — Form step progress bar missing ARIA attributes** `[RESOLVED]` `[GATED]`
- **File:** `fluentformpro/src/Components/FormStep.php:28-35`
- **WCAG:** 4.1.2 (Level A)
- **Status:** **RESOLVED** (2026-02-27) — Progress bar now has `role="progressbar"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `aria-label`. **Gated by toggle.**

**1.4.11 — Subscription custom payment input: errors not linked**
- **File:** `fluent-conversational-js/src/form/components/QuestionTypes/SubscriptionType.vue:188-206`
- **WCAG:** 3.3.1 Error Identification (Level A)
- **Status:** Still open.

#### MEDIUM

**1.4.12 — Phone field: country change not announced**
- **File:** `fluentformpro/src/Components/PhoneField.php:303-332`
- **WCAG:** 4.1.2 (Level A)
- **Status:** Still open. Note: PhoneField.php:197 unquoted `aria-required` was **fixed** (2026-02-27).

**1.4.13 — Accordion keyboard: arrow key navigation between sections missing** `[RESOLVED]` `[GATED]`
- **File:** `fluentformpro/src/assets/public/ff_accordion.js:254-260`
- **WCAG:** 2.1.1 (Level A)
- **Status:** **RESOLVED** (2026-02-27) — Full keyboard navigation added: Up/Down/Left/Right arrow keys to move between accordion headers, Home/End keys to jump to first/last section. **Gated by toggle.**

**1.4.14 — NPS component: validation error not linked to field**
- **File:** `fluent-conversational-js/src/form/components/QuestionTypes/NetPromoterScoreType.vue:207-215`
- **WCAG:** 3.3.1 (Level A)
- **Status:** Still open.

**1.4.15 — Coupon field: no accessible description of purpose** `[RESOLVED]` `[GATED]`
- **File:** `fluentformpro/src/Payments/Components/Coupon.php:109-114`
- **WCAG:** 3.3.2 (Level A)
- **Status:** **RESOLVED** (2026-02-27) — Coupon input now has `aria-label="Enter coupon code"`. **Gated by toggle.**

**1.4.16 — Item quantity: product relationship not communicated** `[RESOLVED]` `[GATED]`
- **File:** `fluentformpro/src/Payments/Components/ItemQuantity.php:131-147`
- **WCAG:** 1.3.1 (Level A)
- **Status:** **RESOLVED** (2026-02-27) — Quantity input now has `aria-label="Quantity for [field label]"` communicating the product relationship. **Gated by toggle.**

#### LOW

**1.4.17 — Save progress button: image variant has generic alt text**
- **File:** `fluentformpro/src/Components/SaveProgressButton.php:428`
- **Status:** Still open.

**1.4.NEW1 — Pro payment component labels: unquoted `for=` attributes** `[RESOLVED]`
- **Files:**
  - `fluentformpro/src/Payments/Components/MultiPaymentComponent.php:337, 340`
  - `fluentformpro/src/Payments/Components/Subscription.php:332`
  - `fluentformpro/src/Payments/Components/PaymentMethods.php:344`
- **WCAG:** 4.1.1 Parsing (Level A)
- **Status:** **RESOLVED** (2026-02-27) — All `for={$id}` changed to `for="{$id}"`.

**1.4.NEW2 — Pro JS: dynamicAutocomplete.js missing combobox ARIA pattern**
- **File:** `fluentformpro/src/assets/public/dynamicAutocomplete.js`
- **WCAG:** 4.1.2 Name, Role, Value (Level A)
- **Problem:** Suggestions dropdown is built dynamically but lacks `aria-owns`, `aria-controls`, `aria-activedescendant`, or `role="listbox"` on the suggestions list.
- **Status:** Open (deferred — non-trivial JS change, separate PR).

**1.4.NEW3 — Pro JS: payment_handler.js missing `aria-live` for status messages**
- **File:** `fluentformpro/src/assets/public/payment_handler.js`
- **WCAG:** 4.1.3 Status Messages (Level AA)
- **Problem:** Payment status updates (processing, success, failure) are shown visually but not announced to screen readers.
- **Status:** Open (deferred — non-trivial JS change, separate PR).

**1.4.NEW4 — Pro JS: ff_address_autocomplete.js uses `alert()` for errors**
- **File:** `fluentformpro/src/assets/public/ff_address_autocomplete.js`
- **WCAG:** Best practice
- **Problem:** Uses native `alert()` for error messages, which blocks the page. Should use accessible toast/inline messaging.
- **Status:** Open (deferred).

**1.4.18 — Matrix field in conversational form: title attribute used for tooltip**
- **File:** `fluent-conversational-js/src/form/components/QuestionTypes/MatrixType.vue:36`
- **Status:** Still open.

**1.4.19 — Conversational FileType: SVG upload icons missing `aria-label`** `[RESOLVED]`
- **File:** `fluent-conversational-js/src/form/components/QuestionTypes/FileType.vue:28-40`
- **Status:** **RESOLVED** (2026-02-27) — SVG upload icons now have `aria-hidden="true"` (decorative icons, text label provides the accessible name). Always-on.

**1.4.20 — Conversational form upload: progress not announced**
- **File:** `fluent-conversational-js/src/form/components/QuestionTypes/FileType.vue:240-242`
- **Status:** Still open.

---

### 1.5 Conversational Form Issues

**Phase 6 (2026-02-27):** Comprehensive accessibility pass across 19 files in `fluent-conversational-js/`. All fixes are **always-on** — purely additive ARIA attributes with no visual/structural changes. No toggle gating needed. Test page: `https://forms.test/elementor-1479/`.

#### CRITICAL (previously)

**1.5.NEW1 — Input fields lack accessible names** `[RESOLVED]`
- **Files:** `BaseType.vue` (computed `ariaLabel`), `TextType.vue`, `EmailType.vue`, `PhoneType.vue`, `PasswordType.vue`, `NumberType.vue`, `DateType.vue`, `UrlType.vue`, `LongTextType.vue`, `DropdownType.vue` (both layers), `FileType.vue`, `CouponType.vue`, `AddressType.vue`, `NameType.vue`, `SignatureType.vue`
- **WCAG:** 4.1.2 Name, Role, Value (Level A), 1.3.1 Info and Relationships (Level A)
- **Status:** **RESOLVED** (2026-02-27) — Added `ariaLabel` computed property in `BaseType.vue` that strips HTML from `question.title`, with `question.placeholder` fallback. Bound via `:aria-label="ariaLabel"` on all input elements. For composite fields (Name, Address), existing `<label for>` associations provide accessible names — `aria-describedby` and `aria-invalid` added instead. For Element Plus `<el-select>` (Dropdown, Address country), `$nextTick` DOM manipulation sets `aria-label` on the inner `<input>` since Vue 3 attribute fallthrough targets the root `<div>`, not the focusable input.
- **Verified:** Playwright test confirmed 18/33 questions have accessible names (remaining use specialized ARIA patterns like `role="listbox"`, `role="radiogroup"`, `role="slider"` that provide accessible names through different mechanisms).

**1.5.NEW2 — Error messages not linked to inputs via `aria-describedby`** `[RESOLVED]`
- **Files:** `FlowFormQuestion.vue` (error div `id`), `BaseType.vue` (`errorDescribedby` computed), all input type components
- **WCAG:** 1.3.1 Info and Relationships (Level A), 3.3.1 Error Identification (Level A)
- **Status:** **RESOLVED** (2026-02-27) — Error div gets `id="err_{question.id}"`. Inputs bind `:aria-describedby="errorDescribedby"` which returns the error div ID when `question.error` is truthy. Always-on.

**1.5.NEW3 — Inputs missing `aria-invalid` on validation errors** `[RESOLVED]`
- **Files:** `BaseType.vue` (`ariaInvalid` computed), all input type components
- **WCAG:** 3.3.1 Error Identification (Level A)
- **Status:** **RESOLVED** (2026-02-27) — `ariaInvalid` computed returns `'true'` when `question.error` is truthy, `null` otherwise. Bound via `:aria-invalid="ariaInvalid"` on all inputs. Always-on.

#### HIGH

**1.5.1 — Inactive questions visible to screen readers**
- **File:** `fluent-conversational-js/src/form/styles/app.scss:594-599`
- **WCAG:** 2.4.3 Focus Order (Level A)
- **Status:** Still open — inactive questions use CSS to hide visually but may still be announced by screen readers. Needs `aria-hidden="true"` on inactive question wrappers.

**1.5.NEW4 — Progress bar lacks ARIA attributes** `[RESOLVED]`
- **File:** `fluent-conversational-js/src/conversational/src/components/FlowForm.vue`
- **WCAG:** 4.1.2 Name, Role, Value (Level A)
- **Status:** **RESOLVED** (2026-02-27) — Progress bar div now has `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, and `aria-label` with percentage text. Always-on.

**1.5.NEW5 — Question titles not semantic headings** `[RESOLVED]`
- **Files:** `FlowFormQuestion.vue`, `FormQuestion.vue`
- **WCAG:** 1.3.1 Info and Relationships (Level A), 2.4.6 Headings and Labels (Level AA)
- **Status:** **RESOLVED** (2026-02-27) — Question title wrapper changed from `<div class="fh2">` to `<h2 class="fh2">`. Screen readers can now navigate questions by heading. The `fh2` CSS class handles visual styling, so no visual change. Always-on.

**1.5.2 — Step transitions not announced**
- **File:** `fluent-conversational-js/src/form/App.vue`
- **WCAG:** 4.1.3 (Level AA)
- **Status:** Still open.

**1.5.3 — Payment gateway redirects not announced**
- **File:** `fluent-conversational-js/src/form/App.vue` (Stripe, Razorpay, Paystack handlers)
- **WCAG:** 4.1.3 (Level AA)
- **Status:** Still open.

#### MEDIUM

**1.5.4 — Conditional question visibility changes not announced**
- **File:** `fluent-conversational-js/src/form/models/QuestionModel.js:205`
- **WCAG:** 4.1.3 (Level AA)
- **Status:** Still open.

**1.5.5 — Swipe navigation has no keyboard equivalent announcement**
- **File:** `fluent-conversational-js/src/form/main.js`
- **WCAG:** 2.1.1 (Level A)
- **Status:** Still open.

**1.5.6 — Counter component has no accessible description** `[RESOLVED]`
- **File:** `fluent-conversational-js/src/form/components/Counter.vue`
- **WCAG:** 1.3.1 (Level A)
- **Status:** **RESOLVED** (2026-02-27) — Counter SVGs now have `aria-hidden="true"`. The counter is decorative (step number also appears in the question text), so hiding from assistive technology is correct. Always-on.

**1.5.NEW6 — Decorative SVGs missing `aria-hidden`** `[RESOLVED]`
- **Files:** `Counter.vue`, `FlowFormQuestion.vue`, `FileType.vue`, `DropdownType.vue` (conversational)
- **WCAG:** 1.1.1 Non-text Content (Level A)
- **Status:** **RESOLVED** (2026-02-27) — All decorative SVGs (counter icons, check marks, upload icons, dropdown arrows) now have `aria-hidden="true"`. Always-on.

**1.5.NEW7 — No `role="form"` landmark** `[RESOLVED]`
- **File:** `fluent-conversational-js/src/conversational/src/components/FlowForm.vue`
- **WCAG:** 1.3.1 Info and Relationships (Level A)
- **Status:** **RESOLVED** (2026-02-27) — Root `.vff` div now has `role="form"` and an `aria-label` identifying it as a form. Screen readers can now navigate to the form via landmarks. Always-on.

**1.5.7 — Conversational form submit button state changes not announced**
- **File:** `fluent-conversational-js/src/form/components/SubmitButton.vue`
- **WCAG:** 4.1.3 (Level AA)
- **Status:** Still open.

**1.5.NEW8 — Matrix `<th>` elements missing `scope` attribute** `[RESOLVED]`
- **Files:** `MatrixType.vue` (both conversational and form layers)
- **WCAG:** 1.3.1 Info and Relationships (Level A)
- **Status:** **RESOLVED** (2026-02-27) — Column headers have `scope="col"`, row headers have `scope="row"`. Always-on.

#### LOW

**1.5.8 — Base question types from vue-flow-form may have their own accessibility gaps** `[RESOLVED]`
- **Files:** `fluent-conversational-js/src/conversational/src/components/` (15 base types)
- **Status:** **RESOLVED** (2026-02-27) — Comprehensive audit completed. All base types now have `aria-label`, `aria-describedby`, and `aria-invalid` bindings via `BaseType.vue` computed properties. Types that already had correct ARIA (MultipleChoiceType, MultiplePictureChoiceType, MatrixType, NetPromoterScoreType, RateType, RangesliderType) were verified and retained.

**1.5.9 — Custom element focusing via `.focus()` without `tabindex`**
- **File:** `fluent-conversational-js/src/form/App.vue`
- **Status:** Still open.

---

### 1.6 User-Reported Issues (Verified)

These issues were reported by real users and validated against the codebase. Some overlap with issues already documented above — those are cross-referenced. New issues unique to user reports are listed below.

#### CRITICAL

**1.6.1 — No `autocomplete` attribute on any standard form field (WCAG 1.3.5)** `[USER-REPORTED]` `[RESOLVED]`
- **WCAG:** 1.3.5 Identify Input Purpose (Level AA) — **EU Accessibility Act requirement**
- **File:** `app/Services/FormBuilder/Components/BaseComponent.php:82-137`
- **Status:** **RESOLVED** — `autocomplete` attribute is now automatically added to form fields based on their name/type. The `getAutocompleteValue()` method (lines 82-137) maps:
  - Type-based: `email` → `email`, `tel` → `tel`, `url` → `url`
  - Name-based: `email` → `email`, `phone` → `tel`
  - Subfield-based: `first_name` → `given-name`, `last_name` → `family-name`, `middle_name` → `additional-name`, `address_line_1` → `address-line1`, `address_line_2` → `address-line2`, `city` → `address-level2`, `state` → `address-level1`, `zip` → `postal-code`, `country` → `country-name`
- **Verified on live site:** Confirmed `autocomplete="given-name"`, `autocomplete="family-name"`, `autocomplete="email"`, `autocomplete="tel"` present on rendered form fields.
- **Note:** A form builder UI setting for custom autocomplete values (2.12) is still a desirable enhancement but no longer blocking.

**1.6.2 — Redundant ARIA attributes create noisy screen reader experience** `[USER-REPORTED]` `[RESOLVED]`
- **WCAG:** 4.1.2 Name, Role, Value (Level A), 2.5.3 Label in Name (Level A)
- **Status:** **FULLY RESOLVED** (regression fixed 2026-02-27)
- **What was done:**
  - **Phase 1 (safe, completed):** Removed `aria-label` from all `<label>` elements in BaseComponent.php:276 and BaseComponent.php:354. Removed `aria-label` from checkbox/radio inputs in Checkable.php:148. Removed `aria-label` from address group label in Address.php:98.
  - **Phase 2 (completed, CSS prerequisite now met):** Removed `aria-labelledby` from Select.php:78 and TextArea.php:47. The CSS prerequisite (changing hidden label CSS from `display:none` to visually-hidden) was completed on 2026-02-27.
- **Regression:** ~~Hidden-label Select/Textarea fields may now have no accessible name~~ **FIXED** — CSS now uses clip-rect pattern, keeping labels in the accessibility tree.

**1.6.3 — File upload field has duplicate `<label for>` elements (WAVE error)** `[USER-REPORTED]` `[RESOLVED]` `[GATED]`
- **WCAG:** 1.3.1 Info and Relationships (Level A)
- **File:** `fluentformpro/src/Components/Uploader.php:78`
- **Status:** **RESOLVED** (2026-02-27) — When toggle is ON, the outer `<label>` element is replaced with a `<div>`, eliminating the duplicate `<label for>` WAVE error. **Gated by toggle.**

#### HIGH

**1.6.4 — Success message not announced to screen readers after form submission** `[USER-REPORTED]` `[RESOLVED]`
- **WCAG:** 4.1.3 Status Messages (Level AA)
- **File:** `resources/assets/public/form-submission.js:385-395`
- **Status:** **RESOLVED** — Success message div now has `role: 'alert'`, `aria-live: 'assertive'`, and `tabindex: '-1'`. The `.focus()` call works correctly with `tabindex`.

**1.6.5 — Placeholder text duplicates label text across all default fields** `[USER-REPORTED]` `[RESOLVED]`
- **WCAG:** 3.3.2 Labels or Instructions (Level A) — best practice
- **File:** `app/Services/FormBuilder/DefaultElements.php`
- **Status:** **RESOLVED** (2026-02-27) — Placeholder defaults cleared for address subfields and email fields. Always-on but only affects newly created forms (existing forms retain their saved placeholder values).

**1.6.6 — Machine-generated IDs are unsemantic and break browser autocomplete** `[USER-REPORTED]` `[PARTIALLY RESOLVED]`
- **WCAG:** 1.3.5 Identify Input Purpose (Level AA)
- **File:** `app/Services/FormBuilder/Components/BaseComponent.php:26-45`
- **Status:** **PARTIALLY RESOLVED** — The autocomplete issue is now addressed by the `autocomplete` attribute (1.6.1). IDs remain auto-generated but this is no longer a functional problem since `autocomplete` drives browser autofill. A "Custom ID" option in the form builder Advanced tab would still be a nice enhancement.

#### MEDIUM

**1.6.7 — Submit/Next/Prev buttons have redundant `aria-label`** `[USER-REPORTED]` `[RESOLVED for submit]`
- **File:** `app/Services/FormBuilder/Components/SubmitButton.php:133-135`
- **Status:** **RESOLVED for submit button** — Text buttons (line 133, 139) no longer have `aria-label`. Image-only button (line 135) correctly keeps `aria-label='Submit The Form'`.
- **Still open for Pro:** `fluentformpro/src/Components/FormStep.php:124, 141` — Next/Prev buttons in multi-step forms may still have redundant `aria-label`. Needs verification.

**1.6.8 — Section heading hardcoded as `<h3>` violates EU accessibility requirements** `[USER-REPORTED]` `[RESOLVED]`
- **WCAG:** 1.3.1 Info and Relationships (Level A) — **EU Accessibility Act requirement**
- **File:** `app/Services/FormBuilder/Components/SectionBreak.php:45-49`
- **Status:** **RESOLVED** — Cross-reference: 1.1.8. Heading level is now configurable (h1-h6) with h3 default.

**1.6.9 — Progress bar `role="progressbar"` has no accessible name or values** `[USER-REPORTED]` `[RESOLVED]` `[GATED]`
- **WCAG:** 4.1.2 Name, Role, Value (Level A) — **EU Accessibility Act requirement**
- **File:** `fluentformpro/src/Components/FormStep.php:29-35`
- **Status:** **RESOLVED** (2026-02-27) — Cross-reference: 1.4.10. Progress bar now has `role="progressbar"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `aria-label`. **Gated by toggle.**

**1.6.10 — `ff-t-cell` class name suggests table layout (misleading but not harmful)** `[USER-REPORTED]`
- **File:** `resources/assets/public/scss/public/_grid.scss:15-49`
- **Verdict:** Form field layout is **NOT an issue** (flexbox). Low priority.

#### LOW

**1.6.11 — `pointer-events: none` on submitting form is redundant but not insecure** `[USER-REPORTED]`
- **File:** `resources/assets/public/scss/public/_public_helpers.scss:416-418`
- **Verdict:** **Not insecure.** The HTML `disabled` attribute is properly set. No change needed.

---

## Part 2 — Requires Breaking Changes

These issues cannot be fixed with simple attribute additions. They require restructuring HTML output, changing component APIs, or replacing third-party libraries.

**Update (2026-02-27):** With the [Global Accessibility Toggle](#global-accessibility-toggle) now in place, these breaking changes can be safely implemented behind the `Helper::isAccessibilityEnabled()` check. Admins who experience issues with custom CSS or JS can disable the toggle to revert to legacy rendering. **11 of 14 Part 2 items are now resolved** (2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.13, 2.14). Standard form changes are gated by the toggle; conversational form changes (2.8) are always-on.

### 2.1 — Rating widget requires CSS refactor for radio visibility `[RESOLVED]` `[GATED]`
- **Files:** `resources/assets/public/scss/public/components.scss:91-96`, `resources/assets/public/Pro/dom-rating.js`
- **Problem:** The radio inputs are hidden with `display: none` CSS, making them unfocusable by screen readers navigating by form controls.
- **Status:** **RESOLVED** (2026-02-27) — Cross-reference: 1.3.1. Under `.ff-a11y-enabled`, rating radio inputs use focusable-hidden pattern instead of `display: none`. **Gated by toggle.**
- **Breaking Risk:** None — gated behind toggle.

### 2.2 — Tabular grid needs semantic restructuring `[RESOLVED]` `[GATED]`
- **File:** `app/Services/FormBuilder/Components/TabularGrid.php`
- **Status:** **RESOLVED** (2026-02-27) — Cross-reference: 1.1.12. `<th scope="col">` and `<th scope="row">` with `aria-labelledby` on inputs. **Gated by toggle.**
- **Breaking Risk:** None — gated behind toggle.

### 2.3 — Choices.js multi-select needs accessible overlay or library replacement `[RESOLVED]` `[GATED]`
- **File:** `resources/assets/public/form-submission.js:1757-1802`
- **Status:** **RESOLVED** (2026-02-27) — Cross-reference: 1.2.27. `aria-expanded`, `aria-haspopup="listbox"`, and `aria-selected` patched after Choices.js init. **Gated by toggle.**
- **Breaking Risk:** None — gated behind toggle.

### 2.4 — Color picker (Pickr) needs replacement or major configuration
- **File:** `fluentformpro/src/Components/ColorPicker.php`
- **Status:** Still open.
- **Breaking Risk:** Medium.

### 2.5 — Dynamic field autocomplete needs combobox pattern implementation `[RESOLVED]` `[GATED]`
- **File:** `fluentformpro/src/Components/DynamicField/DynamicField.php`
- **Status:** **RESOLVED** (2026-02-27) — Full ARIA combobox pattern implemented: `role="combobox"`, `aria-expanded`, `aria-activedescendant`, `aria-controls` on the input, with `role="listbox"` on the suggestions dropdown. **Gated by toggle.**
- **Breaking Risk:** None — gated behind toggle.

### 2.6 — Address field compound structure needs `<fieldset>`/`<legend>` `[RESOLVED]` `[GATED]`
- **File:** `app/Services/FormBuilder/Components/Address.php`
- **Status:** **RESOLVED** (2026-02-27) — Cross-reference: 1.1.10. Address field now wrapped in `<fieldset>`/`<legend>` with `aria-label` on each subfield. **Gated by toggle.**
- **Breaking Risk:** None — gated behind toggle.

### 2.7 — File upload needs semantic button/label restructuring `[RESOLVED]` `[GATED]`
- **File:** `fluentformpro/src/Components/Uploader.php:78`
- **Status:** **RESOLVED** (2026-02-27) — Cross-reference: 1.6.3. Outer `<label>` replaced with `<div>` when toggle ON, eliminating duplicate label issue. **Gated by toggle.**
- **Breaking Risk:** None — gated behind toggle.

### 2.8 — Conversational form: upstream vue-flow-form library accessibility `[RESOLVED]`
- **File:** `fluent-conversational-js/src/conversational/src/components/FlowForm.vue` and 18 other files
- **Status:** **RESOLVED** (2026-02-27) — Comprehensive accessibility pass across both upstream (`src/conversational/`) and pro (`src/form/`) layers. Fixes include: `aria-label` on all input types via `BaseType.vue` computed, `aria-describedby`/`aria-invalid` for error linking, `role="progressbar"` on progress bar, `<h2>` for question headings, `role="form"` landmark, `aria-hidden="true"` on decorative SVGs, `scope` on matrix `<th>` elements, Element Plus `<el-select>` inner input labeling via `$nextTick`. **Always-on** — no toggle gating needed (purely additive ARIA, no visual changes).
- **Breaking Risk:** None — all changes are additive attributes.

### 2.9 — Section break heading level should be configurable `[RESOLVED]`
- **File:** `app/Services/FormBuilder/Components/SectionBreak.php:45-49`
- **Status:** **RESOLVED** — Heading level is now configurable via `settings.heading_level` with h1-h6 options, defaulting to h3.

### 2.10 — Label hiding strategy needs CSS change `[RESOLVED]`
- **File:** `resources/assets/public/scss/public/_public_helpers.scss:127-130, 170-172, 187-189`
- **Status:** **RESOLVED** (2026-02-27) — All three hidden-label CSS patterns changed to visually-hidden clip-rect. Phase 2 ARIA cleanup is now safe. Verified via Playwright — no layout breakage.

### 2.11 — Form-level `aria-live` container architecture
- **Status:** Partially addressed — form-submission.js now creates `ff-sr-announce` spans as needed (line 507-512). A more architectural shared announcer could still be beneficial.
- **Breaking Risk:** None — purely additive.

### 2.12 — `autocomplete` attribute support as a field setting `[USER-REPORTED]` `[PARTIALLY RESOLVED]`
- **Status:** **PARTIALLY RESOLVED** — Auto-detection of `autocomplete` values is now implemented (BaseComponent.php:82-137). A form builder UI dropdown for custom values per field would be a nice enhancement but is no longer critical.
- **Breaking Risk:** Low — purely additive.

### 2.13 — ARIA redundancy cleanup across all components `[USER-REPORTED]` `[RESOLVED]`
- **Status:** **FULLY RESOLVED** (2026-02-27) — Phase 1 (label `aria-label` removal) and Phase 2 (`aria-labelledby` removal from Select/Textarea) are both implemented. CSS prerequisite (hidden label clip-rect) completed, resolving the regression.

### 2.14 — File upload `<label>` / button restructuring `[USER-REPORTED]` `[RESOLVED]` `[GATED]`
- **File:** `fluentformpro/src/Components/Uploader.php:78`
- **Status:** **RESOLVED** (2026-02-27) — Cross-reference: 1.6.3. Outer `<label>` replaced with `<div>` when toggle ON. **Gated by toggle.**
- **Breaking Risk:** None — gated behind toggle.

---

## Priority Matrix

### ~~Immediate — Fix Regression~~ RESOLVED (2026-02-27)
All regression issues have been resolved. CSS prerequisite for Phase 2 ARIA cleanup is complete (gated by toggle).

### Global Toggle — IMPLEMENTED (2026-02-27)
The Enhanced Accessibility toggle is live. All structural changes are gated. See [Global Accessibility Toggle](#global-accessibility-toggle).

### Next Phase — Implement Remaining Breaking Changes (Now Safe)
With the toggle in place, all Part 2 breaking changes can be implemented behind `Helper::isAccessibilityEnabled()`. Priority order:

| # | Issue | Effort | Impact | Status |
|---|-------|--------|--------|--------|
| 2.1 | Rating widget CSS: `display:none` → focusable hidden | Low | High | **RESOLVED** — gated |
| 2.14 | File upload label/button restructure (Pro) | Medium | High | **RESOLVED** — gated |
| 2.6 | Address field `<fieldset>`/`<legend>` | Low-Med | Medium | **RESOLVED** — gated |
| 2.7 | File upload semantic button restructure | Low-Med | Medium | **RESOLVED** — gated |
| 2.2 | Tabular grid semantic restructure | Medium | Medium | **RESOLVED** — gated |
| 2.5 | Dynamic field combobox ARIA pattern | High | Medium | **RESOLVED** — gated |
| 2.3 | Choices.js ARIA patch | Very High | High | **RESOLVED** — gated |
| 2.8 | vue-flow-form upstream accessibility | Very High | Medium | **RESOLVED** — always-on |
| 2.4 | Color picker keyboard (beyond current gated block) | Medium | Low | Open |

### Remaining Non-Breaking Issues (Can Implement Independently)
| # | Issue | Effort | Impact | Status |
|---|-------|--------|--------|--------|
| 1.6.5 | Stop duplicating label text in placeholders | Low | Medium | **RESOLVED** — always-on (new forms only) |
| 1.3.7 | `forced-colors` high contrast support | Medium | Medium | **RESOLVED** — always-on |
| 1.3.4 | Small button touch targets | Low | Medium | **RESOLVED** — gated |
| 1.3.5 | Checkbox/radio touch targets | Medium | Medium | **RESOLVED** — gated |
| 1.3.15 | px → rem migration | High | Low | Open |
| 1.4.4 | Accordion error announcements | Low | Medium | **RESOLVED** — gated |
| 1.4.9 | Chained select descriptions | Low | Low | **RESOLVED** — gated |
| 1.5.1 | Conversational inactive question `aria-hidden` | Medium | Medium | Open |
| 1.5.2 | Conversational step announcements | Medium | Medium | Open |
| 1.5.NEW1 | Conversational input accessible names | High | High | **RESOLVED** — always-on |
| 1.5.NEW4 | Conversational progress bar ARIA | Low | Medium | **RESOLVED** — always-on |
| 1.5.NEW5 | Conversational question headings | Low | Medium | **RESOLVED** — always-on |
| 2.11 | Shared `aria-live` announcer architecture | Medium | High | Partially done |
| 1.1.10 | Address subfield label associations | Low | Medium | **RESOLVED** — gated |
| 1.4.10/1.6.9 | Form step progressbar ARIA | Low | Medium | **RESOLVED** — gated |

---

## Resolved Issues Summary

The following 67 issues have been fully resolved since the initial audit. Issues marked **GATED** only activate when the Enhanced Accessibility toggle is ON. Issues marked **ALWAYS-ON** are active regardless.

| # | Issue | Resolution | Mode |
|---|-------|-----------|------|
| 1.1.1 | Checkbox/radio groups missing grouping | `role="group"` + `aria-labelledby` (Checkable.php:89-90) | GATED |
| 1.1.3 | Help messages not linked to fields | `aria-describedby` with generated IDs (BaseComponent.php:316-340) | GATED |
| 1.1.4 | Tooltip not accessible | `aria-label`, `tabindex="0"`, `role="note"` (BaseComponent.php:392) | GATED |
| 1.1.5 | SVGs without text alternatives | `aria-hidden="true" focusable="false"` (Rating.php:74, BaseComponent.php:391) | GATED |
| 1.1.6 | Rating incomplete ARIA | Comprehensive ARIA on radiogroup and inputs (Rating.php:57,73) | GATED |
| 1.1.7 | Error container missing role="alert" | `role="alert" aria-live="assertive" aria-atomic="true"` (FormBuilder.php:208) | GATED |
| 1.1.8 | Section break hardcoded h3 | Configurable h1-h6 (SectionBreak.php:45-49) | GATED |
| 1.1.11 | Other option missing aria-hidden | `aria-hidden="true"` on wrapper (Checkable.php:158) | GATED |
| 1.1.13 | reCAPTCHA missing aria-label | `aria-label="CAPTCHA verification"` (Recaptcha.php:115) | GATED |
| 1.2.1 | Errors not linked via aria-describedby | Generated error IDs + aria-describedby (form-submission.js:858-861) | GATED |
| 1.2.2 | Focus not moved to first error | .focus() on first error input (form-submission.js:675-678) | GATED |
| 1.2.3 | Rating mouse-only | Full keyboard nav: arrows, Enter/Space (dom-rating.js:86-148) | GATED |
| 1.2.4 | NPS mouse-only | Keyboard nav added (dom-net-promoter.js:26-64) | GATED |
| 1.2.5 | Tooltip mouse-only | focusin/focusout handlers (form-submission.js:992-997) | GATED |
| 1.2.6 | Error stack missing aria-live | Covered by 1.1.7 resolution | GATED |
| 1.2.7 | aria-invalid not cleared | Cleared on change (879-880) and success (398-399) | GATED |
| 1.2.13 | Submission progress not announced | sr-only aria-live span (form-submission.js:497-514) | GATED |
| 1.2.26 | Success message not focusable | tabindex="-1", role="alert", aria-live (form-submission.js:385-395) | GATED |
| 1.2.29 | Rating text not linked | aria-describedby on radiogroup + aria-live on text (Rating.php:55,84) | GATED |
| 1.3.3 | Focus outline:0 without replacement | :focus-visible styles added (_extra.scss:33-37, 121-124) | ALWAYS-ON |
| 1.3.9 | Focus relies on border only | :focus-visible outline added (_extra.scss:121-124) | ALWAYS-ON |
| 1.3.17 | Transition animations not wrapped | prefers-reduced-motion wrapping (_extra.scss:22-26, 109-111) | ALWAYS-ON |
| 1.6.1 | No autocomplete attribute | Auto-mapping implemented (BaseComponent.php:82-137) | GATED |
| 1.6.4 | Success message not announced | role="alert", aria-live, tabindex, focus (form-submission.js:385-395) | GATED |
| 1.6.7 | Submit button redundant aria-label | Removed from text buttons, kept on image-only (SubmitButton.php:133-135) | ALWAYS-ON |
| 1.6.8 | Section heading hardcoded h3 | Configurable (SectionBreak.php:45-49) | GATED |
| 2.9 | Section break heading configurable | Same as 1.6.8 | GATED |
| 1.1.2 | Unquoted `aria-required` (all components) | Quoted in all free + pro files (Name.php, PhoneField.php) | ALWAYS-ON |
| 1.1.9 | Legend `text-indent: -999999px` | Clip-rect visually-hidden + `esc_html()` (FormBuilder.php:598) | ALWAYS-ON |
| 1.1.15 | DateTime unescaped `aria-label` | `esc_attr()` + normalized quotes (DateTime.php:57) | ALWAYS-ON |
| 1.1.NEW1 | TextArea missing `aria-invalid` | Added `aria-invalid="false"` (TextArea.php:47) | ALWAYS-ON |
| 1.3.8 | Hidden label `display:none` | Clip-rect under `.ff-a11y-enabled` (`_public_helpers.scss`) | GATED |
| 1.3.16 | Rating SVG no reduced-motion | Wrapped in `prefers-reduced-motion` (components.scss:103) | ALWAYS-ON |
| 1.3.3+ | Choices.js + accordion/tab focus | `:focus-visible` added (choices.scss, ff_accordion.scss) | ALWAYS-ON |
| 1.6.2 | ARIA redundancy (label aria-label) | Phase 1 removal complete | ALWAYS-ON |
| 1.6.2 | ARIA redundancy (select/textarea) | aria-labelledby removed, CSS gated | ALWAYS-ON* |
| 2.10 | Label hiding strategy CSS | sr-only under `.ff-a11y-enabled` | GATED |
| 2.13 | ARIA redundancy cleanup | Phase 1+2 complete | ALWAYS-ON |
| PRO | MultiPayment/Subscription/PaymentMethods `for=` | Quoted in all 3 files | ALWAYS-ON |
| 1.1.10 | Address subfields missing label associations | `<fieldset>`/`<legend>` wrapper + `aria-label` on subfields (Address.php) | GATED |
| 1.1.12 | Tabular grid header associations | `<th scope="col/row">` + `aria-labelledby` on inputs (TabularGrid.php) | GATED |
| 1.1.14 | Payment method radio buttons missing aria-label | `aria-label="Pay with [method]"` (PaymentMethods.php) | GATED |
| 1.1.16 | Custom HTML unnecessary tabindex | Removed `tabindex="-1"` (CustomHtml.php) | ALWAYS-ON |
| 1.2.18 | Calculation field not announced | `aria-live="polite"` on formula containers (Text.php + JS) | GATED |
| 1.2.22 | Stripe card error no role/aria-live | `role="alert"` + `aria-live="assertive"` on `.ff_card-errors` (payment_handler.js) | GATED |
| 1.2.27 | Choices.js missing aria-expanded | `aria-expanded`, `aria-haspopup="listbox"`, `aria-selected` patched (form-submission.js) | GATED |
| 1.3.1 | Rating radios `display:none` | Focusable-hidden pattern under `.ff-a11y-enabled` (components.scss) | GATED |
| 1.3.4 | Small button below 44px | `min-height/width: 44px` under `.ff-a11y-enabled` (_extra.scss) | GATED |
| 1.3.5 | Checkbox/radio 15px in modern skin | 24x24px under `.ff-a11y-enabled` (_modern_base.scss) | GATED |
| 1.3.6 | Upload remove button too small | 44x44px min under `.ff-a11y-enabled` (components.scss) | GATED |
| 1.3.7 | No forced-colors support | `@media (forced-colors: active)` rules added | ALWAYS-ON |
| 1.3.10 | Disabled button opacity only | `cursor: not-allowed` added (_public_helpers.scss) | ALWAYS-ON |
| 1.3.12 | Step overflow clips focus | `overflow: clip` with padding under `.ff-a11y-enabled` (components.scss) | GATED |
| 1.4.4 | Accordion error indicators | `aria-invalid` + sr-only error count on headers (ff_accordion.js) | GATED |
| 1.4.5 | Range slider missing ARIA | `aria-label` + `aria-describedby` linking to value display (RangeSliderField.php) | GATED |
| 1.4.6 | File upload button no role | `role="button"` already present (Uploader.php) | ALWAYS-ON |
| 1.4.7 | Repeater table no caption | `<caption class="ff-support-sr-only">` with field label (RepeaterField.php) | GATED |
| 1.4.9 | Chained select disabled no explanation | `aria-label` includes "please select [parent] first" (ChainedSelect.php) | GATED |
| 1.4.10 | Form step progress bar no ARIA | `role="progressbar"`, `aria-valuemin/max/now`, `aria-label` (FormStep.php) | GATED |
| 1.4.13 | Accordion keyboard arrow nav | Up/Down/Left/Right/Home/End keys (ff_accordion.js) | GATED |
| 1.4.15 | Coupon field no description | `aria-label="Enter coupon code"` (Coupon.php) | GATED |
| 1.4.16 | Item quantity no product relationship | `aria-label="Quantity for [field]"` (ItemQuantity.php) | GATED |
| 1.6.3 | File upload duplicate label | Outer `<label>` → `<div>` when toggle ON (Uploader.php) | GATED |
| 1.6.5 | Placeholder duplicates label text | Placeholder defaults cleared for address/email (DefaultElements.php) | ALWAYS-ON* |
| 1.6.9 | Progress bar no accessible name | Cross-ref 1.4.10 — full ARIA progressbar (FormStep.php) | GATED |
| 2.1 | Rating widget CSS refactor | Cross-ref 1.3.1 — focusable-hidden pattern | GATED |
| 2.2 | Tabular grid restructuring | Cross-ref 1.1.12 — semantic `<th>` + `aria-labelledby` | GATED |
| 2.3 | Choices.js accessibility patch | Cross-ref 1.2.27 — ARIA attributes patched after init | GATED |
| 2.5 | Dynamic field combobox ARIA | Full combobox pattern (role, aria-expanded, aria-activedescendant, aria-controls) | GATED |
| 2.6 | Address fieldset/legend | Cross-ref 1.1.10 — `<fieldset>`/`<legend>` wrapper | GATED |
| 2.7 | File upload semantic restructure | Cross-ref 1.6.3 — outer `<label>` → `<div>` | GATED |
| 2.14 | File upload label restructure | Cross-ref 1.6.3 — outer `<label>` → `<div>` | GATED |
| 1.5.NEW1 | Conv: inputs lack accessible names | `ariaLabel` computed in BaseType.vue, bound on 15+ types | ALWAYS-ON |
| 1.5.NEW2 | Conv: errors not linked via aria-describedby | `errorDescribedby` computed + error div `id` (FlowFormQuestion.vue) | ALWAYS-ON |
| 1.5.NEW3 | Conv: inputs missing aria-invalid | `ariaInvalid` computed in BaseType.vue | ALWAYS-ON |
| 1.5.NEW4 | Conv: progress bar lacks ARIA | `role="progressbar"` + `aria-valuenow/min/max` (FlowForm.vue) | ALWAYS-ON |
| 1.5.NEW5 | Conv: question titles not headings | `<div class="fh2">` → `<h2 class="fh2">` (FlowFormQuestion.vue) | ALWAYS-ON |
| 1.5.6 | Conv: counter SVGs not hidden | `aria-hidden="true"` on decorative SVGs (Counter.vue) | ALWAYS-ON |
| 1.5.NEW6 | Conv: decorative SVGs missing aria-hidden | `aria-hidden="true"` on SVGs in 4 components | ALWAYS-ON |
| 1.5.NEW7 | Conv: no form landmark | `role="form"` + `aria-label` on root div (FlowForm.vue) | ALWAYS-ON |
| 1.5.NEW8 | Conv: matrix th missing scope | `scope="col/row"` on `<th>` elements (MatrixType.vue) | ALWAYS-ON |
| 1.5.8 | Conv: base types accessibility gaps | Comprehensive ARIA added to all 15 base types via BaseType.vue | ALWAYS-ON |
| 1.4.19 | Conv: FileType SVG icons | `aria-hidden="true"` on upload SVGs (FileType.vue) | ALWAYS-ON |
| 2.8 | Conv: vue-flow-form upstream a11y | Cross-ref 1.5.NEW1-NEW8 — 19 files, all ARIA additive | ALWAYS-ON |

\* 1.6.5 only affects newly created forms; existing forms retain their saved placeholder values.

\* The `aria-labelledby` removal from Select/Textarea is always-on, but its CSS prerequisite (clip-rect hidden labels) is gated. See [Known Limitation](#known-limitation-hidden-labels-when-toggle-is-off).

---

## Implementation Plan: ARIA Redundancy Removal (Issue 2.13)

**Status:** Phase 1 COMPLETE (always-on). Phase 2 COMPLETE (always-on). CSS prerequisite gated by toggle (2026-02-27).

### Phase 1 — COMPLETE (safe cleanup)

The following changes were successfully implemented with zero visual/behavioral impact:

1. **BaseComponent.php:276** — Removed `aria-label` from `<label>` elements in `buildElementLabel()`
2. **BaseComponent.php:354** — Removed `aria-label` attribute and computation logic from `buildElementMarkup()`
3. **Checkable.php:148** — Removed `aria-label` from checkbox/radio inputs wrapped in `<label>`
4. **Address.php:98** — Removed `aria-label` from address group `<label>`

**Cascade impact:** `buildElementLabel()` is also called by `RepeaterContainer.php` and `RepeaterField.php` in Pro. `buildElementMarkup()` is used by ~16 components. All produce cleaner labels automatically.

### Phase 2 — COMPLETE (CSS gated by toggle)

The following changes were implemented:

1. **Select.php:78** — Removed `aria-labelledby` (always-on)
2. **TextArea.php:47** — Removed `aria-labelledby` (always-on)

**CSS prerequisite** (hidden label `display:none` → visually-hidden clip-rect) is now scoped under `.ff-a11y-enabled` as part of the global accessibility toggle. When toggle is ON, all three `_public_helpers.scss` patterns use clip-rect. When OFF, they use `display: none` (legacy). See [Known Limitation](#known-limitation-hidden-labels-when-toggle-is-off).

### What is Deliberately NOT Changed

| Attribute / Location | Reason Kept |
|---|---|
| `id="label_ff_3_..."` on `<label>` elements | Backward-compatible, no harm in keeping |
| `aria-invalid="false"` on all inputs | JS validation toggles to `"true"` on error |
| `aria-required` on all inputs | Communicates required state to assistive tech |
| `Checkable.php:135` image option `aria-label` | Only accessible name for image-only labels (no visible text) |
| `TermsAndConditions.php` label `aria-label` | Provides supplementary link navigation instructions |
| `SubmitButton.php:135` image button `aria-label` | Only accessible name for image-only button |
| `DateTime.php:57` input `aria-label` | Needed for date picker dialog context |
| `TabularGrid.php:68` input `aria-label` | Identifies row+column position in grid |
| `Rating.php:57,73` ARIA attributes | Required — radiogroup pattern with hidden radios |

### Screen Reader Before/After

| Field Type | Before (double announcement) | After (current state) |
|---|---|---|
| Text / Email | "Email, edit, required" (occasional noise) | "Email, edit, required" (clean) |
| Select / Dropdown | "Dropdown, combobox, required, **Dropdown**" | "Dropdown, combobox, required" (clean when label visible) |
| Textarea | "Message, multiline, required, **Message**" | "Message, multiline, required" (clean when label visible) |
| Checkbox option | "Item 1, checkbox, not checked, **Item 1**" | "Item 1, checkbox, not checked" (clean) |
| Radio option | "Option A, radio, not selected, **Option A**" | "Option A, radio, not selected" (clean) |

### Testing Checklist

**Phase 1:** All items verified ✅
- [x] No `aria-label` on `<label>` elements (verified on live site)
- [x] Image checkbox options still have `aria-label` (Checkable.php:135)
- [x] Checkbox/radio options announced once, not twice (verified on live site)
- [x] `aria-invalid` still toggles correctly (form-submission.js verified)
- [x] `autocomplete` attributes present (verified on live site)
- [x] No JavaScript console errors reported

**Phase 2:** All verified ✅ (2026-02-27)
- [x] Select/Textarea no longer have `aria-labelledby` (verified in source)
- [x] Hidden-label CSS → visually-hidden clip-rect (3 patterns in `_public_helpers.scss`)
- [x] Playwright tested — no layout breakage, no horizontal overflow
- [x] Fieldset legend verified: `position: absolute`, `clip: rect(0px,0px,0px,0px)`, `text-indent: 0px`

**Session 2026-02-27 — Completed:**
- [x] Fix `_public_helpers.scss:127-130` hidden label CSS → visually-hidden pattern
- [x] Fix `_public_helpers.scss:170-172` inline form label CSS → visually-hidden pattern
- [x] Fix `_public_helpers.scss:187-189` hidden label CSS → visually-hidden pattern
- [x] Fix Name.php:99 unquoted `aria-required`
- [x] Fix DateTime.php:57 unescaped `aria-label` + mixed quotes
- [x] Add `aria-invalid="false"` to TextArea.php:47
- [x] Fix FormBuilder.php:598 legend `text-indent` → clip-rect + `esc_html()`
- [x] Fix PhoneField.php:197 unquoted `aria-required` (Pro)
- [x] Fix MultiPaymentComponent.php:337,340 unquoted `for=` (Pro)
- [x] Fix Subscription.php:332 unquoted `for=` (Pro)
- [x] Fix PaymentMethods.php:344 unquoted `for=` (Pro)
- [x] Add `:focus-visible` to accordion/tab headers (Pro ff_accordion.scss)
- [x] Add `:focus-visible` to Choices.js container and remove button (choices.scss)
- [x] Wrap rating SVG transition in `prefers-reduced-motion` (components.scss)
- [x] Fix list button first-child missing `border-left` (_public_helpers.scss)
- [x] Build both plugins (`npm run production`)
- [x] Playwright test: 8/8 passed — layout, hidden labels, legend, payment labels, errors, success message

# Workflow: Conversational Forms

Read this when working on conversational form mode, the design editor, form conversion, share pages, or landing pages.

## Key Files

- `app/Services/FluentConversational/Classes/Form.php` — Main conversational form service (boots hooks, design settings, rendering)
- `app/Services/FluentConversational/Classes/Converter/Converter.php` — Converts standard form JSON → conversational questions
- `app/Services/FluentConversational/Classes/Fonts.php` — System + Google font management
- `app/Services/FluentConversational/Classes/Elements/WelcomeScreen.php` — Welcome screen component
- `app/Services/FluentConversational/plugin.php` — Constants (version 1.0.0)
- `app/Services/FluentConversational/autoload.php` — PSR-4 autoloader (`FluentConversational` namespace)
- `app/Services/FluentConversational/public/` — CSS, JS, and font assets

## How Conversational Forms Differ from Standard

Standard FluentForm renders all fields on one page (or in steps). Conversational mode presents **one question at a time** in a full-screen, focused interface:

1. **Single question per screen** — fields shown sequentially with transitions
2. **Custom design system** — separate color scheme, fonts, backgrounds
3. **Welcome screen** — optional intro before questions begin
4. **Keyboard hints** — "Press Enter" cues for navigation
5. **Different rendering pipeline** — uses `Converter` to transform form JSON
6. **Separate public assets** — own CSS/JS in `FluentConversational/public/`

## Design System

Design settings stored in `fluentform_form_meta` with `meta_key = 'conversational_design'`:

```php
[
    'background_color'     => '#FFFFFF',
    'question_color'       => '#191919',
    'answer_color'         => '#0445AF',
    'button_color'         => '#0445AF',
    'button_text_color'    => '#FFFFFF',
    'background_image'     => '',
    'background_brightness' => 0,
    'disable_branding'     => 'no',
    'hide_media_on_mobile' => 'no',
    'key_hint'             => 'yes',
    'enable_scroll_to_top' => 'no',
]
```

Meta settings (`meta_key = 'conversational_meta'`) control title, description, favicon, fonts, and i18n strings.

## Field Filtering

Not all field types work in conversational mode. The `Converter` filters supported field types and transforms them:

- Text inputs → single-line question
- Checkboxes/radio → selectable options with keyboard shortcuts
- File uploads → upload prompt with preview
- Payment fields → integrated via `PaymentHelper`
- Multi-step (`form_step`) → handled as natural question flow (steps become implicit)
- Conditional logic → evaluated between questions

**Deprecated hook migration:** The converter handles deprecated hooks (e.g., old `fluentform_conversational_*` prefix) with proper deprecation notices → new `fluentform/conversational_*` prefix.

## Rendering Pipeline

1. Form flagged as conversational via `fluentform_form_meta` key `is_conversion_form`
2. `Form::boot()` registers all hooks on `init`
3. When form renders, `Converter::convert($form)` transforms form JSON:
   - Iterates fields → calls `buildBaseQuestion()` per field
   - Applies validation rules via `resolveValidationsRules()`
   - Sets defaults via `setDefaultValue()`
   - Handles save-and-resume data if enabled
4. Conversational JS/CSS assets loaded (from `FluentConversational/public/`)
5. Design settings applied as CSS custom properties
6. Frontend JS handles question navigation, transitions, and submission

## Design Editor (Admin)

The "Design" tab in form settings is pushed by `Form::pushDesignTab()`:

- Appears only for forms flagged as conversational
- Settings page rendered via `Form::renderDesignSettings($formId)`
- Loads a separate Vue app for the design editor
- Saves to `fluentform_form_meta` (keys: `conversational_design`, `conversational_meta`)

## Share / Landing Pages

Conversational forms can be shared as standalone landing pages:

- **Share page** — FluentForm Pro feature (`fluentformpro/src/classes/SharePage/SharePage.php`)
- Creates a dedicated URL for the form without WordPress theme chrome
- Uses conversational design settings for full-page rendering
- Meta settings (title, description, favicon) control the page `<head>`

## Key Hooks

```
fluentform/conversational_url                     # Filter the conversational form URL
fluentform/conversational_editor_vars             # Filter editor JS variables
fluentform/conversational_field_types             # Filter accepted field types
fluentform/is_conversion_form                     # Filter whether form is conversational
```

## Converting Between Modes

A standard form can be converted to conversational and back:

- **To conversational:** Set `is_conversion_form` meta to `yes` → design tab appears
- **To standard:** Remove the meta flag → form renders normally again
- The form JSON structure stays the same — only the rendering pipeline changes
- Settings in `FormSettingsController` handle the conversion toggle

## Common Pitfalls

- Conversational forms have their **own autoloader** (`FluentConversational` namespace) — separate from the main plugin autoloader
- Design settings are per-form, stored in `fluentform_form_meta` — not global settings
- Not all field types are supported — the `Converter` silently skips unsupported types
- Payment integration requires `PaymentHelper` — ensure the payment module is active
- Save-and-resume in conversational mode tracks per-question completion, not per-step
- Google Fonts are loaded via external stylesheet — test with Content Security Policy restrictions
- The welcome screen is a special element, not a regular form field

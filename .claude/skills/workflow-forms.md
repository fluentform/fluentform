# Workflow: Forms, Fields & Submissions

Read this when working on the form builder, field types, form rendering, or submission handling.

## Key Files

- `app/Models/Form.php` — Model (table: `fluentform_forms`)
- `app/Models/Submission.php` — Model (table: `fluentform_submissions`)
- `app/Models/EntryDetails.php` — Model (table: `fluentform_entry_details`, per-field values)
- `app/Models/FormMeta.php` — Model (table: `fluentform_form_meta`, multi-purpose)
- `app/Http/Controllers/FormController.php` — Form CRUD
- `app/Http/Controllers/SubmissionController.php` — Entry management
- `app/Services/Form/FormService.php` — Form business logic
- `app/Services/Form/FormValidationService.php` — Validation orchestration
- `app/Services/Form/SubmissionHandlerService.php` — Main submission pipeline
- `app/Services/FormBuilder/BaseFieldManager.php` — Field type registration base
- `app/Services/FormBuilder/Components/` — Field type renderers
- `app/Services/FormBuilder/ShortCodeParser.php` — Submission data to shortcodes
- `app/Services/Parser/Form.php` — Field parser
- `app/Services/ConditionAssesor.php` — Conditional logic evaluator
- `app/Modules/Form/FormFieldsParser.php` — Facade for Form parser
- `app/Modules/Form/FormHandler.php` — Form lifecycle operations
- `resources/assets/admin/views/FormEditor.vue` — Form builder UI
- `resources/assets/admin/store/` — Vuex store for editor state
- `resources/assets/public/form-submission.js` — Frontend form submit handler
- `resources/assets/public/fluentform-advanced.js` — Conditionals, calculations, repeaters

## Data Model

```
Form (fluentform_forms)
  ├── submissions() → hasMany Submission
  ├── formMeta() → hasMany FormMeta
  ├── entryDetails() → hasMany EntryDetails
  ├── formAnalytics() → hasMany FormAnalytics
  └── logs() → hasMany Log

Submission (fluentform_submissions)
  ├── form() → belongsTo Form
  ├── user() → belongsTo User (WordPress)
  ├── submissionMeta() → hasMany SubmissionMeta
  ├── entryDetails() → hasMany EntryDetails
  └── logs() → hasMany Log
```

**Key columns on Form:** `title`, `status` ('published'|'Draft'), `type` ('form'|'post'|'conversational'), `form_fields` (JSON), `appearance_settings` (JSON), `has_payment` (boolean), `conditions` (JSON), `created_by`

**Key columns on Submission:** `form_id`, `serial_number`, `response` (JSON — all field values), `status` ('read'|'unread'|'spam'|'trashed'), `is_favourite`, `user_id`, `browser`, `device`, `ip`, `city`, `country`, payment columns (`payment_status`, `payment_method`, `currency`, `payment_total`, `total_paid`)

## Form Types

| Type | Storage | Rendering |
|------|---------|-----------|
| `form` | `type='form'` in forms table | PHP server-render + jQuery |
| `post` | `type='post'` — creates WordPress posts on submit | Same rendering |
| `conversational` | `type='conversational'` + `is_conversion_form` in form_meta | Separate frontend via `FluentConversational/` |

## Form Fields Architecture

Form fields are stored as JSON in `fluentform_forms.form_fields`. Each field is a JSON object with:
```json
{
  "element": "input_text",
  "attributes": { "name": "field_name", "type": "text", ... },
  "settings": { "label": "Label", "validation_rules": {...}, "conditional_logics": {...} },
  "editor_options": { ... }
}
```

### Field Type Registration

Field types registered via `BaseFieldManager` subclasses in `app/Services/FormBuilder/Components/`:

| Component | Field Types |
|-----------|------------|
| `Text.php` | input_text, input_email, input_url, input_number, input_password, input_hidden |
| `TextArea.php` | textarea |
| `Select.php` | select, multi_select |
| `Checkable.php` | input_radio, input_checkbox |
| `DateTime.php` | input_date, datetime |
| `Rating.php` | ratings |
| `TabularGrid.php` | tabular_grid |
| `Address.php` | address |
| `Name.php` | input_name |
| `SelectCountry.php` | select_country |
| `TermsAndConditions.php` | terms_and_condition |
| `SubmitButton.php` | submit_button |
| `CustomSubmitButton.php` | custom_submit_button |
| `CustomHtml.php` | custom_html |
| `Recaptcha.php` | recaptcha |
| `Hcaptcha.php` | hcaptcha |
| `Turnstile.php` | turnstile |

### Field Rendering Pipeline

1. Form HTML generated server-side by `FormBuilder`
2. Each field's `render($data, $form)` method produces HTML
3. Hook: `fluentform/render_item_{element}` allows overriding
4. Output: HTML form with data attributes for JS configuration
5. Frontend JS (`form-submission.js`, `fluentform-advanced.js`) enhances with:
   - AJAX submission
   - Conditional logic show/hide
   - Calculations
   - Repeater fields
   - File uploads
   - Multi-step navigation

## Submission Lifecycle

### 1. Form Submission (SubmissionHandlerService)

```
POST /wp-json/fluentform/v1/form-submit
  or wp_ajax_fluentform_submit
```

1. **Malicious attack prevention:** `preventMaliciousAttacks()`
2. **Restriction checks:** `validateRestrictions()` (entry limits, schedule, login requirement)
3. **Nonce validation:** `validateNonce()`
4. **Captcha validation:** `validateReCaptcha()`, `validateHCaptcha()`, `validateTurnstile()`
5. **Per-field sanitization:** `fluentform/input_data_{element}` filter for each field
6. **Validation rules:** `FormFieldsParser::getValidations()` builds rules, framework validator runs them
7. **Data insertion:**
   - Filter: `fluentform/insert_response_data`
   - Filter: `fluentform/filter_insert_data`
   - Action: `fluentform/before_insert_submission`
   - INSERT into `fluentform_submissions`
   - INSERT per-field into `fluentform_entry_details`
8. **Post-insertion:**
   - Action: `fluentform/submission_inserted` (main hook — integrations subscribe here)
   - Action: `fluentform/submission_inserted_{form_type}_form`
   - Action: `fluentform/before_form_actions_processing`
9. **Notifications:** `fluentform/notify_on_form_submit`
10. **Confirmation:**
    - Action: `fluentform/before_submission_confirmation`
    - Filter: `fluentform/form_submission_confirmation`
    - Returns confirmation message, redirect URL, or custom page

### Confirmation Types

```php
Form::getFormsDefaultSettings()['confirmation'] = [
    'redirectTo' => 'samePage' | 'customPage' | 'customUrl',
    'messageToShow' => 'Thank you message',
    'samePageFormBehavior' => 'hide_form' | 'show_form',
    'customPage' => page_id,
    'customUrl' => 'https://...'
];
```

## Conditional Logic

**Service:** `ConditionAssesor` (`app/Services/ConditionAssesor.php`)

**Two condition types:**
- **Group conditions:** Multiple groups with OR between groups, AND within each group
- **Simple conditions:** 'any' (OR) or 'all' (AND) logic

**Operators:** `=`, `!=`, `>`, `<`, `>=`, `<=`, `startsWith`, `endsWith`, `contains`, `doNotContains`, `length_equal`, `length_less_than`, `length_greater_than`

Evaluated both server-side (PHP, for submission processing) and client-side (JS, for field visibility in `fluentform-advanced.js`).

## Form Restrictions

Configurable in form settings (`Form::getFormsDefaultSettings()['restrictions']`):

| Restriction | Config Key | Purpose |
|------------|-----------|---------|
| Entry limit | `limitNumberOfEntries` | Max submissions per period |
| Schedule | `scheduleForm` | Open/close dates, specific days |
| Login required | `requireLogin` | Only logged-in users |
| Deny empty | `denyEmptySubmission` | Block empty submissions |
| IP/Country/Keyword | `restrictForm` | Block by IP, country, or keywords |

## Common Tasks

### Adding a new field type

1. Create class extending `BaseFieldManager` in `app/Services/FormBuilder/Components/`
2. Set `$key`, `$title`, `$tags`, `$position`
3. Implement `getComponent()` — returns field config for editor palette
4. Implement `render($data, $form)` — returns field HTML
5. Constructor auto-registers via hooks: `fluentform/editor_components`, `fluentform/render_item_{$key}`
6. Add frontend handling in `fluentform-advanced.js` if field needs JS behavior
7. Add validation rules support if needed

### Adding a form setting

1. Add default value to `Form::getFormsDefaultSettings()` or relevant section
2. Handle in `FormSettingsController::saveGeneral()` with proper sanitization
3. Update Vue settings component in `resources/assets/admin/views/Settings.vue`
4. If stored in `fluentform_form_meta`, use the `FormMeta` model with appropriate `meta_key`

### Working with submission data

```php
// Get submission with all related data
$submission = Submission::with(['form', 'submissionMeta', 'entryDetails'])->find($entryId);

// Access the JSON response (all field values)
$response = json_decode($submission->response, true);

// Get individual field values from entry_details
$details = EntryDetails::where('submission_id', $entryId)->get();

// Parse submission into shortcodes for emails/confirmations
$parsed = ShortCodeParser::parse($template, $submission, $formData, $form);
```

# Architecture

Read this to understand FluentForm's structure, models, routes, and frontend organization.

## Backend Structure

```
app/
├── Api/                    # Public PHP API (Form, Submission facades)
├── Helpers/                # Static utility helpers (Helper, Str, Traits)
├── Hooks/                  # WordPress hooks (actions.php, filters.php, Ajax.php)
│   └── Handlers/           # ActivationHandler, DeactivationHandler, GlobalNotificationHandler
├── Http/
│   ├── Controllers/        # 19 REST API controllers
│   ├── Policies/           # 8 authorization policies
│   ├── Requests/           # Request validation classes
│   └── Routes/api.php      # All REST route definitions
├── Models/                 # Eloquent-style ORM models
├── Modules/                # 25+ feature modules (Form, Entries, Payments, Integrations, etc.)
├── Services/               # Business logic (25+ service directories)
└── Views/                  # PHP view templates
```

## REST API Route Groups (50+ routes)

| Prefix | Policy | Controller(s) | Key Endpoints |
|--------|--------|----------------|---------------|
| `/forms` | FormPolicy | FormController | CRUD, templates, duplicate, convert |
| `/forms/{form_id}` | FormPolicy | FormController | find, update, delete, resources, fields |
| `/settings/{form_id}` | FormPolicy | FormSettingsController | general, customizer, conversational-design, presets |
| `/submissions` | SubmissionPolicy | SubmissionController | index, bulk-actions, print, all |
| `/submissions/{entry_id}` | SubmissionPolicy | SubmissionController + LogController | find, status, favorite, logs, notes |
| `/logs` | SubmissionPolicy | LogController | filters, list, delete |
| `/integrations` | FormPolicy | GlobalIntegrationController | list, update, update-status |
| `/integrations/{form_id}` | FormPolicy | FormIntegrationController | form-integrations, CRUD |
| `/global-settings` | GlobalSettingsPolicy | GlobalSettingsController | get, save |
| `/roles` | RoleManagerPolicy | RolesController | list, addCapability |
| `/managers` | RoleManagerPolicy | ManagersController | list, add, remove, getUsers |
| `/analytics/{form_id}` | FormPolicy | AnalyticsController | reset |
| `/form-submit` | SubmissionPolicy | SubmissionHandlerController | form submission handler |
| `/report/*` | ReportPolicy | ReportController | charts, revenue, completion, heatmaps |
| `/global-search` | FormPolicy | GlobalSearchController | search across forms |

## Models → Tables

| Model | Table | Key Relationships |
|-------|-------|-------------------|
| Form | `fluentform_forms` | hasMany(Submission), hasMany(FormMeta), hasMany(EntryDetails), hasMany(FormAnalytics), hasMany(Log) |
| Submission | `fluentform_submissions` | belongsTo(Form), belongsTo(User), hasMany(SubmissionMeta), hasMany(Log), hasMany(EntryDetails) |
| Entry | `fluentform_submissions` | Alias for Submission (legacy compatibility) |
| FormMeta | `fluentform_form_meta` | belongsTo(Form) — stores notifications, integrations, settings |
| SubmissionMeta | `fluentform_submission_meta` | belongsTo(Submission) |
| EntryDetails | `fluentform_entry_details` | Individual field values per submission |
| FormAnalytics | `fluentform_form_analytics` | Tracks views, conversions per form |
| Log | `fluentform_logs` | Audit/activity logs |
| Scheduler | `fluentform_scheduled_actions` | Async task queue |

### Key Table: `fluentform_submissions`

Most complex table. Key columns:
- `form_id`, `serial_number`, `response` (JSON), `status` ('read'|'unread'|'spam'|'trashed')
- `is_favourite`, `user_id`, `browser`, `device`, `ip`, `city`, `country`
- Payment columns: `payment_status`, `payment_method`, `payment_type`, `currency`, `payment_total`, `total_paid`
- Composite indexes: `form_id_status`, `form_id_created_at`

### Key Table: `fluentform_form_meta`

Multi-purpose metadata table. Common `meta_key` values:
- `notifications` — Email notification configs (JSON array)
- `formSettings` — Form-level settings
- `advancedValidationSettings` — Conditional validation rules
- Integration names (e.g., `mailchimp`, `slack`) — Integration configs
- `is_conversion_form` — Conversational form flag
- `_entryColumns` — Custom entry list columns

## Frontend Structure

```
resources/assets/
├── admin/                      # Vue 2 admin apps
│   ├── editor_app.js           # Form editor entry → fluent-forms-editor.js
│   ├── all_forms_app.js        # Forms list entry → fluent-all-forms-admin.js
│   ├── form_settings_app.js    # Form settings entry → form_settings_app.js
│   ├── form_entries_app.js     # Entries list entry → form_entries.js
│   ├── payment_entries.js      # Payment entries → payment_entries.js
│   ├── AllEntries/all-entries.js # All entries → all_entries.js
│   ├── Reports/reports.js      # Reports → reports.js
│   ├── settings/global_settings.js # Global settings → fluentform-global-settings.js
│   ├── transfer/transfer.js    # Import/export → fluentform-transfer.js
│   ├── store/                  # Vuex store (index.js, mutations.js, actions.js, getters.js)
│   ├── views/                  # Page-level Vue components
│   ├── components/             # Reusable Vue components
│   ├── css/                    # SASS/LESS styles
│   ├── Rest.js                 # REST API client
│   ├── Request.js              # HTTP request handler
│   ├── helpers.js              # Lodash utils, date formatting, UI helpers
│   ├── editor_mixins.js        # Shared editor mixin
│   ├── notifier.js             # Toast: $success, $fail, $message
│   └── Acl.js                  # Permission checking
├── public/                     # Frontend form scripts (jQuery-based)
│   ├── form-submission.js      # Form submit AJAX handler
│   ├── fluentform-advanced.js  # Conditionals, calculations, repeaters, file upload
│   ├── payment_handler.js      # Payment processing
│   ├── form-save-progress.js   # Save & resume
│   └── transactions_ui.js      # Transaction management
└── elementor/                  # Elementor widget integration
```

### Vuex Store

Single root store at `resources/assets/admin/store/`:

```javascript
{
  fieldMode: 'add' | 'edit',
  sidebarLoading: boolean,
  editorShortcodes: {},
  editorComponents: {},          // Available field types
  editorDisabledComponents: {},  // Pro-only field types
  postMockList: [],              // Field template mocks
  taxonomyMockList: [],
  generalMockList: [],
  advancedMockList: [],
  paymentsMockList: [],
  containerMockList: [],
  isMockLoaded: boolean
}
```

### Admin API Client

REST client at `resources/assets/admin/Rest.js`:
```javascript
FluentFormsGlobal.$rest.get(route, data)    // GET
FluentFormsGlobal.$rest.post(route, data)   // POST
FluentFormsGlobal.$rest.put(route, data)    // PUT (→ POST + header)
FluentFormsGlobal.$rest.delete(route, data) // DELETE (→ POST + header)
```

Base URL from `window.fluent_forms_global_var.rest.url`, auth via `X-WP-Nonce`.

Legacy AJAX: `FluentFormsGlobal.$get(data)` / `FluentFormsGlobal.$post(data)` via `admin-ajax.php`.

## Modules Overview (18 directories + standalone module classes)

| Module | Purpose |
|--------|---------|
| Form/ | Core form handling, defaults, settings, submission processing |
| Component/ | Frontend form rendering and asset loading |
| Entries/ | Entry management views and logic |
| Payments/ | Payment processing (Stripe, PayPal, etc.) |
| SubmissionHandler/ | Submission pipeline orchestration |
| AI/ | AI-powered features |
| ReCaptcha/ | Google reCAPTCHA integration |
| HCaptcha/ | hCaptcha integration |
| Turnstile/ | Cloudflare Turnstile integration |
| Report/ | Reporting dashboards and charts |
| Registerer/ | Admin menu and script registration |
| Renderer/ | Template rendering |
| ACL/ | Access control and capability management |
| CLI/ | WP-CLI commands |
| Transfer/ | Import/export forms and entries |
| Track/ | Event tracking |
| Logger/ | Activity logging |
| Widgets/ | Dashboard widgets |
| *AddOnModule.php* | Suggested plugins/addons management |
| *DocumentationModule.php* | Documentation links |
| *EditorButtonModule.php* | TinyMCE editor button |
| *ProcessExteriorModule.php* | External form processing |
| *DashboardWidgetModule.php* | WP dashboard widget |

## Global Helpers (PHP)

```php
wpFluentForm()              // Get Application instance
wpFluentForm('db')          // Get database instance
wpFluentForm('request')     // Get request object
wpFluent()                  // Database query builder
fluentFormSanitizer()       // Recursive input sanitizer
fluentValidator()           // Create validator instances
fluentFormMix($path)        // Asset path via mix-manifest.json
```

## Initialization Sequence

1. WordPress loads `fluentform.php`
2. Composer autoloader → `boot/app.php` → creates Application
3. `boot/bindings.php` — Service container bindings (FormBuilder, Components, AsyncRequest)
4. `boot/globals.php` — Global helper functions
5. `plugins_loaded` → loads `app/Hooks/actions.php`, `filters.php`, `Ajax.php`
6. Loads FluentConversational + Action Scheduler
7. Fires `fluentform/loaded`
8. `admin_init` → registers scripts, admin bar, AI, reports
9. REST routes registered via `app/Http/Routes/api.php`

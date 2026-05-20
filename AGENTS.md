# FluentForm Plugin — Architecture for AI Agents

**Purpose:** Complete structural reference for AI agents (Claude, Codex, etc.) to understand the FluentForm codebase before making changes.

**Quick Links:**
- [Plugin Root & Bootstrap](#1-plugin-root--bootstrap)
- [Models & Database](#2-models--database)
- [Controllers & REST API](#3-controllers--rest-api)
- [Form Submission Flow](#6-form-submission-flow)
- [Form Rendering Pipeline](#7-form-rendering-pipeline)
- [Safety Rules](#12-safety-rules-for-ai-agents)

---

## 1. Plugin Root & Bootstrap

**Entry point:** `fluentform.php` (version 6.2.3 — check version constant `FLUENTFORM_VERSION`)

**Bootstrap sequence:**
```
fluentform.php
  ├─ Defines: FLUENTFORM, FLUENTFORM_DIR_PATH, FLUENTFORM_VERSION
  ├─ Requires: boot/MbstringFallback.php, boot/app.php, vendor/autoload.php
  └─ On plugins_loaded: boot/app.php closure executes
       ├─ Registers activation/deactivation hooks
       ├─ Fires: fluentform/loaded hook (passes $app to Pro, add-ons)
       ├─ Boots: FluentConversational (conversational form engine)
       ├─ Boots: Action Scheduler (async integration queue)
       └─ Loads: app/Hooks/actions.php + filters.php (all hook wiring)
```

**Supporting boot files:**
- `boot/bindings.php` — IoC container bindings (`formBuilder`, `components`, `fluentFormAsyncRequest`)
- `boot/globals.php` — Global helper functions (`wpFluentForm()`, `wpFluent()`, `fluentFormMix()`, `fluentFormSanitizer()`, etc.)
- `config/app.php` — REST namespace: `fluentform/v1`
- `config/middleware.php` — Middleware stack

**Framework:** Custom MVC built on WPFluent (`vendor/wpfluent/framework/`). Key subsystems:
- `Foundation\Application` — IoC container + service locator
- `Http\Router` — REST route registration with policy middleware
- `Database\Query` — Eloquent-inspired query builder wrapping `$wpdb`
- `Validator` — Field validation engine
- `Support\Arr` — Array utility helper (used everywhere)

---

## 2. Models & Database

All models extend `app/Models/Model.php` (lightweight ORM base).

### ORM Models

| Class | Table | Relationships |
|-------|-------|----------------|
| **Form** | `{prefix}fluentform_forms` | hasMany: FormMeta, Submission, SubmissionMeta, EntryDetails, FormAnalytics, Log, Transaction, OrderItem |
| **FormMeta** | `{prefix}fluentform_form_meta` | belongsTo: Form (per-form settings, notifications, integrations as key/value) |
| **Submission** | `{prefix}fluentform_submissions` | belongsTo: Form, User; hasMany: SubmissionMeta, Log, EntryDetails, Transaction, Subscription, OrderItem |
| **SubmissionMeta** | `{prefix}fluentform_submission_meta` | belongsTo: Submission (via `response_id`; API logs, uid hash, action flags) |
| **EntryDetails** | `{prefix}fluentform_entry_details` | belongsTo: Form, Submission (normalized field values for reporting/filtering) |
| **FormAnalytics** | `{prefix}fluentform_form_analytics` | belongsTo: Form (view/conversion counts per form) |
| **Log** | `{prefix}fluentform_logs` | linked via `parent_source_id` (form) or `source_id` (submission; integration/API activity) |
| **Transaction** | `{prefix}ff_transactions` | belongsTo: Form, Submission (payment module) |
| **Subscription** | `{prefix}ff_order_subscriptions` | belongsTo: Submission (payment module) |
| **OrderItem** | `{prefix}ff_order_items` | belongsTo: Form, Submission (payment module) |
| **Scheduler** | `{prefix}ff_scheduled_actions` | standalone (async integration queue) |
| **User** | WordPress `wp_users` | hasMany: Submission (WordPress users) |

### Key Columns

| Table | Column | Type | Purpose |
|-------|--------|------|---------|
| `fluentform_forms` | `form_fields` | LONGTEXT JSON | Field schema: `{ "fields": [...], "submitButton": {...} }` |
| `fluentform_submissions` | `response` | LONGTEXT JSON | Entire submission as JSON: `{ field_key: value, ... }` |
| `fluentform_submission_meta` | `meta_key` / `meta_value` | VARCHAR / LONGTEXT | API logs, flags, computed values |
| All tables | `created_at`, `updated_at` | TIMESTAMP | Auto-managed by Model base class |

### Deletion Cascade

**NO database-level foreign keys.** All cascade deletes are PHP-side:
- `Form::remove($formId)` — cascades to all related FormMeta, Submissions, Logs, Transactions, etc.
- `Submission::remove($submissionIds)` — cascades to SubmissionMeta, EntryDetails, Logs, etc.

**Critical:** If you add a new table with `form_id` or `submission_id` FK, add manual delete logic to these methods.

---

## 3. Controllers & REST API

**All routes** use REST namespace `fluentform/v1` and **delegate immediately to Services** (thin controller pattern).

### Controller Classes

| Controller | Responsibility | Key Methods |
|-----------|---|---|
| **FormController** | CRUD for forms | `index`, `store`, `find`, `update`, `delete`, `duplicate`, `convert`, `templates`, `resources`, `fields`, `shortcodes` |
| **FormSettingsController** | Per-form settings (confirmations, notifications) | `index`, `general`, `saveGeneral`, `store`, `customizer`, `conversationalDesign` |
| **SubmissionController** | View/manage entries | `index`, `find`, `updateStatus`, `toggleIsFavorite`, `handleBulkActions`, `remove` |
| **SubmissionHandlerController** | **PUBLIC form POST** | `submit()` → calls `SubmissionHandlerService::handleSubmission()` |
| **SubmissionLogController** | Integration activity logs per entry | `get`, `remove` |
| **SubmissionNoteController** | Admin notes on entries | `get`, `store` |
| **FormIntegrationController** | Per-form integration feeds | `index`, `find`, `update`, `delete` |
| **GlobalIntegrationController** | Global integration modules (MailChimp, Slack, etc.) | `index`, `updateIntegration` |
| **GlobalSettingsController** | Plugin-wide settings | `index`, `store` |
| **LogController** | Global activity log | `get`, `remove` |
| **ReportController** | Dashboard charts/stats | `getOverviewChart`, `getRevenueChart`, `getCompletionRate`, `getFormStats`, `netRevenue` |
| **RolesController** | Role/capability management | `index`, `addCapability` |
| **ManagersController** | Per-user form access | `index`, `addManager`, `removeManager` |

### REST Routes

| Method | Endpoint | Policy | Purpose |
|--------|----------|--------|---------|
| GET/POST | `/forms` | FormPolicy | List/create forms |
| GET/POST/DELETE | `/forms/{id}` | FormPolicy | Single form operations (CRUD, duplicate, convert) |
| GET/POST/DELETE | `/settings/{id}` | FormPolicy | Per-form settings |
| GET/POST | `/submissions` | SubmissionPolicy | Entry listing, bulk operations |
| GET/POST | `/submissions/{id}` | SubmissionPolicy | Single entry, notes, logs |
| DELETE | `/logs` | SubmissionPolicy | Delete activity logs |
| GET/POST | `/integrations` | GlobalIntegrationPolicy | Global modules |
| GET/POST/DELETE | `/integrations/{id}` | FormPolicy | Per-form feeds |
| GET/POST | `/global-settings` | GlobalSettingsPolicy | Plugin settings |
| GET/POST | `/roles` | RoleManagerPolicy | Capabilities |
| GET/POST/DELETE | `/managers` | RoleManagerPolicy | User access |
| **POST** | **/form-submit** | SubmissionPolicy | **PUBLIC form submission** ← key endpoint |
| GET/POST | `/report/*` | ReportPolicy | Analytics/charts |

### Policies (Authorization)

Policies check `$policy->verifyRequest()` before EVERY route (method-specific fallbacks exist).

| Policy | Default Check | Key Points |
|--------|---|---|
| **FormPolicy** | `fluentform_forms_manager` cap (on `form_id`) | Protects form operations |
| **SubmissionPolicy** | `fluentform_entries_viewer` (form_id resolved **from DB record**, not request) | Prevents IDOR; fetches real form_id from entry |
| **GlobalIntegrationPolicy** | `fluentform_settings_manager` | Protects global settings |
| **GlobalSettingsPolicy** | `fluentform_settings_manager` | Protects plugin settings |
| **ReportPolicy** | `fluentform_entries_viewer` | Allows report viewing |
| **RoleManagerPolicy** | `fluentform_settings_manager` | Protects role/user access |
| **PublicPolicy** | Always passes | Public endpoints (form submission) |

**Permission hierarchy:**
```
dashboard_access
  ↓
entries_viewer
  ↓
manage_entries
  ↓
forms_manager
  ↓
settings_manager
```

---

## 4. Modules (`app/Modules/`)

18 feature modules + 6 standalone classes. Key ones:

| Module | Purpose |
|--------|---------|
| **Component** | Public form rendering, script/style enqueueing, shortcode `[fluentform]` handler |
| **SubmissionHandler** | REST endpoint wrapper for form submissions |
| **Form** | Form CRUD, spam protection (honeypot, Akismet, CleanTalk), field parsing, form transfer (import/export) |
| **Payments** | Stripe gateway, order management, receipts, subscriptions |
| **Entries** | Entry querying, CSV/Excel export, view management |
| **Acl** | Access control gate; integrates with WordPress roles + FluentForm managers |
| **Registerer** | Admin menu, script/style enqueueing, admin bar items |
| **Track** | Form view/conversion tracking to `fluentform_form_analytics` |
| **Report** | Dashboard analytics data generation |
| **Integrations** | MailChimp, Slack, webhook, notification integrations |
| **HCaptcha, ReCaptcha, Turnstile** | CAPTCHA providers |
| **Widgets** | WP dashboard widgets |
| **Conversational** | Conversational form mode (separate from classic forms) |

---

## 5. Services (`app/Services/`)

All business logic lives in Services. Controllers delegate to them immediately.

| Service | Purpose |
|---------|---------|
| **FormService** | Create/update/delete/duplicate/convert forms |
| **SubmissionHandlerService** | **Core submission pipeline** (validation, spam, notification, save) |
| **FormValidationService** | Field rules, required, unique, spam checks |
| **SubmissionService** | Entry queries, status updates, normalized data recording |
| **FormBuilder** | Renders form HTML from field definitions |
| **ShortCodeParser** | Parses `{input.field_name}` tokens in confirmations, emails |
| **EmailNotification** | Sends notification emails |
| **GlobalNotificationManager** | Orchestrates all integrations after submission |
| **IntegrationManager** | Base class for third-party integrations |
| **FormManagerService** | Per-user form access scoping |
| **HistoryService** | Edit history snapshots |
| **AnalyticsService** | Form view tracking |
| **TransferService** | Import/export forms JSON |
| **ConditionAssessor** | Evaluates conditional logic rules |

---

## 6. Form Submission Flow (Frontend → Database)

```
[Browser POST] admin-ajax.php?action=fluentform_submit
     OR POST /wp-json/fluentform/v1/form-submit
         ↓
[SubmissionHandlerController::submit()] or [wp_ajax_nopriv_fluentform_submit]
    Parse $formId from request
         ↓
[SubmissionHandlerService::handleSubmission($data, $formId)]
    │
    ├─ prepareHandler()
    │   ├─ Form::find($formId) — load form from DB
    │   ├─ FormFieldsParser::getEssentialInputs() — parse field defs
    │   └─ fluentFormSanitizer() — sanitize input by field type
    │
    ├─ handleValidation()
    │   ├─ FormValidationService::validateSubmission() — rules, required, unique
    │   └─ isAkismetSpam() / isCleanTalkSpam() — spam checks
    │
    ├─ isSpamAndSkipProcessing() ← if TRUE: insert with status='spam', return early
    │
    ├─ insertSubmission()
    │   ├─ do_action('fluentform/before_insert_submission', ...) — last chance to reject
    │   ├─ Submission::insertGetId($insertData) — INSERT
    │   └─ Helper::setSubmissionMeta($insertId, '_entry_uid_hash', ...) — post-insert meta
    │
    └─ processSubmissionData($insertId, ...)
        ├─ SubmissionService::recordEntryDetails() — normalize fields for reporting
        ├─ do_action('fluentform/submission_inserted', ...) → [GlobalNotificationHandler::globalNotify()]
        │   └─ All integrations fire here: Email, MailChimp, Slack, webhooks, etc.
        │   └─ Async integrations: scheduled via ff_scheduled_actions table
        └─ getReturnData() → parse confirmation (redirect URL or thank-you message)
             ↓
[JSON response] { insert_id, result: { message | redirectUrl }, error }
```

### Key Hooks/Filters

- `fluentform/insert_response_data` — modify form data before insert
- `fluentform/filter_insert_data` — modify DB row before INSERT
- `fluentform/before_insert_submission` — reject submission or add meta
- **`fluentform/submission_inserted`** — after INSERT, triggers all notifications
- `fluentform/form_submission_confirmation` — override confirmation type
- `fluentform/submission_message_parse` — override thank-you message text

---

## 7. Form Rendering Pipeline (Shortcode → HTML)

```
WordPress post: [fluentform id="5"]
    ↓
[Component::addFluentFormShortCode()] (registered in actions.php)
    add_shortcode('fluentform', callback)
    apply_filters('fluentform/shortcode_defaults', ...)
         ↓
[Component::renderForm($atts)]
    │
    ├─ Form::find($formId) WHERE status='published'
    ├─ Load form->settings from FormMeta
    ├─ Load form->fields from form_fields JSON
    ├─ apply_filters('fluentform/rendering_form', $form)
    ├─ apply_filters('fluentform/is_form_renderable', ...)
    ├─ do_action('fluentform/before_form_render', $form) ← custom CSS/JS loaded here
    │
    ├─ IF conversational type:
    │   └─ FluentConversational\Classes\Form::renderShortcode($form)
    │
    └─ ELSE (classic):
        ├─ FormBuilder::build($form, ...) → HTML string
        └─ wp_enqueue_script('fluent-form-submission') → AJAX config via wp_localize_script
             ↓
[Rendered HTML] buffered into shortcode position
```

**Frontend Assets Loaded:**
- `assets/js/form-submission.js` — AJAX form submit handler (jQuery-based)
- `assets/js/fluentform-advanced.js` — Conditionals, calculations, repeaters, file upload
- `assets/js/payment_handler.js` — Stripe, payment processing
- `assets/js/form-save-progress.js` — Save & resume feature
- Plus: per-form custom CSS/JS from `form_meta` 'custom_css' + 'custom_javascript'

**Asset Loading:**
- `wp_enqueue_scripts` hook: scripts loaded only if post contains `[fluentform]` (tracked via `_has_fluentform` post meta)
- `_has_fluentform` post meta is set on `save_post` by parsing shortcodes/blocks
- If form is embedded programmatically without shortcode, assets may not load

---

## 8. Vue Admin Apps

All Vue 2 (Options API). Mount points in admin pages:

| Entry File | Mount Point | Purpose |
|---|---|---|
| `editor_app.js` | `#ff_form_editor_app` | Drag-and-drop form builder |
| `all_forms_app.js` | `#ff_all_forms_app` | Forms list page |
| `form_settings_app.js` | `#ff_form_settings_app` | Form settings (confirmations, notifications) |
| `form_entries_app.js` | `#ff_form_entries_app` | Entry/submission viewer |
| `payment_entries.js` | `#ff_payment_entries_app` | Payment-specific entries |
| `all_entries.js` | `#ff_all_entries_app` | Global entries across all forms |
| `reports.js` | `#ff_reports_app` | Dashboard analytics |
| `fluentform-global-settings.js` | `#ff_global_settings_app` | Plugin settings |
| `form_preview_app.js` | `#ff_form_preview_app` | Frontend preview iframe |

**Global variables:**
- `window.fluent_forms_global_var.admin_i18n` — i18n strings
- `window.fluent_forms_global_var.rest` — nonce + base URL for REST calls
- `window.fluent_forms_global_var.acl` — current user ACL permissions

**API Client:**
- `FluentFormsGlobal.$rest.get/post/put/del()` — all REST calls
- Vuex store: `resources/assets/admin/store/index.js`
- Component library: Element-UI 2.15

---

## 9. Hooks & Filters (`app/Hooks/`)

Central wiring file: `app/Hooks/actions.php`

### Key Action Groups

| Hook | Fired When | Handler |
|------|---|---|
| `admin_menu` | Admin menu builds | `Menu::register()` |
| `admin_init` | Admin initialized | Script/style registration |
| `init` | WordPress init | Integration boot, payment, token-based spam protection |
| `wp` | Front-end page load | Asset loading from `_has_fluentform` post meta |
| `save_post` | Post saved | Update `_has_fluentform` meta if shortcodes present |
| `fluentform/before_form_render` | Before form renders | Load custom CSS/JS for that form |
| `fluentform/form_element_start` | Inside `<form>` tag | Render honeypot, token, CleanTalk script |
| **`fluentform/before_insert_submission`** | Before DB insert | HoneyPot verify, token verify (priority 9) |
| **`fluentform/submission_inserted`** | After DB insert | `GlobalNotificationHandler::globalNotify()` ← all integrations |
| `fluentform/global_notify_completed` | After all notifications | Password field truncation |
| `fluentform_do_scheduled_tasks` | Every 5 minutes (cron) | Process async integration queue |
| `enqueue_block_editor_assets` | Gutenberg editor | Register Gutenberg block |

### Hook Naming Convention

**All new hooks MUST use `fluentform/` prefix.** Old hooks (e.g., `fluentform_before_form_render`) are deprecated but fired alongside new ones for backward compat via `apply_filters_deprecated()`.

---

## 10. Key File Paths

```
Root
  fluentform.php                        ← Plugin entry point
  webpack.mix.js                        ← Build config
  CLAUDE.md                             ← Developer quick reference

boot/
  app.php                               ← Application factory + bootstrap
  bindings.php                          ← IoC bindings
  globals.php                           ← Global helpers

app/
  Hooks/
    actions.php                         ← All add_action() registrations
    filters.php                         ← All add_filter() registrations
    Ajax.php                            ← Legacy admin-ajax endpoints
  Http/
    Controllers/                        ← 19 REST controllers
    Policies/                           ← 8 authorization policies
    Routes/api.php                      ← All REST routes (50+)
  Models/
    Form.php                            ← Form ORM model
    Submission.php                      ← Submission ORM model
    FormMeta.php                        ← Form settings/meta
  Services/
    Form/SubmissionHandlerService.php   ← Core submission pipeline
    FormBuilder/FormBuilder.php         ← Field rendering engine
    Integrations/                       ← Integration handlers
  Modules/                              ← 18 feature modules
    Component/Component.php             ← Public form render
    Payments/                           ← Payment processing
    Form/                               ← Form CRUD + spam protection
    Acl/Acl.php                         ← Authorization gate

database/
  Migrations/                           ← All 9 migration files
  DBMigrator.php                        ← Migration orchestrator

resources/assets/
  admin/                                ← Vue admin apps
    editor_app.js                       ← Form builder entry
    all_forms_app.js                    ← Forms list entry
  public/                               ← Public frontend JS
    form-submission.js                  ← AJAX submit handler
    fluentform-advanced.js              ← Conditionals, calculations
  public/css/                           ← Public form styles

.claude/
  skills/                               ← Architecture docs
    architecture.md                     ← Detailed architecture reference
    coding-patterns.md                  ← Code patterns + anti-patterns
    workflow-forms.md                   ← Form-specific workflows
    workflow-payments.md                ← Payment module workflows
```

---

## 11. Gutenberg Block & Integrations

### Gutenberg Block (`guten_block/`)
- React 18 (separate from Vue 2 admin apps)
- Block name: `fluent-forms/form-selector`
- Registers form selector dropdown + preview
- Compiled to `assets/js/fluent_gutenblock.js`

### Third-Party Integrations (`app/Modules/`)
- **Email Notifications:** Send on submission
- **MailChimp:** Sync contacts to lists
- **Slack:** Send webhooks
- **HubSpot, Zapier, etc.:** Via webhooks/API
- **Payment:** Stripe (orders, subscriptions, receipts)
- **Spam Protection:** Akismet, CleanTalk, honeypot, CAPTCHA (reCAPTCHA, hCaptcha, Turnstile)

All integrations:
1. Register metadata in `form_meta` 'form_integrations' (per-form) or global settings
2. Fire on `fluentform/submission_inserted` (if immediate) or scheduled in `ff_scheduled_actions` (async)
3. Log results to `fluentform_logs` or `fluentform_submission_meta`

---

## 12. Safety Rules for AI Agents

**ALWAYS follow these rules when making changes:**

### Authorization & Access Control

1. **Never bypass the Policy layer.** All REST routes must go through their designated Policy's `verifyRequest()`.
   - Adding a new route without a policy = unprotected endpoint (security vulnerability).

2. **Submission.form_id must come from DB, not request.** For entry-scoped operations:
   ```php
   // WRONG:  $formId = intval($_GET['form_id']);
   // RIGHT:  $formId = Submission::find($entryId)->form_id;
   ```
   This prevents IDOR (Insecure Direct Object References).

3. **Use `Acl` class as the single auth gate.** Check `Acl::hasPermission()` for custom capability checks. Don't call `current_user_can()` directly if Acl has a helper for it.

### Database & Data Integrity

4. **Cascade deletes are PHP-side, not DB-side.** If adding a table with `form_id` or `submission_id` FK:
   - Add manual DELETE logic to `Form::remove($formId)` and/or `Submission::remove($submissionIds)`
   - No database foreign key constraints are used

5. **Form fields are JSON in `form_fields` column.** Schema: `{ "fields": [...], "submitButton": {...} }`.
   - Always decode/re-encode; never regex find-replace on this column
   - Use `FormFieldsParser` to normalize/validate field schema

6. **Submission responses are JSON in `response` column.** Full submission blob: `{ field_key: value, ... }`.
   - Use `EntryDetails` table for normalized, queryable field values
   - If filtering/reporting, query `fluentform_entry_details`, not `response` JSON

### Hooks & Filters

7. **New hooks must use `fluentform/` prefix.** Old hooks (e.g., `fluentform_foo`) are deprecated.
   - Keep old hooks firing for backward compat via `apply_filters_deprecated()`
   - When touching deprecated hooks, fire both old and new versions

8. **Hook priorities matter.**
   - Spam checks: priority 9 (before insert validation)
   - Global notifications: priority 10 (default, after insert)
   - Custom integrations: priority 20+ (last)

### Form Rendering & Submission

9. **Two submission endpoints coexist:**
   - AJAX: `wp_ajax_nopriv_fluentform_submit` (legacy)
   - REST: `POST /wp-json/fluentform/v1/form-submit` (current)
   - Both call same `SubmissionHandlerService`. Changes must work for both paths.

10. **Asset loading is post-meta driven.** The `_has_fluentform` post meta (set on `save_post`) triggers early asset enqueueing.
    - If forms are embedded programmatically without shortcodes, set this meta manually
    - Shortcodes are parsed on `save_post` to update the meta

### Field Definitions & Editor

11. **Editor element filters run at editor load.** Filters like `fluentform/editor_init_element_{type}` normalize old field schemas to new ones.
    - If adding a new field property, add its default in the filter so old forms don't break
    - Always provide backward-compatible defaults for new field properties

12. **Cron runs every 5 minutes.** Scheduled tasks (async integrations) are processed via `fluentform_do_scheduled_tasks` hook.
    - Add tasks to `ff_scheduled_actions` table with status='pending'
    - The cron handler updates status to 'completed'/'failed' after processing

---

## 13. Common Workflows

### Adding a New Form Setting

1. Add setting key/value to `FormMeta` via `SettingsService::saveSettings()`
2. Add corresponding form API endpoint in `FormSettingsController`
3. Add Policy check (usually `FormPolicy`)
4. Update Vue form settings app if UI needed (`form_settings_app.js`)
5. Apply setting when rendering via `apply_filters('fluentform/rendering_form', $form)`

### Adding a New Integration

1. Create a service class extending `IntegrationManager`
2. Implement `getIntegrationDefaults()`, `notify()`, `trackApiCall()`
3. Register in `GlobalNotificationManager::globalNotify()` via hook
4. Store integration config in `FormMeta` 'form_integrations'
5. Handle async processing via `ff_scheduled_actions` if slow

### Adding a New Field Type

1. Define field schema in `DefaultElements.php` (default values, validation rules)
2. Create `BaseComponent` subclass in `FormBuilder/Components/` to render HTML
3. Register editor element definition for drag-and-drop builder
4. Add validation rule in `FormValidationService`
5. Add to `FormFieldsParser` if special parsing needed

### Modifying Submission Flow

1. Add validation or data modification to `SubmissionHandlerService::handleSubmission()`
2. Use hooks for extensibility:
   - `fluentform/filter_insert_data` — modify row before INSERT
   - `fluentform/before_insert_submission` — reject or add meta
   - `fluentform/submission_inserted` — post-insert processing
3. Test BOTH endpoints: AJAX (`wp_ajax_nopriv_fluentform_submit`) and REST

---

## Related Documentation

- **`.claude/skills/architecture.md`** — Detailed backend architecture, models, routes table
- **`.claude/skills/coding-patterns.md`** — Code patterns, anti-patterns, field validation examples
- **`.claude/skills/workflow-forms.md`** — Form builder, field rendering, form CRUD workflows
- **`.claude/skills/workflow-payments.md`** — Payment processing, Stripe integration, order management
- **`.claude/skills/workflow-integrations.md`** — Integration framework, webhook handling, async processing
- **`PRECOMMIT-WORKFLOW.md`** — Pre-commit validation, agent skills (plugin-audit, debugger)
- **`SETUP-AGENT-SKILLS.md`** — Global agent skill setup (one-time)

---

**Last Updated:** 2026-04-29  
**Plugin Version:** 6.2.3  
**Framework:** WPFluent + Vue 2 Admin + jQuery Public  
**For AI Agents:** Use this doc + corresponding skill files before making changes. When in doubt, check policy authorization first.

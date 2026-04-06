# Coding Patterns

Read this when writing new code or reviewing patterns.

## Controller Pattern

**Canonical example:** `app/Http/Controllers/FormController.php` (clean CRUD).
**Complex example:** `app/Http/Controllers/SubmissionController.php` (bulk actions, filtering).

Key conventions:
- Extend `Controller` base class (from WPFluent Framework)
- Inject services via constructor: `public function __construct(FormService $formService)`
- Access request data via `$this->request->get('param', 'default')`
- Validate with `$this->validate($data, $rules, $messages)` (framework validator)
- Respond with `$this->sendSuccess($data, $code)` or `$this->sendError($data, $code)`
- Return arrays directly (framework handles JSON conversion)
- Fire hooks on mutations: `do_action('fluentform/form_created', $form->id)`
- Use `apply_filters()` on API responses for extensibility

## Policy Pattern

**Location:** `app/Http/Policies/`

8 policies: FormPolicy, SubmissionPolicy, GlobalSettingsPolicy, RoleManagerPolicy, ReportPolicy, and base policies.

```
BasePolicy::verifyRequest()           → checks nonce + basic auth
  └─ FormPolicy::verifyRequest()      → requires fluentform_forms_manager or similar capability
  └─ SubmissionPolicy::verifyRequest() → requires fluentform_entries_viewer capability
  └─ GlobalSettingsPolicy              → requires fluentform_settings_manager
  └─ RoleManagerPolicy                 → requires fluentform_full_access
  └─ ReportPolicy                      → requires fluentform_view_reports
```

Key rules:
- Policies are assigned to route groups in `app/Http/Routes/api.php` via `->withPolicy('PolicyName')`
- ACL system uses custom capabilities: `fluentform_full_access`, `fluentform_forms_manager`, `fluentform_entries_viewer`, `fluentform_settings_manager`, `fluentform_view_reports`
- Permission checks via `Acl::hasPermission($permission)` and `Acl::verifyRequest()`

## Service Pattern

**Location:** `app/Services/` (25+ subdirectories)

Services contain all business logic. Controllers are thin wrappers.

```php
class FormService {
    public function get($attributes)     // List with pagination/filters
    public function store($attributes)   // Create new
    public function find($id)            // Retrieve single
    public function update($attributes)  // Update
    public function delete($id)          // Delete
    public function duplicate($attr)     // Duplicate
}
```

Service locator access:
```php
wpFluentForm()->make(FormService::class)
```

## Vue Component Pattern (Vue 2 Options API)

**Reference files:**
- Form editor: `resources/assets/admin/views/FormEditor.vue`
- Forms list: `resources/assets/admin/views/AllForms.vue`
- Entry view: `resources/assets/admin/views/Entry.vue`

Conventions:
- Vue 2 Options API (`data`, `computed`, `methods`, `watch`)
- Element UI 2.15 components: `el-button`, `el-dialog`, `el-table`, `el-form`, `el-select`, etc.
- Shared editor mixin: `editor_mixins.js` for form editing features
- Notifications: `this.$success('message')`, `this.$fail('message')` via `notifier.js`
- Permission checks: `Acl.hasPermission('fluentform_forms_manager')`
- Drag-and-drop: `vddl` library for field reordering in editor

## Frontend API Calls

**Admin REST client** (`resources/assets/admin/Rest.js`):
```javascript
FluentFormsGlobal.$rest.get('forms', { page: 1, per_page: 20 })
FluentFormsGlobal.$rest.post('forms', payload)
FluentFormsGlobal.$rest.put('forms/' + id, data)       // → POST + X-HTTP-Method-Override
FluentFormsGlobal.$rest.delete('forms/' + id)           // → POST + X-HTTP-Method-Override
```

**Legacy AJAX** (`resources/assets/admin/fluent_forms_global.js`):
```javascript
FluentFormsGlobal.$get({ action: 'fluentform_action', route: 'route_name' })
FluentFormsGlobal.$post({ action: 'fluentform_action', data: payload })
```

Base URL: `window.fluent_forms_global_var.rest.url`
Nonce: `window.fluent_forms_global_var.rest.nonce` via `X-WP-Nonce` header.

## Vuex Store Pattern

Single root store at `resources/assets/admin/store/`:

Key patterns:
- Store uses `new Vuex.Store({ state, getters, mutations, actions })`
- No modules — single flat store
- Actions load field resources via REST API
- State tracks editor mode, available components, and field templates
- Components access store via `this.$store.state.*` and `this.$store.commit('mutation')`

## Form Field Registration Pattern

Field types are registered via `BaseFieldManager` (`app/Services/FormBuilder/BaseFieldManager.php`):

```php
class MyField extends BaseFieldManager {
    protected $key = 'my_field';
    protected $title = 'My Field';
    protected $tags = ['basic'];
    protected $position = 'general';

    function getComponent()    // Returns field definition for editor
    function render($data, $form)  // Returns field HTML for frontend
}
```

Registration happens via WordPress hooks in constructor:
- `fluentform/editor_components` — adds field to editor palette
- `fluentform/render_item_{$key}` — renders field HTML
- `fluentform/form_input_types` — registers field type

## Hook Convention

**Action hooks:**
```php
do_action('fluentform/loaded');
do_action('fluentform/submission_inserted', $submission, $entryId, $form);
do_action('fluentform/before_form_validation', $formData, $form);
do_action('fluentform/notify_on_form_submit', $entryId, $formData, $form);
```

**Filter hooks:**
```php
apply_filters('fluentform/rendering_form', $form);
apply_filters('fluentform/insert_response_data', $formData, $formId, $form);
apply_filters('fluentform/validation_error', $errors, $formData, $form, $fields);
apply_filters('fluentform/input_data_{element}', $value, $field, $formData, $form);
```

**Deprecated hooks** still work but use old prefix: `fluentform_*` → `fluentform/*`

## Security Checklist

Apply to ALL new code:

- [ ] `sanitize_text_field()` on all text input
- [ ] `intval()` / `absint()` on all numeric input
- [ ] `sanitize_url()` on URL fields
- [ ] `wp_kses_post()` on HTML content
- [ ] `fluentFormSanitizer()` for recursive data sanitization
- [ ] Policy method exists for every destructive controller action
- [ ] Destructive operations use POST/DELETE, not GET
- [ ] `do_action()` fired on create/update/delete for extensibility
- [ ] All user-facing strings wrapped in `__('', 'fluentform')` (PHP) or `$t()` (Vue)
- [ ] No raw SQL — use `wpFluent()` query builder or model ORM
- [ ] ACL capability check for admin-only features

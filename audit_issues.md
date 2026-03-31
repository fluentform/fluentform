# FluentForm Audit — Remaining Findings (Deep Verification)

Audited: 2026-03-31 | Branch: `dev` | Source: [PR Analytics Audit Report](https://pr-analytics.autharif.com/audits/fluentform)

All four findings below were flagged as HIGH severity but verified as **non-issues** after tracing actual code paths.

---

## HIGH-05: `$this->app` in background process closures

- **File:** `app/Hooks/Ajax.php:184–189`
- **Audit Claim:** `$this` is undefined in a procedural closure, causing fatal error. Background processing is broken.
- **Verdict: NOT A BUG**

### Why It's Not An Issue

`Ajax.php` is included via this chain:
1. `Application::requireCommonFiles($this)` — class method, `$this` = Application instance
2. → `require_once 'app/Hooks/includes.php'` — `$this` inherited
3. → `include_once 'Ajax.php'` — `$this` still inherited

PHP makes `$this` available to any code included within a class method context. So in Ajax.php:
- `$this` refers to the Application instance
- `$this->app` resolves via `__get('app')` → `offsetGet('app')` → the Application itself
- `$this->app['fluentFormAsyncRequest']` correctly resolves the bound service from `boot/bindings.php`
- `$this->app` and `$app` are the same object (`requireCommonFiles($app)` receives `$this`)

The code is functionally correct — just stylistically inconsistent with every other closure in the same file that uses `use ($app)`.

---

## HIGH-04: Missing validation_rules sanitization in Form.php

- **File:** `app/Modules/Form/Form.php:430–500`
- **Audit Claim:** `Form.php::sanitizeFieldMaps()` missing `validation_rules` sanitization that `Updater.php` has. Stored XSS via this code path.
- **Verdict: NOT EXPLOITABLE (dead code path)**

### Why It's Not An Issue

1. **All active form update routes go through `Updater.php`**, not `Form.php`:
   - REST API: `FormController::update()` → `FormService::update()` → `Updater::update()` ✅ has sanitization
   - AJAX fallback: `wp_ajax_fluentform-form-update` → `FormService::update()` → `Updater::update()` ✅ has sanitization

2. **`Form.php::sanitizeFieldMaps()` is legacy code** — not called by any current save path. `Form.php::update()` exists but is never invoked by any route or hook.

3. **Defense in depth at render time**: Even if unsanitized data were somehow stored, `FormValidationService` re-escapes validation messages with `fluentform_sanitize_html()` before rendering to users.

---

## HIGH-12: Unescaped `$note->value` in submission print

- **File:** `app/Services/Submission/SubmissionPrint.php:61`
- **Audit Claim:** `$note->value` concatenated raw into HTML. Stored XSS risk.
- **Verdict: NOT EXPLOITABLE (sanitized on write + wrapped on read)**

### Why It's Not An Issue

Notes are sanitized at multiple layers before they could reach this code:

1. **Controller** (`SubmissionNoteController.php:37`): `wp_kses_post($content)` before passing to service
2. **Service** (`SubmissionService.php:549`): `sanitize_textarea_field($content)` — strips ALL HTML tags before database insert
3. **Output wrapper** (`SubmissionPrint.php:28`): `fluentform_sanitize_html()` wraps the entire output with `wp_kses()` + event handler removal

The raw concatenation at line 61 is poor style but not exploitable — data is plain text by the time it reaches the database.

---

## HIGH-10: FormController::update() passes unsanitized request

- **File:** `app/Http/Controllers/FormController.php:118–133`
- **Audit Claim:** `$request->all()` passed raw unlike `store()` which sanitizes. Mass assignment risk.
- **Verdict: NOT EXPLOITABLE (downstream whitelist prevents it)**

### Why It's Not An Issue

`Updater::update()` builds an **explicit `$data` array** with only these keys:

```php
$data = [
    'title'      => sanitize_text_field($title),
    'status'     => sanitize_text_field($status),
    'updated_at' => current_time('mysql'),
];
// form_fields added conditionally, sanitized via sanitizeFields()
```

Only this `$data` array is passed to `$form->fill()->save()`. Extra request attributes (`type`, `has_payment`, `conditions`, etc.) are never extracted and never reach the database. The unsanitized `$attributes` array is used only as a source for `Arr::get()` calls on specific keys.

---

## Summary

| Finding | Surface Pattern | Deep Verification | Real Risk |
|---------|----------------|-------------------|-----------|
| HIGH-05 | `$this` in closure | `$this` is valid (included in class method) | None |
| HIGH-04 | Missing sanitization | Dead code path, never called | None |
| HIGH-12 | Raw concatenation | Sanitized on write, wrapped on read | None |
| HIGH-10 | Raw `$request->all()` | Downstream builds explicit field list | None |

All four findings are **false positives** caused by surface-level pattern matching without tracing actual execution paths, code reachability, and downstream protections.

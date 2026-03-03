# Workflow: Bug Fixing & Security Patching

Read this before starting any bug fix or security patch.

## Bug Fix Process

### 1. Reproduce First

- Identify the controller/method: search `app/Http/Routes/api.php` for the route
- Trace: route → policy → controller → service → model
- Check if the feature is in the free plugin or Pro-only (Pro has its own plugin)

### 2. Find the Root Cause

Use the Grep tool (not bash grep). Common searches:

```
# Find the API endpoint handler
Pattern: "route_segment"  File: app/Http/Routes/api.php

# Find where a hook fires
Pattern: "do_action.*fluentform/submission"  Path: app/

# Find where a hook is listened to
Pattern: "add_action.*fluentform/submission"  Path: app/

# Find model usage
Pattern: "Submission::"  Path: app/

# Find frontend API calls
Pattern: "\\$rest\\.get\\('forms"  Path: resources/  Glob: "*.{vue,js}"

# Find where PHP data is passed to JS
Pattern: "fluent_forms_global_var"  Path: app/

# Find form field rendering
Pattern: "render_item_"  Path: app/Services/FormBuilder/
```

### 3. Fix with Minimal Impact

- Fix the root cause, not the symptom
- Keep changes as small as possible
- Don't refactor unrelated code
- If touching `fluentform_form_meta`, remember it stores multiple types of data — always filter by `meta_key`
- If touching submissions, remember the composite indexes (`form_id_status`, `form_id_created_at`) — don't add queries that bypass these

### 4. Verify

- [ ] `npm run production` passes (no PHPCS — no PHP linter)
- [ ] Original bug is fixed
- [ ] No regressions in related functionality
- [ ] Edge cases handled (empty arrays, null values, missing records)

## Security Patching Process

### Identify the Vulnerability Type

| Type | What to look for | Fix pattern |
|------|-----------------|-------------|
| **SQL Injection** | Raw user input in queries | `$wpdb->prepare()`, `wpFluent()` query builder |
| **XSS** | Unsanitized output in HTML/JS | `esc_html()`, `esc_attr()`, `wp_kses_post()` |
| **Broken Auth** | Missing policy method | Add capability check in Policy class |
| **IDOR** | No ownership check | Verify submission belongs to expected form/user |
| **SSRF** | User URLs in `wp_remote_get()` | Validate URL, block private IPs |
| **CSRF** | Missing nonce | REST API uses `X-WP-Nonce` automatically |
| **File Upload** | Unrestricted file types | Validate extensions, use `wp_check_filetype()` |

### Security Fix Checklist

- [ ] Identify ALL instances of the vulnerability (grep the whole codebase)
- [ ] Check both free and Pro codebases
- [ ] Correct sanitization function for the data type
- [ ] Policy/ACL checks exist for destructive actions
- [ ] Test with a non-admin user (subscriber or form manager role)

### Common Pitfalls

**1. Form meta stores everything.** `fluentform_form_meta` stores notifications, integrations, settings, custom columns, conversational flags — all keyed by `meta_key`. Always include `meta_key` in queries.

**2. Submission response is JSON.** The `response` column in `fluentform_submissions` is a JSON-encoded object. Don't try to query individual field values from it directly — use `fluentform_entry_details` for per-field lookups.

**3. ACL capabilities are custom.** FluentForm uses its own capability system (`fluentform_full_access`, `fluentform_forms_manager`, etc.), not standard WordPress `edit_posts` capabilities. Check via `Acl::hasPermission()`.

**4. Deprecated hook names.** Old hooks use `fluentform_*` prefix (underscore), new hooks use `fluentform/*` prefix (slash). Both fire. If fixing a hook-related bug, check both patterns.

**5. Multiple entry points.** Forms can be submitted via:
- REST API (`/wp-json/fluentform/v1/form-submit`)
- AJAX (`wp_ajax_fluentform_submit`)
- Both go through `SubmissionHandlerService` but validation paths may differ.

**6. Payment submissions.** Forms with `has_payment = 1` have a different submission flow. Payment-related hooks fire additionally. Don't assume all submissions follow the same path.

**7. Conversational forms.** These use a separate rendering system (`FluentConversational/`) but share the same submission pipeline. Frontend JS is different though.

## After Fixing

- Run `npm run production` for changed JS/Vue files
- Document what was fixed and why in your commit message
- For security fixes, note the vulnerability type and severity

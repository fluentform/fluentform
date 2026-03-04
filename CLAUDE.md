# CLAUDE.md

## Build Commands

```bash
npm install               # Install dependencies
npm run dev               # Laravel Mix compile (development)
npm run watch             # Watch & recompile on changes
npm run production        # Minified production build
composer install          # PHP dependencies (WPFluent framework, OpenSpout)
```

## Architecture

FluentForm is a WordPress form builder plugin. Backend uses the WPFluent framework (shared with FluentCRM/FluentCommunity). Admin UI is Vue 2 SPA. Public forms are server-rendered PHP + jQuery.

- **Backend:** PHP, WPFluent Framework, Eloquent-style ORM, policy-based auth
- **Admin UI:** Vue 2 (Options API), Vuex, Element UI 2.15, Laravel Mix (Webpack)
- **Public Forms:** PHP-rendered HTML + jQuery, no Vue/React on frontend
- **REST API:** `fluentform/v1` — 50+ routes across 12 groups in `app/Http/Routes/api.php`
- **Database:** Custom tables with `fluentform_` prefix. 8 tables (forms, submissions, entry_details, form_meta, submission_meta, form_analytics, logs, scheduled_actions)
- **Modules:** 18 feature modules in `app/Modules/` (Form, Entries, Payments, Component, Registerer, ACL, AI, Transfer, HCaptcha, ReCaptcha, Turnstile, etc.) + standalone module classes
- **Gutenberg Block:** React 18 in `guten_block/`

### Entry Points

`fluentform.php` → `boot/app.php` (creates Application, loads hooks) → `app/Hooks/actions.php` + `filters.php`

Admin mounts multiple Vue apps: form editor, all forms, entries, settings, reports — each a separate entry point compiled to `assets/js/`.

## Coding Rules

1. **Vue 2 Options API only** — no Composition API. Use `data()`, `computed`, `methods`, `watch`
2. **Sanitize all input** — `sanitize_text_field()`, `intval()`, `sanitize_url()`, `wp_kses_post()`
3. **Hook prefix:** `fluentform/` (e.g., `do_action('fluentform/submission_inserted', $submission, $entryId, $form)`)
4. **Text domain:** `fluentform`. PHP: `__('text', 'fluentform')`. JS: uses `$t()` global
5. **REST method override:** PUT/PATCH/DELETE sent as POST with `X-HTTP-Method-Override` header
6. **Global helpers:** `wpFluentForm()` (app instance), `wpFluent()` (DB query builder), `fluentFormSanitizer()` (recursive sanitizer)
7. **Element UI 2.15** for admin components: `el-button`, `el-dialog`, `el-table`, `el-form`, etc.
8. **API client:** Admin uses `FluentFormsGlobal.$rest.get/post/put/del()`. Stores use Vuex, not Pinia
9. **No PHPCS config** — no PHP linter. Run ESLint manually if needed
10. **Asset loading:** `fluentFormMix()` helper maps to `assets/` via `mix-manifest.json`

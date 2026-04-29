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

**Important:** Never add co-author attribution in commit messages.

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

## Deep Knowledge (read on demand)

When working on a specific area, read the relevant skill file for detailed patterns, file maps, and gotchas:

| Topic | File | When to read |
|-------|------|-------------|
| Architecture | `.claude/skills/architecture.md` | Understanding project structure, models, routes, stores, modules |
| Coding patterns | `.claude/skills/coding-patterns.md` | Writing new code — controller, handler, Vue component, API patterns |
| Bug fixes | `.claude/skills/workflow-bugfix.md` | Fixing bugs or security vulnerabilities |
| Forms | `.claude/skills/workflow-forms.md` | Form builder, fields, rendering, submissions, entries |
| Integrations | `.claude/skills/workflow-integrations.md` | Notifications, integrations, webhooks, conditional logic |
| Payments | `.claude/skills/workflow-payments.md` | Payment processing, Stripe, transactions, subscriptions |
| Conversational | `.claude/skills/workflow-conversational.md` | Conversational form mode, design editor, share pages |

## jQuery Migration (v6.2.3)

**Context:** Migrating form submission from jQuery to vanilla JS in 8 non-blocking PRs (PR-1 through PR-8). Free + Pro synchronized release. All PRs created as **draft** branches; user finalizes PR bodies manually on GitHub.

### PR Creation Workflow

1. Create branch from `dev` (not master)
2. Push branch (generates GitHub PR creation link)
3. Use **pr-descriptor** skill to generate PR body
4. Add description to PR body on GitHub (user does this)
5. Mark as draft PR

### PR-1 Template: Core Submission Runtime

```markdown
## FEAT: Core Submission Runtime - jQuery to Vanilla JS Migration (Phase 0)

### Why
Internal optimization to reduce jQuery dependency and improve form submission performance. Migration structured in 8 non-blocking PRs with full backward compatibility. PR-1 establishes the foundation: vanilla JS form submission with optional jQuery fallback via compatibility bridge.

### What Changed

**Frontend (form-submission.js)**
- Migrated core form submission from jQuery to vanilla JS
- Added event bridge: native CustomEvent + jQuery.trigger() for backward compatibility
- Removed jQuery dependency from hot path (50+ submissions/second capable)
- Form payload shape unchanged (binary compatible)

**PHP Hooks & Settings**
- Added `ff_jquery_loading_mode` setting (auto/enabled/disabled)
- Auto mode: uses vanilla JS, falls back to jQuery if needed
- Enabled mode: legacy jQuery-only behavior
- Disabled mode: pure vanilla JS (no jQuery overhead)

**Component System**
- Updated DateTime component for jQuery-independent initialization
- Updated GlobalSettings helper to respect loading mode
- Backward compatible with all existing form configurations

### Testing
- ✅ 43 unit tests (both jQuery modes)
- ✅ 12 browser tests (form submission + step navigation)
- ✅ Fixture 54 tested (standard contact form)
- ✅ Event bridge verified (jQuery + native events both dispatch)

### Risk Level
**LOW** — Zero breaking changes, fully reversible via setting flip

### Merge Gate
- Target: `dev` → will be merged as draft
- Paired with: `fluentformpro#pr/1-foundation-pro` (Pro compatibility verification only, no code changes)
- Merge order: Free first, then Pro within 1 hour
- Rollback: `update_option('ff_jquery_loading_mode', 'enabled')`

### Key Files Modified
- `resources/assets/public/form-submission.js` (+2100 lines, -50 jQuery calls)
- `app/Modules/Component/Component.php` (load mode support)
- `app/Hooks/filters.php` (mode settings)
- `app/Services/FormBuilder/Components/DateTime.php` (vanilla init)
- `app/Services/GlobalSettings/GlobalSettingsHelper.php` (mode management)
- `tests/js/form-submission.test.js` (new browser tests)

### Before Merge
- [ ] Plugin audit complete (security + optimization review)
- [ ] Debugger sweep done (edge cases verified)
- [ ] Code style verified (php-cs-fixer)
- [ ] Pro team verified compatibility
- [ ] All tests pass both jQuery modes

### Next PRs (Week 2)
- PR-3: Step forms & navigation
- PR-4: Save progress & drafts
- PR-5: Advanced modules & conditionals
- PR-7: File upload & validation

---
**Phase 0 plan:** Ship v6.2.3 with auto mode (jQuery fallback). Phase 1-3 gradually deprecate jQuery over months.
```

### Important Reminders
- **Branch base:** Always `dev`, not `master`
- **Draft PRs:** Always create as draft; user finalizes body
- **Never add co-author attribution** in commit messages
- **Main branch is `dev`** for all PRs

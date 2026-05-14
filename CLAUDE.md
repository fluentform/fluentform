# CLAUDE.md

## Domain glossary

Read `CONTEXT.md` before working on domain logic. Use the canonical terms defined there; avoid the listed aliases. The glossary is the single source of truth for what each domain term means in this codebase.

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

## Deep Knowledge (read on demand)

When working on a specific area, read the relevant skill file for detailed patterns, file maps, and gotchas:

| Topic | File | When to read |
|-------|------|-------------|
| **Agent Architecture** | `AGENTS.md` | **AI agents:** Complete code structure, models, APIs, flows. Read first before making changes. |
| Architecture Details | `.claude/skills/architecture.md` | Understanding project structure, models, routes, stores, modules |
| Coding patterns | `.claude/skills/coding-patterns.md` | Writing new code — controller, handler, Vue component, API patterns |
| Bug fixes | `.claude/skills/workflow-bugfix.md` | Fixing bugs or security vulnerabilities |
| Forms | `.claude/skills/workflow-forms.md` | Form builder, fields, rendering, submissions, entries |
| Integrations | `.claude/skills/workflow-integrations.md` | Notifications, integrations, webhooks, conditional logic |
| Payments | `.claude/skills/workflow-payments.md` | Payment processing, Stripe, transactions, subscriptions |
| Conversational | `.claude/skills/workflow-conversational.md` | Conversational form mode, design editor, share pages |

## Plan Mode

Do **not** enter plan mode for small tasks. Plan mode is reserved for
non-trivial implementation work (multi-file refactors, new features
spanning several modules, architectural changes). For the following,
execute directly:

- Single-file edits.
- Git operations (stage / commit / push / stash) on already-understood
  diffs.
- Doc tweaks (README, CLAUDE.md, ADRs, in-line comments).
- One- or two-line bug fixes.
- Renames, typo fixes, formatting.
- Continuing iteration on a change that was already discussed in the
  current conversation.

When in doubt about whether a task qualifies as small, prefer
executing — a brief inline summary of intent is enough.

## Pre-Commit Validation Process

See **`PRECOMMIT-WORKFLOW.md`** for the complete pre-commit review workflow required for all PRs.

Quick steps:
1. Run unit tests: `node --test tests/js/*.test.js`
2. Create validation checklist: `openspec/changes/migrate-form-submission-to-vanilla-js/PR-N-VALIDATION-CHECKLIST.md`
3. Fix all HIGH priority issues
4. Document MEDIUM/LOW issues with rationale
5. Commit checklist file and push branch

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

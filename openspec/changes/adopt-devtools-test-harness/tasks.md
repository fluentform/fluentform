# Tasks — adopt-devtools-test-harness

Each wave is one PR (or one PR group). The `test-infrastructure` capability spec is intentionally deferred until Wave 1 confirms the layout.

Approach (updated): **Codeception (`dev/wp-browser/`) is the single test stack**, mirroring `fluent-cart-x`. Wave 1 lands the scaffold (DONE). Waves 2A–2E fill **module-by-module Cests/Tests**, one module = one folder = one owner so contributors never touch the same file. Wave 3 retires the legacy PHPUnit harness. The earlier "PHPUnit core + Codeception later" plan is superseded — the Integration suite already covers the PHPUnit-shaped tests (wp-browser runs on PHPUnit).

**Claiming work:** put your name in the **Owner** column of a module row below before starting. One module per row → one folder under `tests/<Suite>/<Module>/` → no merge conflicts. Factories are additive (a new entity = a new file under `Support/Factory/`), never edits to a shared one.

Source for module list: [app/Modules/](../../../app/Modules), [app/Http/Controllers/](../../../app/Http/Controllers), [app/Services/](../../../app/Services), [app/Http/Policies/](../../../app/Http/Policies).

---

## Wave 0 — Unblock PR #873  ✅ DONE

PR: [fluentform#873](https://github.com/fluentform/fluentform/pull/873).

- [x] Nested controllers in `dev/cli/` import the base `Controller` class correctly. (`acfd918c`)
- [x] `dev/cli/` log-monitor script gates execution behind `PHP_SAPI === 'cli'`. (`acfd918c`)
- [x] Autoload rebuild in `wpf` only fires when needed. (Fixed earlier in `a4a6370`.)
- [x] `dev/test/inc/TestDBMigrator.php` provides `getMigrations() / migrateUp() / migrateDown()`. (`faae0796`)
- [x] `dev/cli/commands/migration/refresh.php` references `\Dev\Test\Inc\TestDBMigrator`. (`faae0796`)
- [x] `dev/test/inc/RefreshDatabase.php::migrator()` returns `TestDBMigrator::class`. (`faae0796`)
- [x] `database/DBMigrator.php` reverted to one-method (`run()`) — no dev-only or destructive code in production. (`faae0796`)
- [ ] Confirm post-merge layout: `dev/composer.json`, `dev/phpunit.xml.dist`, `dev/test/inc/bootstrap.php`, `wpf` at plugin root, `.distignore` excludes `dev/` from packaged builds. (Pending PR #873 merge.)

## Wave 1 — Codeception scaffold + sandbox + coverage  ✅ DONE

- [x] `dev/wp-browser/` workspace: `composer.json` (`lucatume/wp-browser ^4.5`), `codeception.yml` with coverage include/exclude.
- [x] Suites: `Integration` + `Functional` (WPLoader, +Asserts +REST helper) + `Acceptance` (WPWebDriver + WPDb).
- [x] Support layer: `RestTestCase`, `DatabaseTestCase`, `WpDieCapture`, `Helper/Functional`, `Concerns/InteractsWithFluentForm`, actors.
- [x] **Sandbox-DB guard** `GuardAgainstProductionDb` — fail-closed on non-test DB name / `wp_` prefix / mismatched live connection. Bootstraps call it + `DBMigrator::run()`.
- [x] Factories `FormFactory`, `SubmissionFactory`.
- [x] Ported smoke tests (`SampleTest`, `Database/TablesExistTest`, `Form/FormModelTest`) + examples (`FormsRestCest`, `PublicFormSubmissionCest`).
- [x] `./wpf` rewired: `test`, `coverage`, `coverage:status`, `test:ui` → Codeception; `phpunit` → dormant harness. Per-suite separate processes.
- [x] Test-summary UI (`tests/_output/index.html`) + `dev/cli/commands/coverage-status.php` → `dev/COVERAGE-STATUS.md`.
- [x] Verified locally: Integration 5/5, Functional 2/2 green against a sandbox DB. (Acceptance + coverage need chromedriver / a coverage driver respectively.)
- [ ] Add `.mcp.json` at plugin root referencing `code-review-graph` + the existing `.code-review-graph/graph.db`; verify CLAUDE.md's MCP block matches the `setup-code-review-graph` template.

---

# Wave 2 — Module-by-module Codeception coverage

Each sub-wave (2A–2E) is one PR. Tests go under `tests/Integration/<Module>/` (model/service/policy logic, `*Test.php`) or `tests/Functional/<Module>/` (REST + permission flows, `*Cest.php`). Write any needed factory first (new file in `Support/Factory/`), then iterate file-by-file, then run the per-wave audit. **Run the full audit (security + optimization + traceability) at the end of every sub-wave.**

**Owner column:** each module line is one unit of work in one folder. Add `— @you` to claim it; that's how parallel contributors stay conflict-free. Regenerate `dev/COVERAGE-STATUS.md` (`./wpf coverage:status`) at the end of each sub-wave.

## Wave 2A — Foundation (factories + models + migrations + policies + coverage dashboard)

Everything else depends on these. Land first, no exceptions.

- [ ] **Factories** at `dev/test/factories/`:
  - [ ] `FormFactory` — minimal published form with one text field.
  - [ ] `SubmissionFactory` — submission tied to a Form, with `entry_details` rows.
  - [ ] `FormMetaFactory`, `SubmissionMetaFactory`.
- [ ] **Models** ([app/Models/](../../../app/Models)):
  - [ ] `Form` — relations, scopes, `getOrCreate`, status transitions.
  - [ ] `Submission` — relations to Form + EntryDetails, status casts.
  - [ ] `EntryDetails` — write/read, sanitization at the model layer.
  - [ ] `FormMeta`, `SubmissionMeta` — get/set, JSON encode/decode round-trip.
  - [ ] `FormAnalytic`, `Log`, `ScheduledAction` — basic CRUD.
- [ ] **Migrations** ([database/Migrations/](../../../database/Migrations)):
  - [ ] All 8 tables created by migrations, columns match expected schema.
  - [ ] `TestDBMigrator::migrateUp / migrateDown` idempotent — running twice is a no-op.
- [ ] **Policies** ([app/Http/Policies/](../../../app/Http/Policies)):
  - [ ] `FormPolicy` — full role × cap matrix per ability.
  - [ ] `SubmissionPolicy` — same.
  - [ ] `GlobalSettingsPolicy`, `GlobalIntegrationPolicy`, `ReportPolicy`, `RoleManagerPolicy`, `PublicPolicy`.
- [ ] **Coverage dashboard** — new `dev/cli/commands/coverage-status.php`:
  - [ ] Joins writer inventory (`.test-writer-results/setup-audit.txt`) + PHPUnit coverage (text/HTML) + `code-review-graph` dependent counts.
  - [ ] Output: `dev/COVERAGE-STATUS.md` with summary + per-module table + top-10 high-risk untested.
  - [ ] Invoked via `./wpf coverage:status`. Regenerated at the end of every Wave 2 sub-wave.
- [ ] **Wave audit**: security + optimization + traceability over the diff.

**Gate to advance:** factories usable from every later wave; `./wpf test` green; full suite under 30 s; `dev/COVERAGE-STATUS.md` exists.

## Wave 2B — Public-facing surface (highest production risk)

Anything that runs without admin auth.

- [~] **[app/Modules/Form/](../../../app/Modules/Form)** rendering + submission — _started (@scaffold): `tests/Integration/Submission/PublicSubmissionTest.php`_:
  - [x] AJAX submit happy path (real `wp_ajax_nopriv_fluentform_submit` via `submitPublicForm`) — stores Submission + EntryDetails.
  - [x] Validation failure path — `{errors:{field:[...]}}` at status 423.
  - [x] XSS payloads (`<script>`, `<img onerror>`, `<svg onload>`) sanitized before storage (`@dataProvider`).
  - [ ] Shortcode renders expected HTML structure.
  - [ ] Redirect URL resolution (incl. dynamic shortcodes).
- [~] **[app/Modules/SubmissionHandler/](../../../app/Modules/SubmissionHandler)** — handler pipeline covered for happy/validation/XSS; remaining: conditional skip, spam path, exception path.
- [ ] **[app/Modules/Component/](../../../app/Modules/Component)** — one test class per field type. Each covers: render, sanitize, validate, store, error message. Use `@dataProvider` for input variants.
- [ ] **[app/Modules/HCaptcha/](../../../app/Modules/HCaptcha)**, **[app/Modules/ReCaptcha/](../../../app/Modules/ReCaptcha)**, **[app/Modules/Turnstile/](../../../app/Modules/Turnstile)**:
  - [ ] enabled / disabled, success, network failure (mock HTTP), key missing.
- [ ] **[app/Modules/Payments/](../../../app/Modules/Payments)** — *do not auto-merge*; manual review on every file:
  - [ ] PaymentTransaction model, status transitions.
  - [ ] PaymentHandler dispatch.
  - [ ] Stripe handler happy + refund + webhook-signature-fail.
  - [ ] Payment validation in submission flow.
- [ ] **[app/Modules/Registerer/](../../../app/Modules/Registerer)** — conditional asset enqueue per context (admin, frontend, block editor).
- [ ] **Regenerate `dev/COVERAGE-STATUS.md`**.
- [ ] **Wave audit** with extra scrutiny on Payments diff.

**Gate to advance:** zero Payments findings open at HIGH severity; XSS coverage on Component sanitize paths verified by manual review.

## Wave 2C — Admin REST + Entries + Transfer

Bugs here annoy form owners but don't leak data publicly.

- [ ] **[app/Http/Controllers/](../../../app/Http/Controllers)** — per controller: auth-fail (401), perm-deny (403), happy (200), validation-fail (422):
  - [ ] FormController, FormSettingsController, FormIntegrationController
  - [ ] SubmissionController, SubmissionHandlerController, SubmissionNoteController, SubmissionLogController
  - [ ] AnalyticsController, ReportController, LogController
  - [ ] GlobalSettingsController, GlobalIntegrationController, GlobalSearchController
  - [ ] IntegrationManagerController, ManagersController, RolesController
  - [ ] AdminNoticeController, SuggestedPluginsController
- [ ] **[app/Modules/Entries/](../../../app/Modules/Entries)** — list, filter, search, sort, paginate, bulk delete, bulk status change, export.
- [ ] **[app/Modules/Transfer/](../../../app/Modules/Transfer)** — JSON + CSV round-trip per format; import validation; ID remapping.
- [ ] **[app/Modules/Acl/](../../../app/Modules/Acl)** — capability checks, role mapping persistence.
- [ ] **[app/Modules/Ai/](../../../app/Modules/Ai)** — provider abstraction, prompt builder, error path with fake provider.
- [ ] **Regenerate `dev/COVERAGE-STATUS.md`**.
- [ ] **Wave audit**.

## Wave 2D — Services + integrations + background work

- [ ] **[app/Services/](../../../app/Services)** — for every service with `tests_for` count = 0 in the graph:
  - [ ] `Form/*`, `Submission/*`, `Integrations/*`, `Settings/*`, `Migrator/*`, `Report/*`, `Roles/*`, `Manager/*`, `Scheduler/*`, `Browser/*`, `Logger/*`, `Parser/*`, `Emogrifier/*`, `Analytics/*`.
  - [ ] `ConditionAssesor.php`, `GlobalSearchService.php`.
- [ ] **Notifications** (email + integrations) — conditional logic eval truth table, hook firing order, recipient resolution, dynamic shortcodes.
- [ ] **Webhook integrations** — payload shape per integration, retry, signature, error handling.
- [ ] **[app/Modules/Logger/](../../../app/Modules/Logger)** — log insert, query, prune; level filter.
- [ ] **Scheduled actions** — enqueue, dequeue, retry, failure path.
- [ ] **[app/Modules/Report/](../../../app/Modules/Report)** — aggregation correctness with seeded data.
- [ ] **[app/Modules/Track/](../../../app/Modules/Track)** — analytic event recording, dedupe.
- [ ] **Regenerate `dev/COVERAGE-STATUS.md`**.
- [ ] **Wave audit**.

## Wave 2E — Remaining modules + lifecycle seams

- [ ] **[app/Modules/Renderer/](../../../app/Modules/Renderer)** — form HTML rendering, conversational layout, step navigation.
- [ ] **[app/Modules/Widgets/](../../../app/Modules/Widgets)** — widget registration, render output.
- [ ] **[app/Modules/CLI/](../../../app/Modules/CLI)** — WP-CLI command surface (skip if no commands shipped yet).
- [ ] **Lifecycle seams** — `AddOnModule.php`, `DashboardWidgetModule.php`, `DocumentationModule.php`, `EditorButtonModule.php`, `ProcessExteriorModule.php`.
- [ ] **[boot/](../../../boot)** — application bootstrap, hook registration order, plugin activation/deactivation hooks.
- [ ] **Hooks/handlers** — [app/Hooks/](../../../app/Hooks) actions + filters that aren't covered by upstream module tests.
- [ ] **Final regenerate `dev/COVERAGE-STATUS.md`** + cumulative audit.

**Wave 2 exit gate:** every file in the writer's `discover` inventory is `covered` or `partial` (no `new`); `--quality-gate` enabled in CI-equivalent pre-commit; cumulative audit yields no HIGH findings.

---

# Wave 3 — Retire the legacy PHPUnit harness

Triggers after Wave 2 coverage has moved to Codeception and `dev/test/` has been dormant for one release.

- [ ] Confirm no remaining unique coverage lives only in `dev/test/tests/` (port anything still valuable into a Cest/Test first).
- [ ] Delete `dev/test/`, `dev/test/setup.sh`, `dev/phpunit.xml.dist`; drop the `test` classmap entry from `dev/composer.json`.
- [ ] Remove the `./wpf phpunit` branch and its WP-test-lib install path from `dev/cli/wpf.php` / `init.php`.
- [ ] Update `.distignore` if needed (`dev` is already excluded wholesale, so `dev/wp-browser/` is too — verify).
- [ ] Write `test-infrastructure` spec.md: the single-stack contract (suite model, sandbox-DB guard, one-module-one-folder, additive factories, coverage commands) + the "destructive plumbing lives only in dev/" invariant.

---

## Out of scope for this change

- GitHub Actions CI workflow. Track separately once Wave 2 is green locally.
- JS / Vue / E2E testing stack (Vitest, Playwright). Separate change. (Acceptance/WPWebDriver browser tests are in-scope here for PHP-rendered forms.)
- Free ↔ pro contract surface tests with `fluentformpro`. Separate change once the pro plugin's surface is mapped.
- PHPStan / PHPCS adoption. Sibling change `adopt-static-analysis`, runnable in parallel.

## Cross-references

- Codeception reference: [`fluent-cart-x/dev/wp-browser/`](../../../../fluent-cart-x/dev/wp-browser) — the canonical WPFluent wp-browser layout this scaffold mirrors.
- Cart-x dev tooling: [`fluent-cart-x/dev/`](../../../../fluent-cart-x/dev)
- Originating PR: [fluentform#873](https://github.com/fluentform/fluentform/pull/873) (`acfd918c` + `faae0796`).

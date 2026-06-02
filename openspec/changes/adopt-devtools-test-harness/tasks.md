# Tasks — adopt-devtools-test-harness

Each wave is one PR (or one PR group). The `test-infrastructure` capability spec is intentionally deferred until Wave 1 confirms the layout.

Approach: **PR #873's PHPUnit scaffold first** (Waves 0–1), then **AI-assisted PHPUnit coverage module-by-module** (Waves 2A–2E), then **Codeception layer mirroring `fluent-cart-x/dev/wp-browser/`** (Wave 3) for the suites where Codeception's REST + permission helpers genuinely beat raw PHPUnit. PHPUnit and Codeception co-exist — they don't replace each other.

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

## Wave 1 — Inventory + graph wiring

- [ ] Add `.mcp.json` at plugin root referencing `code-review-graph` and the existing `.code-review-graph/graph.db`.
- [ ] Verify CLAUDE.md's MCP tool block matches the `setup-code-review-graph` skill template.
- [ ] Smoke `./wpf test` with the empty / scaffolded suite — must be green before Wave 2.
- [ ] Run `write-php-test . discover`. Commit:
  - [ ] `.test-writer-results/setup-audit.txt`
  - [ ] `.test-writer-results/test-brief.md`
- [ ] Cross-reference the inventory with `query_graph` (uncovered nodes ranked by callee + dependent count). Save as `target-shortlist.md` in this change directory.

---

# Wave 2 — Module-by-module PHPUnit coverage

Each sub-wave (2A–2E) is one PR. Within a sub-wave, write factories first, then iterate file-by-file with `write-php-test . <ClassName>`, review the generated test + caveats, then run the per-wave audit. **Run the full audit (security + optimization + traceability) at the end of every sub-wave** — the writer's `--quality-gate` only checks test quality, not security of the code under test.

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

- [ ] **[app/Modules/Form/](../../../app/Modules/Form)** rendering + submission:
  - [ ] Shortcode renders expected HTML structure.
  - [ ] AJAX submit happy path (`fluentform_submit`) — stores Submission + EntryDetails.
  - [ ] Validation failure path — error response shape stable.
  - [ ] Redirect URL resolution (incl. dynamic shortcodes).
- [ ] **[app/Modules/SubmissionHandler/](../../../app/Modules/SubmissionHandler)** — handler pipeline, conditional skip, exception path.
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

# Wave 3 — Codeception layer (mirror cart-x's `dev/wp-browser/`)

Triggers only after Wave 2 is green. Codeception **co-exists** with PHPUnit — it doesn't replace it. PHPUnit stays for unit-shaped tests (models, services, formatters). Codeception is added where its helpers materially win.

Reference: [fluent-cart-x/dev/wp-browser/](../../../../fluent-cart-x/dev/wp-browser) — 218 cests across `Integration/` + `Functional/`, with `DatabaseTestCase`, `IntegrationsTestCase`, `RestTestCase`, `WpDieCapture`, factories under `Support/Factory/`.

## Wave 3A — Codeception scaffold

- [ ] Create `dev/wp-browser/composer.json` requiring `lucatume/wp-browser ^4.5`. Run `composer install` from `dev/wp-browser/`.
- [ ] Create `dev/wp-browser/codeception.yml` mirroring cart-x: `namespace: Tests\Support`, paths set to `tests/`, `actor_suffix: Tester`.
- [ ] Create suite configs:
  - [ ] `dev/wp-browser/tests/Integration.suite.yml` — `WPLoader` module, loads plugin via `loadPluginsBeforeWordPress`.
  - [ ] `dev/wp-browser/tests/Functional.suite.yml` — `WPDb` + `WPFilesystem` + `REST`.
- [ ] Create support classes mirroring cart-x:
  - [ ] `tests/Support/DatabaseTestCase.php` — `extends WPTestCase`, runs `TestDBMigrator::migrateUp` in `setUp`.
  - [ ] `tests/Support/RestTestCase.php` — REST envelope helpers (`getAs`, `postAs`, `assertOk`, `assertForbidden`).
  - [ ] `tests/Support/IntegrationsTestCase.php` — sets up provider stubs.
  - [ ] `tests/Support/WpDieCapture.php` — captures `wp_die` for negative path tests.
  - [ ] `tests/Support/Factory/FormFactory.php`, `SubmissionFactory.php` — ports of the PHPUnit factories.
  - [ ] `tests/Support/IntegrationTester.php`, `FunctionalTester.php` — codecept build output.
- [ ] Update `.distignore`: also exclude `dev/wp-browser/` from packaged builds.
- [ ] Extend `./wpf coverage:status` to include Codeception coverage when present.

## Wave 3B — Port high-value REST + permission suites

Only port suites that genuinely benefit from Codeception. Skip pure unit tests.

- [ ] **Permissions cests** (mirroring cart-x's `tests/Functional/Permissions/`):
  - [ ] `FormsPermissionsCest.php` — every Form REST route × every role × allow/deny.
  - [ ] `SubmissionsPermissionsCest.php`
  - [ ] `IntegrationsPermissionsCest.php`
  - [ ] `SettingsPermissionsCest.php`
- [ ] **Integration cests** (mirroring `tests/Integration/Http/`, `tests/Integration/Services/`):
  - [ ] `FormControllerCest.php` — full CRUD lifecycle in one cest (create → list → update → duplicate → delete).
  - [ ] `SubmissionControllerCest.php` — list + filter + entry detail + delete.
  - [ ] `PaymentFlowCest.php` — submission → payment intent → success / refund.
  - [ ] `WebhookIntegrationCest.php` — outbound dispatch, retry on 5xx.
- [ ] **Listener cests** (mirroring `tests/Integration/Listeners/`):
  - [ ] Submission lifecycle event listeners (notification fired, integration fired, log written).

## Wave 3C — CI alignment

- [ ] PHPUnit and Codeception both run in the precommit / CI sequence:
  - `./wpf test` (PHPUnit) → `dev/wp-browser/vendor/bin/codecept run` (Codeception).
- [ ] Decide migration policy: any PHPUnit test that maps cleanly to a Codeception cest and reduces flakiness gets migrated; the rest stays. Do not migrate for migration's sake.
- [ ] Update `test-infrastructure` spec.md (created here) with the dual-stack contract: when to use PHPUnit, when to use Codeception, where each lives, plus the "destructive plumbing lives only in dev/" invariant.

---

## Out of scope for this change

- GitHub Actions CI workflow. Track separately once Waves 2 + 3 are green locally.
- JS / Vue / E2E testing stack (Vitest, Playwright). Separate change.
- Free ↔ pro contract surface tests with `fluentformpro`. Separate change once the pro plugin's surface is mapped.
- PHPStan / PHPCS adoption. Track as a sibling change `adopt-static-analysis` that can run in parallel with Wave 2.

## Cross-references

- Writer tool: [`/Volumes/Projects/Tools/fluent-test-writer-php`](../../../../../../../Tools/fluent-test-writer-php)
- Cart-x PHPUnit (legacy reference): [`fluent-cart-x/dev/`](../../../../fluent-cart-x/dev)
- Cart-x Codeception (Wave 3 reference): [`fluent-cart-x/dev/wp-browser/`](../../../../fluent-cart-x/dev/wp-browser)
- Blocking PR: [fluentform#873](https://github.com/fluentform/fluentform/pull/873) (`acfd918c` + `faae0796` already pushed)

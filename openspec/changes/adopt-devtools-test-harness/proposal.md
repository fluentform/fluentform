## Why

FluentForm currently has no PHP test harness on this branch lineage. `dev/` contains only a stray `vendor/sebastian` directory — no `dev/composer.json`, no `dev/phpunit.xml.dist`, no `dev/test/inc/bootstrap.php`, no `wpf` launcher at the plugin root. The plugin therefore cannot run PHPUnit, and the [`fluent-test-writer-php`](../../../../../Tools/fluent-test-writer-php) CLI classifies the plugin as `none-wpfluent` and either aborts or falls into an install-devtools path that needs GitHub credentials for `wpfluent/devtools`.

Two facts shape the path forward:

1. [fluentform PR #873](https://github.com/fluentform/fluentform/pull/873) restores the missing `dev/` toolkit and `wpf` launcher. The reviewer-flagged blockers are addressed by commits `acfd918c` ("FIX: Address PR #873 review comments") and `faae0796` ("REFACTOR: Move dev-only migration helpers off production DBMigrator"), both fast-forwarded onto the PR's branch.
2. Sibling plugin [`fluent-cart-x`](../../../../fluent-cart-x) already ships the canonical WPFluent devtools layout:
   - [`dev/composer.json`](../../../../fluent-cart-x/dev/composer.json) — `phpunit/phpunit ^8`, `yoast/phpunit-polyfills`, `symfony/console`, `phpstan`, `php_codesniffer`. Classmap autoloads `cli`, `factories`, `test`.
   - [`dev/phpunit.xml.dist`](../../../../fluent-cart-x/dev/phpunit.xml.dist) — bootstrap `test/inc/bootstrap.php`, suite `./test/tests`, testdox logger, `stopOnFailure=true`.
   - [`wpf`](../../../../fluent-cart-x/wpf) — one-liner that boots `Dev\Cli\Application::boot(__DIR__)`.
   - [`dev/wp-browser/`](../../../../fluent-cart-x/dev/wp-browser) — separate Codeception + lucatume/wp-browser layer with 218 integration/functional tests. Adopted in Wave 3, not Wave 2.

PR #873 and `fluent-cart-x` are **the same approach**, not competing options — both target the writer's `devtools-new` classification (`wpf` boots `Dev\Cli\Application`, `dev/composer.json` present). #873 is the fluentform port of cart's pattern; cart is the working reference. Adopting cart's shape 1:1 keeps the WPFluent fleet consistent so engineers moving between plugins don't re-learn the test stack each time, and ensures `fluent-test-writer-php` classifies the plugin as `devtools-new` (no env provisioning prompt, straight to discovery and generation).

**Architectural invariant** (established by `faae0796`): destructive migration plumbing lives **only** under `dev/`. The production `database/DBMigrator.php` exposes one method (`run()`). Dev-only helpers live on `Dev\Test\Inc\TestDBMigrator` and are excluded from packaged builds by `.distignore`. No code path in production loads or can reach `migrateDown()`.

This change unblocks AI-assisted PHPUnit test authoring via `fluent-test-writer-php`. The first concrete output of the new harness is a `discover`-only run that prints the full inventory of testable classes so the team can pick the curated first batch before committing to `--all-new`.

## What Changes

**Direction (updated):** Codeception (`lucatume/wp-browser`) is the **single** test stack, mirroring `fluent-cart-x`. The legacy PHPUnit harness under `dev/test/` is migrated then retired (dormant one release, then deleted). PHPUnit-shaped tests still exist — they run as the Integration suite, which is PHPUnit under the hood — but there is one harness, one runner, one mental model. The earlier "PHPUnit core, Codeception in Wave 3" plan is superseded.

- **Wave 1 scaffold — DONE in this change.** `dev/wp-browser/` created mirroring cart-x: `composer.json` (`lucatume/wp-browser ^4.5`), `codeception.yml` (with coverage include/exclude), Integration + Functional + Acceptance suites, `Support/` base cases (`RestTestCase`, `DatabaseTestCase`, `WpDieCapture`), the `Functional` REST helper module, `FormFactory`/`SubmissionFactory`, and a fail-closed sandbox-DB guard (`GuardAgainstProductionDb`). The ~9 legacy smoke tests are superseded by ported equivalents (`SampleTest`, `Database/TablesExistTest`, `Form/FormModelTest`) plus example `FormsRestCest` (Functional) and `PublicFormSubmissionCest` (Acceptance).
- **Sandbox-only by construction.** Tests run against a dedicated throwaway DB + a MySQL user scoped to it, with a distinct table prefix; the guard refuses to run otherwise. The live site DB is unreachable.
- **`./wpf` rewired.** `./wpf test` runs Integration + Functional (each in its own process — two WPLoader boots can't share one), `./wpf coverage` adds coverage, `./wpf coverage:status` regenerates the dashboard, `./wpf test:ui` opens the summary; `./wpf phpunit` still runs the dormant harness.
- **Test-summary UI + coverage.** A summary landing page (`tests/_output/index.html`) links each suite's HTML result report; `./wpf coverage` produces an HTML coverage report + Clover XML; `dev/cli/commands/coverage-status.php` rolls it into `dev/COVERAGE-STATUS.md`. Coverage requires PCOV/Xdebug.
- **Module-by-module Cests** in Waves 2A–2E, one module = one folder = one owner (conflict-free). Each sub-wave is one PR.
- **Retire PHPUnit harness** in Wave 3 (delete `dev/test/`, `setup.sh`, `dev/phpunit.xml.dist`).
- **Wire `code-review-graph` MCP** for this repo (`.mcp.json` + CLAUDE.md block) so coverage targeting uses the graph, not grep.

## Capabilities

### New Capabilities

- `test-infrastructure` — finalized in Wave 3 once the legacy harness is removed. Defines the contract for how tests are written and run in fluentform: the `dev/wp-browser/` layout (mirrors `fluent-cart-x`), the suite model (Integration / Functional / Acceptance), bootstrap + sandbox-DB-guard contract, test file location and naming (one module = one folder), factory placement (additive, one file per entity), and the coverage/dashboard commands. Also records the single-stack decision and the invariant that destructive migration plumbing lives only under `dev/`.

### Modified Capabilities

None.

## Impact

- **Affected code:** No production PHP changes. `dev/` is added by #873; this change only confirms its shape and exercises it. `.mcp.json` (new, dev-only). `.test-writer-results/` artifacts are dev-only and may be gitignored. `dev/COVERAGE-STATUS.md` is dev-only.
- **APIs:** No public APIs change.
- **Dependencies:** `lucatume/wp-browser ^4.5` under `dev/wp-browser/composer.json` (separate workspace from `dev/composer.json`). Coverage needs PCOV or Xdebug locally. No production dependency changes.
- **Systems:** None. The writer runs locally; no CI integration is in scope for this change.
- **Cross-plugin:** None. FluentForm's pro add-on is not touched by this change.
- **Coordination:** Blocked on #873. Once merged, the first writer run (`discover`) is fast and read-only.

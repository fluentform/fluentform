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

- **Wait for #873 to land** (with `acfd918c` and `faae0796` already on its branch). This change does **not** duplicate that PR's scaffold work. It coordinates around it.
- **Verify the post-merge layout** matches the writer's `devtools-new` expectation: `dev/composer.json`, `dev/test/inc/bootstrap.php`, `dev/phpunit.xml.dist`, and `wpf` at plugin root. Bring any divergences from `fluent-cart-x`'s shape into line.
- **Wire `code-review-graph` MCP** for this repo (a `.mcp.json` referring to the existing `.code-review-graph/graph.db`, plus the `setup-code-review-graph` skill's CLAUDE.md block). Without this, target selection falls back to grep.
- **Run `write-php-test . discover`** as the first writer invocation. Persist `.test-writer-results/setup-audit.txt` and `.test-writer-results/test-brief.md` so the inventory is reviewable before any test is generated.
- **Module-by-module PHPUnit coverage** in Waves 2A–2E (factories → public-facing → admin → services → cleanup). Each sub-wave is one PR. Per-target loop: `write-php-test . <ClassName>` → review generated test + caveats → commit.
- **Codeception layer in Wave 3.** After PHPUnit baseline is green, mirror cart-x's `dev/wp-browser/` for high-value REST + permission cests. PHPUnit and Codeception co-exist — they don't replace each other.
- **Coverage visibility** (added in Wave 2A): a `dev/cli/commands/coverage-status.php` script that joins the writer's inventory + PHPUnit coverage + `code-review-graph` ranking into one markdown dashboard at `dev/COVERAGE-STATUS.md`.

## Capabilities

### New Capabilities

- `test-infrastructure` — to be added in Wave 3 once the layout is fully concrete. Will define the contract for how PHP tests are written and run in fluentform: layout (mirrors `fluent-cart-x`), bootstrap contract, test file location and naming, factory placement, the writer's caveat directory (`.claude/skills/testing-phpunit/references/fluentform/`), and the writer's `--quality-gate` / `--full-suite-gate` definitions. Also documents the PHPUnit ↔ Codeception dual-stack contract: when to use each, and the architectural invariant that destructive migration plumbing lives only under `dev/`.

### Modified Capabilities

None.

## Impact

- **Affected code:** No production PHP changes. `dev/` is added by #873; this change only confirms its shape and exercises it. `.mcp.json` (new, dev-only). `.test-writer-results/` artifacts are dev-only and may be gitignored. `dev/COVERAGE-STATUS.md` is dev-only.
- **APIs:** No public APIs change.
- **Dependencies:** None added by Wave 2. Wave 3 adds `lucatume/wp-browser ^4.5` under `dev/wp-browser/composer.json` (separate from `dev/composer.json`).
- **Systems:** None. The writer runs locally; no CI integration is in scope for this change.
- **Cross-plugin:** None. FluentForm's pro add-on is not touched by this change.
- **Coordination:** Blocked on #873. Once merged, the first writer run (`discover`) is fast and read-only.

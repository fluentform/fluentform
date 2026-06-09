# Pre-Merge Review — nkb-bd/dev-tests-codeception-docs

**Date:** 2026-06-09 | **Mode:** Full | **PR type:** Tooling / Docs (dev-only) | **Plugin:** fluentform

> **Scope note.** The branch diff vs `master` is enormous (290 files, ~65k insertions) but that is dominated by merged release work, regenerated `.po`/`.pot` language files, and a `wpfluent/framework` vendor bump — none of which is this branch's actual unit of work. The reviewable change here is the **Codeception (wp-browser) test harness** under `dev/`, captured in the uncommitted + untracked working set. This review is scoped to that. **No shipped plugin code is touched**; everything lives under `dev/`, which `.distignore` excludes from packaged builds.

## Summary

**Blocking:** 0 | **High:** 0 | **Medium:** 1 | **Suggestion:** 4

### Medium
- `dev/README.md` / `openspec/.../proposal.md` — **Coverage XML described as "Cobertura" but is actually Clover** (traceability)

### Suggestion
- `dev/wp-browser/composer.lock` — Committed lockfile for a dev-only workspace (~194 KB) (ui-logic / hygiene)
- `dev/wp-browser/tests/Support/DatabaseTestCase.php:24` — `SHOW TABLES LIKE '{$fullTable}'` string-interpolates the table name (perf-and-integrity, test-only)
- `dev/cli/commands/codecept.php:166` — `coveragePhp()` matches driver names with an anchored regex that can miss multi-extension `-m` output (ui-logic)
- `dev/wp-browser/tests/Acceptance/Form/PublicFormSubmissionCest.php:18` — Hard-coded `FORM_ID = 1` makes the example acceptance test non-portable (ui-logic)

## What looks good

- **Fail-closed sandbox guard is the right design.** `GuardAgainstProductionDb::assertSandbox()` runs from every bootstrap *before* any DB touch, reads `.env` directly (not `getenv`, which Codeception doesn't populate), requires a `test` token in the DB name, rejects the `wp_` prefix, and — when WP is already booted — cross-checks the live `$wpdb->dbname` against the configured target. This is genuine defense-in-depth for a harness where `WPLoader` drops/recreates tables. The `.env.example` header reinforces it loudly.
- **Per-suite process isolation is correctly reasoned and implemented.** The runner explicitly runs each WPLoader suite in its own `codecept` process because two boots collide on WordPress's global `$table_prefix`, and the comment says exactly that. Coverage is then snapshotted per suite (`<suite>.cov`) and merged via `merge-coverage.php` because per-suite reports overwrite `coverage.serialized` — a non-obvious gotcha handled cleanly.
- **Multi-request state reset is a real correctness fix, not cargo-culting.** `InteractsWithFluentForm::resetFluentState()` rebinds a fresh framework `Request` and nulls each WPFluent Route's cached `parameters`/`substitutedParameters` between in-process dispatches, with a comment explaining production never hits this (one request per process). Without it, a second `/forms/{id}` would inherit the first id. The `coverage.xml` parsers (`parseCoverage`, `coverage-status.php`) correctly read the Clover `<project>/<file>` `metrics` shape that Codeception actually emits (verified against a real local `coverage.xml`).

## Inline findings

### `dev/README.md` + `openspec/changes/adopt-devtools-test-harness/proposal.md` — traceability — Medium

**Coverage XML described as "Cobertura" but is actually Clover**

**Evidence:** README ("a Cobertura `coverage.xml`") and proposal ("Cobertura XML") describe the coverage output as Cobertura. The actual generated `dev/wp-browser/tests/_output/coverage.xml` has a Clover root (`<coverage><project>…<file><metrics statements= coveredstatements=>`), and both `codecept.php::parseCoverage()` and `coverage-status.php` parse that Clover shape. Codeception's `coverage: enabled` + `--coverage-xml` produces Clover, and `merge-coverage.php` writes via `SebastianBergmann\CodeCoverage\Report\Clover`.

**Impact:** Docs mislabel the artifact format. Anyone wiring a CI coverage uploader (Codecov/Coveralls accept Clover and Cobertura but parse them differently) could pick the wrong adapter. No runtime impact.

**Recommended fix:** Replace "Cobertura" with "Clover" in `dev/README.md` and `proposal.md`.

**Detectors:** `traceability`

---

### `dev/wp-browser/composer.lock` — ui-logic — Suggestion

**Committed lockfile for a dev-only workspace**

**Evidence:** `composer.lock` (~194 KB) is tracked under `dev/wp-browser/` while `/vendor/` is correctly gitignored. The whole `dev/` tree is dev-only and excluded from packaged builds.

**Impact:** Pinning the dev test toolchain via a committed lock is defensible (reproducible local installs). Flagging only so it's an explicit decision rather than an accident — it adds a large, churny file to the repo.

**Recommended fix:** Keep it if reproducible dev installs are wanted (recommended for a shared harness); otherwise gitignore it alongside `vendor/`. Either way, make it a conscious choice.

**Detectors:** `ui-to-backend-wiring`

---

### `dev/wp-browser/tests/Support/DatabaseTestCase.php:24` — perf-and-integrity — Suggestion

**`SHOW TABLES LIKE` string-interpolates the table name**

**Evidence:** `tableExists()` and `countFluentFormTables()` build `SHOW TABLES LIKE '{$fullTable}'` / `'{$like}'` by interpolation rather than `$wpdb->prepare()` with `esc_like()`. (`Helper/Functional::resetFluentFormTables()` does it correctly with `prepare` + `esc_like`.)

**Impact:** Test-only, and the inputs are hard-coded code constants (`fluentform_*` + sandbox prefix), so there's no real injection vector. Purely a consistency/hygiene note within the test harness.

**Recommended fix:** Optional — mirror the `Functional::resetFluentFormTables()` pattern (`$wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like(...) . '%')`) for uniformity.

**Detectors:** `performance-and-data-integrity`

---

### `dev/cli/commands/codecept.php:166` — ui-logic — Suggestion

**`coveragePhp()` driver detection regex is fragile**

**Evidence:** `preg_match('/^(pcov|xdebug)$/mi', $mods)` matches a line that is *exactly* `pcov` or `xdebug`. `php -m` prints one module per line so this usually works, but any decoration (e.g. `Xdebug v3.x` headers, or `[Zend Modules]` grouping where Xdebug appears under Zend with a version suffix) would cause a false "no driver found" and silently produce empty coverage.

**Impact:** Edge-case false negative on coverage-driver detection; the user sees the "no driver" warning despite having one. Low likelihood on standard CLI PHP builds.

**Recommended fix:** Optional — loosen to `/^(pcov|xdebug)\b/mi` or check `extension_loaded` via `php -r` instead of parsing `-m`.

**Detectors:** `ui-to-backend-wiring`

---

### `dev/wp-browser/tests/Acceptance/Form/PublicFormSubmissionCest.php:18` — ui-logic — Suggestion

**Hard-coded `FORM_ID = 1` in the example acceptance test**

**Evidence:** `private const FORM_ID = 1;` and the docblock says "The form must already exist … Set FORM_ID to its id." The Acceptance suite uses `WPDb` (`populate: false, cleanup: false`) against a served site, so it relies on a pre-existing form rather than seeding one.

**Impact:** The example test will silently fail or time out on any sandbox where form id 1 doesn't exist or doesn't carry a `first_name` field. It's labeled an example and Acceptance is opt-in, so this is informational — but it's the one test that can't self-provision.

**Recommended fix:** Optional — seed a form via `FormFactory` against the sandbox DB in `_before`, or read the id from an env var, so the example runs without manual setup.

**Detectors:** `ui-to-backend-wiring`

---

## Pattern-pass notes (sequential)

- **Pass A/H — Breaking changes / backwards-compat:** None. No shipped PHP signatures, hooks, REST shapes, options, DB columns, or JS globals change. The only production-adjacent reference is `\FluentForm\Database\DBMigrator::run()` (called from bootstraps) and `Form::getFormsDefaultSettings()` (factory) — both verified to exist with matching namespaces; the harness consumes them read-only.
- **Pass B — Regression risk:** The `./wpf` dispatch change adds `phpunit`, `codecept`, `coverage`, `coverage:status`, `test:ui` to the no-`wp-load` allowlist and re-points the old `test` keyword from the legacy PHPUnit path to Codeception, moving the legacy path to `./wpf phpunit`. README updated to match (`./wpf phpunit`). The legacy harness under `dev/test/` is retained (Wave 3 retires it), so no capability is lost.
- **Pass D — WordPress PHP:** Harness code only. No `$_GET/$_POST` output is echoed to users; `writeDashboard()` builds local HTML and runs `htmlspecialchars()` on test-case names. `exec(open/xdg-open …)` and the codecept command assembly consistently use `escapeshellarg()`.
- **Pass G — Performance:** N/A to production. Stale `coverage.xml` is unlinked before each run to avoid showing a previous number.
- **Pass I — Adversarial inputs:** `parseJUnit`/`parseCoverage` fail soft (`@simplexml_load_file`, null guards, empty-stats default) so a missing/corrupt XML yields "No tests run" / "not measured" rather than a fatal. `merge-coverage.php` skips non-`CodeCoverage` includes and exits non-zero with a clear message when nothing usable merges.

## Verification Checklist
- [ ] M-01: Replace "Cobertura" with "Clover" in `dev/README.md` and `proposal.md`.
- [ ] S-01: Decide consciously whether `dev/wp-browser/composer.lock` is tracked or ignored.
- [ ] S-02: (Optional) Use `prepare()`+`esc_like()` in `DatabaseTestCase` table lookups for consistency.
- [ ] S-03: (Optional) Loosen `coveragePhp()` driver-detection regex.
- [ ] S-04: (Optional) Make the example Acceptance Cest self-provision its form.

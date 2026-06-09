# ./wpf

This is a cli toolkit for helping the development process with many handy features. To know more about this tool, just run `./wpf` from your plugin's root directory and check the available commands that you may use to ease your development process.

# But, at first!

- Run `chmod 700 ./wpf` to grant the permission and then `./wpf init` to install the dependencies.

If you've done everything right then, you may run `./wpf` to check the list of available commands.

# Tests — Codeception (wp-browser)

FluentForm's tests run on [Codeception](https://codeception.com/) + [wp-browser](https://github.com/lucatume/wp-browser) (`WPLoader`). This is the **single, canonical** test stack. The legacy PHPUnit harness under `dev/test/` is **dormant** — kept one release as a fallback, then removed. Codeception runs on PHPUnit under the hood, so unit-shaped tests look the same; you also gain Functional (REST/permission) and Acceptance (real-browser) suites.

Everything lives in its own Composer workspace under `dev/wp-browser/`:

```
dev/wp-browser/
├── codeception.yml              # namespace Tests\Support; coverage include/exclude
├── composer.json                # lucatume/wp-browser ^4.5
└── tests/
    ├── .env / .env.example      # SANDBOX config (gitignored .env)
    ├── Integration.suite.yml    # WPLoader — model/service/policy tests (*Test.php)
    ├── Functional.suite.yml     # WPLoader + Asserts + REST helper module — *Cest.php
    ├── Acceptance.suite.yml     # WPWebDriver + WPDb — real-browser *Cest.php
    ├── Integration/  Functional/  Acceptance/   # tests, one folder per module
    └── Support/                 # base cases, factories, REST helper, DB guard
```

## ⚠️ Sandbox database — never your live site

`WPLoader` **installs WordPress into the configured database and drops/recreates its tables on every run.** Point it only at a throwaway DB.

1. Create a dedicated, empty database and a MySQL user scoped to it (this user physically cannot reach your site DB):
   ```sql
   CREATE DATABASE fluentform_tests CHARACTER SET utf8mb4;
   CREATE USER 'ff_test'@'localhost' IDENTIFIED BY '<pw>';
   GRANT ALL PRIVILEGES ON fluentform_tests.* TO 'ff_test'@'localhost';  -- test DB ONLY
   FLUSH PRIVILEGES;
   ```
2. `cp dev/wp-browser/tests/.env.example dev/wp-browser/tests/.env` and fill in your WordPress path + the sandbox DB. Use a **distinct table prefix** (e.g. `fftest_`), never `wp_`.

> **The scoped MySQL user (step 1) is the hard guarantee — not optional.** WPLoader connects and runs the WP installer *during its own initialization, before any in-suite guard or bootstrap*. So a `GRANT` limited to the test DB is the one layer that physically cannot be out-ordered: even a wrong `.env` can't reach your site DB. Never run the tests as `root` or with a user that can see the live database.

**Guard layering (defense-in-depth):**
1. **Scoped DB user** — the backstop that holds regardless of timing (above).
2. **`./wpf` pre-flight** — `./wpf test`/`coverage` validate `.env` (DB name has a `test` token, prefix isn't `wp_`) **before** spawning Codeception, so WPLoader never even starts on a bad config.
3. **`Support/GuardAgainstProductionDb`** — runs from each suite bootstrap as a final check (and cross-checks the live `$wpdb` connection). Note this fires *after* WPLoader has booted, so it's defense-in-depth, not the primary gate — which is why layers 1–2 exist.

⚠️ Running `vendor/bin/codecept` **directly** (bypassing `./wpf`) skips the pre-flight: WPLoader connects before the bootstrap guard can fail closed. On a raw run the **scoped user is your only pre-connect protection** — so keep it scoped. Prefer `./wpf` for everyday runs.

## Setup

```bash
cd dev/wp-browser && composer install   # one-time
vendor/bin/codecept build               # generates actor classes (re-run after suite edits)
```

## Running

Run from the **plugin root** (the `./wpf` launcher lives there):

```bash
./wpf test                 # Integration + Functional, then open the summary UI.
                           #   Auto-measures coverage when a PCOV/Xdebug driver is found;
                           #   no driver → runs fast and the coverage card shows "not measured".
./wpf test --fast          # Skip coverage even if a driver exists (fastest inner loop).
./wpf test Integration     # one suite only
./wpf test Acceptance      # real-browser suite — needs chromedriver + a served site
./wpf coverage             # force coverage; warns if no driver is installed
./wpf coverage:status      # regenerate dev/COVERAGE-STATUS.md from the last coverage run
./wpf test:ui              # re-open the last summary dashboard without re-running
```

### Narrowing a run

Anything after the suite name is passed straight through to `codecept run`. **Test-file paths are relative to `dev/wp-browser/`** (where Codeception runs), even though you invoke `./wpf` from the plugin root:

```bash
# one file
./wpf test Integration tests/Integration/Submission/PublicSubmissionTest.php
# one method  (file path + ':' + method)
./wpf test Integration tests/Integration/Form/FormModelTest.php:test_factory_persists_a_published_form
# by name fragment (matches the 3 XSS data sets)
./wpf test Integration --filter xss
# verbose (per-step) and stop on first failure
./wpf test Integration -v --fail-fast
```

Or call Codeception directly for full control:

```bash
cd dev/wp-browser && vendor/bin/codecept run Functional -v
```

> WPLoader suites can't share a process (two boots collide on WordPress's global `$table_prefix`), so `./wpf test` with no suite runs each suite in a **separate** `codecept` process. Pass a single suite name to stay in one process.

## Test-summary UI & coverage

`./wpf test` writes a polished summary **dashboard** at `dev/wp-browser/tests/_output/index.html` — a pass/fail status hero, per-suite cards (passed/failed/errors/skipped, assertions, timing, parsed from JUnit XML), a collapsible **"What was tested"** list of every test case (✓/✕ + timing), and a **coverage** card showing the real percentage + a colored bar (or an honest "not measured" until a driver is present). Links into each suite's full Codeception HTML report and the line-by-line coverage report. Dark-mode aware. Opens automatically. `./wpf coverage` additionally produces `tests/_output/coverage/index.html` (line-by-line, color-coded) and a Clover `coverage.xml`; `./wpf coverage:status` rolls that into a per-module dashboard at `dev/COVERAGE-STATUS.md`.

**Coverage needs a driver** — **PCOV** (recommended: ~5–10× faster than Xdebug at coverage) or **Xdebug**. Herd's PHP ships neither and you can't build extensions against it, so install a homebrew PHP of the same minor version and add PCOV:

```bash
brew install php@8.3
CPPFLAGS="-I/opt/homebrew/opt/pcre2/include" /opt/homebrew/opt/php@8.3/bin/pecl install pcov
```

`./wpf coverage` auto-detects a driver-capable PHP (checks `WPF_COVERAGE_PHP`, then `/opt/homebrew/opt/php@8.3`, then the current PHP), runs the suites under it with `pcov.directory` pointed at the plugin root, and **merges** each suite's coverage into one report (`dev/cli/commands/merge-coverage.php`). Set `WPF_COVERAGE_PHP=/path/to/php` to force a specific binary. Without any driver, tests still pass and the dashboard shows "not measured".

> **Coverage measures your branch, not the installed release.** Point `FLUENTFORM_PLUGIN` in `.env` at this checkout's `fluentform.php` (absolute path) so WPLoader loads the worktree — otherwise you'd be covering whatever copy is in `wp-content/plugins/`.

## Writing tests — where things go

| Kind | Suite | Base / actor | File |
|---|---|---|---|
| Model / service / policy logic | Integration | `extends WPTestCase` (or `RestTestCase` for REST) | `*Test.php` |
| REST CRUD, permission matrices | Functional | `$I` (FunctionalTester) | `*Cest.php` |
| Public form in a real browser | Acceptance | `$I` (AcceptanceTester) | `*Cest.php` |

Shared helpers (`Support/`): `RestTestCase` and the Functional module both expose `get/post/put/patch/delete/submitForm` against `/fluentform/v1/` plus `loginAsAdmin/logout/impersonateAsRole` (one implementation in `Support/Concerns/InteractsWithFluentForm`). For the **real public submission path** (a logged-out visitor → `wp_ajax_nopriv_fluentform_submit`) use `submitPublicForm($formId, $fields)`, which captures the `wp_send_json` response. `DatabaseTestCase` has schema inspectors; `WpDieCapture` captures `wp_send_json`/`wp_die`; `MailCatcher` reads outbound email (`MailCatcher::clear()` then `MailCatcher::sent()`). Factories live in `Support/Factory/` — `FormFactory` (seeds `formSettings` meta so submissions don't warn), `SubmissionFactory`.

> **Multi-request state:** the trait resets the WPFluent Router's cached route params and rebinds a fresh framework Request before each dispatch — Codeception runs many requests per process and the Router would otherwise leak the first request's `{id}` into the next. Don't remove `resetFluentState()`. **Add a new entity as a new factory file; never edit a shared one** so parallel contributors don't conflict. Tests for a module go under `tests/<Suite>/<Module>/` — one folder per module, so two people never touch the same file.

# Legacy PHPUnit harness (dormant)

The original PHPUnit harness below remains for one release as a fallback. Run it directly with `php dev/vendor/bin/phpunit -c dev/phpunit.xml.dist` (or `./wpf phpunit`). New tests should be written as Codeception suites, not here.

## Test Setup (PHPUnit)

- Run `chmod 700 ./test/setup.sh` to grant the necessary permission to run.
- Run `./test/setup.sh dbname dbuser dbpass dbhost` to setup the test suite.

The `dbname` will be used to create the database for testing, so provide your `mysql` username and password in the place of `dbuser` and `dbpass` and use `localhost` for the `dbhost`. Once you complete setting up the test environment, find ther `./stubs/Models/Model.php` and rename the `WPFluent` using the correct namespace of your project from `\WPFluent\App\Models\Model`. If
you did everything correctly then you should be able to write and run tests.

- To check, run `./wpf phpunit` from the root of your plugin directory.

# Test Helpers Reference

The PHPUnit harness provides these helpers on the base `TestCase` (via the `Concerns` trait and `TestCase` methods). Use them instead of hand-rolling `$_POST`, raw `$wpdb` writes, or `register_rest_route` boilerplate.

## REST request helpers (Concerns)

| Method | Purpose |
|---|---|
| `$this->get($uri, $params = [])` | GET against `/fluentform/v1/{uri}` |
| `$this->post($uri, $params = [])` | POST |
| `$this->put($uri, $params = [])` | POST + `X-HTTP-Method-Override: PUT` + correct dispatch method |
| `$this->patch($uri, $params = [])` | Same as `put` for PATCH |
| `$this->delete($uri, $params = [])` | Same for DELETE — routes to `@delete` handler, not `@update` |
| `$this->submitForm($formId, array $data)` | Drive `/form-submit` endpoint as if frontend AJAX submitted |
| `$this->login(int $userId)` / `$this->logout()` | Set / reset WP current user |
| `$this->impersonateAsRole(string $cap)` | Create fresh subscriber + add cap + login. Returns user ID. |
| `$this->mockHttp(string $needle, array $response)` | Intercept any `wp_remote_*` whose URL contains `$needle` |

## Response asserts (Response)

```php
$this->get('forms')
    ->assertStatus(200)
    ->assertJsonPath('forms.data.0.id', 5)
    ->assertJsonHas('forms.total')
    ->assertJsonMissing('error');
```

Other accessors: `->getStatus()`, `->getData()`, `->getJson()`, `->isOkay()`, `->isForbidden()`.

## Fixture loader (TestCase)

```php
$form = $this->loadFormFixture('single-field');
$form = $this->loadFormFixture('multi-step-with-conditions');
$form = $this->loadFormFixture('payment-form');
$form = $this->loadFormFixture('conditional-logic');
```

Reads `dev/test/fixtures/forms/<name>.json` and creates a published Form. See `dev/test/fixtures/README.md` for fixture authoring rules (privacy, no real PII).

## Model helpers (TestCase)

| Method | Purpose |
|---|---|
| `$this->setFormMeta($formId, $key, $value)` | Insert `fluentform_form_meta` row; auto-encodes arrays/objects to JSON |
| `$this->loadSubmissionFixture($formId, array $response)` | Insert Submission + per-field EntryDetails rows; returns Submission model |

## Suite-scoped migrations (RefreshDatabase)

`setUpBeforeClass()` migrates once per class; `setUp()` truncates between tests. Pro-owned tables (e.g. `fluentform_coupons`) must self-truncate — see `dev/test/tests/Pro/TestCouponModelAnchor.php` for the pattern.

## Cross-plugin testing — `FLUENTFORM_PRO_TEST=1`

When `FLUENTFORM_PRO_TEST=1` is set, bootstrap.php additionally loads `../fluentformpro/fluentformpro.php` so Pro tests under `dev/test/tests/Pro/` can run. Pro test classes that need it should gate themselves on the sentinel constant:

```php
public static function setUpBeforeClass() : void
{
    if (!defined('FLUENTFORM_PRO_TEST_LOADED')) {
        self::markTestSkipped('Pro not loaded (set FLUENTFORM_PRO_TEST=1)');
    }
    parent::setUpBeforeClass();
}
```

Run with the flag:

```bash
FLUENTFORM_PRO_TEST=1 php dev/vendor/bin/phpunit -c dev/phpunit.xml.dist
```

# QA Tooling:

All QA scripts live in `dev/composer.json`, so run them from `dev/` (from the
plugin root use `composer --working-dir=dev <script>`).

- `cd dev && composer phpstan` — static analysis over `../app` against the baseline.
- `cd dev && composer phpcs -- ../app/Path/File.php` — Fluent WordPress Standard on a file (or `-- ../app` for the whole plugin).
- `cd dev && composer gate` — runs **both** PHPStan and PHPCS in one go.

**Note** You may run the `./setup.sh` multiple times if you need to.

# PR Gate (pre-push hook)

Every `git push` runs PHPStan + PHPCS locally **before** the refs leave your
machine; a failing check rejects the push. This is a **local** gate, not CI.

## One-time setup (per clone)

```bash
bash dev/setup.sh
```

Picks a **PHP 8.1+** binary, installs `dev/vendor` (phpstan, phpcs, wpcs) under it, and installs
the pre-push hook (`.git/hooks/pre-push` → `dev/hooks/pre-push`). Idempotent — re-run anytime.

Manual equivalent, if you prefer:
```bash
cd dev && composer install            # build dev/vendor (phpstan, phpcs, wpcs)
cd ..
ln -sf ../../dev/hooks/pre-push .git/hooks/pre-push && chmod +x dev/hooks/pre-push
```

Requires **PHP 8.1+** (the *tools* need it — your served site can stay on any PHP version),
**Composer**, and **Node**. The default macOS `php` is often 7.4; the hook prepends
`/opt/homebrew/bin` to `PATH` so it finds a Homebrew PHP 8.x automatically. For **manual** runs,
ensure your shell `php` is 8.1+ (e.g. `export PATH="/opt/homebrew/opt/php@8.3/bin:$PATH"`).
Verify the hook: `ls -l .git/hooks/pre-push` (must be executable).

## What blocks vs warns

- **PHPStan** scans all of `../app` but only **new** errors fail — the pre-existing errors are frozen in `dev/phpstan-baseline.neon`.
- **PHPCS** lints only the **changed `app/` files**; **errors block, warnings are shown but don't block**.

## Scope & exclusions

Both tools skip the same **unimportant** parts of the plugin — templates, CLI tooling, run-once
migrations, and bundled third-party libraries. Keep the two lists in sync:

- `dev/phpstan.neon` → `excludePaths`: `app/Modules/Widgets`, `app/Services/Libraries`, `app/Views`,
  `app/Modules/CLI`, `database/Migrations`.
- `.phpcs.xml` → `<exclude-pattern>` mirrors the same paths.

PHPStan also `scanFiles` `../boot/globals.php` + `../fluentform.php` (parse-only) so the plugin's
runtime-loaded global helpers (`wpFluentForm`, `fluentform_sanitize_html`, `fluentformSanitizeCSS`,
…) and constants are known — real undefined-symbol checks keep working instead of being baselined.

> **ESLint (not yet wired — "QG-03").** The runner references `dev/eslint-check.mjs` for
> `resources/admin` (Vue 2) and `resources/public` (jQuery), but it is not implemented, so JS/Vue
> changes are **not** linted yet (the gate prints "ESLint skipped"). Wiring it needs ESLint +
> `eslint-plugin-vue` + a Vue 2 parser, an error-level ruleset, and changed-file scoping. Dedicated change.

## Run it manually

```bash
cd dev && composer gate                                              # both checks
GATE_PHP_FILES="app/Http/Controllers/LogController.php" composer gate  # scope PHPCS to files
```

## Auto-fix style

```bash
cd dev && vendor/bin/phpcbf --standard=../.phpcs.xml ../app/Path/File.php
git diff ../app/Path/File.php        # always review what it rewrote
```

## The baseline (ratchet)

`dev/phpstan-baseline.neon` is a **curated** freeze of the errors that existed when the gate was
set up; only new errors fail. **Never add new errors to the baseline to go green — fix the code.**

- Do **not** blanket-regenerate the baseline — it discards the curation. `reportUnmatchedIgnoredErrors: false`
  in `dev/phpstan.neon` lets it tolerate later code drift (entries that no longer match are ignored).
- For a *benign* analyzer limitation on new code (framework magic method, `self`-call via `static::`,
  etc.), add a narrowly-scoped `ignoreErrors` entry (message + path) in `dev/phpstan.neon` rather than
  mutating the baseline. See the existing examples there.
- Only regenerate after a genuine, broad cleanup:

```bash
cd dev && composer phpstan -- --generate-baseline=phpstan-baseline.neon
```

## Raise the PHPStan level

Edit `level: 2` in `dev/phpstan.neon` (range `0`–`9`, or `max`). After raising, run
`composer phpstan`, then fix the new errors or re-generate the baseline. Raise one
level at a time.

## Emergency bypass

```bash
git push --no-verify
```

Use only when you've read the errors and decided they're acceptable for this push
(e.g. a rebased branch whose diff includes upstream commits). Note why in the PR.

# If anything goes wrong:

- `cd /var/folders/hl/9mtnq0xx42n17zs18wwpfwv80000gn/T`
- `rm -rf wordpress`
- `rm -rf wordpress-tests-lib`
- run the `setup.sh` again.
- run `phpunit` again.

**Note:** The path is dynamic so it could be a little bit different. In that case adjust the path from the error message displayed on the console which will mention the location using something similar to this kind of path.

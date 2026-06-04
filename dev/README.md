# ./wpf

This is a cli toolkit for helping the development process with many handy features. To know more about this tool, just run `./wpf` from your plugin's root directory and check the available commands that you may use to ease your development process.

# But, at first!

- Run `chmod 700 ./wpf` to grant the permission and then `./wpf init` to install the dependencies.

If you've done everything right then, you may run `./wpf` to check the list of available commands.

# Test Setup:

- Run `chmod 700 ./test/setup.sh` to grant the necessary permission to run.
- Run `./test/setup.sh dbname dbuser dbpass dbhost` to setup the test suite.

The `dbname` will be used to create the database for testing, so provide your `mysql` username and password in the place of `dbuser` and `dbpass` and use `localhost` for the `dbhost`. Once you complete setting up the test environment, find ther `./stubs/Models/Model.php` and rename the `WPFluent` using the correct namespace of your project from `\WPFluent\App\Models\Model`. If
you did everything correctly then you should be able to write and run tests.

- To check, run `./wpf test` from the root of your plugin directory.

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

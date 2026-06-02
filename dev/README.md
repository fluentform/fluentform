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

# QA Tooling:

All QA scripts live in `dev/composer.json`, so run them from the `dev/` directory
(from the plugin root use `composer --working-dir=dev <script>`).

- `cd dev && composer phpstan` — static analysis over `../app` against the baseline.
- `cd dev && composer phpcs -- ../app/Path/File.php` — Fluent WordPress Standard on a file (or `-- ../app` for the whole plugin).
- `cd dev && composer gate` — runs **both** PHPStan and PHPCS in one go.

**Note** You may run the `./setup.sh` multiple times if you need to.

# Quality Gate (pre-push hook)

Every `git push` runs PHPStan + PHPCS locally **before** the refs leave your
machine. If a check fails, the push is rejected. This is a **local** gate — it
runs on your machine, not in CI.

## One-time setup (per clone)

```bash
cd dev && composer install            # builds dev/vendor (phpstan, phpcs, wpcs)
cd ..
cp dev/hooks/pre-push .git/hooks/pre-push && chmod +x .git/hooks/pre-push
```

Requires **PHP 8.x**, **Composer**, and **Node** (the runner is `dev/quality-gate.mjs`).
Verify it's active: `ls -l .git/hooks/pre-push` (must be executable).

## What runs, and what blocks

| Check | Scans | Blocks the push on |
|-------|-------|--------------------|
| **PHPStan** (`dev/phpstan.neon`, level 2) | all of `../app` vs the baseline | **new** type errors only — the 1,827 pre-existing errors are frozen in `dev/phpstan-baseline.neon` |
| **PHPCS** (`.phpcs.xml`, Fluent Standard) | only the **changed `app/` files** | style/security **errors** (unescaped output, unsanitized input, tabs, etc.) |

- **Warnings are shown but do not block** (e.g. missing nonce, debug functions). Errors block.
- PHPStan needs the whole codebase for type resolution, so it scans all of `app/`; the baseline is what keeps it from failing on legacy code. PHPCS is per-file, so it only lints what you changed (legacy improves as it's touched).

## Running it manually

```bash
cd dev && composer gate                              # both checks, full app/
GATE_PHP_FILES="app/Http/Controllers/LogController.php" composer gate   # scope PHPCS to specific files
```

## Auto-fixing style

`composer phpcs` only reports. To auto-fix the `[x]`-marked rules:

```bash
cd dev && vendor/bin/phpcbf --standard=../.phpcs.xml ../app/Path/File.php
git diff ../app/Path/File.php        # always review what it rewrote
```

## The PHPStan baseline

`dev/phpstan-baseline.neon` freezes the errors that existed when the gate was set
up; only new errors fail. As files are cleaned, the baseline shrinks. **Never add
new errors to the baseline to make a push green — fix the code instead.** To
regenerate after a real cleanup:

```bash
cd dev && composer phpstan -- --generate-baseline=phpstan-baseline.neon
```

## Raising the PHPStan level

Edit `level: 2` in `dev/phpstan.neon` (range `0`–`9`, or `max`). After raising,
run `composer phpstan`, then either fix the new errors or re-generate the baseline.
Raise one level at a time so the team isn't flooded.

## Emergency bypass

```bash
git push --no-verify
```

Use only when you've read the errors and decided they're acceptable for this push
(e.g. a rebased branch where the diff includes upstream commits). Note why in the PR.

# If anything goes wrong:

- `cd /var/folders/hl/9mtnq0xx42n17zs18wwpfwv80000gn/T`
- `rm -rf wordpress`
- `rm -rf wordpress-tests-lib`
- run the `setup.sh` again.
- run `phpunit` again.

**Note:** The path is dynamic so it could be a little bit different. In that case adjust the path from the error message displayed on the console which will mention the location using something similar to this kind of path.

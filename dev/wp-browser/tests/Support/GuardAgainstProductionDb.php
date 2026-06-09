<?php

namespace Tests\Support;

/**
 * Defense-in-depth sandbox check run from each suite bootstrap.
 *
 * IMPORTANT: this runs AFTER WPLoader has already booted WordPress (which runs
 * the WP installer = drops/recreates tables). It therefore can't prevent WPLoader
 * from touching a misconfigured database — by the time it runs, the connection
 * has happened. The gates that actually run BEFORE WPLoader are:
 *   1. the scoped MySQL test user (can't reach the live DB at all), and
 *   2. the `./wpf` pre-flight (validates .env before spawning codecept).
 * This class is the final net for raw `vendor/bin/codecept` runs and adds the
 * live-$wpdb-vs-config cross-check.
 *
 * Codeception loads tests/.env for %PARAM% substitution but not into getenv(),
 * so values are read straight from the file (the real source of truth).
 */
class GuardAgainstProductionDb
{
    public static function assertSandbox(): void
    {
        $env = self::readEnv();
        $dbName = (string) ($env['TEST_DB_NAME'] ?? '');
        $prefix = (string) ($env['TEST_TABLE_PREFIX'] ?? '');

        $reasons = [];

        if ($dbName === '') {
            $reasons[] = 'TEST_DB_NAME is empty.';
        } elseif (stripos($dbName, 'test') === false) {
            $reasons[] = "TEST_DB_NAME ('{$dbName}') has no 'test' token — refusing in case it is a live database.";
        }

        if ($prefix === '' || strtolower($prefix) === 'wp_') {
            $reasons[] = "TEST_TABLE_PREFIX ('{$prefix}') must be a distinct sandbox prefix, never the default 'wp_'.";
        }

        // Defense in depth: if WP is booted, the connection we are actually on
        // must be the configured sandbox, not some other database.
        global $wpdb;
        if (isset($wpdb) && !empty($wpdb->dbname) && $dbName !== '' && $wpdb->dbname !== $dbName) {
            $reasons[] = "Live DB connection ('{$wpdb->dbname}') does not match TEST_DB_NAME ('{$dbName}').";
        }

        if ($reasons) {
            fwrite(STDERR, "\n[FluentForm tests] Refusing to run — environment does not look like a sandbox:\n");
            foreach ($reasons as $reason) {
                fwrite(STDERR, "  - {$reason}\n");
            }
            fwrite(STDERR, "Fix dev/wp-browser/tests/.env (see .env.example) and try again.\n\n");
            exit(1);
        }
    }

    private static function readEnv(): array
    {
        $path = __DIR__ . '/../.env';
        if (!is_readable($path)) {
            return [];
        }

        $values = [];
        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
                continue;
            }
            [$key, $value] = explode('=', $line, 2);
            $values[trim($key)] = trim($value);
        }

        return $values;
    }
}

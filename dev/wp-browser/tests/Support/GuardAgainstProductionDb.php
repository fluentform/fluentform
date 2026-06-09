<?php

namespace Tests\Support;

/**
 * Fail-closed guard run from every suite bootstrap before any test touches the
 * database. WPLoader drops and recreates tables on the configured database, so
 * a misconfigured .env pointed at a live site would be catastrophic. This
 * refuses to proceed unless the target looks unmistakably like a sandbox.
 *
 * Codeception loads tests/.env for %PARAM% substitution but not into getenv(),
 * so the values are read straight from the file (the real source of truth). If
 * WordPress is already booted, the live $wpdb connection is cross-checked too.
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

<?php

namespace FluentForm\Database;

use FluentForm\Database\Migrations\FormAnalyticsMigrator;
use FluentForm\Database\Migrations\FormMetaMigrator;
use FluentForm\Database\Migrations\FormsMigrator;
use FluentForm\Database\Migrations\LogsMigrator;
use FluentForm\Database\Migrations\Migrator;
use FluentForm\Database\Migrations\ScheduledActionsMigrator;
use FluentForm\Database\Migrations\SubmissionDetailsMigrator;
use FluentForm\Database\Migrations\SubmissionMetaMigrator;
use FluentForm\Database\Migrations\SubmissionsMigrator;

require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

class DBMigrator
{
    private static array $migrators = [
        FormsMigrator::class,
        FormMetaMigrator::class,
        SubmissionsMigrator::class,
        SubmissionMetaMigrator::class,
        FormAnalyticsMigrator::class,
        SubmissionDetailsMigrator::class,
        LogsMigrator::class,
        ScheduledActionsMigrator::class
    ];

    public static function migrateUp($network_wide = false)
    {
        self::migrate();
    }

    public static function migrate()
    {
        /**
         * @var $migrator Migrator
         */
        foreach (self::$migrators as $migrator) {
            $migrator::migrate();
        }
    }

    public static function migrateDown($network_wide = false)
    {
        /**
         * @var $migrator Migrator
         */
        foreach (self::$migrators as $migrator) {
            $migrator::dropTable();
        }
    }

    public static function refresh($network_wide = false)
    {
        static::migrateDown($network_wide);
        static::migrateUp($network_wide);
    }
}
<?php

namespace FluentForm\Database\Migrations;

class LogsMigrator extends Migrator
{
    public static string $tableName = 'fluentform_logs';

    public static function getSqlSchema(): string
    {
        return <<<SQL
			  `id` INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
			  `parent_source_id` INT UNSIGNED NULL,
			  `source_type` VARCHAR(255) NULL,
			  `source_id` INT UNSIGNED NULL,
			  `component` VARCHAR(255) NULL,
			  `status` CHAR(30) NULL,
			  `title` VARCHAR(255) NOT NULL,
			  `description` LONGTEXT NULL,
			  `created_at` TIMESTAMP NULL

SQL;
    }

    public static function afterMigration()
    {
        update_option('fluentform_db_fluentform_logs_added', true, 'no');
    }
}

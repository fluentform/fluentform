<?php

namespace FluentForm\Database\Migrations;

class ScheduledActionsMigrator extends Migrator
{
    public static string $tableName = 'ff_scheduled_actions';

    public static function getSqlSchema(): string
    {
        return <<<SQL
            `id` BIGINT(20) UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
            `action` VARCHAR(255) NULL,
            `form_id` BIGINT(20) UNSIGNED NULL, 
            `origin_id` BIGINT(20) UNSIGNED NULL, 
			`feed_id` BIGINT(20) UNSIGNED NULL,
			`type` VARCHAR(255) DEFAULT 'submission_action',
			`status` VARCHAR(255) NULL,
			`data` LONGTEXT NULL,
			`note` TINYTEXT NULL,
			`retry_count` INT UNSIGNED DEFAULT 0,
			`created_at` TIMESTAMP NULL,
			`updated_at` TIMESTAMP NULL,
        
SQL;
    }

    public static function afterMigration()
    {
        update_option('fluentform_scheduled_actions_migrated', 'yes', 'no');
    }
}

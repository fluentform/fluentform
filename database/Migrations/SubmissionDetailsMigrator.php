<?php

namespace FluentForm\Database\Migrations;

class SubmissionDetailsMigrator extends Migrator
{
    public static string $tableName = 'fluentform_entry_details';

    public static function getSqlSchema(): string
    {
        return <<<SQL
			  `id` BIGINT(20) UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
			  `form_id` BIGINT(20) UNSIGNED NULL,
			  `submission_id` BIGINT(20) UNSIGNED NULL,
			  `field_name` VARCHAR(255) NULL,
			  `sub_field_name` VARCHAR(255) NULL,
			  `field_value` LONGTEXT NULL

SQL;
    }

    public static function afterMigration()
    {
        update_option('fluentform_entry_details_migrated', 'yes', 'no');
    }
}

<?php

namespace FluentForm\Database\Migrations;

class FormsMigrator extends Migrator
{
    public static string $tableName = 'fluentform_forms';

    public static function getSqlSchema(): string
    {
        return <<<SQL
			  `id` INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
			  `title` VARCHAR(255) NOT NULL,
			  `status` VARCHAR(45) NULL DEFAULT 'Draft',
			  `appearance_settings` TEXT NULL,
			  `form_fields` LONGTEXT NULL,
			  `has_payment` TINYINT(1) NOT NULL DEFAULT 0,
			  `type` VARCHAR(45) NULL,
			  `conditions` TEXT NULL,
			  `created_by` INT NULL,
			  `created_at` TIMESTAMP NULL,
			  `updated_at` TIMESTAMP NULL

SQL;
    }
}

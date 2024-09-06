<?php

namespace FluentForm\Database\Migrations;

class SubmissionsMigrator extends Migrator
{
    public static string $tableName = 'fluentform_submissions';

    public static function getSqlSchema(): string
    {
        return <<<SQL
			  `id` BIGINT(20) UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
			  `form_id` INT UNSIGNED NULL,
			  `serial_number` INT UNSIGNED NULL,
			  `response` LONGTEXT NULL,
			  `source_url` VARCHAR(255) NULL,
			  `user_id` INT UNSIGNED NULL,
			  `status` VARCHAR(45) NULL DEFAULT 'unread' COMMENT 'possible values: read, unread, trashed',
			  `is_favourite` TINYINT(1) NOT NULL DEFAULT 0,
			  `browser` VARCHAR(45) NULL,
			  `device` VARCHAR(45) NULL,
			  `ip` VARCHAR(45) NULL,
			  `city` VARCHAR(45) NULL,
			  `country` VARCHAR(45) NULL,
			  `payment_status` VARCHAR(45) NULL,
			  `payment_method` VARCHAR(45) NULL,
			  `payment_type` VARCHAR(45) NULL,
			  `currency` VARCHAR(45) NULL,
			  `payment_total` FLOAT NULL,
			  `total_paid` FLOAT NULL,
			  `created_at` TIMESTAMP NULL,
			  `updated_at` TIMESTAMP NULL

SQL;
    }
}

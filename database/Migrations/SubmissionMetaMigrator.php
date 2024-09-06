<?php

namespace FluentForm\Database\Migrations;

class SubmissionMetaMigrator extends Migrator
{
    public static string $tableName = 'fluentform_submission_meta';

    public static function getSqlSchema(): string
    {
        return <<<SQL
			 `id` BIGINT(20) UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
			  `response_id` BIGINT(20) UNSIGNED NULL,
			  `form_id` INT UNSIGNED NULL,
			  `meta_key` VARCHAR(45) NULL,
			  `value` LONGTEXT NULL,
			  `status` VARCHAR(45) NULL,
			  `user_id` INT UNSIGNED NULL,
			  `name` VARCHAR(45) NULL,
			  `created_at` TIMESTAMP NULL,
			  `updated_at` TIMESTAMP NULL

SQL;
    }
}

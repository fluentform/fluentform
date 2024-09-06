<?php

namespace FluentForm\Database\Migrations;

class FormMetaMigrator extends Migrator
{
    public static string $tableName = 'fluentform_form_meta';

    public static function getSqlSchema(): string
    {
        return <<<SQL
			  `id` INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
			  `form_id` INT UNSIGNED NULL,
			  `meta_key` VARCHAR(255) NOT NULL,
			  `value` LONGTEXT NULL

SQL;
    }
}

<?php

namespace FluentForm\Database\Migrations;

use FluentForm\Framework\Database\Schema;

class FormAnalyticsMigrator extends Migrator
{
    public static string $tableName = 'fluentform_form_analytics';

    public static function getSqlSchema(): string
    {
        return <<<SQL
			  `id` INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
			  `form_id` INT UNSIGNED NULL,
			  `user_id` INT UNSIGNED NULL,
			  `source_url` TEXT NOT NULL,
			  `platform` CHAR(30) NULL,
			  `browser` CHAR(30) NULL,
			  `city` VARCHAR (100) NULL,
			  `country` VARCHAR (100) NULL,
			  `ip` CHAR(15) NULL,
			  `count` INT DEFAULT 1,
			  `created_at` TIMESTAMP NULL

SQL;
    }

    public static function afterMigration()
    {
        $table = static::$tableName;
        $columnName = 'source_url';
        $columns = Schema::getColumnsWithTypes($table);
        foreach ($columns as $column) {
            if ($column['column_name'] === $columnName && $column['data_type'] === 'char') {
                Schema::sql("ALTER TABLE {$table} MODIFY {$columnName} TEXT NOT NULL");
            }
        }
    }
}

<?php

namespace Tests\Support;

use lucatume\WPBrowser\TestCase\WPTestCase;

/**
 * Base case for database/schema integration tests. Read-only table, column and
 * index inspectors plus a few row helpers, so test files contain only test_*
 * methods. Mirrors the cart-x helper, retargeted to FluentForm's table prefix.
 */
abstract class DatabaseTestCase extends WPTestCase
{
    protected function fullTableName(string $table): string
    {
        global $wpdb;
        return $wpdb->prefix . $table;
    }

    protected function tableExists(string $table): bool
    {
        global $wpdb;
        $fullTable = $this->fullTableName($table);
        return $wpdb->get_var("SHOW TABLES LIKE '{$fullTable}'") !== null;
    }

    protected function countFluentFormTables(): int
    {
        global $wpdb;
        $like = $wpdb->prefix . 'fluentform_%';
        return count($wpdb->get_col("SHOW TABLES LIKE '{$like}'"));
    }

    protected function getColumns(string $table): array
    {
        global $wpdb;
        $fullTable = $this->fullTableName($table);
        $results = $wpdb->get_results("SHOW COLUMNS FROM `{$fullTable}`", ARRAY_A);
        $columns = [];
        foreach ($results as $row) {
            $columns[$row['Field']] = $row;
        }
        return $columns;
    }

    protected function getColumnNames(string $table): array
    {
        return array_keys($this->getColumns($table));
    }

    protected function hasColumn(string $table, string $column): bool
    {
        return array_key_exists($column, $this->getColumns($table));
    }

    protected function getIndexes(string $table): array
    {
        global $wpdb;
        $fullTable = $this->fullTableName($table);
        $results = $wpdb->get_results("SHOW INDEX FROM `{$fullTable}`", ARRAY_A);
        $indexes = [];
        foreach ($results as $row) {
            $indexes[$row['Key_name']][] = $row['Column_name'];
        }
        return $indexes;
    }

    protected function assertColumnsExist(string $table, array $expectedColumns): void
    {
        $actual = $this->getColumnNames($table);
        foreach ($expectedColumns as $col) {
            $this->assertContains($col, $actual, "Column '{$col}' missing from {$table}");
        }
    }

    protected function insertRow(string $table, array $data): int
    {
        global $wpdb;
        $wpdb->insert($this->fullTableName($table), $data);
        return (int) $wpdb->insert_id;
    }

    protected function getRow(string $table, int $id): ?object
    {
        global $wpdb;
        $fullTable = $this->fullTableName($table);
        return $wpdb->get_row($wpdb->prepare("SELECT * FROM `{$fullTable}` WHERE `id` = %d", $id));
    }
}

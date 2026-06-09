<?php

namespace Tests\Integration\Database;

use Tests\Support\DatabaseTestCase;

/**
 * Proves the bootstrap migration created FluentForm's tables. Supersedes the
 * legacy dev/test/tests/DB/TestDBWorks.php with a check against the real schema.
 */
class TablesExistTest extends DatabaseTestCase
{
    public function test_core_tables_exist(): void
    {
        $tables = [
            'fluentform_forms',
            'fluentform_form_meta',
            'fluentform_submissions',
            'fluentform_submission_meta',
            'fluentform_form_analytics',
            'fluentform_entry_details',
            'fluentform_logs',
        ];

        foreach ($tables as $table) {
            $this->assertTrue($this->tableExists($table), "Missing table: {$table}");
        }
    }

    public function test_forms_table_has_expected_columns(): void
    {
        $this->assertColumnsExist('fluentform_forms', ['id', 'title', 'status', 'form_fields', 'type']);
    }
}

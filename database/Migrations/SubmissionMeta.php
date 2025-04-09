<?php

namespace FluentForm\Database\Migrations;

class SubmissionMeta
{
    /**
     * Migrate the table.
     *
     * @return void
     */
    public static function migrate()
    {
        global $wpdb;

        $charsetCollate = $wpdb->get_charset_collate();

        $table = $wpdb->prefix . 'fluentform_submission_meta';
        $indexPrefix = $wpdb->prefix . 'ff_s_m_idx';

        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") != $table) {
            $sql = "CREATE TABLE $table (
			  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			  `response_id` BIGINT(20) UNSIGNED NULL,
			  `form_id` INT UNSIGNED NULL,
			  `meta_key` VARCHAR(45) NULL,
			  `value` LONGTEXT NULL,
			  `status` VARCHAR(45) NULL,
			  `user_id` INT UNSIGNED NULL,
			  `name` VARCHAR(45) NULL,
			  `created_at` TIMESTAMP NULL,
			  `updated_at` TIMESTAMP NULL,
			  PRIMARY KEY (`id`),
              INDEX `{$indexPrefix}_response_id` (`response_id`),
              INDEX `{$indexPrefix}_form_id` (`form_id`)) $charsetCollate;";
            require_once ABSPATH . 'wp-admin/includes/upgrade.php';
            dbDelta($sql);
        } else {
            // For existing installations, add indexes if they don't exist
            $indexes = $wpdb->get_results("SHOW INDEX FROM $table");
            $indexedColumns = [];
            foreach ($indexes as $index) {
                $indexedColumns[] = $index->Column_name;
            }
            if (!in_array('response_id', $indexedColumns)) {
                $wpdb->query("ALTER TABLE {$table} ADD INDEX `{$indexPrefix}_response_id` (`response_id`);");
            }
            if (!in_array('form_id', $indexedColumns)) {
                $wpdb->query("ALTER TABLE {$table} ADD INDEX `{$indexPrefix}_form_id` (`form_id`);");
            }
        }
    }
}
<?php

namespace FluentForm\Database;

use FluentForm\Database\Migrations\Logs;
use FluentForm\Database\Migrations\Forms;
use FluentForm\Database\Migrations\FormMeta;
use FluentForm\Database\Migrations\Submissions;
use FluentForm\Database\Migrations\FormAnalytics;
use FluentForm\Database\Migrations\SubmissionMeta;
use FluentForm\Database\Migrations\ScheduledActions;
use FluentForm\Database\Migrations\SubmissionDetails;

class DBMigrator
{
    public static function getMigrations()
    {
        return [
            'fluentform_forms'           => Forms::class,
            'fluentform_form_meta'       => FormMeta::class,
            'fluentform_submissions'     => Submissions::class,
            'fluentform_submission_meta' => SubmissionMeta::class,
            'fluentform_form_analytics'  => FormAnalytics::class,
            'fluentform_entry_details'   => SubmissionDetails::class,
            'fluentform_logs'            => Logs::class,
            'ff_scheduled_actions'       => ScheduledActions::class,
        ];
    }

    public static function run($network_wide = false)
    {
        Forms::migrate();
        FormMeta::migrate();
        Submissions::migrate(true);
        SubmissionMeta::migrate();
        FormAnalytics::migrate();
        SubmissionDetails::migrate();
        Logs::migrate();
        ScheduledActions::migrate();
    }

    public static function migrateUp($network_wide = false)
    {
        static::run($network_wide);
    }

    public static function migrateDown($network_wide = false)
    {
        global $wpdb;

        foreach (array_keys(static::getMigrations()) as $table) {
            $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}{$table}");
        }
    }
}

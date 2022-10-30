<?php

namespace FluentForm\Database;

use FluentForm\Database\Migrations\Forms;
use FluentForm\Database\Migrations\FormLogs;
use FluentForm\Database\Migrations\FormMeta;
use FluentForm\Database\Migrations\FormAnalytics;
use FluentForm\Database\Migrations\FormSubmissions;
use FluentForm\Database\Migrations\ScheduledActions;
use FluentForm\Database\Migrations\FormSubmissionMeta;
use FluentForm\Database\Migrations\FormSubmissionDetails;

class DBMigrator
{
    public static function run($network_wide = false)
    {
        Forms::migrate();
        FormMeta::migrate();
        FormSubmissions::migrate(true);
        FormSubmissionMeta::migrate();
        FormAnalytics::migrate();
        FormSubmissionDetails::migrate();
        FormLogs::migrate();
        ScheduledActions::migrate();
    }
}

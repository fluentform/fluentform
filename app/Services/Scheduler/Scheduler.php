<?php

namespace FluentForm\App\Services\Scheduler;

use FluentForm\App\Helpers\Helper;
use FluentForm\App\Models\Form;
use FluentForm\App\Models\FormAnalytics;
use FluentForm\App\Models\Scheduler as SchedulerModel;
use FluentForm\App\Models\Submission;
use FluentForm\App\Modules\Payments\PaymentHelper;
use FluentForm\App\Services\Emogrifier\Emogrifier;
use FluentForm\Framework\Support\Arr;

class Scheduler
{
    public static function processEmailReport()
    {
        self::cleanUpOldData();
        $defaults = [
            'status' => 'yes',
            'send_to_type' => 'admin_email',
            'custom_recipients' => '',
            'sending_day' => 'Mon'
        ];
        $settings = get_option('_fluentform_email_report_summary');
        if($settings) {
            $settings = wp_parse_args($settings, $defaults);
        } else {
            $settings = $defaults;
        }
        $settings = apply_filters('fluentform/email_summary_settings', $settings);
    
        if($settings['status'] == 'no') {
            return;
        }

        $currentDay = date('D');
        $reportingDay = $settings['sending_day'];
    
        $config = apply_filters_deprecated(
            'fluentform_email_summary_config',
            [
                [
                    'status' => $currentDay == $reportingDay,
                    'days' => 7
                ]
            ],
            FLUENTFORM_FRAMEWORK_UPGRADE,
            'fluentform/email_summary_config',
            'Use fluentform/email_summary_config instead of fluentform_email_summary_config.'
        );

        $config = apply_filters('fluentform/email_summary_config', $config);

        if (!$config['status']) {
            return;
        }

        $days = $config['days'];

        if($settings['send_to_type'] == 'admin_email') {
            $recipients = [get_option('admin_email')];
        } else {
            $custom_recipients = $settings['custom_recipients'];
            $custom_recipients = explode(',', $custom_recipients);
            $recipients = [];
            foreach ($custom_recipients as $recipient) {
                $recipient = trim($recipient);
                if(is_email($recipient)) {
                    $recipients[] = $recipient;
                }
            }
        }

        if(!$recipients) {
            return;
        }


        // Let's grab the reports
        global $wpdb;
        $days = intval($days);
        if(!$days) {
            $days = 7;
        }

        $reportDateFrom = date('Y-m-d', time() - $days * 86400); // 7 days
        $submissionCounts = Submission::select([
                wpFluent()->raw("COUNT({$wpdb->prefix}fluentform_submissions.id) as total"),
                'fluentform_submissions.form_id',
                'fluentform_forms.title'
            ])
            ->groupBy('fluentform_submissions.form_id')
            ->orderBy('total', 'DESC')
            ->where('fluentform_submissions.created_at', '>', $reportDateFrom)
            ->join('fluentform_forms', 'fluentform_forms.id', '=', 'fluentform_submissions.form_id')
            ->limit(15)
            ->get();

        foreach ($submissionCounts as $submissionCount) {
            $submissionCount->permalink = admin_url('admin.php?page=fluent_forms&route=entries&form_id='.$submissionCount->form_id);
            $submissionCount->draft_total = 0;
        }

        $draftCounts = self::getDraftSubmissionCounts($reportDateFrom, null);
        foreach ($submissionCounts as $submissionCount) {
            if (isset($draftCounts[ $submissionCount->form_id ])) {
                $submissionCount->draft_total = (int) $draftCounts[ $submissionCount->form_id ];
            }
        }

        if(!$submissionCounts || $submissionCounts->isEmpty()) {
            return; // Nothing found
        }

        $paymentCounts = [];
        if(PaymentHelper::hasPaymentSettings()) {
            $paymentCounts = wpFluent()->table('fluentform_transactions')
                ->select([
                    wpFluent()->raw("SUM({$wpdb->prefix}fluentform_transactions.payment_total) as total_amount"),
                    'fluentform_transactions.form_id',
                    'fluentform_transactions.currency',
                    'fluentform_forms.title'
                ])
                ->groupBy('fluentform_transactions.form_id')
                ->orderBy('total_amount', 'DESC')
                ->where('fluentform_transactions.created_at', '>', $reportDateFrom)
                ->where('fluentform_transactions.status', '=', 'paid')
                ->join('fluentform_forms', 'fluentform_forms.id', '=', 'fluentform_transactions.form_id')
                ->limit(15)
                ->get();
            foreach ($paymentCounts as $paymentCount) {
                $paymentCount->readable_amount = $paymentCount->currency.' '.number_format($paymentCount->total_amount / 100);
            }
        }

        $data = array(
            'submissions' => $submissionCounts,
            'payments' => $paymentCounts,
            'days' => $days
        );
        $emailBody = wpFluentForm('view')->make('email.report.body', $data);
    
        $emailBody = apply_filters_deprecated(
            'fluentform_email_summary_body',
            [
                $emailBody,
                $data
            ],
            FLUENTFORM_FRAMEWORK_UPGRADE,
            'fluentform/email_summary_body',
            'Use fluentform/email_summary_body instead of fluentform_email_summary_body.'
        );

        $emailBody = apply_filters('fluentform/email_summary_body', $emailBody, $data);

        $originalEmailBody = $emailBody;

        ob_start();
        try {
            // apply CSS styles inline for picky email clients
            $emogrifier = new Emogrifier($emailBody);
            $emailBody = $emogrifier->emogrify();
        } catch (\Exception $e) {

        }
        $maybeError = ob_get_clean();

        if ($maybeError) {
            $emailBody =  $originalEmailBody;
        }

        $headers = [
            'Content-Type: text/html; charset=utf-8'
        ];
        /* translators: %s is the Number Email Summary Days */
        $emailSubject = sprintf(esc_html__('Email Summary of Your Forms (Last %d Days)', 'fluentform'), $days);

        if (isset($settings['subject']) && $settings['subject']) {
            $emailSubject = $settings['subject'];
        }
    
        $emailSubject = apply_filters_deprecated(
            'fluentform_email_summary_subject',
            [
                $emailSubject
            ],
            FLUENTFORM_FRAMEWORK_UPGRADE,
            'fluentform/email_summary_subject',
            'Use fluentform/email_summary_subject instead of fluentform_email_summary_subject'
        );
        $emailSubject = apply_filters('fluentform/email_summary_subject', $emailSubject);

        $emailResult = wp_mail($recipients, $emailSubject, $emailBody, $headers);

        do_action_deprecated(
            'fluentform_email_summary_details',
            [
                [
                    'recipients' => $recipients,
                    'email_subject' => $emailSubject,
                    'email_body' => $emailBody
                ],
                $data,
                $emailResult
            ],
            FLUENTFORM_FRAMEWORK_UPGRADE,
            'fluentform/email_summary_details',
            'Use fluentform/email_summary_details instead of fluentform_email_summary_details.'
        );

        do_action('fluentform/email_summary_details', [
            'recipients' => $recipients,
            'email_subject' => $emailSubject,
            'email_body' => $emailBody
        ], $data, $emailResult);

        return $emailResult;
    }

    /**
     * Process per-form email summary reports (runs separately from global report).
     */
    public static function processPerFormEmailReports()
    {
        global $wpdb;
        $currentDay = date('D');
        $days = 7;
        $config = apply_filters('fluentform/per_form_email_summary_config', ['days' => $days]);
        $days = isset($config['days']) ? intval($config['days']) : 7;
        if ($days < 1) {
            $days = 7;
        }
        $reportDateFrom = date('Y-m-d', time() - $days * 86400);

        $forms = Form::all();
        foreach ($forms as $form) {
            $formId = $form->id;
            $formSettings = Form::getFormMeta('formSettings', $formId);
            if (!is_array($formSettings)) {
                $formSettings = is_string($formSettings) ? json_decode($formSettings, true) : [];
            }
            $summary = isset($formSettings['per_form_email_summary']) ? $formSettings['per_form_email_summary'] : [];
            if (empty($summary) || !is_array($summary)) {
                continue;
            }
            $summary = wp_parse_args($summary, [
                'status'            => 'no',
                'send_to_type'      => 'admin_email',
                'custom_recipients' => '',
                'sending_day'       => 'Mon',
                'subject'            => '',
            ]);

            if ($summary['status'] !== 'yes' || $summary['sending_day'] !== $currentDay) {
                continue;
            }

            if ($summary['send_to_type'] === 'admin_email') {
                $recipients = [get_option('admin_email')];
            } else {
                $custom_recipients = isset($summary['custom_recipients']) ? $summary['custom_recipients'] : '';
                $custom_recipients = explode(',', $custom_recipients);
                $recipients = [];
                foreach ($custom_recipients as $recipient) {
                    $recipient = trim($recipient);
                    if (is_email($recipient)) {
                        $recipients[] = $recipient;
                    }
                }
            }
            if (empty($recipients)) {
                continue;
            }

            $submissionCounts = Submission::select([
                    wpFluent()->raw("COUNT({$wpdb->prefix}fluentform_submissions.id) as total"),
                    'fluentform_submissions.form_id',
                    'fluentform_forms.title'
                ])
                ->groupBy('fluentform_submissions.form_id')
                ->where('fluentform_submissions.form_id', $formId)
                ->where('fluentform_submissions.created_at', '>', $reportDateFrom)
                ->join('fluentform_forms', 'fluentform_forms.id', '=', 'fluentform_submissions.form_id')
                ->get();

            foreach ($submissionCounts as $submissionCount) {
                $submissionCount->permalink = admin_url('admin.php?page=fluent_forms&route=entries&form_id=' . $submissionCount->form_id);
                $submissionCount->draft_total = 0;
            }
            $draftCountsPerForm = self::getDraftSubmissionCounts($reportDateFrom, $formId);
            $draftTotal = isset($draftCountsPerForm[ $formId ]) ? (int) $draftCountsPerForm[ $formId ] : 0;
            foreach ($submissionCounts as $submissionCount) {
                $submissionCount->draft_total = $draftTotal;
            }

            $paymentCounts = [];
            if (PaymentHelper::hasPaymentSettings()) {
                $paymentCounts = wpFluent()->table('fluentform_transactions')
                    ->select([
                        wpFluent()->raw("SUM({$wpdb->prefix}fluentform_transactions.payment_total) as total_amount"),
                        'fluentform_transactions.form_id',
                        'fluentform_transactions.currency',
                        'fluentform_forms.title'
                    ])
                    ->groupBy('fluentform_transactions.form_id')
                    ->where('fluentform_transactions.form_id', $formId)
                    ->where('fluentform_transactions.created_at', '>', $reportDateFrom)
                    ->where('fluentform_transactions.status', '=', 'paid')
                    ->join('fluentform_forms', 'fluentform_forms.id', '=', 'fluentform_transactions.form_id')
                    ->get();
                foreach ($paymentCounts as $paymentCount) {
                    $paymentCount->readable_amount = $paymentCount->currency . ' ' . number_format($paymentCount->total_amount / 100);
                }
            }

            $reportDateTo = date('Y-m-d 23:59:59', time());
            $integrationStats = self::getIntegrationStats($formId, [ $reportDateFrom . ' 00:00:00', $reportDateTo ]);

            $data = [
                'submissions'       => $submissionCounts,
                'payments'          => $paymentCounts,
                'days'              => $days,
                'single_form'       => true,
                'form_title'        => $form->title,
                'form_id'           => $formId,
                'draft_total'       => $draftTotal,
                'integration_stats' => $integrationStats,
            ];
            $emailBody = wpFluentForm('view')->make('email.report.body', $data);
            $emailBody = apply_filters('fluentform/email_summary_body', $emailBody, $data);

            $originalEmailBody = $emailBody;
            ob_start();
            try {
                $emogrifier = new Emogrifier($emailBody);
                $emailBody = $emogrifier->emogrify();
            } catch (\Exception $e) {
                $emailBody = $originalEmailBody;
            }
            ob_get_clean();

            $emailSubject = isset($summary['subject']) && $summary['subject'] !== ''
                ? $summary['subject']
                : sprintf(__('Weekly summary for %s', 'fluentform'), $form->title);
            $replacements = [
                '{form_title}' => $form->title,
                '{form_id}'    => (string) $formId,
                '{days}'       => (string) $days,
                '{site_name}'  => get_bloginfo('name'),
            ];
            $emailSubject = str_replace(array_keys($replacements), array_values($replacements), $emailSubject);
            $emailSubject = apply_filters('fluentform/per_form_email_summary_subject', $emailSubject, $formId, $data);

            $headers = ['Content-Type: text/html; charset=utf-8'];
            wp_mail($recipients, $emailSubject, $emailBody, $headers);
        }
    }

    /**
     * Get draft (incomplete) submission counts per form for the period.
     *
     * @param string     $reportDateFrom Date string (Y-m-d) for start of period.
     * @param int|null   $formId         Optional. Limit to one form.
     * @return array<int,int> Map of form_id => count.
     */
    private static function getDraftSubmissionCounts($reportDateFrom, $formId = null)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'fluentform_draft_submissions';
        $exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table)) === $table;
        if (!$exists) {
            return apply_filters('fluentform/email_summary_draft_counts', [], $reportDateFrom, $formId);
        }

        try {
            $query = wpFluent()->table('fluentform_draft_submissions')
                ->select([
                    'form_id',
                    wpFluent()->raw('COUNT(id) AS draft_total'),
                ])
                ->groupBy('form_id');

            if ($formId !== null) {
                $query->where('form_id', '=', (int) $formId);
            }

            $dateCol = null;
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Table name is from prefix, safe.
            $cols = $wpdb->get_results('SHOW COLUMNS FROM `' . esc_sql($table) . '`');
            foreach (is_array($cols) ? $cols : [] as $col) {
                $field = isset($col->Field) ? $col->Field : '';
                if ($field === 'updated_at' || $field === 'created_at') {
                    $dateCol = $field;
                    break;
                }
            }
            if ($dateCol !== null) {
                $query->where($dateCol, '>=', $reportDateFrom . ' 00:00:00');
            }

            $rows = $query->get();
            $counts = [];
            foreach ($rows as $row) {
                $counts[ (int) $row->form_id ] = (int) $row->draft_total;
            }
            return apply_filters('fluentform/email_summary_draft_counts', $counts, $reportDateFrom, $formId);
        } catch (\Exception $e) {
            return apply_filters('fluentform/email_summary_draft_counts', [], $reportDateFrom, $formId);
        }
    }

    /**
     * Get successful, failed and processing integration (API) run counts per form.
     * Only includes integration_notify_ actions (excludes email notifications etc).
     *
     * @param int   $formId    Form ID.
     * @param array $dateRange Optional. [ startDate, endDate ] for filtering.
     * @return array<string, array{success: int, failed: int, processing: int}> Map of integration display name => [ 'success' => n, 'failed' => n, 'processing' => n ].
     */
    public static function getIntegrationStats($formId, $dateRange = [])
    {
        $formId = (int) $formId;
        if ($formId <= 0) {
            return [];
        }
        $query = SchedulerModel::selectRaw('action, status, COUNT(*) as run_count')
            ->where('form_id', $formId)
            ->where(function ($q) {
                $q->where('action', 'like', 'fluentform/integration_notify_%')
                    ->orWhere('action', 'like', 'fluentform_integration_notify_%');
            });

        $startDate = Arr::get($dateRange, 0);
        $endDate = Arr::get($dateRange, 1);
        if ($startDate && $endDate) {
            if ($startDate != date('Y-m-d H:i:s', strtotime($startDate))) {
                $startDate .= ' 00:00:01';
            }
            if ($endDate != date('Y-m-d H:i:s', strtotime($endDate))) {
                $endDate .= ' 23:59:59';
            }
            $query->where('updated_at', '>=', $startDate)
                ->where('updated_at', '<=', $endDate);
        }

        $rows = $query->groupBy('action', 'status')->get();

        $stats = [];
        foreach ($rows as $row) {
            $name = Helper::getLogInitiator($row->action, 'api');
            if (! isset($stats[ $name ])) {
                $stats[ $name ] = [ 'success' => 0, 'failed' => 0, 'processing' => 0 ];
            }
            $status = strtolower((string) $row->status);
            $count = (int) $row->run_count;
            if ($status === 'pending' || $status === 'processing') {
                $stats[ $name ]['processing'] += $count;
            } elseif ($status === 'success' || $status === 'completed') {
                $stats[ $name ]['success'] += $count;
            } else {
                $stats[ $name ]['failed'] += $count;
            }
        }

        return apply_filters('fluentform/get_integration_stats', $stats, $formId, $dateRange);
    }

    private static function cleanUpOldData()
    {
        $days = 60;
        $days = apply_filters_deprecated(
            'fluentform_cleanup_days_count',
            [
                $days
            ],
            FLUENTFORM_FRAMEWORK_UPGRADE,
            'fluentform/cleanup_days_count',
            'Use fluentform/cleanup_days_count instead of fluentform_cleanup_days_count.'
        );
        $deleteDaysCount = apply_filters('fluentform/cleanup_days_count', $days);
        if(!$deleteDaysCount) {
            return;
        }
        $seconds = $deleteDaysCount * 86400;
        $deleteTo = date('Y-m-d H:i:s', time() - $seconds);
        // delete 60 days old analytics data
        FormAnalytics::where('created_at', '<', $deleteTo)
            ->delete();

        // delete 60 days old scheduled_actions data
        \FluentForm\App\Models\Scheduler::where('created_at', '<', $deleteTo)
            ->delete();

    }
}

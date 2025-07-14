<?php

namespace FluentForm\App\Services\Report;

use Exception;
use FluentForm\App\Models\Form;
use FluentForm\App\Models\Submission;
use FluentForm\Framework\Helpers\ArrayHelper as Arr;
use FluentForm\Framework\Support\Sanitizer;


class ReportService
{
    /**
     * Get Form Report
     * @param array $attr
     * @return array|mixed $response
     * @throws Exception
     */
    public function form($attr = [])
    {
        $formId = (int) Arr::get($attr, 'form_id');
        ReportHelper::maybeMigrateData($formId);
        try {
            $form = Form::findOrFail($formId);
        } catch (Exception $e) {
            throw new \Exception("The form couldn't be found.");
        }

        $statuses = Arr::get($attr, 'statuses', ['read', 'unread', 'unapproved', 'approved', 'declined', 'unconfirmed', 'confirmed']);
        return ReportHelper::generateReport($form, $statuses);
    }

    /**
     * Get Submissions Report
     *
     * @throws Exception
     */
    public function submissions($args)
    {
        try {
            return Submission::report($args);
        } catch (Exception $e) {
            throw new Exception($e->getMessage());
        }
    }

    /**
     * Get Reports Data
     * 
     * @param array $data
     * @return array
     */
    public function getReports($data)
    {

        $data = Sanitizer::sanitize($data, [
            'start_date' => 'sanitizeTextField',
            'end_date' => 'sanitizeTextField',
            'component' => 'sanitizeTextField',
            'view' => 'sanitizeTextField',
            'metric' => 'sanitizeTextField',
            'transactions_payment_status' => 'sanitizeTextField',
            'transactions_payment_method' => 'sanitizeTextField',
            'subscriptions_status' => 'sanitizeTextField',
            'subscriptions_interval' => 'sanitizeTextField',
            'subscriptions_form_id' => 'sanitizeTextField',
            'stats_range' => 'sanitizeTextField'
        ]);

        $startDate = Arr::get($data, 'start_date');
        $endDate = Arr::get($data, 'end_date');
        $formId = intval(Arr::get($data, 'form_id'));
        $component = Arr::get($data, 'component');
        
        // if no start or end date, then set default date range as last month
        if (!$startDate || !$endDate) {
            $now = new \DateTime();
            $endDate = $now->format('Y-m-d 23:59:59');

            $thirtyDaysAgo = new \DateTime();
            $thirtyDaysAgo->modify('-30 days');
            $startDate = $thirtyDaysAgo->format('Y-m-d 00:00:00');
        }

        $reports = ['reports' => []];

        if ($component === 'overview_chart') {
            $view = Arr::get($data, 'view', 'submissions');
            $reports['reports']['overview_chart'] = ReportHelper::getOverviewChartData($startDate, $endDate, $formId, $view);
        } else if ($component === 'completion_rate') {
            $reports['reports']['completion_rate'] = ReportHelper::getCompletionRateData($startDate, $endDate, $formId);
        } else if ($component === 'form_stats') {
            $reports['reports']['form_stats'] = ReportHelper::getFormStats($startDate, $endDate);
        } else if ($component === 'heatmap_data') {
            $reports['reports']['heatmap_data'] = ReportHelper::getSubmissionHeatmap($startDate, $endDate);
        } else if ($component === 'country_heatmap') {
            $reports['reports']['country_heatmap'] = ReportHelper::getSubmissionsByCountry($startDate, $endDate, $formId);
        } else if ($component === 'api_logs') {
            $reports['reports']['api_logs'] = ReportHelper::getApiLogs($startDate, $endDate);
        } else if ($component === 'top_performing_forms') {
            $metric = Arr::get($data, 'metric', 'entries');
            $reports['reports']['top_performing_forms'] = ReportHelper::getTopPerformingForms($startDate, $endDate, $metric);
        } else if ($component === 'transactions') {
            $transactionsFormId = intval(Arr::get($data, 'transactions_form_id'));
            $transactionsPaymentStatus = Arr::get($data, 'transactions_payment_status', '');
            $transactionsPaymentMethod = Arr::get($data, 'transactions_payment_method', '');

            $reports['reports']['transactions'] = ReportHelper::getTransactions(
                $startDate,
                $endDate,
                $transactionsFormId,
                $transactionsPaymentStatus,
                $transactionsPaymentMethod
            );
        } else if ($component === 'subscriptions') {
            $subscriptionsStatus = Arr::get($data, 'subscriptions_status', 'all');
            $subscriptionsInterval = Arr::get($data, 'subscriptions_interval', 'all');
            $subscriptionsFormId = Arr::get($data, 'subscriptions_form_id', 0);
            $reports['reports']['subscriptions'] = ReportHelper::getSubscriptions($startDate, $endDate, $subscriptionsStatus, $subscriptionsInterval, $subscriptionsFormId);
        } else {
            // Return all reports if no specific component requested
            $view = Arr::get($data, 'view', 'submissions');
            $statsRange = Arr::get($data, 'stats_range', 'month');
            $transactionsFormId = intval(Arr::get($data, 'transactions_form_id'));
            $transactionsPaymentStatus = Arr::get($data, 'transactions_payment_status', '');
            $transactionsPaymentMethod = Arr::get($data, 'transactions_payment_method', '');

            $reports['reports'] = [
                'overview_chart'        => ReportHelper::getOverviewChartData($startDate, $endDate, $formId, $view),
                'form_stats'            => ReportHelper::getFormStats($startDate, $endDate, $statsRange),
                'completion_rate'       => ReportHelper::getCompletionRateData($startDate, $endDate, $formId),
                'heatmap_data'          => ReportHelper::getSubmissionHeatmap($startDate, $endDate),
                'country_heatmap'       => ReportHelper::getSubmissionsByCountry($startDate, $endDate, $formId),
                'api_logs'              => ReportHelper::getApiLogs($startDate, $endDate),
                'top_performing_forms'  => ReportHelper::getTopPerformingForms($startDate, $endDate, 'entries'),
                'transactions'          => ReportHelper::getTransactions(
                    $startDate,
                    $endDate,
                    $transactionsFormId,
                    $transactionsPaymentStatus,
                    $transactionsPaymentMethod
                ),
                'subscriptions'         => ReportHelper::getSubscriptions($startDate, $endDate)
            ];
        }

        return $reports;
    }

    /**
     * Get forms for dropdown
     * 
     * @return array
     */
    public function getFormsDropdown()
    {
        $forms = Form::select(['id', 'title', 'has_payment'])
                     ->orderBy('id', 'DESC')
                     ->get();

        return [
            'forms' => $forms
        ];
    }
}

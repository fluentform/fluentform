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
            'stats_range' => 'sanitizeTextField'
        ]);

        $startDate = Arr::get($data, 'start_date');
        $endDate = Arr::get($data, 'end_date');
        $formId = intval(Arr::get($data, 'form_id'));
        $components = array_map('trim', explode(',', Arr::get($data, 'component', '')));
        // if no start or end date, then set default date range as last month
        if (!$startDate || !$endDate) {
            $now = new \DateTime();
            $endDate = $now->format('Y-m-d 23:59:59');

            $thirtyDaysAgo = new \DateTime();
            $thirtyDaysAgo->modify('-30 days');
            $startDate = $thirtyDaysAgo->format('Y-m-d 00:00:00');
        }

        $reports = ['reports' => []];
        if (in_array('overview_chart', $components)) {
            $reports['reports']['overview_chart'] = ReportHelper::getOverviewChartData($startDate, $endDate, $formId, 'activity');
            $reports['reports']['revenue_chart'] = ReportHelper::getOverviewChartData($startDate, $endDate, $formId, 'revenue');
        }

        if (in_array('completion_rate', $components)) {
            $reports['reports']['completion_rate'] = ReportHelper::getCompletionRateData($startDate, $endDate, $formId);
        }

        if (in_array('form_stats', $components)) {
            $reports['reports']['form_stats'] = ReportHelper::getFormStats($startDate, $endDate, $formId);
        }

        if (in_array('heatmap_data', $components)) {
            $reports['reports']['heatmap_data'] = ReportHelper::getSubmissionHeatmap($startDate, $endDate);
        }

        if (in_array('country_heatmap', $components)) {
            $reports['reports']['country_heatmap'] = ReportHelper::getSubmissionsByCountry($startDate, $endDate, $formId);
        }

        if (in_array('api_logs', $components)) {
            $reports['reports']['api_logs'] = ReportHelper::getApiLogs($startDate, $endDate);
        }

        if (in_array('top_performing_forms', $components)) {
            $metric = Arr::get($data, 'metric', 'entries');
            $reports['reports']['top_performing_forms'] = ReportHelper::getTopPerformingForms($startDate, $endDate, $metric);
        }

        if (in_array('subscriptions', $components)) {
            $reports['reports']['subscriptions'] = ReportHelper::getSubscriptions($startDate, $endDate, $formId);
        }

        if (in_array('payment_types', $components)) {
            $reports['reports']['payment_types'] = [
                'subscription' => ReportHelper::getPaymentsByType($startDate, $endDate, 'subscription', $formId),
                'onetime' => ReportHelper::getPaymentsByType($startDate, $endDate, 'onetime', $formId)
            ];
        }

        if (!$components || empty($reports['reports'])) {
            $reports['reports'] = [
                'overview_chart'        => ReportHelper::getOverviewChartData($startDate, $endDate, $formId, 'activity'),
                'revenue_chart'         => ReportHelper::getOverviewChartData($startDate, $endDate, $formId, 'revenue'),
                'form_stats'            => ReportHelper::getFormStats($startDate, $endDate, $formId),
                'completion_rate'       => ReportHelper::getCompletionRateData($startDate, $endDate, $formId),
                'heatmap_data'          => ReportHelper::getSubmissionHeatmap($startDate, $endDate),
                'country_heatmap'       => ReportHelper::getSubmissionsByCountry($startDate, $endDate, $formId),
                'api_logs'              => ReportHelper::getApiLogs($startDate, $endDate),
                'top_performing_forms'  => ReportHelper::getTopPerformingForms($startDate, $endDate, 'entries'),
                'subscriptions'         => ReportHelper::getSubscriptions($startDate, $endDate, $formId),
                'payment_types' => [
                    'subscription' => ReportHelper::getPaymentsByType($startDate, $endDate, 'subscription', $formId),
                    'onetime' => ReportHelper::getPaymentsByType($startDate, $endDate, 'onetime', $formId)
                ],
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

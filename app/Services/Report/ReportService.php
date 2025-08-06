<?php

namespace FluentForm\App\Services\Report;

use Exception;
use FluentForm\App\Helpers\Helper;
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
            $reports['reports']['heatmap_data'] = ReportHelper::getSubmissionHeatmap($startDate, $endDate, $formId);
        }

        if (in_array('country_heatmap', $components)) {
            $reports['reports']['country_heatmap'] = ReportHelper::getSubmissionsByCountry($startDate, $endDate, $formId);
        }

        if (in_array('api_logs', $components)) {
            $reports['reports']['api_logs'] = ReportHelper::getApiLogs($startDate, $endDate, $formId);
        }

        if (in_array('top_performing_forms', $components)) {
            $metric = Arr::get($data, 'metric', 'entries');
            if (!in_array($metric, ['entries', 'payments'])) {
                $metric = 'entries';
            }
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
                'heatmap_data'          => ReportHelper::getSubmissionHeatmap($startDate, $endDate), $formId,
                'country_heatmap'       => ReportHelper::getSubmissionsByCountry($startDate, $endDate, $formId),
                'api_logs'              => ReportHelper::getApiLogs($startDate, $endDate, $formId),
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
     * Get Net Revenue Data
     *
     * @return array{data: mixed, totals: mixed, total: mixed, group_by: array|\ArrayAccess|mixed, date_range: array{start: mixed, end: mixed}}
     */
    public function netRevenue($data)
    {
        if (!Helper::hasPro()) {
            return [
                'data' => [],
                'totals' => [],
                'total' => 0,
                'group_by' => 'forms',
                'date_range' => [
                    'start' => '',
                    'end' => ''
                ]
            ];
        }
        $data = Sanitizer::sanitize($data, [
            'start_date' => 'sanitizeTextField',
            'end_date' => 'sanitizeTextField',
            'group_by' => 'sanitizeTextField',
        ]);

        $groupBy = Arr::get($data, 'group_by', 'forms');
        $startDate = Arr::get($data, 'start_date');
        $endDate = Arr::get($data, 'end_date');
        $formId = intval(Arr::get($data, 'form_id'));
        $perPage = intval(Arr::get($data, 'per_page', 10));
        $currentPage = intval(Arr::get($data, 'page', 1));

        if (!$startDate || !$endDate) {
            $endDate = current_time('Y-m-d H:i:s');
            $startDate = date('Y-m-d H:i:s', strtotime('-30 days', strtotime($endDate)));
        }

        try {
            switch ($groupBy) {
                case 'forms':
                    $data = ReportHelper::getNetRevenueByForms($startDate, $endDate, $perPage, $currentPage);
                    break;
                case 'payment_method':
                    $data = ReportHelper::getNetRevenueByPaymentMethod($startDate, $endDate, $formId, $perPage, $currentPage);
                    break;
                case 'payment_type':
                    $data = ReportHelper::getNetRevenueByPaymentType($startDate, $endDate, $formId, $perPage, $currentPage);
                    break;
                default:
                    throw new Exception('Invalid group_by parameter');
            }

            return [
                'data' => $data['data'],
                'totals' => $data['totals'],
                'total' => $data['total'],
                'group_by' => $groupBy,
                'date_range' => [
                    'start' => $startDate,
                    'end' => $endDate
                ]
            ];
        } catch (Exception $e) {
            throw new Exception($e->getMessage());
        }
    }

    public function submissionsAnalysis($data)
    {
        if (!Helper::hasPro()) {
            return [
                'data' => [],
                'total' => 0,
                'totals' => [],
                'group_by' => 'forms',
                'date_range' => [
                    'start' => '',
                    'end' => ''
                ]
            ];
        }
        $data = Sanitizer::sanitize($data, [
            'group_by' => 'sanitizeTextField',
            'start_date' => 'sanitizeTextField',
            'end_date' => 'sanitizeTextField'
        ]);

        $groupBy = Arr::get($data, 'group_by', 'forms');
        $startDate = Arr::get($data, 'start_date');
        $endDate = Arr::get($data, 'end_date');
        $formId = intval(Arr::get($data, 'form_id'));
        $perPage = intval(Arr::get($data, 'per_page', 10));
        $currentPage = intval(Arr::get($data, 'page', 1));

        if (!$startDate || !$endDate) {
            $endDate = current_time('Y-m-d H:i:s');
            $startDate = date('Y-m-d H:i:s', strtotime('-30 days', strtotime($endDate)));
        }

        try {
            switch ($groupBy) {
                case 'forms':
                    $data = ReportHelper::getSubmissionAnalysisByForms($startDate, $endDate, $perPage, $currentPage);
                    break;
                case 'submission_source':
                    $data = ReportHelper::getSubmissionAnalysisBySource($startDate, $endDate, $formId, $perPage, $currentPage);
                    break;
                case 'email':
                    $data = ReportHelper::getSubmissionAnalysisByEmail($startDate, $endDate, $formId, $perPage, $currentPage);
                    break;
                case 'country':
                    $data = ReportHelper::getSubmissionAnalysisByCountry($startDate, $endDate, $formId, $perPage, $currentPage);
                    break;
                case 'submission_date':
                    $data = ReportHelper::getSubmissionAnalysisByDate($startDate, $endDate, $formId, $perPage, $currentPage);
                    break;
                default:
                    throw new Exception('Invalid group_by parameter');
            }

            return [
                'data' => $data['data'],
                'total' => $data['total'],
                'totals' => $data['totals'],
                'group_by' => $groupBy,
                'date_range' => [
                    'start' => $startDate,
                    'end' => $endDate
                ]
            ];
        } catch (Exception $e) {
            throw new Exception($e->getMessage());
        }
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

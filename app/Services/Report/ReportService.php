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
     * Get Net Revenue Data
     *
     * @return array{data: mixed, totals: mixed, total: mixed, group_by: array|\ArrayAccess|mixed, date_range: array{start: mixed, end: mixed}}
     */
    public function netRevenue($data)
    {
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

    /**
     * Get Overview Chart Data
     *
     * @param array $data
     * @return array
     */
    public function getOverviewChart($data)
    {
        $data = $this->sanitizeCommonParams($data);
        $startDate = $data['start_date'];
        $endDate = $data['end_date'];
        $formId = $data['form_id'];

        return [
            'overview_chart' => ReportHelper::getOverviewChartData($startDate, $endDate, $formId, 'activity')
        ];
    }

    /**
     * Get Revenue Chart Data
     *
     * @param array $data
     * @return array
     */
    public function getRevenueChart($data)
    {
        $data = $this->sanitizeCommonParams($data);
        $startDate = $data['start_date'];
        $endDate = $data['end_date'];
        $formId = $data['form_id'];

        return [
            'revenue_chart' => ReportHelper::getOverviewChartData($startDate, $endDate, $formId, 'revenue')
        ];
    }

    /**
     * Get Completion Rate Data
     *
     * @param array $data
     * @return array
     */
    public function getCompletionRate($data)
    {
        $data = $this->sanitizeCommonParams($data);
        $startDate = $data['start_date'];
        $endDate = $data['end_date'];
        $formId = $data['form_id'];

        return [
            'completion_rate' => ReportHelper::getCompletionRateData($startDate, $endDate, $formId)
        ];
    }

    /**
     * Get Form Stats Data
     *
     * @param array $data
     * @return array
     */
    public function getFormStats($data)
    {
        $data = $this->sanitizeCommonParams($data);
        $startDate = $data['start_date'];
        $endDate = $data['end_date'];
        $formId = $data['form_id'];

        return [
            'form_stats' => ReportHelper::getFormStats($startDate, $endDate, $formId)
        ];
    }

    /**
     * Get Heatmap Data
     *
     * @param array $data
     * @return array
     */
    public function getHeatmapData($data)
    {
        $data = $this->sanitizeCommonParams($data);
        $startDate = $data['start_date'];
        $endDate = $data['end_date'];
        $formId = $data['form_id'];

        return [
            'heatmap_data' => ReportHelper::getSubmissionHeatmap($startDate, $endDate, $formId)
        ];
    }

    /**
     * Get Country Heatmap Data
     *
     * @param array $data
     * @return array
     */
    public function getCountryHeatmap($data)
    {
        $data = $this->sanitizeCommonParams($data);
        $startDate = $data['start_date'];
        $endDate = $data['end_date'];
        $formId = $data['form_id'];

        return [
            'country_heatmap' => ReportHelper::getSubmissionsByCountry($startDate, $endDate, $formId)
        ];
    }

    /**
     * Get API Logs Data
     *
     * @param array $data
     * @return array
     */
    public function getApiLogs($data)
    {
        $data = $this->sanitizeCommonParams($data);
        $startDate = $data['start_date'];
        $endDate = $data['end_date'];
        $formId = $data['form_id'];

        return [
            'api_logs' => ReportHelper::getApiLogs($startDate, $endDate, $formId)
        ];
    }

    /**
     * Get Top Performing Forms Data
     *
     * @param array $data
     * @return array
     */
    public function getTopPerformingForms($data)
    {
        $data = $this->sanitizeCommonParams($data);
        $startDate = $data['start_date'];
        $endDate = $data['end_date'];
        $metric = Arr::get($data, 'metric', 'entries');

        if (!in_array($metric, ['entries', 'payments', 'views'])) {
            $metric = 'entries';
        }

        return [
            'top_performing_forms' => ReportHelper::getTopPerformingForms($startDate, $endDate, $metric)
        ];
    }

    /**
     * Get Subscriptions Data
     *
     * @param array $data
     * @return array
     */
    public function getSubscriptions($data)
    {
        $data = $this->sanitizeCommonParams($data);
        $startDate = $data['start_date'];
        $endDate = $data['end_date'];
        $formId = $data['form_id'];

        return [
            'subscriptions' => ReportHelper::getSubscriptions($startDate, $endDate, $formId)
        ];
    }

    /**
     * Get Payment Types Data
     *
     * @param array $data
     * @return array
     */
    public function getPaymentTypes($data)
    {
        $data = $this->sanitizeCommonParams($data);
        $startDate = $data['start_date'];
        $endDate = $data['end_date'];
        $formId = $data['form_id'];

        return [
            'payment_types' => [
                'subscription' => ReportHelper::getPaymentsByType($startDate, $endDate, 'subscription', $formId),
                'onetime' => ReportHelper::getPaymentsByType($startDate, $endDate, 'onetime', $formId)
            ]
        ];
    }

    /**
     * Sanitize and prepare common parameters
     *
     * @param array $data
     * @return array
     */
    public function sanitizeCommonParams($data)
    {
        $data = Sanitizer::sanitize($data, [
            'start_date' => 'sanitizeTextField',
            'end_date' => 'sanitizeTextField',
            'metric' => 'sanitizeTextField',
        ]);

        $startDate = Arr::get($data, 'start_date');
        $endDate = Arr::get($data, 'end_date');
        $formId = intval(Arr::get($data, 'form_id'));

        // Set default date range if not provided
        if (!$startDate || !$endDate) {
            $now = new \DateTime();
            $endDate = $now->format('Y-m-d 23:59:59');

            $thirtyDaysAgo = new \DateTime();
            $thirtyDaysAgo->modify('-30 days');
            $startDate = $thirtyDaysAgo->format('Y-m-d 00:00:00');
        }

        return [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'form_id' => $formId,
            'metric' => Arr::get($data, 'metric', 'entries')
        ];
    }
}

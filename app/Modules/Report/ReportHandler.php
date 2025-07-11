<?php

namespace FluentForm\App\Modules\Report;

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

use FluentForm\App\Models\Form;
use FluentForm\App\Models\FormAnalytics;
use FluentForm\App\Models\Submission;
use FluentForm\App\Models\Log;
use FluentForm\Framework\Helpers\ArrayHelper;
use FluentForm\App\Modules\Payments\PaymentHelper;

class ReportHandler
{
    protected $app;

    public function __construct($app)
    {
        $this->app = $app;

        $app->addAction('fluentform/render_report', [$this, 'renderReport']);
        $app->addAdminAjaxAction('fluentform-get-reports', [$this, 'getReports']);
        $app->addAdminAjaxAction('fluentform-get-forms', [$this, 'getFormsForDropdown']);
        $app->addAdminAjaxAction('fluentform-get-net-revenue-by-group', [$this, 'getNetRevenueByGroup']);
        $app->addAdminAjaxAction('fluentform-get-submission-analysis-by-group', [$this, 'getSubmissionAnalysisByGroup']);
    }

    public function renderReport()
    {
        wp_enqueue_script('fluentform_reports');
        wp_enqueue_style('fluentform_reports');

        $hasPayment = false;
        $paymentSettings = get_option('__fluentform_payment_module_settings');
        if ($paymentSettings && ArrayHelper::get($paymentSettings, 'status') === 'yes') {
            $hasPayment = true;
        }

        wp_localize_script('fluentform_reports', 'FluentFormApp', [
            'has_payment' => $hasPayment,
            'payment_statuses' => PaymentHelper::getPaymentStatuses(),
            'payment_methods' => apply_filters('fluentform/available_payment_methods', [])
        ]);

        $this->app->view->render('admin.reports.index', [
            'logo' => fluentformMix('img/fluentform-logo.svg'),
        ]);
    }

    public function getReports()
    {
        $startDate = sanitize_text_field($this->app->request->get('start_date'));
        $endDate = sanitize_text_field($this->app->request->get('end_date'));
        $formId = intval($this->app->request->get('form_id'));
        $component = sanitize_text_field($this->app->request->get('component', ''));

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
            $view = sanitize_text_field($this->app->request->get('view', 'submissions'));
            $reports['reports']['overview_chart'] = $this->getOverviewChartData($startDate, $endDate, $formId, $view);
        }
        else if ($component === 'completion_rate') {
            $reports['reports']['completion_rate'] = $this->getCompletionRateData($startDate, $endDate, $formId);
        }
        else if ($component === 'form_stats') {
            $reports['reports']['form_stats'] = $this->getFormStats($startDate, $endDate);
        }
        else if ($component === 'heatmap_data') {
            $reports['reports']['heatmap_data'] = $this->getSubmissionHeatmap($startDate, $endDate);
        }
        else if ($component === 'country_heatmap') {
            $reports['reports']['country_heatmap'] = $this->getSubmissionsByCountry($startDate, $endDate, $formId);
        }
        else if ($component === 'api_logs') {
            $reports['reports']['api_logs'] = $this->getApiLogs($startDate, $endDate);
        }
        else if ($component === 'top_performing_forms') {
            $metric = sanitize_text_field($this->app->request->get('metric', 'entries'));
            $reports['reports']['top_performing_forms'] = $this->getTopPerformingForms($startDate, $endDate, $metric);
        }
        else if ($component === 'transactions') {
            $transactionsFormId = intval($this->app->request->get('transactions_form_id'));
            $transactionsPaymentStatus = sanitize_text_field($this->app->request->get('transactions_payment_status'));
            $transactionsPaymentMethod = sanitize_text_field($this->app->request->get('transactions_payment_method'));

            $reports['reports']['transactions'] = $this->getTransactions(
                $startDate,
                $endDate,
                $transactionsFormId,
                $transactionsPaymentStatus,
                $transactionsPaymentMethod
            );
        }
        else if ($component === 'subscriptions') {
            $subscriptionsStatus = sanitize_text_field($this->app->request->get('subscriptions_status', 'all'));
            $subscriptionsInterval = sanitize_text_field($this->app->request->get('subscriptions_interval', 'all'));
            $subscriptionsFormId = sanitize_text_field($this->app->request->get('subscriptions_form_id', null));
            $reports['reports']['subscriptions'] = $this->getSubscriptions($startDate, $endDate, $subscriptionsStatus, $subscriptionsInterval, $subscriptionsFormId);
        }
        else {
            $view = sanitize_text_field($this->app->request->get('view', 'submissions'));
            $statsRange = sanitize_text_field($this->app->request->get('stats_range', 'month'));
            $transactionsFormId = intval($this->app->request->get('transactions_form_id'));
            $transactionsPaymentStatus = sanitize_text_field($this->app->request->get('transactions_payment_status'));
            $transactionsPaymentMethod = sanitize_text_field($this->app->request->get('transactions_payment_method'));

            $reports['reports'] = [
                'overview_chart'        => $this->getOverviewChartData($startDate, $endDate, $formId, $view),
                'form_stats'            => $this->getFormStats($startDate, $endDate, $statsRange),
                'completion_rate'       => $this->getCompletionRateData($startDate, $endDate, $formId),
                'heatmap_data'          => $this->getSubmissionHeatmap($startDate, $endDate),
                'country_heatmap'       => $this->getSubmissionsByCountry($startDate, $endDate, $formId),
                'api_logs'              => $this->getApiLogs($startDate, $endDate),
                'top_performing_forms'  => $this->getTopPerformingForms($startDate, $endDate, 'entries'),
                'transactions'          => $this->getTransactions(
                    $startDate,
                    $endDate,
                    $transactionsFormId,
                    $transactionsPaymentStatus,
                    $transactionsPaymentMethod
                ),
                'subscriptions'         => $this->getSubscriptions($startDate, $endDate)
            ];
        }

        wp_send_json_success($reports, 200);
    }

    public function getFormsForDropdown()
    {
        $forms = Form::select(['id', 'title', 'has_payment'])
                     ->orderBy('id', 'DESC')
                     ->get();

        wp_send_json_success([
            'forms' => $forms
        ]);
    }

    public function getOverviewChartData($startDate, $endDate, $formId)
    {
        $view = sanitize_text_field($this->app->request->get('view'));

        // Process and fix date ranges if needed
        list($startDate, $endDate) = $this->processDateRange($startDate, $endDate);

        // Calculate date difference to determine grouping
        $startDateTime = new \DateTime($startDate);
        $endDateTime = new \DateTime($endDate);
        $interval = $startDateTime->diff($endDateTime);
        $daysInterval = $interval->days + 1;

        // Determine grouping mode based on date range
        $groupingMode = $this->getGroupingMode($daysInterval);

        // Get data based on the view type
        if ($view === 'conversion') {
            $chartData = $this->getFormViewsAndConversions($startDate, $endDate, $groupingMode, $formId);
        } else {
            $data = $this->getAggregatedData($startDate, $endDate, $groupingMode, $view, $formId);

            // Get date labels based on grouping mode
            $dateLabels = $this->getDateLabels($startDateTime, $endDateTime, $groupingMode);

            // Format the data for the chart
            $chartData = $this->formatDataForChart($dateLabels, $data);
        }

        return $chartData;
    }

    private function getFormSpecificDateRange($formId, $view)
    {
        $form = Form::find($formId);

        if (!$form) {
            // Fallback to default range if form not found
            $now = new \DateTime();
            return [
                'start_date' => (new \DateTime())->modify('-30 days')->format('Y-m-d H:i:s'),
                'end_date'   => $now->format('Y-m-d H:i:s')
            ];
        }

        // Get form creation date
        $formCreatedAt = $form->created_at;

        // Get first and last submission dates - IMPORTANT: Don't apply any status filters here
        $firstSubmission = Submission::where('form_id', $formId)
                                     ->orderBy('created_at', 'ASC')
                                     ->first();

        $lastSubmission = Submission::where('form_id', $formId)
                                    ->orderBy('created_at', 'DESC')
                                    ->first();

        // Get total count to verify our date range will include all submissions
        $totalSubmissions = Submission::where('form_id', $formId)->count();

        $now = new \DateTime();
        $formCreatedDate = $formCreatedAt ? new \DateTime($formCreatedAt) : $now;
        $firstSubmissionDate = $firstSubmission ? new \DateTime($firstSubmission->created_at) : $formCreatedDate;
        $lastSubmissionDate = $lastSubmission ? new \DateTime($lastSubmission->created_at) : $now;

        // Ensure we have some reasonable date range even if no submissions
        if ($firstSubmissionDate == $lastSubmissionDate) {
            $firstSubmissionDate = (clone $lastSubmissionDate)->modify('-7 days');
        }

        // For conversion view, use form creation date to last submission
        if ($view === 'conversion') {
            return [
                'start_date'        => $formCreatedDate->format('Y-m-d 00:00:00'),
                'end_date'          => $lastSubmissionDate->format('Y-m-d 23:59:59'),
                'total_submissions' => $totalSubmissions
            ];
        }
        else {
            return [
                'start_date'        => $firstSubmissionDate->format('Y-m-d 00:00:00'),
                'end_date'          => $lastSubmissionDate->format('Y-m-d 23:59:59'),
                'total_submissions' => $totalSubmissions
            ];
        }
    }

    /**
     * Determine grouping mode based on date range
     */
    private function getGroupingMode($daysInterval)
    {
        if ($daysInterval <= 7) {
            return 'day'; // 1-7 days: group by day
        } elseif ($daysInterval <= 31) {
            return '3days'; // 8-31 days: group by 3 days
        } elseif ($daysInterval <= 92) {
            return 'week'; // Group by week for 1-3 months
        } else {
            return 'month'; // 3+ months: group by month
        }
    }

    /**
     * Get aggregated data based on grouping mode
     */
    private function getAggregatedData($startDate, $endDate, $groupingMode, $dataType, $formId)
    {
        $baseQuery = Submission::whereBetween('created_at', [$startDate, $endDate]);

        // Filter by form ID if provided
        if ($formId) {
            $baseQuery->where('form_id', $formId);
        }

        if ($dataType === 'payments') {
            // Clone the base query for each payment status
            $paidQuery = clone $baseQuery;
            $pendingQuery = clone $baseQuery;
            $refundedQuery = clone $baseQuery;

            // Get paid payments
            $paidQuery->whereNotNull('payment_total')
                      ->where(function($query) {
                          $query->where('payment_status', 'paid');
                      })
                      ->selectRaw('ROUND(SUM(payment_total) / 100, 2) as count');

            // Get pending payments
            $pendingQuery->whereNotNull('payment_total')
                         ->where('payment_status', 'pending')
                         ->selectRaw('ROUND(SUM(payment_total) / 100, 2) as count');

            // Get refunded payments
            $refundedQuery->whereNotNull('payment_total')
                          ->where('payment_status', 'refunded')
                          ->selectRaw('ROUND(SUM(payment_total) / 100, 2) as count');

            // Apply grouping based on mode to all three queries
            if ($groupingMode === 'day') {
                $paidQuery->selectRaw('DATE(created_at) as date_group')->groupBy('date_group');
                $pendingQuery->selectRaw('DATE(created_at) as date_group')->groupBy('date_group');
                $refundedQuery->selectRaw('DATE(created_at) as date_group')->groupBy('date_group');
            } elseif ($groupingMode === '3days') {
                // Get minimum date for reference
                $minDateRecord = Submission::whereBetween('created_at', [$startDate, $endDate])
                                           ->selectRaw('MIN(DATE(created_at)) as min_date')
                                           ->first();

                if ($minDateRecord && $minDateRecord->min_date) {
                    $minDate = $minDateRecord->min_date;

                    $paidQuery->selectRaw("MIN(DATE(created_at)) as date_group")
                              ->selectRaw("FLOOR(DATEDIFF(DATE(created_at), '{$minDate}') / 3) as group_num")
                              ->groupBy('group_num');

                    $pendingQuery->selectRaw("MIN(DATE(created_at)) as date_group")
                                 ->selectRaw("FLOOR(DATEDIFF(DATE(created_at), '{$minDate}') / 3) as group_num")
                                 ->groupBy('group_num');

                    $refundedQuery->selectRaw("MIN(DATE(created_at)) as date_group")
                                  ->selectRaw("FLOOR(DATEDIFF(DATE(created_at), '{$minDate}') / 3) as group_num")
                                  ->groupBy('group_num');
                } else {
                    $paidQuery->selectRaw('DATE(created_at) as date_group')->groupBy('date_group');
                    $pendingQuery->selectRaw('DATE(created_at) as date_group')->groupBy('date_group');
                    $refundedQuery->selectRaw('DATE(created_at) as date_group')->groupBy('date_group');
                }
            } elseif ($groupingMode === 'week') {
                $paidQuery->selectRaw("DATE(DATE_ADD(created_at, INTERVAL(-WEEKDAY(created_at)) DAY)) as date_group")->groupBy('date_group');
                $pendingQuery->selectRaw("DATE(DATE_ADD(created_at, INTERVAL(-WEEKDAY(created_at)) DAY)) as date_group")->groupBy('date_group');
                $refundedQuery->selectRaw("DATE(DATE_ADD(created_at, INTERVAL(-WEEKDAY(created_at)) DAY)) as date_group")->groupBy('date_group');
            } else {
                $paidQuery->selectRaw("DATE_FORMAT(created_at, '%Y-%m-01') as date_group")->groupBy('date_group');
                $pendingQuery->selectRaw("DATE_FORMAT(created_at, '%Y-%m-01') as date_group")->groupBy('date_group');
                $refundedQuery->selectRaw("DATE_FORMAT(created_at, '%Y-%m-01') as date_group")->groupBy('date_group');
            }

            // Execute the queries
            $paidResults = $paidQuery->orderBy('date_group')->get();
            $pendingResults = $pendingQuery->orderBy('date_group')->get();
            $refundedResults = $refundedQuery->orderBy('date_group')->get();

            // Format the data
            $paidData = [];
            foreach ($paidResults as $result) {
                $paidData[$result->date_group] = $result->count;
            }

            $pendingData = [];
            foreach ($pendingResults as $result) {
                $pendingData[$result->date_group] = $result->count;
            }

            $refundedData = [];
            foreach ($refundedResults as $result) {
                $refundedData[$result->date_group] = $result->count;
            }

            // Return all three datasets
            return [
                'paid'     => $paidData,
                'pending'  => $pendingData,
                'refunded' => $refundedData
            ];
        } else {
            $query = $baseQuery->selectRaw('COUNT(*) as count');

            // Apply grouping based on mode
            if ($groupingMode === 'day') {
                $query->selectRaw('DATE(created_at) as date_group')
                      ->groupBy('date_group');
            } elseif ($groupingMode === '3days') {
                $minDateRecord = Submission::whereBetween('created_at', [$startDate, $endDate])
                                           ->selectRaw('MIN(DATE(created_at)) as min_date')
                                           ->first();

                if ($minDateRecord && $minDateRecord->min_date) {
                    $query->selectRaw("MIN(DATE(created_at)) as date_group")
                          ->selectRaw("FLOOR(DATEDIFF(DATE(created_at), '{$minDateRecord->min_date}') / 3) as group_num")
                          ->groupBy('group_num');
                } else {
                    $query->selectRaw('DATE(created_at) as date_group')
                          ->groupBy('date_group');
                }
            } elseif ($groupingMode === 'week') {
                $query->selectRaw("DATE(DATE_ADD(created_at, INTERVAL(-WEEKDAY(created_at)) DAY)) as date_group")
                      ->groupBy('date_group');
            } else {
                $query->selectRaw("DATE_FORMAT(created_at, '%Y-%m-01') as date_group")
                      ->groupBy('date_group');
            }

            $results = $query->orderBy('date_group')->get();

            $data = [];
            foreach ($results as $result) {
                $data[$result->date_group] = $result->count;
            }

            return $data;
        }
    }

    /**
     * Generate date labels based on grouping mode
     */
    private function getDateLabels(\DateTime $startDate, \DateTime $endDate, $groupingMode)
    {
        $dates = [];
        $labels = [];
        $current = clone $startDate;

        if ($groupingMode === 'day') {
            // Generate daily labels
            while ($current <= $endDate) {
                $dateKey = $current->format('Y-m-d');
                $dates[] = $dateKey;
                $labels[] = $current->format('M d');
                $current->modify('+1 day');
            }
        } elseif ($groupingMode === '3days') {
            // Generate labels for every 3 days
            $dayIndex = 0;
            $groupStartDate = clone $current;

            while ($current <= $endDate) {
                if ($dayIndex % 3 === 0 && $dayIndex > 0) {
                    $previousDate = clone $current;
                    $previousDate->modify('-1 day');

                    $dateKey = $groupStartDate->format('Y-m-d');
                    $dates[] = $dateKey;
                    $labels[] = $groupStartDate->format('M d');

                    $groupStartDate = clone $current;
                }

                $current->modify('+1 day');
                $dayIndex++;
            }

            // Add the last group if needed
            if ($groupStartDate <= $endDate) {
                $dateKey = $groupStartDate->format('Y-m-d');
                $dates[] = $dateKey;
                $labels[] = $groupStartDate->format('M d');
            }
        } elseif ($groupingMode === 'week') {
            // Generate weekly labels
            while ($current <= $endDate) {
                // Use simple approach to get Monday (start of week)
                $dayOfWeek = (int)$current->format('N'); // 1 (Monday) through 7 (Sunday)
                $daysToSubtract = $dayOfWeek - 1;

                $weekStart = clone $current;
                if ($daysToSubtract > 0) {
                    $weekStart->modify("-{$daysToSubtract} days");
                }

                // Calculate end of week (Sunday)
                $weekEnd = clone $weekStart;
                $weekEnd->modify('+6 days');

                // If weekend exceeds the range end, cap it
                if ($weekEnd > $endDate) {
                    $weekEnd = clone $endDate;
                }

                $dateKey = $weekStart->format('Y-m-d');
                $dates[] = $dateKey;
                $labels[] = $weekStart->format('M d');

                // Move to next week
                $current->modify('+7 days');
            }
        } else {
            // Generate monthly labels
            while ($current <= $endDate) {
                $dateKey = $current->format('Y-m-01');
                $dates[] = $dateKey;
                $labels[] = $current->format('M Y');

                // Manually move to first day of next month
                $year = (int)$current->format('Y');
                $month = (int)$current->format('m');

                // Move to next month
                $month++;
                if ($month > 12) {
                    $month = 1;
                    $year++;
                }

                // Set to first day of next month
                $current = new \DateTime("$year-$month-01");
            }
        }

        return ['dates' => $dates, 'labels' => $labels];
    }

    /**
     * Format data for the chart
     */
    private function formatDataForChart($dateLabels, $data)
    {
        $dates = $dateLabels['dates'];
        $labels = $dateLabels['labels'];

        if (is_array($data) && isset($data['paid'])) {
            $paidValues = $this->fillMissingData($dates, $data['paid']);
            $pendingValues = $this->fillMissingData($dates, $data['pending']);
            $refundedValues = $this->fillMissingData($dates, $data['refunded']);

            return [
                'dates'  => $labels,
                'values' => [
                    'paid'     => array_values($paidValues),
                    'pending'  => array_values($pendingValues),
                    'refunded' => array_values($refundedValues)
                ]
            ];
        } else {
            $values = $this->fillMissingData($dates, $data);

            return [
                'dates'  => $labels,
                'values' => array_values($values)
            ];
        }
    }

    private function processDateRange($startDate, $endDate)
    {
        // Sanity check - ensure start date is before end date
        $startDateTime = new \DateTime($startDate);
        $endDateTime = new \DateTime($endDate);

        // If start date is after end date, swap them
        if ($startDateTime > $endDateTime) {
            $temp = $startDate;
            $startDate = $endDate;
            $endDate = $temp;

            // Update datetime objects
            $startDateTime = new \DateTime($startDate);
            $endDateTime = new \DateTime($endDate);
        }

        // Check if range appears to be same day (possibly "Today" selection)
        $interval = $startDateTime->diff($endDateTime);
        if ($interval->days < 1) {
            // If the date parameter explicitly requested "today" (has today's date)
            $today = new \DateTime('today');
            $isToday = $startDateTime->format('Y-m-d') === $today->format('Y-m-d');

            if (!$isToday) {
                $startDateTime->modify('-1 year');
                $startDate = $startDateTime->format('Y-m-d H:i:s');
            }
        }

        return [$startDate, $endDate];
    }

    /**
     * Fill in missing data with zeros
     */
    private function fillMissingData($allDates, $data)
    {
        $result = [];
        foreach ($allDates as $date) {
            $result[$date] = isset($data[$date]) ? $data[$date] : 0;
        }
        return $result;
    }

    /**
     * Get completion rate data for the gauge chart
     */
    private function getCompletionRateData($startDate, $endDate, $formId)
    {
        $completeQuery = Submission::whereBetween('created_at', [$startDate, $endDate]);

        if ($formId) {
            $completeQuery->where('form_id', $formId);
        }

        $completeSubmissions = $completeQuery->count();

        $incompleteQuery = wpFluent()->table('fluentform_draft_submissions')
                                    ->whereBetween('created_at', [$startDate, $endDate]);

        if ($formId) {
            $incompleteQuery->where('form_id', $formId);
        }

        $incompleteSubmissions = $incompleteQuery->count();

        // Calculate totals - total_submissions should be complete submissions only
        // Total attempts = complete + incomplete (drafts)
        $totalAttempts = $completeSubmissions + $incompleteSubmissions;
        $completionRate = $totalAttempts > 0 ? round(($completeSubmissions / $totalAttempts) * 100, 1) : 0;

        return [
            'completion_rate' => $completionRate,
            'incomplete_submissions' => $incompleteSubmissions,
            'total_submissions' => $completeSubmissions, // This should be complete submissions only
            'total_attempts' => $totalAttempts // Total form attempts (complete + incomplete)
        ];
    }

    /**
     * Get form views and conversions by date chunks
     */
    private function getFormViewsAndConversions($startDate, $endDate, $groupingMode, $formId)
    {
        if ($this->app->applyFilters('fluentform/disabled_analytics', false)) {
            return [];
        }

        // Convert to DateTime objects
        $startDateTime = new \DateTime($startDate);
        $endDateTime = new \DateTime($endDate);

        // Get date labels for X-axis
        $dateLabels = $this->getDateLabels($startDateTime, $endDateTime, $groupingMode);
        $dates = $dateLabels['dates'];
        $labels = $dateLabels['labels'];

        // Initialize data arrays
        $viewsData = array_fill_keys($dates, 0);
        $submissionsData = array_fill_keys($dates, 0);
        $formCountData = array_fill_keys($dates, 0);

        // 1. Get UNIQUE VIEWS by IP address
        $viewsQuery = FormAnalytics::whereBetween('created_at', [$startDate, $endDate])
                                   ->whereNotNull('ip');

        if ($formId) {
            $viewsQuery->where('form_id', $formId);
        }

        // Group by date and IP to count unique visitors
        if ($groupingMode === 'day') {
            $viewsQuery->selectRaw('DATE(created_at) as date_group, COUNT(DISTINCT ip) as unique_count');
        } elseif ($groupingMode === '3days') {
            // Get min date for reference
            $minDateRecord = FormAnalytics::whereBetween('created_at', [$startDate, $endDate])
                                          ->selectRaw('MIN(DATE(created_at)) as min_date')
                                          ->first();

            if ($minDateRecord && $minDateRecord->min_date) {
                $minDate = $minDateRecord->min_date;
                $viewsQuery->selectRaw("FLOOR(DATEDIFF(DATE(created_at), '{$minDate}') / 3) as group_num")
                           ->selectRaw('MIN(DATE(created_at)) as date_group')
                           ->selectRaw('COUNT(DISTINCT ip) as unique_count')
                           ->groupBy('group_num');
            } else {
                $viewsQuery->selectRaw('DATE(created_at) as date_group, COUNT(DISTINCT ip) as unique_count')
                           ->groupBy('date_group');
            }
        } elseif ($groupingMode === 'week') {
            $viewsQuery->selectRaw("DATE(DATE_ADD(created_at, INTERVAL(-WEEKDAY(created_at)) DAY)) as date_group, COUNT(DISTINCT ip) as unique_count");
        } else { // month
            $viewsQuery->selectRaw("DATE_FORMAT(created_at, '%Y-%m-01') as date_group, COUNT(DISTINCT ip) as unique_count");
        }

        if ($groupingMode !== '3days' || !($minDateRecord && $minDateRecord->min_date)) {
            $viewsQuery->groupBy('date_group');
        }

        $viewsResults = $viewsQuery->get();

        // Map views results to our date keys
        foreach ($viewsResults as $result) {
            $dateKey = $result->date_group;
            if (isset($viewsData[$dateKey])) {
                $viewsData[$dateKey] = $result->unique_count;
            }
        }

        // 2. Get UNIQUE SUBMISSIONS by IP address
        $submissionQuery = Submission::whereBetween('created_at', [$startDate, $endDate])
                                     ->whereNotNull('ip');

        if ($formId) {
            $submissionQuery->where('form_id', $formId);
        }

        $minDateRecord = null;
        // Group by date and IP to count unique submitters
        if ($groupingMode === 'day') {
            $submissionQuery->selectRaw('DATE(created_at) as date_group, COUNT(DISTINCT ip) as unique_count');
        } elseif ($groupingMode === '3days') {
            // Get min date for reference
            $minDateRecord = Submission::whereBetween('created_at', [$startDate, $endDate])
                                       ->selectRaw('MIN(DATE(created_at)) as min_date')
                                       ->first();

            if ($minDateRecord && $minDateRecord->min_date) {
                $minDate = $minDateRecord->min_date;
                $submissionQuery->selectRaw("FLOOR(DATEDIFF(DATE(created_at), '{$minDate}') / 3) as group_num")
                                ->selectRaw('MIN(DATE(created_at)) as date_group')
                                ->selectRaw('COUNT(DISTINCT ip) as unique_count')
                                ->groupBy('group_num');
            } else {
                $submissionQuery->selectRaw('DATE(created_at) as date_group, COUNT(DISTINCT ip) as unique_count')
                                ->groupBy('date_group');
            }
        } elseif ($groupingMode === 'week') {
            $submissionQuery->selectRaw("DATE(DATE_ADD(created_at, INTERVAL(-WEEKDAY(created_at)) DAY)) as date_group, COUNT(DISTINCT ip) as unique_count");
        } else { // month
            $submissionQuery->selectRaw("DATE_FORMAT(created_at, '%Y-%m-01') as date_group, COUNT(DISTINCT ip) as unique_count");
        }

        if ($groupingMode !== '3days' || !($minDateRecord && $minDateRecord->min_date)) {
            $submissionQuery->groupBy('date_group');
        }

        $submissionResults = $submissionQuery->get();

        // Map submission results to our date keys
        foreach ($submissionResults as $result) {
            $dateKey = $result->date_group;
            if (isset($submissionsData[$dateKey])) {
                $submissionsData[$dateKey] = $result->unique_count;
            }
        }

        // 3. Count forms created in each time period
        $formQuery = Form::whereBetween('created_at', [$startDate, $endDate]);

        // Group forms by date
        if ($groupingMode === 'day') {
            $formQuery->selectRaw('DATE(created_at) as date_group, COUNT(*) as count');
        } elseif ($groupingMode === '3days') {
            // Get min date for reference
            $minDateRecord = Form::whereBetween('created_at', [$startDate, $endDate])
                                 ->selectRaw('MIN(DATE(created_at)) as min_date')
                                 ->first();

            if ($minDateRecord && $minDateRecord->min_date) {
                $minDate = $minDateRecord->min_date;
                $formQuery->selectRaw("FLOOR(DATEDIFF(DATE(created_at), '{$minDate}') / 3) as group_num")
                          ->selectRaw('MIN(DATE(created_at)) as date_group')
                          ->selectRaw('COUNT(*) as count')
                          ->groupBy('group_num');
            } else {
                $formQuery->selectRaw('DATE(created_at) as date_group, COUNT(*) as count')
                          ->groupBy('date_group');
            }
        } elseif ($groupingMode === 'week') {
            $formQuery->selectRaw("DATE(DATE_ADD(created_at, INTERVAL(-WEEKDAY(created_at)) DAY)) as date_group, COUNT(*) as count");
        } else { // month
            $formQuery->selectRaw("DATE_FORMAT(created_at, '%Y-%m-01') as date_group, COUNT(*) as count");
        }

        if ($groupingMode !== '3days' || !($minDateRecord && $minDateRecord->min_date)) {
            $formQuery->groupBy('date_group');
        }

        $formResults = $formQuery->get();

        // Map form results to our date keys
        foreach ($formResults as $result) {
            $dateKey = $result->date_group;
            if (isset($formCountData[$dateKey])) {
                $formCountData[$dateKey] = $result->count;
            }
        }

        // Calculate conversion rates
        $conversionRates = [];
        foreach ($dates as $date) {
            $views = $viewsData[$date];
            $submissions = $submissionsData[$date];

            // Calculate conversion rate (avoid division by zero)
            $conversionRate = $views > 0 ? round(($submissions / $views) * 100, 2) : 0;
            $conversionRates[$date] = $conversionRate;
        }

        // Format for chart display
        return [
            'dates'            => $labels,
            'views'            => array_values($viewsData),
            'submissions'      => array_values($submissionsData),
            'conversion_rates' => array_values($conversionRates),
            'form_counts'      => array_values($formCountData)
        ];
    }

    public function getFormStats($startDate, $endDate)
    {
        // Process and fix date ranges if needed
        list($startDate, $endDate) = $this->processDateRange($startDate, $endDate);

        // Calculate the date range duration to determine previous period
        $startDateTime = new \DateTime($startDate);
        $endDateTime = new \DateTime($endDate);
        $interval = $startDateTime->diff($endDateTime);
        $daysDifference = $interval->days;

        // Calculate previous period dates (same duration, shifted back)
        $previousEndDateTime = clone $startDateTime;
        $previousEndDateTime->modify('-1 day');
        $previousStartDateTime = clone $previousEndDateTime;
        $previousStartDateTime->modify("-{$daysDifference} days");

        $previousStartDate = $previousStartDateTime->format('Y-m-d H:i:s');
        $previousEndDate = $previousEndDateTime->format('Y-m-d H:i:s');

        // Get submission counts
        $periodSubmissions = Submission::whereBetween('created_at',
            [$startDate, $endDate])->count();
        $previousPeriodSubmissions = Submission::whereBetween('created_at',
            [$previousStartDate, $previousEndDate])->count();

        // Get submission status counts (grouped)
        $statusCounts = Submission::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');
        $unreadSubmissions = $statusCounts['unread'] ?? 0;
        $readSubmissions = $statusCounts['read'] ?? 0;
        $periodSpamSubmissions = $statusCounts['spam'] ?? 0;

        $previousStatusCounts = Submission::whereBetween('created_at', [$previousStartDate, $previousEndDate])
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');
        $previousSpamSubmissions = $previousStatusCounts['spam'] ?? 0;

        // Get active integrations count from wp_options
        $modulesStatus = get_option('fluentform_global_modules_status');
        $activeIntegrations = count(array_filter($modulesStatus, function($status) {
            return $status === 'yes' || $status == 1 || $status == 'true';
        }));

        // Calculate period growth percentage
        $growthPercentage = 0;
        if ($previousPeriodSubmissions > 0) {
            $growthPercentage = round((($periodSubmissions - $previousPeriodSubmissions) / $previousPeriodSubmissions) * 100,
                1);
        } elseif ($periodSubmissions > 0) {
            $growthPercentage = 100;
        }

        $growthText = $growthPercentage > 0 ? '+' . $growthPercentage . '%' : $growthPercentage . '%';
        $growthType = $growthPercentage > 0 ? 'up' : ($growthPercentage < 0 ? 'down' : 'neutral');

        // calculate spam percentage
        $spamPercentage = 0;
        if ($previousSpamSubmissions > 0) {
            $spamPercentage = round((($periodSpamSubmissions - $previousSpamSubmissions) / $previousSpamSubmissions) * 100, 1);
        } elseif ($periodSpamSubmissions > 0) {
            $spamPercentage = 100;
        }

        $spamText = $spamPercentage > 0 ? '+' . $spamPercentage . '%' : $spamPercentage . '%';
        $spamType = $spamPercentage > 0 ? 'down' : ($spamPercentage < 0 ? 'up' : 'neutral');

        $stats = [
            'period'              => $daysDifference . ' days',
            'total_submissions'   => [
                'value'        => $periodSubmissions,
                'period_value' => $periodSubmissions,
                'change'       => $growthText,
                'change_type'  => $growthType
            ],
            'spam_submissions'    => [
                'value'        => $periodSpamSubmissions,
                'period_value' => $previousSpamSubmissions,
                'change'       => $spamText,
                'change_type'  => $spamType
            ],
            'active_integrations' => [
                'value' => $activeIntegrations,
            ],
            'unread_submissions'  => [
                'value' => $unreadSubmissions,
            ],
            'read_submissions'    => [
                'value' => $readSubmissions,
            ],
        ];

        // Add payment statistics if payment module is enabled
        $paymentSettings = get_option('__fluentform_payment_module_settings');
        if ($paymentSettings && ArrayHelper::get($paymentSettings, 'status') === 'yes') {
            // Get payment statistics
            $paymentStats = $this->getPaymentStats($startDate, $endDate, $previousStartDate, $previousEndDate);
            $stats = array_merge($stats, $paymentStats);
        }

        return $stats;
    }

    private function getPaymentStats($startDate, $endDate, $previousStartDate, $previousEndDate)
    {
        // Get total payments (paid status) for current period
        $currentPayments = wpFluent()
            ->table('fluentform_transactions')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'paid')
            ->sum('payment_total');

        // Get total payments for previous period
        $previousPayments = wpFluent()
            ->table('fluentform_transactions')
            ->whereBetween('created_at', [$previousStartDate, $previousEndDate])
            ->where('status', 'paid')
            ->sum('payment_total');

        // Get pending payments for current period
        $currentPending = wpFluent()
            ->table('fluentform_transactions')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'pending')
            ->sum('payment_total');

        // Get pending payments for previous period
        $previousPending = wpFluent()
            ->table('fluentform_transactions')
            ->whereBetween('created_at', [$previousStartDate, $previousEndDate])
            ->where('status', 'pending')
            ->sum('payment_total');

        // Get total refunds for current period
        $currentRefunds = wpFluent()
            ->table('fluentform_transactions')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'refunded')
            ->sum('payment_total');

        // Get total refunds for previous period
        $previousRefunds = wpFluent()
            ->table('fluentform_transactions')
            ->whereBetween('created_at', [$previousStartDate, $previousEndDate])
            ->where('status', 'refunded')
            ->sum('payment_total');

        // Convert from cents to dollars
        $currentPayments = $currentPayments ? $currentPayments / 100 : 0;
        $previousPayments = $previousPayments ? $previousPayments / 100 : 0;
        $currentPending = $currentPending ? $currentPending / 100 : 0;
        $previousPending = $previousPending ? $previousPending / 100 : 0;
        $currentRefunds = $currentRefunds ? $currentRefunds / 100 : 0;
        $previousRefunds = $previousRefunds ? $previousRefunds / 100 : 0;

        // Calculate payment growth percentage
        $paymentGrowthPercentage = 0;
        if ($previousPayments > 0) {
            $paymentGrowthPercentage = round((($currentPayments - $previousPayments) / $previousPayments) * 100, 1);
        } elseif ($currentPayments > 0) {
            $paymentGrowthPercentage = 100;
        }

        $paymentGrowthText = $paymentGrowthPercentage > 0 ? '+' . $paymentGrowthPercentage . '%' : $paymentGrowthPercentage . '%';
        $paymentGrowthType = $paymentGrowthPercentage > 0 ? 'up' : ($paymentGrowthPercentage < 0 ? 'down' : 'neutral');

        // Calculate refund growth percentage
        $refundGrowthPercentage = 0;
        if ($previousRefunds > 0) {
            $refundGrowthPercentage = round((($currentRefunds - $previousRefunds) / $previousRefunds) * 100, 1);
        } elseif ($currentRefunds > 0) {
            $refundGrowthPercentage = 100;
        }

        $refundGrowthText = $refundGrowthPercentage > 0 ? '+' . $refundGrowthPercentage . '%' : $refundGrowthPercentage . '%';
        $refundGrowthType = $refundGrowthPercentage > 0 ? 'down' : ($refundGrowthPercentage < 0 ? 'up' : 'neutral'); // Refunds going up is bad

        // Calculate pending growth percentage
        $pendingGrowthPercentage = 0;
        if ($previousPending > 0) {
            $pendingGrowthPercentage = round((($currentPending - $previousPending) / $previousPending) * 100, 1);
        } elseif ($currentPending > 0) {
            $pendingGrowthPercentage = 100;
        }

        $pendingGrowthText = $pendingGrowthPercentage > 0 ? '+' . $pendingGrowthPercentage . '%' : $pendingGrowthPercentage . '%';
        $pendingGrowthType = $pendingGrowthPercentage > 0 ? 'up' : ($pendingGrowthPercentage < 0 ? 'down' : 'neutral');

        // Get default currency from payment settings
        $paymentSettings = PaymentHelper::getPaymentSettings();
        $currency = ArrayHelper::get($paymentSettings, 'currency', 'USD');
        $currencySymbol = PaymentHelper::getCurrencySymbol($currency);

        return [
            'total_payments' => [
                'value' => number_format($currentPayments, 2),
                'raw_value' => $currentPayments,
                'currency' => $currency,
                'currency_symbol' => $currencySymbol,
                'change' => $paymentGrowthText,
                'change_type' => $paymentGrowthType
            ],
            'pending_payments' => [
                'value' => number_format($currentPending, 2),
                'raw_value' => $currentPending,
                'currency' => $currency,
                'currency_symbol' => $currencySymbol,
                'change' => $pendingGrowthText,
                'change_type' => $pendingGrowthType
            ],
            'total_refunds' => [
                'value' => number_format($currentRefunds, 2),
                'raw_value' => $currentRefunds,
                'currency' => $currency,
                'currency_symbol' => $currencySymbol,
                'change' => $refundGrowthText,
                'change_type' => $refundGrowthType
            ]
        ];
    }

    public function getSubmissionHeatmap($startDate, $endDate)
    {
        // Process and fix date ranges if needed
        list($startDate, $endDate) = $this->processDateRange($startDate, $endDate);

        // Create DateTime objects for iteration
        $startDateTime = new \DateTime($startDate);
        $endDateTime = new \DateTime($endDate);

        // Generate all dates in the range
        $allDates = [];
        $current = clone $startDateTime;
        while ($current <= $endDateTime) {
            $allDates[] = $current->format('Y-m-d');
            $current->modify('+1 day');
        }

        // Initialize heatmap data with zeros for all dates and time slots
        $heatmapData = [];
        foreach ($allDates as $date) {
            $heatmapData[$date] = array_fill(0, 8, 0); // 8 time slots, all initialized to 0
        }

        // Query submissions using Eloquent-like syntax
        $results = Submission::whereBetween('created_at', [$startDate, $endDate])
                             ->selectRaw('DATE(created_at) as submission_date')
                             ->selectRaw('HOUR(created_at) as submission_hour')
                             ->selectRaw('COUNT(*) as count')
                             ->groupBy('submission_date', 'submission_hour')
                             ->orderBy('submission_date')
                             ->orderBy('submission_hour')
                             ->get();

        // Fill in actual submission data
        foreach ($results as $row) {
            $date = $row->submission_date;
            $hour = (int)$row->submission_hour;
            $count = (int)$row->count;

            // Calculate time slot index (0-7) for 3-hour intervals
            $timeSlotIndex = floor($hour / 3);

            // Add count to the appropriate time slot (date should already exist)
            if (isset($heatmapData[$date])) {
                $heatmapData[$date][$timeSlotIndex] += $count;
            }
        }

        return [
            'heatmap_data' => $heatmapData,
            'start_date'   => $startDate,
            'end_date'     => $endDate
        ];
    }

    public function getApiLogs($startDate, $endDate)
    {
        // Process date range
        list($startDate, $endDate) = $this->processDateRange($startDate, $endDate);

        // Calculate date difference to determine grouping
        $startDateTime = new \DateTime($startDate);
        $endDateTime = new \DateTime($endDate);
        $interval = $startDateTime->diff($endDateTime);
        $daysInterval = $interval->days + 1;

        // Determine grouping mode based on date range
        $groupingMode = $this->getGroupingMode($daysInterval);

        // Define the date format based on grouping mode
        if ($groupingMode === 'day') {
            $dateFormat = "DATE(created_at)";
        } elseif ($groupingMode === '3days') {
            $dateFormat = "DATE(created_at)";
        } elseif ($groupingMode === 'week') {
            $dateFormat = "DATE(DATE_ADD(created_at, INTERVAL(-WEEKDAY(created_at)) DAY))";
        } else { // month
            $dateFormat = "DATE_FORMAT(created_at, '%Y-%m-01')";
        }

        // Components to exclude
        $excludedComponents = [
            'postFeeds',
            'AdminApproval',
            'Payment',
            'EntryEditor',
            'DoubleOptin',
            'Subscription',
            'UserRegistration',
            'Akismet Integration',
            'CleanTalk API Integration'
        ];

        // Get logs grouped by date and status using Eloquent, excluding specific components
        $logsQuery = Log::whereBetween('created_at', [$startDate, $endDate]);

        // Exclude components - handle both NULL and specific values
        $logsQuery->where(function($query) use ($excludedComponents) {
            $query->whereNull('component')
                  ->orWhereNotIn('component', $excludedComponents);
        });

        $results = $logsQuery->selectRaw($dateFormat . ' as log_date')
                             ->selectRaw('status')
                             ->selectRaw('COUNT(*) as count')
                             ->groupBy('log_date', 'status')
                             ->orderBy('log_date')
                             ->get();

        // Get total counts by status (also excluding the specific components)
        $totalsQuery = Log::whereBetween('created_at', [$startDate, $endDate]);

        $totalsQuery->where(function($query) use ($excludedComponents) {
            $query->whereNull('component')
                  ->orWhereNotIn('component', $excludedComponents);
        });

        $totalsResults = $totalsQuery->selectRaw('status')
                                     ->selectRaw('COUNT(*) as count')
                                     ->groupBy('status')
                                     ->get();

        $totals = [
            'success' => 0,
            'pending' => 0,
            'failed'  => 0
        ];

        foreach ($totalsResults as $total) {
            $status = strtolower($total->status);
            if (isset($totals[$status])) {
                $totals[$status] = (int)$total->count;
            }
        }

        // Get date labels and prepare data
        $dateLabels = $this->getDateLabels($startDateTime, $endDateTime, $groupingMode);
        $dates = $dateLabels['dates'];
        $formattedLabels = $dateLabels['labels'];

        // Initialize data structure - always with all dates, even if no data exists
        $seriesData = [
            'success' => array_fill_keys($dates, 0),
            'pending' => array_fill_keys($dates, 0),
            'failed'  => array_fill_keys($dates, 0)
        ];

        // Fill in data from results when available
        foreach ($results as $row) {
            $date = $row->log_date;
            $status = strtolower($row->status);
            $count = (int)$row->count;

            // Map status to our categories
            if ($status === 'success' || $status === 'pending' || $status === 'failed') {
                if (isset($seriesData[$status][$date])) {
                    $seriesData[$status][$date] = $count;
                }
            }
        }

        return [
            'logs_data'  => [
                'categories' => $formattedLabels,
                'series'     => $seriesData
            ],
            'totals'     => $totals,
            'start_date' => $startDate,
            'end_date'   => $endDate
        ];
    }

    public function getTransactions($startDate, $endDate, $formId = null, $paymentStatus = null, $paymentMethod = null)
    {
        $paymentSettings = get_option('__fluentform_payment_module_settings');
        if (!$paymentSettings || !ArrayHelper::get($paymentSettings, 'status')) {
            return []; // Return empty if payment module is disabled
        }

        list($startDate, $endDate) = $this->processDateRange($startDate, $endDate);

        $query = wpFluent()
            ->table('fluentform_transactions')
            ->whereBetween('created_at', [$startDate, $endDate]);

        // Apply filters
        if ($formId) {
            $query->where('form_id', $formId);
        }

        if ($paymentStatus) {
            $query->where('status', strtolower($paymentStatus));
        }

        if ($paymentMethod) {
            $query->where('payment_method', strtolower($paymentMethod));
        }

        $transactions = $query->get([
            'id',
            'submission_id',
            'form_id',
            'transaction_hash',
            'payment_method',
            'payment_total',
            'status',
            'currency',
            'created_at'
        ]);

        $formattedTransactions = [];

        foreach ($transactions as $transaction) {
            $status = ucfirst($transaction->status);
            $standardStatus = 'Failed';
            if ($status === 'Paid' || $status === 'Pending' || $status === 'Failed' || $status === 'Processing' || $status === 'Cancelled' || $status === 'Refunded' || $status === 'Intended') {
                $standardStatus = $status;
            }

            $submissionLink = admin_url('admin.php?page=fluent_forms&route=entries&form_id=' . $transaction->form_id . '#/entries/' . $transaction->submission_id);

            $formattedTransactions[] = [
                'id'             => $transaction->id,
                'submissionLink' => $submissionLink,
                'formId'         => $transaction->form_id,
                'transactionId'  => $transaction->transaction_hash,
                'date'           => $transaction->created_at ? date('d M, Y',
                    strtotime($transaction->created_at)) : 'N/A',
                'amount'         => $transaction->payment_total / 100,
                'paymentMethod'  => ucfirst($transaction->payment_method),
                'status'         => $standardStatus,
                'currency'       => $transaction->currency ?: 'USD'
            ];
        }

        return $formattedTransactions;
    }

    public function getSubscriptions($startDate, $endDate, $status = 'all', $interval = 'all', $formId = 'null')
    {
        $paymentSettings = get_option('__fluentform_payment_module_settings');
        if (!$paymentSettings || !ArrayHelper::get($paymentSettings, 'status')) {
            return []; // Return empty if payment module is disabled
        }

        // Process date range
        list($startDate, $endDate) = $this->processDateRange($startDate, $endDate);

        // Query subscriptions
        $query = wpFluent()
            ->table('fluentform_subscriptions')
            ->whereBetween('created_at', [$startDate, $endDate]);

        // Apply status filter
        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        // Apply interval filter
        if ($interval && $interval !== 'all') {
            $query->where('billing_interval', $interval);
        }

        // Apply form id
        if ($formId && $formId !== 'null') {
            $query->where('form_id', $formId);
        }

        // Fetch subscriptions
        $subscriptions = $query->get();

        // Group subscriptions by plan_name for chart display
        $subscriptionsByPlan = [];
        $totalRecurringAmount = 0;

        foreach ($subscriptions as $subscription) {
            $planName = $subscription->plan_name ?: ($subscription->item_name ?: 'Unnamed Plan');
            $recurringAmount = $subscription->recurring_amount / 100; // Convert cents to dollars

            if (!isset($subscriptionsByPlan[$planName])) {
                $subscriptionsByPlan[$planName] = 0;
            }

            $subscriptionsByPlan[$planName] += $recurringAmount;
            $totalRecurringAmount += $recurringAmount;
        }

        // Sort by amount (highest first)
        arsort($subscriptionsByPlan);

        // Calculate growth compared to previous period
        $previousStartDate = (new \DateTime($startDate))->modify('-' . $this->getDateDifference($startDate, $endDate) . ' days')->format('Y-m-d H:i:s');
        $previousEndDate = (new \DateTime($startDate))->modify('-1 day')->format('Y-m-d H:i:s');

        $previousQuery = wpFluent()
            ->table('fluentform_subscriptions')
            ->whereBetween('created_at', [$previousStartDate, $previousEndDate])
            ->where(function($q) {
                $q->where('status', 'active')
                    ->orWhere('status', 'trialing');
            });

        if ($formId) {
            $previousQuery->where('form_id', $formId);
        }

        $previousSubscriptions = $previousQuery->get();
        $previousTotalRecurring = 0;

        foreach ($previousSubscriptions as $subscription) {
            $previousTotalRecurring += $subscription->recurring_amount / 100;
        }

        // Calculate growth percentage
        $growthPercentage = 0;
        if ($previousTotalRecurring > 0) {
            $growthPercentage = round((($totalRecurringAmount - $previousTotalRecurring) / $previousTotalRecurring) * 100, 1);
        } elseif ($totalRecurringAmount > 0) {
            $growthPercentage = 100;
        }

        // Format data for chart display
        $chartData = [];
        $colors = [
            '#45aaf2', // Light blue
            '#4c6ef5', // Blue
            '#fa8231', // Orange
            '#26de81', // Green
            '#a55eea', // Purple
            '#fd9644', // Light orange
            '#2bcbba', // Teal
            '#eb3b5a'  // Red
        ];

        $colorIndex = 0;
        foreach ($subscriptionsByPlan as $plan => $amount) {
            $chartData[] = [
                'name' => $plan,
                'value' => $amount,
                'color' => $colors[$colorIndex % count($colors)]
            ];
            $colorIndex++;
        }

        // Limit to top 5 plans for readability
        $chartData = array_slice($chartData, 0, 5);

        return [
            'total_recurring' => $totalRecurringAmount,
            'growth_percentage' => $growthPercentage,
            'subscription_count' => count($subscriptions),
            'chart_data' => $chartData,
            'start_date' => $startDate,
            'end_date' => $endDate
        ];
    }

    private function getDateDifference($startDate, $endDate)
    {
        $start = new \DateTime($startDate);
        $end = new \DateTime($endDate);
        $interval = $start->diff($end);
        return $interval->days + 1;
    }

    public function getSubmissionsByCountry($startDate, $endDate, $formId = null)
    {
        list($startDate, $endDate) = $this->processDateRange($startDate, $endDate);

        $query = Submission::whereBetween('created_at', [$startDate, $endDate]);

        if ($formId) {
            $query->where('form_id', $formId);
        }

        $submissions = $query->select(['id', 'country'])
                            ->get();

        $countryData = [];
        $countryNames = getFluentFormCountryList();

        foreach ($submissions as $submission) {
            $country = $submission->country;

            if (!empty($country)) {
                $countryCode = strtoupper($country);
                if (!isset($countryData[$countryCode])) {
                    $countryData[$countryCode] = [
                        'name' => isset($countryNames[$countryCode]) ? $countryNames[$countryCode] : $countryCode,
                        'value' => 0
                    ];
                }
                $countryData[$countryCode]['value']++;
            }
        }

        uasort($countryData, function($a, $b) {
            return $b['value'] - $a['value'];
        });

        return [
            'country_data' => array_values($countryData)
        ];
    }

    /**
     * Get top performing forms by entries, views, or payments
     */
    public function getTopPerformingForms($startDate, $endDate, $metric = 'entries')
    {
        list($startDate, $endDate) = $this->processDateRange($startDate, $endDate);

        $forms = Form::select(['id', 'title'])->get();
        $topForms = [];

        foreach ($forms as $form) {
            $value = 0;

            switch ($metric) {
                case 'entries':
                    $value = Submission::where('form_id', $form->id)
                        ->whereBetween('created_at', [$startDate, $endDate])
                        ->count();
                    break;

                case 'payments':
                    // Check if payment module is enabled
                    $paymentSettings = get_option('__fluentform_payment_module_settings');
                    if ($paymentSettings && ArrayHelper::get($paymentSettings, 'status')) {
                        $value = wpFluent()
                            ->table('fluentform_transactions')
                            ->where('form_id', $form->id)
                            ->where('status', 'paid')
                            ->whereBetween('created_at', [$startDate, $endDate])
                            ->sum('payment_total');
                        // Convert from cents to dollars
                        $value = $value ? round($value / 100, 2) : 0;
                    }
                    break;
            }

            if ($value > 0) {
                $topForms[] = [
                    'id' => $form->id,
                    'title' => $form->title ?: 'Untitled Form',
                    'value' => $value
                ];
            }
        }

        // Sort by value in descending order
        usort($topForms, function($a, $b) {
            return $b['value'] - $a['value'];
        });

        // Return top 5 forms
        return array_reverse(array_slice($topForms, 0, 5));
    }

    /**
     * Get net revenue grouped by different criteria
     */
    public function getNetRevenueByGroup()
    {
        // Verify user permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Insufficient permissions'], 403);
            return;
        }

        $groupBy = sanitize_text_field($this->app->request->get('group_by', 'forms'));
        $startDate = sanitize_text_field($this->app->request->get('start_date'));
        $endDate = sanitize_text_field($this->app->request->get('end_date'));
        $formId = intval($this->app->request->get('form_id', 0));
        $perPage = intval($this->app->request->get('per_page', 10));
        $currentPage = intval($this->app->request->get('page', 1));

        // Validate and set default dates if not provided
        if (!$startDate || !$endDate) {
            $endDate = current_time('Y-m-d H:i:s');
            $startDate = date('Y-m-d H:i:s', strtotime('-30 days', strtotime($endDate)));
        }

        try {
            switch ($groupBy) {
                case 'forms':
                    $data = $this->getNetRevenueByForms($startDate, $endDate, $perPage, $currentPage);
                    break;
                case 'payment_method':
                    $data = $this->getNetRevenueByPaymentMethod($startDate, $endDate, $formId, $perPage, $currentPage);
                    break;
                case 'payment_type':
                    $data = $this->getNetRevenueByPaymentType($startDate, $endDate, $formId, $perPage, $currentPage);
                    break;
                default:
                    wp_send_json_error(['message' => 'Invalid group_by parameter'], 400);
                    return;
            }

            wp_send_json_success([
                'data' => $data['data'],
                'totals' => $data['totals'],
                'total' => $data['total'],
                'group_by' => $groupBy,
                'date_range' => [
                    'start' => $startDate,
                    'end' => $endDate
                ]
            ]);
        } catch (\Exception $e) {
            wp_send_json_error(['message' => 'Error fetching revenue data: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get net revenue grouped by forms with pagination
     */
    private function getNetRevenueByForms($startDate, $endDate, $perPage = 5, $currentPage = 1)
    {
        global $wpdb;
        $prefix = $wpdb->prefix;
        $query = wpFluent()
            ->table('fluentform_transactions')
            ->join('fluentform_forms', 'fluentform_transactions.form_id', '=', 'fluentform_forms.id')
            ->select(
                'fluentform_forms.id as form_id',
                'fluentform_forms.title as form_title',
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'paid' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) as paid_amount"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'pending' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) as pending_amount"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'refunded' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) as refunded_amount"),
                wpFluent()->raw("(SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'paid' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) - SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'refunded' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END)) as net_revenue")
            )
            ->whereBetween('fluentform_transactions.created_at', [$startDate, $endDate])
            ->whereIn('fluentform_transactions.status', ['paid', 'pending', 'refunded'])
            ->groupBy('fluentform_forms.id', 'fluentform_forms.title')
            ->orderBy('net_revenue', 'DESC');

        $results = $query->paginate($perPage, ['*'], 'page', $currentPage);
        $total = $results->total();
        
        // Get totals for all data
        $totalsQuery = wpFluent()
            ->table('fluentform_transactions')
            ->select(
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'paid' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) as paid"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'pending' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) as pending"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'refunded' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) as refunded"),
                wpFluent()->raw("(SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'paid' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) - SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'refunded' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END)) as net")
            )
            ->whereBetween('fluentform_transactions.created_at', [$startDate, $endDate])
            ->whereIn('fluentform_transactions.status', ['paid', 'pending', 'refunded']);
        
        $totals = $totalsQuery->first();
        if ($totals) {
            $formattedTotals = [
                'paid' => round($totals->paid / 100, 2),
                'pending' => round($totals->pending / 100, 2),
                'refunded' => round($totals->refunded / 100, 2),
                'net' => round($totals->net / 100, 2)
            ];
        } else {
            $formattedTotals = [
                'paid' => 0,
                'pending' => 0,
                'refunded' => 0,
                'net' => 0
            ];
        }

        $formattedResults = [];
        foreach ($results->items() as $row) {
            $formattedResults[] = [
                'form_id' => $row->form_id,
                'form_title' => $row->form_title ?: 'Untitled Form',
                'paid_amount' => round($row->paid_amount / 100, 2),
                'pending_amount' => round($row->pending_amount / 100, 2),
                'refunded_amount' => round($row->refunded_amount / 100, 2),
                'net_revenue' => round($row->net_revenue / 100, 2)
            ];
        }
        
        return [
            'data' => $formattedResults,
            'totals' => $formattedTotals,
            'total' => $total
        ];
    }

    /**
     * Get net revenue grouped by payment method with pagination
     */
    private function getNetRevenueByPaymentMethod($startDate, $endDate, $formId = null, $perPage = 5, $currentPage = 1)
    {
        global $wpdb;
        $prefix = $wpdb->prefix;
        $query = wpFluent()
            ->table('fluentform_transactions')
            ->select(
                'fluentform_transactions.payment_method',
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'paid' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) as paid_amount"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'pending' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) as pending_amount"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'refunded' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) as refunded_amount"),
                wpFluent()->raw("(SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'paid' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) - SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'refunded' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END)) as net_revenue"),
                wpFluent()->raw("COUNT(*) as transaction_count")
            )
            ->whereBetween('fluentform_transactions.created_at', [$startDate, $endDate])
            ->whereIn('fluentform_transactions.status', ['paid', 'pending', 'refunded'])
            ->whereNotNull('fluentform_transactions.payment_method');

        if ($formId) {
            $query->where('fluentform_transactions.form_id', $formId);
        }

        $query->groupBy('fluentform_transactions.payment_method')
            ->orderBy('net_revenue', 'DESC');

        $results = $query->paginate($perPage, ['*'], 'page', $currentPage);
        $total = $results->total();
        
        // Get totals for all data
        $totalsQuery = wpFluent()
            ->table('fluentform_transactions')
            ->select(
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'paid' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) as paid"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'pending' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) as pending"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'refunded' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) as refunded"),
                wpFluent()->raw("(SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'paid' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) - SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'refunded' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END)) as net")
            )
            ->whereBetween('fluentform_transactions.created_at', [$startDate, $endDate])
            ->whereIn('fluentform_transactions.status', ['paid', 'pending', 'refunded']);
        
        $totals = $totalsQuery->first();
        if ($totals) {
            $formattedTotals = [
                'paid' => round($totals->paid / 100, 2),
                'pending' => round($totals->pending / 100, 2),
                'refunded' => round($totals->refunded / 100, 2),
                'net' => round($totals->net / 100, 2)
            ];
        } else {
            $formattedTotals = [
                'paid' => 0,
                'pending' => 0,
                'refunded' => 0,
                'net' => 0
            ];
        }

        $formattedResults = [];
        foreach ($results->items() as $row) {
            $paymentMethodName = $this->formatPaymentMethodName($row->payment_method);
            $formattedResults[] = [
                'payment_method' => $row->payment_method,
                'payment_method_name' => $paymentMethodName,
                'paid_amount' => round($row->paid_amount / 100, 2),
                'pending_amount' => round($row->pending_amount / 100, 2),
                'refunded_amount' => round($row->refunded_amount / 100, 2),
                'net_revenue' => round($row->net_revenue / 100, 2),
                'transaction_count' => $row->transaction_count
            ];
        }
        return [
            'data' => $formattedResults,
            'totals' => $formattedTotals,
            'total' => $total
        ];
    }

    /**
     * Get net revenue grouped by payment type with pagination
     */
    private function getNetRevenueByPaymentType($startDate, $endDate, $formId = null, $perPage = 5, $currentPage = 1)
    {
        global $wpdb;
        $prefix = $wpdb->prefix;
        $query = wpFluent()
            ->table('fluentform_transactions')
            ->select(
                'fluentform_transactions.transaction_type',
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'paid' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) as paid_amount"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'pending' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) as pending_amount"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'refunded' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) as refunded_amount"),
                wpFluent()->raw("(SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'paid' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) - SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'refunded' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END)) as net_revenue"),
                wpFluent()->raw("COUNT(*) as transaction_count")
            )
            ->whereBetween('fluentform_transactions.created_at', [$startDate, $endDate])
            ->whereIn('fluentform_transactions.status', ['paid', 'pending', 'refunded'])
            ->whereIn('fluentform_transactions.transaction_type', ['onetime', 'subscription']);

        if ($formId) {
            $query->where('fluentform_transactions.form_id', $formId);
        }

        $query->groupBy('fluentform_transactions.transaction_type')
            ->orderBy('net_revenue', 'DESC');

        $results = $query->paginate($perPage, ['*'], 'page', $currentPage);
        $total = $results->total();
        
        // Get totals for all data
        $totalsQuery = wpFluent()
            ->table('fluentform_transactions')
            ->select(
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'paid' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) as paid"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'pending' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) as pending"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'refunded' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) as refunded"),
                wpFluent()->raw("(SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'paid' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END) - SUM(CASE WHEN {$prefix}fluentform_transactions.status = 'refunded' THEN {$prefix}fluentform_transactions.payment_total ELSE 0 END)) as net")
            )
            ->whereBetween('fluentform_transactions.created_at', [$startDate, $endDate])
            ->whereIn('fluentform_transactions.status', ['paid', 'pending', 'refunded']);
        
        if ($formId) {
            $totalsQuery->where('fluentform_transactions.form_id', $formId);
        }
        
        $totals = $totalsQuery->first();
        if ($totals) {
            $formattedTotals = [
                'paid' => round($totals->paid / 100, 2),
                'pending' => round($totals->pending / 100, 2),
                'refunded' => round($totals->refunded / 100, 2),
                'net' => round($totals->net / 100, 2)
            ];
        } else {
            $formattedTotals = [
                'paid' => 0,
                'pending' => 0,
                'refunded' => 0,
                'net' => 0
            ];
        }

        $formattedResults = [];
        foreach ($results->items() as $row) {
            $typeName = $row->transaction_type === 'onetime' ? 'One-time Payment' : 'Subscription';
            $formattedResults[] = [
                'payment_type' => $row->transaction_type,
                'payment_type_name' => $typeName,
                'paid_amount' => round($row->paid_amount / 100, 2),
                'pending_amount' => round($row->pending_amount / 100, 2),
                'refunded_amount' => round($row->refunded_amount / 100, 2),
                'net_revenue' => round($row->net_revenue / 100, 2),
                'transaction_count' => $row->transaction_count
            ];
        }
        
        return [
            'data' => $formattedResults,
            'totals' => $formattedTotals,
            'total' => $total
        ];
    }

    /**
     * Format payment method name for display
     */
    private function formatPaymentMethodName($paymentMethod)
    {
        $methodNames = [
            'stripe' => 'Stripe',
            'paypal' => 'PayPal',
            'razorpay' => 'Razorpay',
            'paystack' => 'Paystack',
            'mollie' => 'Mollie',
            'square' => 'Square',
            'paddle' => 'Paddle',
            'test' => 'Offline/Test',
            'offline' => 'Offline'
        ];

        return $methodNames[$paymentMethod] ?? ucfirst($paymentMethod);
    }

    /**
     * Get submission analysis grouped by different criteria
     */
    public function getSubmissionAnalysisByGroup()
    {
        // Verify user permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Insufficient permissions'], 403);
            return;
        }

        $groupBy = sanitize_text_field($this->app->request->get('group_by', 'forms'));
        $startDate = sanitize_text_field($this->app->request->get('start_date'));
        $endDate = sanitize_text_field($this->app->request->get('end_date'));
        $formId = intval($this->app->request->get('form_id', 0));
        $perPage = intval($this->app->request->get('per_page', 10));
        $currentPage = intval($this->app->request->get('page', 1));

        // Validate and set default dates if not provided
        if (!$startDate || !$endDate) {
            $endDate = current_time('Y-m-d H:i:s');
            $startDate = date('Y-m-d H:i:s', strtotime('-30 days', strtotime($endDate)));
        }

        try {
            $result = [];

            switch ($groupBy) {
                case 'forms':
                    $result = $this->getSubmissionAnalysisByForms($startDate, $endDate, $perPage, $currentPage);
                    break;
                case 'submission_source':
                    $result = $this->getSubmissionAnalysisBySource($startDate, $endDate, $formId, $perPage, $currentPage);
                    break;
                case 'email':
                    $result = $this->getSubmissionAnalysisByEmail($startDate, $endDate, $formId, $perPage, $currentPage);
                    break;
                case 'country':
                    $result = $this->getSubmissionAnalysisByCountry($startDate, $endDate, $formId, $perPage, $currentPage);
                    break;
                case 'submission_date':
                    $result = $this->getSubmissionAnalysisByDate($startDate, $endDate, $formId, $perPage, $currentPage);
                    break;
                default:
                    wp_send_json_error(['message' => 'Invalid group_by parameter'], 400);
                    return;
            }

            wp_send_json_success([
                'data' => $result['data'],
                'total' => $result['total'],
                'totals' => $result['totals'],
                'group_by' => $groupBy,
                'date_range' => [
                    'start' => $startDate,
                    'end' => $endDate
                ]
            ]);
        } catch (\Exception $e) {
            wp_send_json_error(['message' => 'Error fetching submission analysis data: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get submission analysis grouped by forms with pagination
     */
    private function getSubmissionAnalysisByForms($startDate, $endDate, $perPage = 5, $currentPage = 1)
    {
        global $wpdb;
        $prefix = $wpdb->prefix;
        $query = wpFluent()
            ->table('fluentform_submissions')
            ->join('fluentform_forms', 'fluentform_submissions.form_id', '=', 'fluentform_forms.id')
            ->select(
                'fluentform_forms.id as form_id',
                'fluentform_forms.title as form_title',
                wpFluent()->raw('COUNT(*) as total_submissions'),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'read' THEN 1 ELSE 0 END) as read_submissions"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'unread' THEN 1 ELSE 0 END) as unread_submissions"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'trashed' THEN 1 ELSE 0 END) as spam_submissions"),
                wpFluent()->raw("ROUND((SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'read' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as conversion_rate")
            )
            ->whereBetween('fluentform_submissions.created_at', [$startDate, $endDate])
            ->groupBy('fluentform_forms.id', 'fluentform_forms.title')
            ->orderBy('total_submissions', 'DESC');

        $results = $query->paginate($perPage, ['*'], 'page', $currentPage);
        $total = $results->total();
        
        // Get totals for all data
        $totalsQuery = wpFluent()
            ->table('fluentform_submissions')
            ->select(
                wpFluent()->raw('COUNT(*) as `total`'),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'read' THEN 1 ELSE 0 END) as `read_count`"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'unread' THEN 1 ELSE 0 END) as `unread_count`"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'trashed' THEN 1 ELSE 0 END) as `spam_count`")
            )
            ->whereBetween('fluentform_submissions.created_at', [$startDate, $endDate]);
        
        $totalsData = $totalsQuery->first();
        if ($totalsData) {
            $totals = [
                'total' => (int)$totalsData->total,
                'read' => (int)$totalsData->read_count,
                'unread' => (int)$totalsData->unread_count,
                'spam' => (int)$totalsData->spam_count,
                'readRate' => $totalsData->total > 0 ? round(($totalsData->read_count / $totalsData->total) * 100, 2) : 0
            ];
        } else {
            $totals = [
                'total' => 0,
                'read' => 0,
                'unread' => 0,
                'spam' => 0,
                'readRate' => 0
            ];
        }

        $formattedResults = [];
        foreach ($results->items() as $row) {
            $formattedResults[] = [
                'form_id' => $row->form_id,
                'form_title' => $row->form_title ?: 'Untitled Form',
                'total_submissions' => (int)$row->total_submissions,
                'read_submissions' => (int)$row->read_submissions,
                'unread_submissions' => (int)$row->unread_submissions,
                'spam_submissions' => (int)$row->spam_submissions,
                'conversion_rate' => (float)$row->conversion_rate
            ];
        }

        return [
            'data' => $formattedResults,
            'total' => $total,
            'totals' => $totals
        ];
    }

    /**
     * Get submission analysis grouped by source URL with pagination
     */
    private function getSubmissionAnalysisBySource($startDate, $endDate, $formId = null, $perPage = 5, $currentPage = 1)
    {
        global $wpdb;
        $prefix = $wpdb->prefix;
        // Build the query using wpFluent with full table names
        $query = wpFluent()
            ->table('fluentform_submissions')
            ->select(
                'fluentform_submissions.source_url',
                wpFluent()->raw('COUNT(*) as total_submissions'),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'read' THEN 1 ELSE 0 END) as read_submissions"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'unread' THEN 1 ELSE 0 END) as unread_submissions"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'trashed' THEN 1 ELSE 0 END) as spam_submissions"),
                wpFluent()->raw("ROUND((SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'read' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as conversion_rate")
            )
            ->whereBetween('fluentform_submissions.created_at', [$startDate, $endDate]);

        if ($formId) {
            $query->where('fluentform_submissions.form_id', $formId);
        }
        // Group by source URL and order by total submissions descending
        $query->groupBy('fluentform_submissions.source_url')
              ->orderBy('total_submissions', 'DESC');

        $results = $query->paginate($perPage, ['*'], 'page', $currentPage);
        $total = $results->total();
        
        // Get totals for all data
        $totalsQuery = wpFluent()
            ->table('fluentform_submissions')
            ->select(
                wpFluent()->raw('COUNT(*) as `total`'),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'read' THEN 1 ELSE 0 END) as `read_count`"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'unread' THEN 1 ELSE 0 END) as `unread_count`"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'trashed' THEN 1 ELSE 0 END) as `spam_count`")
            )
            ->whereBetween('fluentform_submissions.created_at', [$startDate, $endDate]);

        if ($formId) {
            $totalsQuery->where('fluentform_submissions.form_id', $formId);
        }
        
        $totalsData = $totalsQuery->first();
        if ($totalsData) {
            $totals = [
                'total' => (int)$totalsData->total,
                'read' => (int)$totalsData->read_count,
                'unread' => (int)$totalsData->unread_count,
                'spam' => (int)$totalsData->spam_count,
                'readRate' => $totalsData->total > 0 ? round(($totalsData->read_count / $totalsData->total) * 100, 2) : 0
            ];
        } else {
            $totals = [
                'total' => 0,
                'read' => 0,
                'unread' => 0,
                'spam' => 0,
                'readRate' => 0
            ];
        }

        $formattedResults = [];
        foreach ($results->items() as $row) {
            $formattedResults[] = [
                'source_url' => $row->source_url ?: 'Direct Access',
                'total_submissions' => (int)$row->total_submissions,
                'read_submissions' => (int)$row->read_submissions,
                'unread_submissions' => (int)$row->unread_submissions,
                'spam_submissions' => (int)$row->spam_submissions,
                'conversion_rate' => (float)$row->conversion_rate
            ];
        }

        return [
            'data' => $formattedResults,
            'total' => $total,
            'totals' => $totals
        ];
    }

    /**
     * Get submission analysis grouped by email with pagination
     */
    private function getSubmissionAnalysisByEmail($startDate, $endDate, $formId = null, $perPage = 5, $currentPage = 1)
    {
        global $wpdb;
        $prefix = $wpdb->prefix;
        // Create a subquery with the email expression to handle the grouping properly
        $subQuery = "SELECT 
            COALESCE(
                NULLIF(JSON_UNQUOTE(JSON_EXTRACT({$prefix}fluentform_submissions.response, '$.email')), ''),
                NULLIF(JSON_UNQUOTE(JSON_EXTRACT({$prefix}fluentform_submissions.response, '$.email_1')), ''),
                NULLIF(JSON_UNQUOTE(JSON_EXTRACT({$prefix}fluentform_submissions.response, '$.user_email')), ''),
                'No Email'
            ) as email,
            COUNT(*) as total_submissions,
            SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'read' THEN 1 ELSE 0 END) as read_submissions,
            SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'unread' THEN 1 ELSE 0 END) as unread_submissions,
            SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'trashed' THEN 1 ELSE 0 END) as spam_submissions,
            ROUND((SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'read' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as conversion_rate
        FROM {$prefix}fluentform_submissions
        WHERE {$prefix}fluentform_submissions.created_at BETWEEN '{$startDate}' AND '{$endDate}'
        " . ($formId ? " AND {$prefix}fluentform_submissions.form_id = {$formId}" : "") . "
        GROUP BY email";

        $query = wpFluent()
            ->table(wpFluent()->raw("({$subQuery}) as email_stats"))
            ->orderBy('total_submissions', 'DESC');

        $results = $query->paginate($perPage, ['*'], 'page', $currentPage);
        $total = $results->total();
        
        // Get totals for all data
        $totalsQuery = wpFluent()
            ->table('fluentform_submissions')
            ->select(
                wpFluent()->raw('COUNT(*) as `total`'),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'read' THEN 1 ELSE 0 END) as `read_count`"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'unread' THEN 1 ELSE 0 END) as `unread_count`"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'trashed' THEN 1 ELSE 0 END) as `spam_count`")
            )
            ->whereBetween('fluentform_submissions.created_at', [$startDate, $endDate]);

        if ($formId) {
            $totalsQuery->where('fluentform_submissions.form_id', $formId);
        }
        
        $totalsData = $totalsQuery->first();
        if ($totalsData) {
            $totals = [
                'total' => (int)$totalsData->total,
                'read' => (int)$totalsData->read_count,
                'unread' => (int)$totalsData->unread_count,
                'spam' => (int)$totalsData->spam_count,
                'readRate' => $totalsData->total > 0 ? round(($totalsData->read_count / $totalsData->total) * 100, 2) : 0
            ];
        } else {
            $totals = [
                'total' => 0,
                'read' => 0,
                'unread' => 0,
                'spam' => 0,
                'readRate' => 0
            ];
        }

        $formattedResults = [];
        foreach ($results->items() as $row) {
            $formattedResults[] = [
                'email' => $row->email,
                'total_submissions' => (int)$row->total_submissions,
                'read_submissions' => (int)$row->read_submissions,
                'unread_submissions' => (int)$row->unread_submissions,
                'spam_submissions' => (int)$row->spam_submissions,
                'conversion_rate' => (float)$row->conversion_rate
            ];
        }

        return [
            'data' => $formattedResults,
            'total' => $total,
            'totals' => $totals
        ];
    }

    /**
     * Get submission analysis grouped by country with pagination
     */
    private function getSubmissionAnalysisByCountry($startDate, $endDate, $formId = null, $perPage = 5, $currentPage = 1)
    {
        global $wpdb;
        $prefix = $wpdb->prefix;
        $query = wpFluent()
            ->table('fluentform_submissions')
            ->select(
                'fluentform_submissions.country',
                wpFluent()->raw('COUNT(*) as total_submissions'),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'read' THEN 1 ELSE 0 END) as read_submissions"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'unread' THEN 1 ELSE 0 END) as unread_submissions"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'trashed' THEN 1 ELSE 0 END) as spam_submissions"),
                wpFluent()->raw("ROUND((SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'read' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as conversion_rate")
            )
            ->whereBetween('fluentform_submissions.created_at', [$startDate, $endDate]);

        if ($formId) {
            $query->where('fluentform_submissions.form_id', $formId);
        }
        
        // Group by country and order by total submissions descending
        $query->groupBy('fluentform_submissions.country')
              ->orderBy('total_submissions', 'DESC');

        $results = $query->paginate($perPage, ['*'], 'page', $currentPage);

        $total = $results->total();
        
        // Get totals for all data
        $totalsQuery = wpFluent()
            ->table('fluentform_submissions')
            ->select(
                wpFluent()->raw('COUNT(*) as `total`'),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'read' THEN 1 ELSE 0 END) as `read_count`"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'unread' THEN 1 ELSE 0 END) as `unread_count`"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'trashed' THEN 1 ELSE 0 END) as `spam_count`")
            )
            ->whereBetween('fluentform_submissions.created_at', [$startDate, $endDate]);

        if ($formId) {
            $totalsQuery->where('fluentform_submissions.form_id', $formId);
        }
        
        $totalsData = $totalsQuery->first();
        if ($totalsData) {
            $totals = [
                'total' => (int)$totalsData->total,
                'read' => (int)$totalsData->read_count,
                'unread' => (int)$totalsData->unread_count,
                'spam' => (int)$totalsData->spam_count,
                'readRate' => $totalsData->total > 0 ? round(($totalsData->read_count / $totalsData->total) * 100, 2) : 0
            ];
        } else {
            $totals =  [
                'total' => 0,
                'read' => 0,
                'unread' => 0,
                'spam' => 0,
                'readRate' => 0,
            ];
        }

        $formattedResults = [];
        foreach ($results->items() as $row) {
            $formattedResults[] = [
                'country' => $row->country ?: 'Unknown',
                'total_submissions' => (int)$row->total_submissions,
                'read_submissions' => (int)$row->read_submissions,
                'unread_submissions' => (int)$row->unread_submissions,
                'spam_submissions' => (int)$row->spam_submissions,
                'conversion_rate' => (float)$row->conversion_rate
            ];
        }

        return [
            'data' => $formattedResults,
            'total' => $total,
            'totals' => $totals
        ];
    }

    /**
     * Get submission analysis grouped by submission date
     */
    private function getSubmissionAnalysisByDate($startDate, $endDate, $formId = null, $perPage = 5, $currentPage = 1)
    {
        global $wpdb;
        $prefix = $wpdb->prefix;
        $query = wpFluent()
            ->table('fluentform_submissions')
            ->select(
                wpFluent()->raw("DATE({$prefix}fluentform_submissions.created_at) as submission_date"),
                wpFluent()->raw('COUNT(*) as total_submissions'),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'read' THEN 1 ELSE 0 END) as read_submissions"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'unread' THEN 1 ELSE 0 END) as unread_submissions"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'trashed' THEN 1 ELSE 0 END) as spam_submissions"),
                wpFluent()->raw("ROUND((SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'read' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as conversion_rate")
            )
            ->whereBetween('fluentform_submissions.created_at', [$startDate, $endDate]);

        if ($formId) {
            $query->where('fluentform_submissions.form_id', $formId);
        }
        
        // Group by date and order by date descending
        $query->groupBy(wpFluent()->raw("DATE({$prefix}fluentform_submissions.created_at)"))
              ->orderBy('submission_date', 'DESC');

        $results = $query->paginate($perPage, ['*'], 'page', $currentPage);
        $total = $results->total();
        
        // Get totals for all data
        $totalsQuery = wpFluent()
            ->table('fluentform_submissions')
            ->select(
                wpFluent()->raw('COUNT(*) as `total`'),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'read' THEN 1 ELSE 0 END) as `read_count`"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'unread' THEN 1 ELSE 0 END) as `unread_count`"),
                wpFluent()->raw("SUM(CASE WHEN {$prefix}fluentform_submissions.status = 'trashed' THEN 1 ELSE 0 END) as `spam_count`")
            )
            ->whereBetween('fluentform_submissions.created_at', [$startDate, $endDate]);

        if ($formId) {
            $totalsQuery->where('fluentform_submissions.form_id', $formId);
        }
        
        $totalsData = $totalsQuery->first();
        if ($totalsData) {
            $totals = [
                'total' => (int)$totalsData->total,
                'read' => (int)$totalsData->read_count,
                'unread' => (int)$totalsData->unread_count,
                'spam' => (int)$totalsData->spam_count,
                'readRate' => $totalsData->total > 0 ? round(($totalsData->read_count / $totalsData->total) * 100, 2) : 0
            ];
        } else {
            $totals =  [
                'total' => 0,
                'read' => 0,
                'unread' => 0,
                'spam' => 0,
                'readRate' => 0,
            ];
        }

        $formattedResults = [];
        foreach ($results->items() as $row) {
            $formattedResults[] = [
                'submission_date' => $row->submission_date,
                'total_submissions' => (int)$row->total_submissions,
                'read_submissions' => (int)$row->read_submissions,
                'unread_submissions' => (int)$row->unread_submissions,
                'spam_submissions' => (int)$row->spam_submissions,
                'conversion_rate' => (float)$row->conversion_rate
            ];
        }

        return [
            'data' => $formattedResults,
            'total' => $total,
            'totals' => $totals
        ];
    }
}
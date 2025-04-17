<?php

namespace FluentForm\App\Modules\Report;

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

use FluentForm\App\Models\Submission;
use FluentForm\App\Models\Log;

class ReportHandler
{
    protected $app;

    public function __construct($app)
    {
        $this->app = $app;

        $app->addAction('fluentform/render_report', [$this, 'renderReport']);
        $app->addAdminAjaxAction('fluentform-get-reports', [$this, 'getReports']);
    }

    public function renderReport()
    {
        wp_enqueue_script('fluentform_reports');

        $this->app->view->render('admin.reports.index', [
            'logo' => fluentformMix('img/fluentform-logo.svg'),
        ]);
    }

    public function getReports()
    {
        $reports = [
            'reports' => [
                'overview_chart' => $this->getOverviewChartData(),
                'form_stats'     => $this->getFormStats(),
                'heatmap_data'   => $this->getSubmissionHeatmap(),
                'api_logs'       => $this->getApiLogs(),
                'transactions'   => $this->getTransactions()
            ]
        ];

        wp_send_json_success($reports, 200);
    }

    public function getOverviewChartData()
    {
        $startDate = sanitize_text_field($this->app->request->get('start_date'));
        $endDate = sanitize_text_field($this->app->request->get('end_date'));
        $view = sanitize_text_field($this->app->request->get('view'));

        if (empty($startDate) || empty($endDate)) {
            $now = new \DateTime();
            $endDate = $now->format('Y-m-d 23:59:59');

            $thirtyDaysAgo = (new \DateTime())->modify('-30 days');
            $startDate = $thirtyDaysAgo->format('Y-m-d 00:00:00');
        }

        // Process and fix date ranges if needed
        list($startDate, $endDate) = $this->processDateRange($startDate, $endDate);

        // Calculate date difference to determine grouping
        $startDateTime = new \DateTime($startDate);
        $endDateTime = new \DateTime($endDate);
        $interval = $startDateTime->diff($endDateTime);
        $daysInterval = $interval->days + 1; // Include both start and end dates

        // Determine grouping mode based on date range
        $groupingMode = $this->getGroupingMode($daysInterval);

        // Get data based on the view type
        if ($view === 'conversion') {
            return $this->getFormViewsAndConversions($startDate, $endDate, $groupingMode);
        } else {
            $data = $this->getAggregatedData($startDate, $endDate, $groupingMode, $view);

            // Get date labels based on grouping mode
            $dateLabels = $this->getDateLabels($startDateTime, $endDateTime, $groupingMode);

            // Format the data for the chart
            return $this->formatDataForChart($dateLabels, $data);
        }
    }

    /**
     * Determine grouping mode based on date range
     */
    private function getGroupingMode($daysInterval)
    {
        if ($daysInterval <= 7) {
            return 'day'; // 1-7 days: group by day
        } elseif ($daysInterval <= 31) { // Change from 30 to 31 to catch full months
            return '3days'; // 8-31 days: group by 3 days
        } elseif ($daysInterval <= 92) { // About 3 months
            return 'week'; // Group by week for 1-3 months
        } else {
            return 'month'; // 3+ months: group by month
        }
    }

    /**
     * Get aggregated data based on grouping mode
     */
    private function getAggregatedData($startDate, $endDate, $groupingMode, $dataType)
    {
        $query = Submission::whereBetween('created_at', [$startDate, $endDate]);

        if ($dataType === 'payments') {
            $query->whereNotNull('payment_total')
                  ->where(function($query) {
                      $query->where('payment_status', 'paid');
                  })
                  ->selectRaw('ROUND(SUM(payment_total) / 100, 2) as count');
        } else {
            $query->selectRaw('COUNT(*) as count');
        }

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
        } else { // month
            // Generate monthly labels - using manual approach to get end of month
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

        // Fill in missing data with zeros
        $values = $this->fillMissingData($dates, $data);

        return [
            'dates'  => $labels,
            'values' => array_values($values),
        ];
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
            // If the date parameter explicitly requested "today" (has today's date), 
            // don't modify it. Otherwise, assume it's a range issue and expand to a year.
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
     * Get form views and conversions by date chunks
     */
    private function getFormViewsAndConversions($startDate, $endDate, $groupingMode)
    {
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
        $viewsQuery = \FluentForm\App\Models\FormAnalytics::whereBetween('created_at', [$startDate, $endDate])
                                                          ->whereNotNull('ip');

        // Group by date and IP to count unique visitors
        if ($groupingMode === 'day') {
            $viewsQuery->selectRaw('DATE(created_at) as date_group, COUNT(DISTINCT ip) as unique_count');
        } elseif ($groupingMode === '3days') {
            // Get min date for reference
            $minDateRecord = \FluentForm\App\Models\FormAnalytics::whereBetween('created_at', [$startDate, $endDate])
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
        $submissionQuery = \FluentForm\App\Models\Submission::whereBetween('created_at', [$startDate, $endDate])
                                                            ->whereNotNull('ip');

        // Group by date and IP to count unique submitters
        if ($groupingMode === 'day') {
            $submissionQuery->selectRaw('DATE(created_at) as date_group, COUNT(DISTINCT ip) as unique_count');
        } elseif ($groupingMode === '3days') {
            // Get min date for reference
            $minDateRecord = \FluentForm\App\Models\Submission::whereBetween('created_at', [$startDate, $endDate])
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
        $formQuery = \FluentForm\App\Models\Form::whereBetween('created_at', [$startDate, $endDate]);

        // Group forms by date
        if ($groupingMode === 'day') {
            $formQuery->selectRaw('DATE(created_at) as date_group, COUNT(*) as count');
        } elseif ($groupingMode === '3days') {
            // Get min date for reference
            $minDateRecord = \FluentForm\App\Models\Form::whereBetween('created_at', [$startDate, $endDate])
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

    public function getFormStats()
    {
        $range = $this->app->request->get('stats_range', 'month');

        $now = new \DateTime();
        $today = $now->format('Y-m-d');

        // Set date range based on selection
        switch ($range) {
            case 'today':
                $startDate = $today . ' 00:00:00';
                $endDate = $today . ' 23:59:59';
                $previousStartDate = (new \DateTime())->modify('-1 day')->format('Y-m-d 00:00:00');
                $previousEndDate = (new \DateTime())->modify('-1 day')->format('Y-m-d 23:59:59');
                break;

            case 'week':
                $startDate = (new \DateTime())->modify('-7 days')->format('Y-m-d H:i:s');
                $endDate = $now->format('Y-m-d H:i:s');
                $previousStartDate = (new \DateTime())->modify('-14 days')->format('Y-m-d H:i:s');
                $previousEndDate = (new \DateTime())->modify('-8 days')->format('Y-m-d H:i:s');
                break;

            case 'month':
                $startDate = (new \DateTime())->modify('-30 days')->format('Y-m-d H:i:s');
                $endDate = $now->format('Y-m-d H:i:s');
                $previousStartDate = (new \DateTime())->modify('-60 days')->format('Y-m-d H:i:s');
                $previousEndDate = (new \DateTime())->modify('-31 days')->format('Y-m-d H:i:s');
                break;

            case 'year':
                $startDate = (new \DateTime())->modify('-365 days')->format('Y-m-d H:i:s');
                $endDate = $now->format('Y-m-d H:i:s');
                $previousStartDate = (new \DateTime())->modify('-730 days')->format('Y-m-d H:i:s');
                $previousEndDate = (new \DateTime())->modify('-366 days')->format('Y-m-d H:i:s');
                break;
        }

        // Get submission counts
        $periodSubmissions = \FluentForm\App\Models\Submission::whereBetween('created_at',
            [$startDate, $endDate])->count();
        $previousPeriodSubmissions = \FluentForm\App\Models\Submission::whereBetween('created_at',
            [$previousStartDate, $previousEndDate])->count();

        // Get submission status counts
        $unreadSubmissions = \FluentForm\App\Models\Submission::whereBetween('created_at',
            [$startDate, $endDate])->where('status', 'unread')->count();
        $readSubmissions = \FluentForm\App\Models\Submission::whereBetween('created_at',
            [$startDate, $endDate])->where('status', 'read')->count();

        $periodSpamSubmissions = \FluentForm\App\Models\Submission::whereBetween('created_at',
            [$startDate, $endDate])->where('status', 'spam')->count();
        $previousSpamSubmissions = \FluentForm\App\Models\Submission::whereBetween('created_at',
            [$previousStartDate, $previousEndDate])->where('status', 'spam')->count();

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
        $growthType = $growthPercentage > 0 ? 'up' : ($growthPercentage < 0 ? 'down' : '');

        // calculate spam percentage
        $spamPercentage = 0;
        if ($previousSpamSubmissions > 0) {
            $spamPercentage = round((($periodSpamSubmissions - $previousSpamSubmissions) / $previousSpamSubmissions) * 100,
                1);
        } elseif ($periodSpamSubmissions > 0) {
            $spamPercentage = 100;
        }

        $spamText = $spamPercentage > 0 ? '+' . $spamPercentage . '%' : $spamPercentage . '%';
        $spamType = $spamPercentage > 0 ? 'up' : ($spamPercentage < 0 ? 'down' : '');

        return [
            'period'              => $range,
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
    }

    public function getSubmissionHeatmap()
    {
        $startDate = sanitize_text_field($this->app->request->get('heatmap_start_date'));
        $endDate = sanitize_text_field($this->app->request->get('heatmap_end_date'));

        if (!$startDate || !$endDate) {
            $endDate = date('Y-m-d H:i:s');
            $startDate = date('Y-m-d H:i:s', strtotime('-14 days'));
        }

        // Process and fix date ranges if needed
        list($startDate, $endDate) = $this->processDateRange($startDate, $endDate);

        // Query submissions using Eloquent-like syntax
        $results = Submission::whereBetween('created_at', [$startDate, $endDate])
                             ->selectRaw('DATE(created_at) as submission_date')
                             ->selectRaw('HOUR(created_at) as submission_hour')
                             ->selectRaw('COUNT(*) as count')
                             ->groupBy('submission_date', 'submission_hour')
                             ->orderBy('submission_date')
                             ->orderBy('submission_hour')
                             ->get();

        // Transform into time slot buckets (8 time slots of 3 hours each)
        $heatmapData = [];

        foreach ($results as $row) {
            $date = $row->submission_date;
            $hour = (int)$row->submission_hour;
            $count = (int)$row->count;

            // Calculate time slot index (0-7) for 3-hour intervals
            $timeSlotIndex = floor($hour / 3);

            // Initialize date in heatmap data if not exists
            if (!isset($heatmapData[$date])) {
                $heatmapData[$date] = array_fill(0, 8, 0);
            }

            // Add count to appropriate time slot
            $heatmapData[$date][$timeSlotIndex] += $count;
        }

        return [
            'heatmap_data' => $heatmapData,
            'start_date'   => $startDate,
            'end_date'     => $endDate
        ];
    }

    public function getApiLogs()
    {
        $startDate = sanitize_text_field($this->app->request->get('api_logs_start_date'));
        $endDate = sanitize_text_field($this->app->request->get('api_logs_end_date'));

        if (!$startDate || !$endDate) {
            $endDate = date('Y-m-d H:i:s');
            $startDate = date('Y-m-d H:i:s', strtotime('-30 days'));
        }

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

    public function getTransactions()
    {
        $transactions = wpFluent()
            ->table('fluentform_transactions')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get([
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
            $status = strtolower($transaction->status);
            if ($status === 'paid') {
                $standardStatus = 'Paid';
            } elseif ($status === 'failed') {
                $standardStatus = 'Failed';
            } else {
                $standardStatus = 'Processing';
            }

            $submissionLink = admin_url('admin.php?page=fluent_forms&route=entries&form_id=' . $transaction->form_id . '#/entries/' . $transaction->submission_id);

            $formattedTransactions[] = [
                'id'             => $transaction->id,
                'submissionLink' => $submissionLink,
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
}
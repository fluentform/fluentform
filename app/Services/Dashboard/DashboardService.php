<?php

namespace FluentForm\App\Services\Dashboard;

use Exception;
use FluentForm\App\Helpers\Helper;
use FluentForm\App\Models\Form;
use FluentForm\App\Models\Submission;
use FluentForm\Framework\Helpers\ArrayHelper as Arr;
use FluentForm\Framework\Support\Sanitizer;

class DashboardService
{
    /**
     * Get Dashboard Data
     *
     * @param array $data
     * @return array
     */
    public function getDashboard($data)
    {
        $data = Sanitizer::sanitize($data, [
            'startDate' => 'sanitizeTextField',
            'endDate' => 'sanitizeTextField',
            'range' => 'sanitizeTextField'
        ]);

        $range = Arr::get($data, 'range', 'month');
        $startDate = Arr::get($data, 'startDate');
        $endDate = Arr::get($data, 'endDate');

        // Handle 'all' range - get all data without date filtering
        if ($range === 'all') {
            $dateRange = ['start' => null, 'end' => null, 'range' => 'all'];
        } else {
            // Use provided dates or calculate from range
            if ($startDate && $endDate) {
                $dateRange = ['start' => $startDate, 'end' => $endDate, 'range' => $range];
            } else {
                $dateRange = DashboardHelper::getDateRangeFromPeriod($range);
            }
        }

        return [
            'stats' => $this->getStats(['dateRange' => $dateRange]),
            'chart_data' => $this->getChartData(['dateRange' => $dateRange]),
            'latest_entries' => $this->getLatestEntries(['limit' => 5, 'dateRange' => $dateRange]),
            'api_logs' => $this->getApiLogs(['limit' => 5, 'dateRange' => $dateRange]),
            'notifications' => $this->getNotifications(['limit' => 5]),
            'country_heatmap' => $this->getCountryHeatmap(['dateRange' => $dateRange]),
            'license_status' => $this->getLicenseStatus(),
            'date_range' => $dateRange
        ];
    }

    /**
     * Get Dashboard Stats
     *
     * @param array $data
     * @return array
     */
    public function getStats($data)
    {
        $dateRange = Arr::get($data, 'dateRange');

        return [
            'total_forms' => DashboardHelper::getTotalForms($dateRange),
            'total_entries' => DashboardHelper::getTotalEntries($dateRange),
            'active_integrations' => DashboardHelper::getActiveIntegrations(),
            'total_revenue' => DashboardHelper::getTotalRevenue($dateRange)
        ];
    }

    /**
     * Get Chart Data
     *
     * @param array $data
     * @return array
     */
    public function getChartData($data)
    {
        $dateRange = Arr::get($data, 'dateRange');

        return DashboardHelper::getSubmissionChartData($dateRange);
    }

    /**
     * Get Latest Entries
     *
     * @param array $data
     * @return array
     */
    public function getLatestEntries($data)
    {
        $limit = Arr::get($data, 'limit', 10);
        $dateRange = Arr::get($data, 'dateRange');

        return DashboardHelper::getLatestEntries($limit, $dateRange);
    }

    /**
     * Get API Logs
     *
     * @param array $data
     * @return array
     */
    public function getApiLogs($data)
    {
        $limit = Arr::get($data, 'limit', 10);
        $dateRange = Arr::get($data, 'dateRange');

        return DashboardHelper::getApiLogs($limit, $dateRange);
    }

    /**
     * Get Notifications
     *
     * @param array $data
     * @return array
     */
    public function getNotifications($data)
    {
        $limit = Arr::get($data, 'limit', 10);

        return DashboardHelper::getNotifications($limit);
    }

    /**
     * Get Country Heatmap
     *
     * @param array $data
     * @return array
     */
    public function getCountryHeatmap($data)
    {
        $dateRange = Arr::get($data, 'dateRange');

        return DashboardHelper::getCountryHeatmap($dateRange);
    }

    /**
     * Get License Status
     *
     * @return array
     */
    public function getLicenseStatus()
    {
        // Check if FluentForm Pro is active
        if (!defined('FLUENTFORMPRO')) {
            return [
                'is_pro' => false,
                'status' => 'free',
                'message' => 'You are currently using the free version of Fluent Forms.'
            ];
        }

        // Get the license checker instance
        if (class_exists('FluentFormAddOnChecker')) {
            $instance = \FluentFormAddOnChecker::getInstance();

            if ($instance) {
                // Use reflection to access the private getSavedLicenseStatus method
                $reflection = new \ReflectionClass($instance);
                $method = $reflection->getMethod('getSavedLicenseStatus');
                $method->setAccessible(true);
                $licenseStatus = $method->invoke($instance);

                if ($licenseStatus === 'valid') {
                    return [
                        'is_pro' => true,
                        'status' => 'valid',
                        'message' => 'Your Fluent Forms Pro license is active.'
                    ];
                } elseif ($licenseStatus === 'expired') {
                    return [
                        'is_pro' => true,
                        'status' => 'expired',
                        'message' => 'Your Fluent Forms Pro license has expired. Please renew to continue receiving updates.'
                    ];
                } elseif ($licenseStatus === 'invalid') {
                    return [
                        'is_pro' => true,
                        'status' => 'invalid',
                        'message' => 'Your Fluent Forms Pro license is invalid. Please check your license key.'
                    ];
                } else {
                    return [
                        'is_pro' => true,
                        'status' => 'inactive',
                        'message' => 'Fluent Forms Pro is installed but license is not activated.'
                    ];
                }
            }
        }

        return [
            'is_pro' => false,
            'status' => 'free',
            'message' => 'You are currently using the free version of Fluent Forms.'
        ];
    }
}

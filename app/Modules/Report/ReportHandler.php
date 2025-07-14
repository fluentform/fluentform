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
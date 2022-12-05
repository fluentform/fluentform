<?php

namespace FluentForm\App\Http\Controllers\Admin;

use FluentForm\App\Helpers\Helper;
use FluentForm\Framework\Helpers\ArrayHelper;

class DashboardController
{
    protected $request;
    
    public function __construct()
    {
        $this->request = wpFluentForm('request');
    }
    
    public function index()
    {
        $formsInfo = $this->getFormInfo();
        $this->addToPro();
        $visibleCards = $this->getDashboardCards();
        $dashboardData = apply_filters('fluentform_dashboard_data', [
            'forms_count'                 => $formsInfo['forms_data'],
            'analytics_info'              => $formsInfo['analytics_data'],
            'submission_summary'          => $this->getSubmissionInfo(),
            'monthly_submission_chart'       => $this->getSubmissionOverviewInfo(),
            'monthly_submission_overview' => $this->getMonthlyOverViewDetails(),
            'activities_data'             => $this->getRecentActivity(),
            'submission_per_form_data'    => $this->getSubmissionPerForm(),
            'visible_cards'               => $visibleCards
        
        
        ]);
        wp_send_json_success($dashboardData);
    }
    
    private function getSubmissionInfo()
    {
        $submissions = wpFluent()->table('fluentform_submissions')
            ->select([
                'id',
                'payment_status',
                'status',
            ])
            ->get();
        
        $statuses = self::getSubmissionStatuses();
        $formattedStatus = [];
        foreach ($statuses as $key => $status) {
            $formattedStatus[$key] = 0;
        }
        
        $sumTotal = 0;
        foreach ($submissions as $submission) {
            $sumTotal ++;
            if ($submission->payment_status && in_array($submission->payment_status, $formattedStatus)) {
                $formattedStatus[$submission->payment_status] ++;
            } elseif (in_array($submission->status, $formattedStatus)) {
                $formattedStatus[$submission->status] ++;
            }
        }
        $formattedSubmissions = [];
        foreach ($formattedStatus as $statusKey => $value) {
            if($value == 0){
                continue;
            }
            $arr = [
                'info'  => ArrayHelper::get(self::getSubmissionStatuses(),$statusKey).' '.__('Submissions','fluentform'),
                'value' => $value,
                'title' => __('View', 'fluentform')
            ];
            if ($statusKey == 'read' || $statusKey == 'unread') {
                $arr['view_url'] = admin_url('admin.php?page=fluent_forms_all_entries&filter_by_status=' . $statusKey);
            } else {
                $arr['view_url'] = admin_url('admin.php?page=fluent_forms_payment_entries&filter_by_status=' . $statusKey);
            }
            if($statusKey == 'trashed'){
                unset($arr['view_url']);
            }
            $formattedSubmissions[] = $arr;
        }
    
        $lastSubmission = $this->getLastSubmission();
        if ($lastSubmission) {
            
            $lastSubmission->human_date = human_time_diff(strtotime($lastSubmission->created_at), strtotime(current_time('mysql'))) . __(' ago', 'fluentform');
            $lastSubmission->submission_url = admin_url('admin.php?page=fluent_forms&route=entries&form_id=' . $lastSubmission->form_id . '#/entries/' . $lastSubmission->id);
            
            array_unshift($formattedSubmissions, [
                'info'     => __('Last Submission', 'fluentform'),
                'value'    => $lastSubmission->human_date,
                'title'    => $lastSubmission->title,
                'view_url' => $lastSubmission->submission_url
            ]);
        }
        array_unshift($formattedSubmissions, [
            'info'     => __("Total Submission", 'fluentform'),
            'value'    => $sumTotal,
            'title'    => __('View', 'fluentform'),
            'view_url' => admin_url('admin.php?page=fluent_forms_all_entries'),
        ]);
        return $formattedSubmissions;
    }
    
    public function getPaymentInfo()
    {
        return wpFluent()->table('fluentform_submissions')
            ->select([
                'id',
                'form_id',
                'payment_status',
                wpFluent()->raw('count(id) as total_count'),
                wpFluent()->raw('sum(payment_total) as total_amount')
            ])
            ->whereNotNull('payment_status')
            ->where('status', '!=', 'trashed')
            ->orderBy('payment_status')
            ->groupBy('payment_status')
            ->get();
    }
    
    private function getFormInfo()
    {
        $forms = fluentFormApi()->forms(['per_page' => 9999]);
        $highestSubmission = $highestViews = $highestConversion = $paymentForm = $postForm = $conversionForm = $stepForm = $activeForm = $inActiveForm = 0;
        $formattedFormData = [];
        foreach ($forms['data'] as $form) {
            $form = (array)$form;
            
            if ($form['total_Submissions'] > $highestSubmission) {
                $formattedFormData[0] = [
                    'info'     => __('Highest Submissions', 'fluentform'),
                    'title'    => $form['title'],
                    'view_url' => $form['edit_url'],
                    'value'    => $form['total_Submissions']
                ];
                $highestSubmission = $form['total_Submissions'];
            }
            if ($form['total_views'] > $highestViews) {
                $formattedFormData[1] = [
                    'info'     => __('Highest View', 'fluentform'),
                    'title'    => $form['title'],
                    'view_url' => $form['edit_url'],
                    'value'    => $form['total_views']
                ];
                $highestViews = $form['total_views'];
            }
            if ($form['conversion'] > $highestConversion) {
                $formattedFormData[2] = [
                    'info'     => __('Highest Conversion', 'fluentform'),
                    'title'    => $form['title'],
                    'view_url' => $form['edit_url'],
                    'value'    => $form['conversion'] . '%'
                ];
                $highestConversion = $form['conversion'];
            }
            
            if (ArrayHelper::isTrue($form, 'has_payment')) {
                $paymentForm++;
            }
            if (ArrayHelper::get($form, 'type') == 'post') {
                $postForm++;
            }
            if (isset($form['conversion_preview'])) {
                $conversionForm++;
            }
            if (Helper::isMultiStepForm($form['id'])) {
                $stepForm++;
            }
            if ($form['status'] == 'published') {
                $activeForm++;
            } else {
                $inActiveForm++;
            }
        }
        
        
        $formInfo[] = [
            'info'     => __('Total Forms', 'fluentform'),
            'value'    => $forms['total'],
            'title'    => __('View', 'fluentform'),
            'view_url' => admin_url('admin.php?page=fluent_forms'),
        ];
        
        if ($activeForm > 0) {
            $formInfo[] = [
                'info'     => __('Active Forms', 'fluentform'),
                'value'    => $activeForm,
                'title'    => __('View', 'fluentform'),
                'view_url' => admin_url('admin.php?page=fluent_forms&filter_by=published'),
            ];
        }
        if ($inActiveForm > 0) {
            $formInfo[] = [
                'info'     => __('Inactive Forms', 'fluentform'),
                'value'    => $inActiveForm,
                'title'    => __('View', 'fluentform'),
                'view_url' => admin_url('admin.php?page=fluent_forms&filter_by=unpublished'),
            ];
        }
        if ($conversionForm > 0) {
            $formInfo[] = [
                'info'     => __('Conversational Forms', 'fluentform'),
                'value'    => $conversionForm,
                'title'    => __('View', 'fluentform'),
                'view_url' => admin_url('admin.php?page=fluent_forms&filter_by=published'),
            ];
        }
        if (defined('FLUENTFORMPRO')) {
            if ($paymentForm > 0) {
                $formInfo[] = [
                    'info'     => __('Payment Forms', 'fluentform'),
                    'value'    => $paymentForm,
                    'title'    => __('View', 'fluentform'),
                    'view_url' => admin_url('admin.php?page=fluent_forms&filter_by=is_payment'),
                ];
            }
            if ($postForm > 0) {
                $formInfo[] = [
                    'info'     => __('Post Forms', 'fluentform'),
                    'value'    => $postForm,
                    'title'    => __('View', 'fluentform'),
                    'view_url' => admin_url('admin.php?page=fluent_forms&filter_by=post'),
                ];
            }
            if ($stepForm > 0) {
                $formInfo[] = [
                    'info'     => __('Step Forms', 'fluentform'),
                    'value'    => $stepForm,
                    'title'    => __('View', 'fluentform'),
                    'view_url' => admin_url('admin.php?page=fluent_forms&filter_by=step_form'),
                
                ];
            }
        }
        return [
            'forms_data'     => $formInfo,
            'analytics_data' => $formattedFormData,
        ];
    }
    
    public function addToPro()
    {
        if (!defined('FLUENTFORMPRO')) {
            return;
        }
        
        add_filter('fluentform_dashboard_data', function ($data) {
            $paymentSettings = \FluentFormPro\Payments\PaymentHelper::getPaymentSettings();
            $currency = ArrayHelper::get($paymentSettings, 'currency', 'USD');
            
            $payments = $this->getPaymentInfo();
            $formattedPayments = [];
            foreach ($payments as $payment) {
                $formattedPayments[] = [
                    'info'     => sprintf(__('Payments %s', 'fluentform'), ucfirst($payment->payment_status)),
                    'value'    => \FluentFormPro\Payments\PaymentHelper::formatMoney($payment->total_amount, $currency),
                    'title'    => __('View', 'fluentform'),
                    'view_url' => admin_url('admin.php?page=fluent_forms_payment_entries&filter_by_status=' . $payment->payment_status),
                ];
            }
            return array_merge($data, [
                'payment_info' => $formattedPayments
            ]);
        });
    }
    
    public function getSubmissionOverviewInfo()
    {
        $entries = $this->getMonthlyData();
        $formattedEntries = [];
        if (empty($entries)) {
            return [];
        }
        foreach ($entries as $entry) {
            $formattedEntries[$entry->date] = $entry->total_count;
        }
        return $formattedEntries;
    }
    
    public function getMonthlyOverViewDetails()
    {
        $dateRange = $this->request->get('date_range');
        $startDate = ArrayHelper::get($dateRange, '0');
        $endDate = ArrayHelper::get($dateRange, '1');
        $entries = wpFluent()->table('fluentform_submissions')
            ->select('*')
//            ->where('status', '!=', 'trashed')
            ->where('fluentform_submissions.created_at', '>=', $startDate . ' 00:00:01')
            ->where('fluentform_submissions.created_at', '<=', $endDate . ' 23:59:59')
            ->get();
        
        
        $submissionCounts = [
            'read'       => 0,
            'unread'     => 0,
            'total'      => 0,
            'total_paid' => 0,
        ];
        foreach ($entries as $entry) {
            if ($entry->payment_status && isset($submissionCounts[$entry->payment_status])) {
                $submissionCounts[$entry->payment_status]++;
            }
            if ($entry->status) {
                $submissionCounts[$entry->status]++;
            }
            if ($entry->total_paid) {
                $submissionCounts['total_paid'] += $entry->total_paid;
            }
            $submissionCounts['total']++;
        }
        $overViewInfo = [];
        if (defined('FLUENTFORMPRO')) {
            $paymentSettings = \FluentFormPro\Payments\PaymentHelper::getPaymentSettings();
            $currency = ArrayHelper::get($paymentSettings, 'currency', 'USD');
            
            $overViewInfo[] = [
                'info'  => __('Monthly Total Paid', 'fluentform'),
                'value' => \FluentFormPro\Payments\PaymentHelper::formatMoney($submissionCounts['total_paid'],
                    $currency),
                'title' => __('View', 'fluentform'),
            ];
        }
        
        
        $overViewInfo[] = [
            'info'  => __('Monthly Unread', 'fluentform'),
            'value' => $submissionCounts['unread'],
            'title' => __('View', 'fluentform'),
        
        ];
        $overViewInfo[] = [
            'info'  => __('Monthly Read', 'fluentform'),
            'value' => $submissionCounts['read'],
            'title' => __('View', 'fluentform'),
        
        ];
        
        $overViewInfo[] = [
            'info'  => __('Monthly Total Submissions', 'fluentform'),
            'value' => $submissionCounts['total'],
            'title' => __('View', 'fluentform'),
        ];
        
        return $overViewInfo;
    }
    
    private function getMonthlyData()
    {
        $dateRange = $this->request->get('date_range');
        $status = $this->request->get('submission_type');
        $startDate = ArrayHelper::get($dateRange, '0');
        $endDate = ArrayHelper::get($dateRange, '1');
        $query = wpFluent()->table('fluentform_submissions')
            ->select([
                'id',
                'status',
                'payment_status',
                'total_paid',
                wpFluent()->raw('count(id) as total_count'),
                wpFluent()->raw('date(created_at) as date'),
            ]);
//            ->where('status', '!=', 'trashed');
        if ($status && $status != 'all') {
            $query->where('status', $status);
        }
        $query->where('fluentform_submissions.created_at', '>=', $startDate . ' 00:00:01')
            ->where('fluentform_submissions.created_at', '<=', $endDate . ' 23:59:59')
            ->groupBy('date');
        
        
        return $query->get();
    }
    
    protected function getRecentActivity()
    {
        global $wpdb;
        $logs = wpFluent()->table('fluentform_logs')
            ->select([
                'fluentform_logs.*',
                wpFluent()->raw($wpdb->prefix . 'fluentform_forms.title as form_title'),
                wpFluent()->raw($wpdb->prefix . 'fluentform_logs.parent_source_id as form_id'),
                wpFluent()->raw($wpdb->prefix . 'fluentform_logs.source_id as entry_id')
            ])
            ->leftJoin('fluentform_forms', 'fluentform_forms.id', '=', 'fluentform_logs.parent_source_id')
            ->orderBy('fluentform_logs.id', 'DESC')
            ->limit(5)
            ->get();
        
        foreach ($logs as $log) {
            if ($log->source_type == 'submission_item' && $log->entry_id) {
                $log->human_date = human_time_diff(strtotime($log->created_at),
                        strtotime(current_time('mysql'))) . __(' ago', 'fluentform');
                $log->submission_url = admin_url('admin.php?page=fluent_forms&route=entries&form_id=' . $log->form_id . '#/entries/' . $log->entry_id);
            }
        }
        return $logs;
    }
    
    protected function getSubmissionPerForm()
    {
        global $wpdb;
        
        $submissionGroup = wpFluent()->table('fluentform_submissions')
            ->select([
                'fluentform_submissions.form_id',
                wpFluent()->raw($wpdb->prefix . 'fluentform_forms.title as form_title'),
                wpFluent()->raw('count(' . $wpdb->prefix . 'fluentform_submissions.id) as total_count'),
            ])
            ->leftJoin('fluentform_forms', 'fluentform_forms.id', '=', 'fluentform_submissions.form_id')
//            ->where('fluentform_submissions.status', '!=', 'trashed')
            ->groupBy('form_id')
            ->get();
        $formattedData = [];
        foreach ($submissionGroup as $group) {
            $formattedData[$group->form_title . '#' . $group->form_id] = $group->total_count;
        }
        return $formattedData;
    }
    
    public function updateVisibleCards()
    {
        $cards = wp_unslash($this->request->get('visible_cards'));
        update_option('fluentform_dashboard_visible_cards', $cards, 'no');
        
        wp_send_json_success([
            'message' => 'Dashboard successfully updated',
        ], 200);
    }
    
    private function getDashboardCards()
    {
        
        $visibleCards = [
            "Total Forms",
            "Last Submission",
            "Total Submission",
            "Trashed Submissions",
            "Unread Submissions",
            "Active Forms",
            "Inactive Forms",
            "Highest View",
            "Highest Submissions",
            "Monthly Read",
            "Monthly Unread",
            "Monthly Total Submissions",
            "Monthly Submission Chart",
        ];
        if (defined('FLUENTFORMPRO')) {
            $visibleCards = array_merge($visibleCards, [
                "Paid Submission",
                "Payments Paid",
                "Monthly Total Paid",
            ]);
        }
        if (get_option('fluentform_dashboard_visible_cards')) {
            $visibleCards = get_option('fluentform_dashboard_visible_cards');
        }
       return $visibleCards;
    }
    
    private static function getSubmissionStatuses()
    {
        $statuses = \FluentForm\App\Helpers\Helper::getEntryStatuses();
        if (defined('FLUENTFORMPRO')) {
            $paymentStatuses = \FluentFormPro\Payments\PaymentHelper::getPaymentStatuses();
            $statuses = array_merge($statuses, $paymentStatuses);
        }
        return $statuses;
    }
    
    private function getLastSubmission()
    {
        return wpFluent()->table('fluentform_submissions')
            ->select([
                'fluentform_submissions.id',
                'fluentform_submissions.form_id',
                'fluentform_forms.title',
                'fluentform_submissions.created_at'
            ])
            ->orderBy('fluentform_submissions.id', 'DESC')
            ->where('fluentform_submissions.status', '!=', 'trashed')
            ->join('fluentform_forms', 'fluentform_forms.id', '=', 'fluentform_submissions.form_id')
            ->first();
    }
}

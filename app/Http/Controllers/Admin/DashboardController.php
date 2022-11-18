<?php

namespace FluentForm\App\Http\Controllers\Admin;

use FluentForm\App\Helpers\Helper;
use FluentForm\Framework\Helpers\ArrayHelper;
use FluentFormPro\Payments\PaymentHelper;

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
        $submissionInfo = $this->getSubmissionInfo();
        $submissionOverViewInfo = $this->getSubmissionOverviewInfo();
        $recentActivities = $this->getRecentActivity();
        $this->addToPro();
        
        
        $dashboardData = apply_filters('fluentform_dashboard_data', [
            'forms_data'               => $formsInfo['forms_data'],
            'analytics_data'           => $formsInfo['analytics_data'],
            'submission_data'          => $submissionInfo,
            'submission_overview_data' => $submissionOverViewInfo,
            'activities_data'          => $recentActivities,
            'submission_per_form_data' => $this->getSubmissionPerForm(),
        ]);
        wp_send_json_success($dashboardData);
    }
    
    private function getSubmissionInfo()
    {
        $query = wpFluent()->table('fluentform_submissions')->select([
            'payment_status',
            wpFluent()->raw('count(id) as total_count')
        ]);
        if (defined('FLUENTFORMPRO')) {
            $query->whereIn('payment_status', ['paid', 'pending', 'refunded'])
                ->orWhereNull('payment_status');
        }
        $submissionsGroups = $query->groupBy('payment_status')->get();
        
        $sumTotal = 0;
        $formattedSubmissions = [];
        foreach ($submissionsGroups as $group) {
            $sumTotal += $group->total_count;
            if ($group->payment_status) {
                $formattedSubmissions[] = [
                    'info'  => sprintf(__('%s Submission', 'fluentform'), ucfirst($group->payment_status)),
                    'value' => $group->total_count,
                    'title'    => __('View', 'fluentform'),
                    'view_url' => admin_url('admin.php?page=fluent_forms_payment_entries&filter_by_status='.$group->payment_status),
                ];
            }
        }
        array_unshift($formattedSubmissions, [
            'info'  => __("Total Submission", 'fluentform'),
            'value' => $sumTotal,
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
            ->groupBy('payment_status')
            ->get();
    }
    
    private function getFormInfo()
    {
        $forms = fluentFormApi()->forms(['per_page'=>9999]);
        $highestSubmission = $highestViews = $highestConversion = $paymentForm = $postForm = $conversionForm = $stepForm = 0;
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
        }
        
        
        $formInfo[] = [
            'info'     => __('Total Forms', 'fluentform'),
            'value'    => $forms['total'],
            'title'    => __('View', 'fluentform'),
            'view_url' => admin_url('admin.php?page=fluent_forms'),
        ];
       
        if ($conversionForm > 0) {
            $formInfo[] = [
                'info'     => __('Conversational Forms', 'fluentform'),
                'value'    => $conversionForm,
                'title'    => __('View', 'fluentform'),
                'view_url' => admin_url('admin.php?page=fluent_forms&filter_by=conv_form'),
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
        add_filter('fluentform_dashboard_data', function ($data) {
            $paymentSettings = PaymentHelper::getPaymentSettings();
            $currency = ArrayHelper::get($paymentSettings, 'currency', 'USD');
            
            $payments = $this->getPaymentInfo();
            $formattedPayments = [];
            foreach ($payments as $payment) {
                $formattedPayments[] = [
                    'info'  => sprintf(__('Payments %s', 'fluentform'), ucfirst($payment->payment_status)),
                    'value' => PaymentHelper::formatMoney($payment->total_amount, $currency),
                    'title'    => __('View', 'fluentform'),
                    'view_url' => admin_url('admin.php?page=fluent_forms_payment_entries&filter_by_status='.$payment->payment_status),
                ];
            }
            return array_merge($data, [
                'payment_data' => $formattedPayments
            ]);
        });
    }
    
    public function getSubmissionOverviewInfo()
    {
        $entries = $this->getDailyEntriesCount();
        $formattedEntries = [];
        if (empty($entries)) {
            return [];
        }
        foreach ($entries as $entry) {
            $formattedEntries[$entry->date] = $entry->total_count;
        }
        
        return $formattedEntries;
    }
    
    private function getDailyEntriesCount()
    {
        $dateRange = $this->request->get('date_range');
        $startDate = ArrayHelper::get($dateRange, '0');
        $endDate = ArrayHelper::get($dateRange, '1');
        return wpFluent()->table('fluentform_submissions')
            ->select([
                'id',
                wpFluent()->raw('count(id) as total_count'),
                wpFluent()->raw('date(created_at) as date'),
            ])
            ->where('status', '!=', 'trashed')
            ->where('fluentform_submissions.created_at', '>=', $startDate . ' 00:00:01')
            ->where('fluentform_submissions.created_at', '<=', $endDate . ' 23:59:59')
            ->groupBy('date')
            ->get();
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
        $dateRange = $this->request->get('date_range');
        $startDate = ArrayHelper::get($dateRange, '0');
        $endDate = ArrayHelper::get($dateRange, '1');
        $submissionGroup = wpFluent()->table('fluentform_submissions')
            ->select([
                'fluentform_submissions.form_id',
                wpFluent()->raw($wpdb->prefix . 'fluentform_forms.title as form_title'),
                wpFluent()->raw('count(' . $wpdb->prefix . 'fluentform_submissions.id) as total_count'),
            ])
            ->leftJoin('fluentform_forms', 'fluentform_forms.id', '=', 'fluentform_submissions.form_id')
            ->where('fluentform_submissions.status', '!=', 'trashed')
            ->where('fluentform_submissions.created_at', '>=', $startDate . ' 00:00:01')
            ->where('fluentform_submissions.created_at', '<=', $endDate . ' 23:59:59')
            ->groupBy('form_id')
            ->get();
        $formattedData = [];
        foreach ($submissionGroup as $group) {
            $formattedData[$group->form_title .'#'.$group->form_id] = $group->total_count;
        }
        return $formattedData;
    }
}

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
}
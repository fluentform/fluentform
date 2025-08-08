<?php

namespace FluentForm\App\Modules\Dashboard;

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

use FluentForm\App\Helpers\Helper;
use FluentForm\App\Modules\Registerer\TranslationString;
use FluentForm\Framework\Helpers\ArrayHelper;
use FluentForm\App\Modules\Payments\PaymentHelper;

class DashboardHandler
{
    protected $app;

    public function __construct($app)
    {
        $this->app = $app;

        $app->addAction('fluentform/render_dashboard', [$this, 'renderDashboard']);
    }

    public function renderDashboard()
    {
        wp_enqueue_script('fluentform_dashboard');
        wp_enqueue_style('fluentform_dashboard');
        
        $hasPayment = false;
        $paymentSettings = get_option('__fluentform_payment_module_settings');
        if ($paymentSettings && ArrayHelper::get($paymentSettings, 'status') === 'yes') {
            $hasPayment = true;
        }

        wp_localize_script('fluentform_dashboard', 'FluentFormApp', [
            'has_payment'      => $hasPayment,
            'has_pro'          => Helper::hasPro(),
            'dashboard_i18n'   => TranslationString::getDashboardI18n(),
            'payment_statuses' => PaymentHelper::getPaymentStatuses(),
            'payment_methods'  => apply_filters('fluentform/available_payment_methods', [])
        ]);

        $this->app->view->render('admin.dashboard.index', [
            'logo' => fluentformMix('img/fluentform-logo.svg'),
        ]);
    }
}

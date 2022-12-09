<?php

namespace FluentForm\App\Modules\Reports;

use FluentForm\App\Api\Form;
use FluentForm\App\Helpers\Helper;
use FluentForm\App\Modules\Entries\Entries;
use FluentForm\App\Services\Integrations\GlobalIntegrationManager;
use FluentForm\Framework\Foundation\Application;

class Reports
{
    private $app;
    private $formApi;
    private $entryHelper;

    public function __construct(Application $app)
    {
        $this->app = $app;
        $this->formApi = new Form;
        $this->entryHelper = new Entries();
    }

    public function getFormReports($formId)
    {
        if (!$formId) {
            $formId = intval($this->app->request->get('form_id'));
        }
        $date_range = $this->app->request->get('date_range');
        $reports = $this->getFormReportsData($formId, $date_range);
        if (!$reports) {
            wp_send_json_error([]);
        }
        wp_send_json_success($reports);
    }

    public function getFormReportsData($formId, $date_range = [])
    {
        if (!$formId) {
            return [];
        }
        $form = $this->formApi->find($formId);
        $total_submission = $this->getTotalSubmissionCount($formId, $date_range);
        $total_ip_view = $this->getTotalIpViewCount($formId, $date_range);
        $total_view = $this->getTotalViewCount($formId, $date_range);
        $total_conversion_rate = $this->conversionRate($total_view, $total_submission);
        $total_ip_conversion_rate = $this->conversionRate($total_ip_view, $total_submission);
        $last_submission = $this->getLastSubmissionDate($formId);
        $payments = $form->has_payment ? $this->getPaymentReports($formId, $date_range) : false;
        $integrations = $this->getIntegrationReports($formId, $date_range);
        return [
            "overview"     => [
                "conversion"      => $total_conversion_rate,
                "ip_conversion"   => $total_ip_conversion_rate,
                "last_submission" => $last_submission,
                "chart_data"      => $this->entryHelper->getEntriesReportForChart(),
                "ip_views"        => $total_ip_view,
                "views"           => $total_view,
                "submissions"     => $total_submission,
                "payments"        => $payments ? $payments['transactions']['total']['payments'] : ['0'],
                "integrations"    => $integrations ? count($integrations) : 0,
                "date_range"      => $date_range
            ],
            "views"        => [
                "label"       => __('Views', 'fluentform'),
                "description" => __('Views for selected period.', 'fluentform'),
                "ip_label"    => __('Unique Views', 'fluentform'),
                "total"       => $total_view,
                "ip_total"    => $total_ip_view,
            ],
            "conversion"   => [
                "label"       => __('Conversion', 'fluentform'),
                "description" => __('Conversion Rate for selected period.', 'fluentform'),
                "ip_label"    => __('Unique Conversion', 'fluentform'),
                "total"       => $total_conversion_rate,
                "ip_total"    => $total_ip_conversion_rate,
            ],
            "submissions"  => [
                "label"       => __('Submissions', 'fluentform'),
                "description" => __('Submissions for selected period.', 'fluentform'),
                "total"       => $total_submission,
                "url"         => Helper::getFormAdminPermalink('entries', $form)
            ],
            "integrations" => [
                "label"       => __('Integrations', 'fluentform'),
                "description" => __('Data sent to third party apps over the selected period.'),
                "url"         => Helper::getFormSettingsUrl($form, 'all-integrations'),
                "data"        => $integrations,
            ],
            "payments"     => [
                "label"       => __('Payments', 'fluentform'),
                "description" => __('Payments reports over the selected period.'),
                "data"        => $payments,
            ],
        ];
    }

    private function getTotalViewCount($formId, $dateRange, $default = 0)
    {
        $query = wpFluent()->table('fluentform_form_analytics')
            ->select(wpFluent()->raw('SUM(count) as count'))
            ->where('form_id', $formId);
        if ($dateRange) {
            $query->where('created_at', '>=', $dateRange[0] . ' 00:00:01');
            $query->where('created_at', '<=', $dateRange[1] . ' 23:59:59');
        }
        $row = $query->first();
        if ($row->count) {
            return (int)$row->count;
        }
        return $default;
    }

    private function getTotalIpViewCount($formId, $dateRange)
    {
        $query = wpFluent()->table('fluentform_form_analytics')
            ->select('ip')
            ->where('form_id', $formId);
        if ($dateRange) {
            $query->where('created_at', '>=', $dateRange[0] . ' 00:00:01');
            $query->where('created_at', '<=', $dateRange[1] . ' 23:59:59');
        }
        return $query->count();
    }

    private function getPaymentReports($formId, $dateRange)
    {
        if (!defined('FLUENTFORMPRO')) {
            return false;
        }
        return [
            'transactions'  => $this->getTransactionsReports($formId, $dateRange),
            'orders'        => $this->getOrdersReports($formId, $dateRange),
            'subscriptions' => $this->getSubscriptionReports($formId, $dateRange),
        ];
    }

    private function getTransactionsReports($formId, $dateRange)
    {
        $transactions = [];
        $paymentsQuery = wpFluent()->table('fluentform_transactions')
            ->select([
                wpFluent()->raw('SUM(payment_total) as total_payments'),
                wpFluent()->raw('COUNT(*) as count'),
                'currency',
                'status'
            ])
            ->where('form_id', $formId);
        if ($dateRange) {
            $paymentsQuery->where('created_at', '>=', $dateRange[0] . ' 00:00:01');
            $paymentsQuery->where('created_at', '<=', $dateRange[1] . ' 23:59:59');
        }
        $grandTotal = $paymentsQuery->groupBy('currency')->get();
        $paymentsByStatuses = $paymentsQuery->groupBy('status')->get();

        if (!$grandTotal || !$paymentsByStatuses) {
            return [
                "total" => [
                    'count'    => 0,
                    'payments' => ["0"],
                ],
                "items" => [
                    "pending" => [
                        "count"    => 0,
                        "status"   => 'pending',
                        "name"     => __('pending', 'fluentform'),
                        "payments" => ["0"],
                    ],
                    "paid"    => [
                        "count"    => 0,
                        "status"   => 'paid',
                        "name"     => __('paid', 'fluentform'),
                        "payments" => ["0"],
                    ],
                    "failed"  => [
                        "count"    => 0,
                        "status"   => 'failed',
                        "name"     => __('failed', 'fluentform'),
                        "payments" => ["0"],
                    ],
                ]
            ];
        }

        $total = [
            'count'    => 0,
            'payments' => [],
        ];

        foreach ($grandTotal as $item) {
            if (!isset($item->total_payments) || !$item->count || !$item->currency) {
                continue;
            }
            $total['count'] = $total['count'] + (int)$item->count;
            $total['payments'][] = \FluentFormPro\Payments\PaymentHelper::formatMoney($item->total_payments,
                $item->currency);
        }
        $transactions['total'] = $total;

        $statuses = [];

        foreach ($paymentsByStatuses as $item) {
            if (!$item->status || !isset($item->count) || !isset($item->total_payments) || !$item->currency) {
                continue;
            }
            if (isset($statuses[$item->status])) {
                $statuses[$item->status]['count'] = $statuses[$item->status]['count'] + (int)$item->count;
                $statuses[$item->status]['payments'][] = \FluentFormPro\Payments\PaymentHelper::formatMoney($item->total_payments,
                    $item->currency);
            } else {
                $statuses[$item->status] = [
                    "count"    => (int)$item->count,
                    "status"   => $item->status,
                    "name"     => __($item->status, 'fluentform'),
                    "payments" => [
                        \FluentFormPro\Payments\PaymentHelper::formatMoney($item->total_payments,
                            $item->currency)
                    ],
                ];
            }
        }
        $transactions['items'] = $statuses;
        return $transactions;
    }

    private function getOrdersReports($formId, $dateRange)
    {
        $ordersReports = [];
        $subscriptionQuery = wpFluent()->table('fluentform_order_items')
            ->select([
                wpFluent()->raw('SUM(quantity) as total_quantity'),
                wpFluent()->raw('SUM(line_total) as payments'),
                'item_price',
                'item_name',
                wpFluent()->raw('COUNT(*) as count'),
            ])
            ->where('form_id', $formId);
        if ($dateRange) {
            $subscriptionQuery->where('created_at', '>=', $dateRange[0] . ' 00:00:01');
            $subscriptionQuery->where('created_at', '<=', $dateRange[1] . ' 23:59:59');
        }
        $grandTotal = $subscriptionQuery->groupBy('item_price')->get();

        if (!$grandTotal) {
            return false;
        }

        $total = [
            'count'    => 0,
            'quantity' => 0,
            'payments' => 0,
        ];
        $currency = \FluentFormPro\Payments\PaymentHelper::getFormCurrency($formId);
        foreach ($grandTotal as $item) {
            if (!isset($item->payments) || !isset($item->item_price)) {
                continue;
            }
            $total = [
                'count'    => $total['count'] + (int)$item->count,
                'quantity' => $total['quantity'] + (int)$item->total_quantity,
                'payments' => $total['payments'] + (int)$item->payments,
            ];
            $ordersReports['items'][] = [
                'name'     => __($item->item_name, 'fluentform'),
                'count'    => $item->count,
                'quantity' => $item->total_quantity,
                'payments' => \FluentFormPro\Payments\PaymentHelper::formatMoney($item->payments, $currency),
                'price'    => \FluentFormPro\Payments\PaymentHelper::formatMoney($item->item_price, $currency),
            ];
        }
        $total['payments'] = \FluentFormPro\Payments\PaymentHelper::formatMoney($total['payments'], $currency);
        $ordersReports['total'] = $total;
        return $ordersReports;
    }

    private function getSubscriptionReports($formId, $dateRange)
    {
        $subscriptionReports = [];
        $query = wpFluent()->table('fluentform_subscriptions');

        $query->select([
            wpFluent()->raw('SUM(quantity * recurring_amount) as should_pay'),
            wpFluent()->raw('SUM(recurring_amount * bill_count) as paid'),
            wpFluent()->raw('SUM(quantity) as pay_count'),
            wpFluent()->raw('SUM(bill_count) as paid_count'),
            wpFluent()->raw('COUNT(*) as count'),
            'status',
            'billing_interval',
            'plan_name',
            'recurring_amount',
            'trial_days',
        ])
            ->where('form_id', $formId);
        if ($dateRange) {
            $query->where('created_at', '>=', $dateRange[0] . ' 00:00:01');
            $query->where('created_at', '<=', $dateRange[1] . ' 23:59:59');
        }

        $statuses = $query->groupBy(['status'])->get();

        if (!$statuses) {
            return false;
        }

        $total = [
            'count'      => 0,
            'should_pay' => 0,
            'paid'       => 0,
            'pay_count'  => 0,
            'paid_count' => 0,
        ];
        $currency = \FluentFormPro\Payments\PaymentHelper::getFormCurrency($formId);
        foreach ($statuses as $item) {
            if (!isset($item->should_pay) || !$item->count) {
                continue;
            }
            $total = [
                'count'      => $total['count'] + (int)$item->count,
                'should_pay' => $total['should_pay'] + (int)$item->should_pay,
                'paid'       => $total['paid'] + (int)$item->paid,
                'pay_count'  => $total['pay_count'] + (int)$item->pay_count,
                'paid_count' => $total['paid_count'] + (int)$item->paid_count,
            ];
            $subscriptionReports['items'][] = [
                'count'      => $item->count,
                'status'     => $item->status,
                'name'       => __($item->status, 'fluentform'),
                'pay_count'  => $item->pay_count,
                'paid_count' => $item->paid_count,
                'should_pay' => \FluentFormPro\Payments\PaymentHelper::formatMoney($item->should_pay, $currency),
                'paid'       => \FluentFormPro\Payments\PaymentHelper::formatMoney($item->paid, $currency),
            ];
        }
        if (isset($subscriptionReports['items'])) {
            $total['should_pay'] = \FluentFormPro\Payments\PaymentHelper::formatMoney($total['should_pay'], $currency);
            $total['paid'] = \FluentFormPro\Payments\PaymentHelper::formatMoney($total['paid'], $currency);
            $subscriptionReports['total'] = $total;
        }

        $plannings = $query->groupBy(['billing_interval'])->get();

        if (!$plannings) {
            return false;
        }

        $planDataFormat = [];
        $sumPayments = [];
        $interval = [
            "day"   => __("Daily", 'fluentform'),
            "month" => __("Monthly", 'fluentform'),
            "year"  => __("Yearly", 'fluentform'),
            "week"  => __("Weekly", 'fluentform'),
        ];
        foreach ($plannings as $item) {
            if (!isset($item->should_pay) || !$item->count || !$item->billing_interval) {
                continue;
            }

            if (
                isset($planDataFormat[$item->billing_interval]) ||
                isset($sumPayments[$item->billing_interval])
            ) {
                $planDataFormat[$item->billing_interval]['count'] += $item->count;
                $planDataFormat[$item->billing_interval]['pay_count'] += $item->pay_count;
                $planDataFormat[$item->billing_interval]['paid_count'] += $item->paid_count;
                $sumPayments[$item->billing_interval]['should_pay'] += $item->should_pay;
                $sumPayments[$item->billing_interval]['paid'] += $item->paid;
                $planDataFormat[$item->billing_interval]['should_pay'] = \FluentFormPro\Payments\PaymentHelper::formatMoney($sumPayments[$item->billing_interval]['should_pay'],
                    $currency);
                $planDataFormat[$item->billing_interval]['paid'] = \FluentFormPro\Payments\PaymentHelper::formatMoney($sumPayments[$item->billing_interval]['paid'],
                    $currency);
            } else {
                $planDataFormat[$item->billing_interval] = [
                    "name"       => __($item->plan_name, 'fluentform'),
                    "interval"   => $interval[$item->billing_interval],
                    "count"      => (int)$item->count,
                    'trial_days' => $item->trial_days,
                    'pay_count'  => (int)$item->pay_count,
                    'paid_count' => (int)$item->paid_count,
                    "should_pay" => \FluentFormPro\Payments\PaymentHelper::formatMoney($item->should_pay, $currency),
                    'paid'       => \FluentFormPro\Payments\PaymentHelper::formatMoney($item->paid, $currency),
                    'price'      => \FluentFormPro\Payments\PaymentHelper::formatMoney($item->recurring_amount,
                        $currency),
                ];
                $sumPayments[$item->billing_interval] = [
                    "should_pay" => (int)$item->should_pay,
                    "paid"       => (int)$item->paid,
                ];
            }
            $planDataFormat[$item->billing_interval]['items'][] = [
                'count'      => (int)$item->count,
                'pay_count'  => (int)$item->pay_count,
                'paid_count' => (int)$item->paid_count,
                'price'      => \FluentFormPro\Payments\PaymentHelper::formatMoney($item->recurring_amount, $currency),
                'should_pay' => \FluentFormPro\Payments\PaymentHelper::formatMoney($item->should_pay, $currency),
                'paid'       => \FluentFormPro\Payments\PaymentHelper::formatMoney($item->paid, $currency),
                'status'     => $item->status,
            ];
        }
        if ($planDataFormat) {
            $subscriptionReports['plannings'] = $planDataFormat;
        }

        return $subscriptionReports;
    }

    private function getLastSubmissionDate($formId)
    {
        $query = wpFluent()->table('fluentform_submissions')
            ->where('form_id', $formId)->orderBy('id', 'DESC')->first();
        if ($query) {
            return $query->updated_at;
        }
        return '';
    }

    private function getTotalSubmissionCount($formId, $dateRange)
    {
        $query = wpFluent()->table('fluentform_submissions')
            ->where('form_id', $formId);
        if ($dateRange) {
            $query->where('created_at', '>=', $dateRange[0] . ' 00:00:01');
            $query->where('created_at', '<=', $dateRange[1] . ' 23:59:59');
        }
        return $query->count();
    }

    private function conversionRate($view, $submission)
    {
        if (!$view || !$submission) {
            return 0;
        }
        return ceil(($view / $submission) * 100);
    }

    private function getIntegrationReports($formId, $dateRange)
    {
        $feeds = (new GlobalIntegrationManager($this->app))->getNotificationFeeds($formId);
        if (!$feeds || !is_array($feeds)) {
            return false;
        }

        $feedsProviders = array_map(function ($arr) {
            return $arr['provider'];
        }, $feeds);
        $uniqueProvider = array_unique($feedsProviders);
        $duplicatesProvider = array_diff_assoc($feedsProviders, $uniqueProvider);

        $integrationsReport = [];
        foreach ($feeds as $feed) {
            $apiLogQuery = wpFluent()->table('ff_scheduled_actions')
                ->select([
                    'status',
                    wpFluent()->raw('COUNT(status) as total')
                ])
                ->where('form_id', $formId)
                ->where('feed_id', $feed['id']);
            if ($dateRange) {
                $apiLogQuery->where('created_at', '>=', $dateRange[0] . ' 00:00:01');
                $apiLogQuery->where('created_at', '<=', $dateRange[1] . ' 23:59:59');
            }
            $apiLogQuery->groupBy(['status']);

            if ($data = $apiLogQuery->get()) {
                $integrationsReport[] = [
                    "enable"   => $feed['enabled'],
                    "provider" => "UserRegistration" != $feed['provider'] ? $feed['provider'] : "UserRegistrationOrUpdate",
                    "name"     => __($feed['name'], 'fluentform'),
                    "statuses" => $data,
                ];
            } else {
                $statusLogQuery = wpFluent()->table('fluentform_logs')
                    ->select([
                        'status',
                        wpFluent()->raw('COUNT(status) as total')
                    ])
                    ->where('parent_source_id', $formId)
                    ->where('component', $feed['provider']);

                if (in_array($feed['provider'], $duplicatesProvider)) {
                    $statusLogQuery->where('title', $feed['name']);
                }
                if ($dateRange) {
                    $statusLogQuery->where('created_at', '>=', $dateRange[0] . ' 00:00:01');
                    $statusLogQuery->where('created_at', '<=', $dateRange[1] . ' 23:59:59');
                }
                $statusLogQuery->groupBy(['status']);
                if ($data = $statusLogQuery->get()) {
                    $integrationsReport[] = [
                        "enable"   => $feed['enabled'],
                        "provider" => "UserRegistration" != $feed['provider'] ? $feed['provider'] : "UserRegistrationOrUpdate",
                        "name"     => __($feed['name'], 'fluentform'),
                        "statuses" => $data,
                    ];
                } else {
                    $integrationsReport[] = [
                        "enable"   => $feed['enabled'],
                        "provider" => "UserRegistration" != $feed['provider'] ? $feed['provider'] : "UserRegistrationOrUpdate",
                        "name"     => __($feed['name'], 'fluentform'),
                        "statuses" => [
                            [
                                "status" => "success",
                                "total"  => 0,
                            ],
                            [
                                "status" => "failed",
                                "total"  => 0,
                            ]
                        ],
                    ];
                }
            }
        }
        return $integrationsReport;
    }
}
<?php

namespace FluentForm\App\Modules\MCP\Tools;

defined('ABSPATH') || exit;

use FluentForm\App\Helpers\Helper;
use FluentForm\App\Models\Submission;
use FluentForm\App\Modules\MCP\Support\ErrorCodes;
use FluentForm\App\Modules\MCP\Support\FormAccess;
use FluentForm\App\Modules\MCP\Support\MCPHelper;
use FluentForm\App\Services\Report\ReportHelper;
use FluentForm\Framework\Support\Arr;

/**
 * Report tools (read).
 *
 * The get-form-stats tool answers "how is this form doing?" — entry counts by
 * status, total views, and conversion rate. get-submissions-trend gives a daily time
 * series for charting volume over a window. get-payment-summary (advanced)
 * answers revenue questions with server-side SUMs from the transactions table
 * via the same ReportHelper the admin Reports page uses. All form-scoped.
 */
class ReportTools
{
    const TREND_MAX_DAYS = 366;

    public static function definitions()
    {
        return [
            'fluentform/get-form-stats' => [
                'label'       => __('Get Form Stats', 'fluentform'),
                'group'       => __('Reports', 'fluentform'),
                'description' => __('Headline numbers for one form: entry counts by status (unread, read, spam, trashed, favorites, all), total views, and conversion rate (entries ÷ views). Requires form_id.', 'fluentform'),
                'input_schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'form_id' => ['type' => 'integer'],
                    ],
                    'required' => ['form_id'],
                ],
                'execute_callback'    => [self::class, 'getFormStats'],
                'capability'          => ['fluentform_entries_viewer', 'fluentform_dashboard_access'],
                'annotations' => ['readonly' => true],
            ],

            'fluentform/get-submissions-trend' => [
                'label'       => __('Get Submissions Trend', 'fluentform'),
                'group'       => __('Reports', 'fluentform'),
                'description' => __('Daily entry counts for one form over a date window (defaults to the last 30 days, maximum 366 days). Returns a date→count series for charting submission volume. Requires form_id.', 'fluentform'),
                'input_schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'form_id'   => ['type' => 'integer'],
                        'date_from' => ['type' => 'string', 'description' => 'YYYY-MM-DD (site timezone). Defaults to 30 days ago. The window may span at most 366 days.'],
                        'date_to'   => ['type' => 'string', 'description' => 'YYYY-MM-DD (site timezone). Defaults to today.'],
                    ],
                    'required' => ['form_id'],
                ],
                'execute_callback'    => [self::class, 'getTrend'],
                'capability'          => ['fluentform_entries_viewer', 'fluentform_dashboard_access'],
                'annotations' => ['readonly' => true],
            ],

            'fluentform/get-payment-summary' => [
                'label'       => __('Get Payment Summary', 'fluentform'),
                'group'       => __('Reports', 'fluentform'),
                'description' => __('Payment totals computed server-side: amount and count per payment status (paid, pending, refunded, …), split into one-time and subscription transactions, plus a combined paid total. Scope to one form with form_id or omit it to aggregate every form you can access. Defaults to the last 30 days; widen date_from/date_to for lifetime totals.', 'fluentform'),
                'input_schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'form_id'   => ['type' => 'integer', 'description' => 'Optional. Omit to aggregate across all forms in your access scope.'],
                        'date_from' => ['type' => 'string', 'description' => 'YYYY-MM-DD (site timezone). Defaults to 30 days ago.'],
                        'date_to'   => ['type' => 'string', 'description' => 'YYYY-MM-DD (site timezone). Defaults to today.'],
                    ],
                ],
                'execute_callback'    => [self::class, 'getPaymentSummary'],
                'capability'          => 'fluentform_view_payments',
                'annotations' => ['readonly' => true],
                'advanced'    => true,
            ],
        ];
    }

    public static function getFormStats($params = [])
    {
        $form = FormAccess::resolveForm($params);
        if (is_wp_error($form)) {
            return $form;
        }
        $formId = (int) $form->id;

        $counts = (new Submission())->countByGroup($formId);
        $views  = (int) Helper::getFormMeta($formId, '_total_views', 0);
        $all    = isset($counts['all']) ? (int) $counts['all'] : 0;

        $conversion = $views > 0 ? round(($all / $views) * 100, 2) : null;

        $data = [
            'form_id'             => $formId,
            'counts'              => $counts,
            'total_views'         => $views,
            'conversion_rate_pct' => $conversion,
        ];

        // Entries can exceed tracked views (e.g. a form embedded in a template
        // with view tracking off), which pushes the rate past 100% — flag it
        // rather than emit a bogus number the agent would read as real.
        if (null !== $conversion && $all > $views) {
            $data['views_note'] = __('Entries exceed tracked views, so the conversion rate is unreliable — view tracking may be disabled or unavailable for this form.', 'fluentform');
        }

        return MCPHelper::envelope(
            sprintf(
                /* translators: 1: form title, 2: entry count, 3: view count */
                __('"%1$s": %2$d entries from %3$d views.', 'fluentform'),
                $form->title,
                $all,
                $views
            ),
            $data
        );
    }

    public static function getTrend($params = [])
    {
        $form = FormAccess::resolveForm($params);
        if (is_wp_error($form)) {
            return $form;
        }
        $formId = (int) $form->id;

        $window = self::dateWindow($params, self::TREND_MAX_DAYS);
        if (is_wp_error($window)) {
            return $window;
        }
        list($from, $to) = $window;

        $rows = Submission::query()
            ->where('form_id', $formId)
            ->where('status', '!=', 'trashed')
            ->where('created_at', '>=', $from . ' 00:00:00')
            ->where('created_at', '<=', $to . ' 23:59:59')
            ->selectRaw('DATE(created_at) as day, COUNT(*) as count')
            ->groupBy('day')
            ->orderBy('day', 'ASC')
            ->get();

        $series = [];
        $total  = 0;
        foreach ($rows as $row) {
            $count    = (int) $row->count;
            $total   += $count;
            $series[] = ['date' => $row->day, 'count' => $count];
        }

        return MCPHelper::envelope(
            sprintf(
                /* translators: 1: total entries, 2: start date, 3: end date */
                __('%1$d entries between %2$s and %3$s.', 'fluentform'),
                $total,
                $from,
                $to
            ),
            [
                'form_id' => $formId,
                'from'    => $from,
                'to'      => $to,
                'total'   => $total,
                'series'  => $series,
            ]
        );
    }

    public static function getPaymentSummary($params = [])
    {
        $formId = 0;
        if (!empty($params['form_id'])) {
            // ReportHelper trusts a non-zero form id without a scope check, so
            // the access check has to happen here, before it's passed down.
            $form = FormAccess::resolveForm($params);
            if (is_wp_error($form)) {
                return $form;
            }
            $formId = (int) $form->id;
        }

        $settings = get_option('__fluentform_payment_module_settings');
        if (!$settings || !Arr::isTrue($settings, 'status')) {
            return MCPHelper::error(ErrorCodes::FEATURE_DISABLED, __('The payment module is disabled, so there is no payment data to summarize.', 'fluentform'));
        }

        // No span clamp: this is a SUM grouped by status (a handful of rows),
        // not per-day buckets, and the admin Reports page runs the same query
        // unbounded — lifetime totals are a legitimate ask.
        $window = self::dateWindow($params);
        if (is_wp_error($window)) {
            return $window;
        }
        list($from, $to) = $window;

        $onetime      = self::normalizePaymentBlock(ReportHelper::getPaymentsByType($from . ' 00:00:00', $to . ' 23:59:59', 'onetime', $formId));
        $subscription = self::normalizePaymentBlock(ReportHelper::getPaymentsByType($from . ' 00:00:00', $to . ' 23:59:59', 'subscription', $formId));

        $totalPaid = 0;
        foreach ([$onetime, $subscription] as $block) {
            $totalPaid += (float) Arr::get($block, 'payment_statuses.paid.amount', 0);
        }

        $symbol = Arr::get($onetime, 'currency_symbol', Arr::get($subscription, 'currency_symbol', ''));

        return MCPHelper::envelope(
            sprintf(
                /* translators: 1: currency symbol, 2: paid amount, 3: start date, 4: end date */
                __('%1$s%2$s paid between %3$s and %4$s.', 'fluentform'),
                $symbol,
                number_format($totalPaid, 2),
                $from,
                $to
            ),
            [
                'form_id'         => $formId ? $formId : null,
                'from'            => $from,
                'to'              => $to,
                'currency_symbol' => $symbol,
                'total_paid'      => round($totalPaid, 2),
                'onetime'         => $onetime,
                'subscription'    => $subscription,
            ]
        );
    }

    /**
     * ReportHelper output is shaped for the admin UI: counts come back as
     * string column values and the currency sign HTML-encoded. Tighten both
     * for the agent-facing JSON contract.
     */
    private static function normalizePaymentBlock($block)
    {
        if (!is_array($block)) {
            return [];
        }

        if (isset($block['currency_symbol'])) {
            $block['currency_symbol'] = html_entity_decode($block['currency_symbol'], ENT_QUOTES);
        }

        if (!empty($block['payment_statuses']) && is_array($block['payment_statuses'])) {
            foreach ($block['payment_statuses'] as $status => $row) {
                if (isset($row['count'])) {
                    $block['payment_statuses'][$status]['count'] = (int) $row['count'];
                }
            }
        }

        return $block;
    }

    /**
     * Validated Y-m-d [from, to] window from tool params. Defaults to the last
     * 30 days ending today; a non-zero $maxDays caps the span.
     *
     * @return array|\WP_Error
     */
    private static function dateWindow($params, $maxDays = 0)
    {
        $to = !empty($params['date_to']) ? sanitize_text_field($params['date_to']) : gmdate('Y-m-d', current_time('timestamp'));
        if (!MCPHelper::isYmd($to)) {
            return MCPHelper::error(ErrorCodes::INVALID_PARAM, __('date_to must be a valid date in YYYY-MM-DD format.', 'fluentform'), ['fields' => ['date_to']]);
        }

        $from = !empty($params['date_from']) ? sanitize_text_field($params['date_from']) : gmdate('Y-m-d', strtotime('-30 days', strtotime($to)));
        if (!MCPHelper::isYmd($from)) {
            return MCPHelper::error(ErrorCodes::INVALID_PARAM, __('date_from must be a valid date in YYYY-MM-DD format.', 'fluentform'), ['fields' => ['date_from']]);
        }

        if ($from > $to) {
            return MCPHelper::error(ErrorCodes::INVALID_PARAM, __('date_from must be on or before date_to.', 'fluentform'), ['fields' => ['date_from', 'date_to']]);
        }

        if ($maxDays) {
            $spanDays = (int) (new \DateTime($from))->diff(new \DateTime($to))->days;
            if ($spanDays > $maxDays) {
                return MCPHelper::error(
                    ErrorCodes::INVALID_PARAM,
                    sprintf(
                        /* translators: %d: maximum allowed days in the date window */
                        __('The date window may span at most %d days. Narrow date_from/date_to and call again.', 'fluentform'),
                        $maxDays
                    ),
                    ['fields' => ['date_from', 'date_to'], 'max_days' => $maxDays]
                );
            }
        }

        return [$from, $to];
    }
}

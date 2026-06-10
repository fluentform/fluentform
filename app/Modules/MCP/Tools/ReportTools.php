<?php

namespace FluentForm\App\Modules\MCP\Tools;

defined('ABSPATH') || exit;

use FluentForm\App\Helpers\Helper;
use FluentForm\App\Models\Submission;
use FluentForm\App\Modules\MCP\Support\ErrorCodes;
use FluentForm\App\Modules\MCP\Support\FormAccess;
use FluentForm\App\Modules\MCP\Support\MCPHelper;
use FluentForm\App\Modules\MCP\Support\PermissionGate;

/**
 * Report tools (read).
 *
 * The get-form-stats tool answers "how is this form doing?" — entry counts by
 * status, total views, and conversion rate. get-submissions-trend gives a daily time
 * series for charting volume over a window. Both are per-form and form-scoped.
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
                'permission_callback' => function () {
                    return PermissionGate::can('fluentform_entries_viewer') || PermissionGate::can('fluentform_dashboard_access');
                },
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
                'permission_callback' => function () {
                    return PermissionGate::can('fluentform_entries_viewer') || PermissionGate::can('fluentform_dashboard_access');
                },
                'annotations' => ['readonly' => true],
            ],
        ];
    }

    public static function getFormStats($params = [])
    {
        $form = FormAccess::resolveForm(isset($params['form_id']) ? $params['form_id'] : 0);
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
        $form = FormAccess::resolveForm(isset($params['form_id']) ? $params['form_id'] : 0);
        if (is_wp_error($form)) {
            return $form;
        }
        $formId = (int) $form->id;

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

        // Span clamp: the window bounds the scan and the GROUP BY bucket count,
        // so it gets a ceiling just like per_page does.
        $spanDays = (int) (new \DateTime($from))->diff(new \DateTime($to))->days;
        if ($spanDays > self::TREND_MAX_DAYS) {
            return MCPHelper::error(
                ErrorCodes::INVALID_PARAM,
                sprintf(
                    /* translators: %d: maximum allowed days in the trend window */
                    __('The date window may span at most %d days. Narrow date_from/date_to and call again.', 'fluentform'),
                    self::TREND_MAX_DAYS
                ),
                ['fields' => ['date_from', 'date_to'], 'max_days' => self::TREND_MAX_DAYS]
            );
        }

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
}

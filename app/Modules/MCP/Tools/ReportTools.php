<?php

namespace FluentForm\App\Modules\MCP\Tools;

defined('ABSPATH') or die;

use FluentForm\App\Helpers\Helper;
use FluentForm\App\Models\Form;
use FluentForm\App\Models\Submission;
use FluentForm\App\Modules\MCP\Support\MCPHelper;
use FluentForm\App\Modules\MCP\Support\PermissionGate;

/**
 * Report tools (read).
 *
 * get-form-stats answers "how is this form doing?" — entry counts by status,
 * total views, and conversion rate. get-submissions-trend gives a daily time
 * series for charting volume over a window. Both are per-form and form-scoped.
 */
class ReportTools
{
    public static function definitions()
    {
        return [
            'fluentform/get-form-stats' => [
                'label'       => __('Get Form Stats', 'fluentform'),
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
                'description' => __('Daily entry counts for one form over a date window (defaults to the last 30 days). Returns a date→count series for charting submission volume. Requires form_id.', 'fluentform'),
                'input_schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'form_id'   => ['type' => 'integer'],
                        'date_from' => ['type' => 'string', 'description' => 'YYYY-MM-DD (site timezone). Defaults to 30 days ago.'],
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
        $formId = isset($params['form_id']) ? (int) $params['form_id'] : 0;
        $guard  = self::guard($formId);
        if (is_wp_error($guard)) {
            return $guard;
        }
        $form = $guard;

        $counts = (new Submission())->countByGroup($formId);
        $views  = (int) Helper::getFormMeta($formId, '_total_views', 0);
        $all    = isset($counts['all']) ? (int) $counts['all'] : 0;

        $conversion = $views > 0 ? round(($all / $views) * 100, 2) : null;

        return MCPHelper::envelope(
            sprintf(
                /* translators: 1: form title, 2: entry count, 3: view count */
                __('"%1$s": %2$d entries from %3$d views.', 'fluentform'),
                $form->title,
                $all,
                $views
            ),
            [
                'form_id'             => $formId,
                'counts'              => $counts,
                'total_views'         => $views,
                'conversion_rate_pct' => $conversion,
            ]
        );
    }

    public static function getTrend($params = [])
    {
        $formId = isset($params['form_id']) ? (int) $params['form_id'] : 0;
        $guard  = self::guard($formId);
        if (is_wp_error($guard)) {
            return $guard;
        }

        $to   = !empty($params['date_to']) ? sanitize_text_field($params['date_to']) : gmdate('Y-m-d', current_time('timestamp'));
        $from = !empty($params['date_from']) ? sanitize_text_field($params['date_from']) : gmdate('Y-m-d', strtotime('-30 days', strtotime($to)));

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

    /**
     * Resolve + access-check a form. Returns the Form model or a WP_Error.
     *
     * @return \FluentForm\App\Models\Form|\WP_Error
     */
    private static function guard($formId)
    {
        if (!$formId) {
            return MCPHelper::error('missing_identifier', __('form_id is required.', 'fluentform'), ['fields' => ['form_id']]);
        }
        if (!PermissionGate::canAccessForm($formId)) {
            return MCPHelper::error('forbidden', __('You do not have access to this form.', 'fluentform'));
        }
        $form = Form::query()->find($formId);
        if (!$form) {
            return MCPHelper::error('not_found', __('No form found for the given form_id.', 'fluentform'));
        }
        return $form;
    }
}

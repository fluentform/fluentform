<?php

namespace FluentForm\App\Modules\MCP\Tools;

defined('ABSPATH') or die;

use FluentForm\App\Models\Form;
use FluentForm\App\Modules\MCP\Support\MCPHelper;
use FluentForm\App\Modules\MCP\Support\PermissionGate;
use FluentForm\App\Services\Form\FormService;

/**
 * Form tools (read).
 *
 * list-forms is the catalogue; get-form loads one form's field schema so the
 * agent knows the exact field keys before reading entries. Both respect the
 * user's form scope: a "specific forms" manager never sees a form outside their
 * assignment, even by id.
 */
class FormTools
{
    public static function definitions()
    {
        return [
            'fluentform/list-forms' => [
                'label'       => __('List Forms', 'fluentform'),
                'description' => __('Find and filter forms with compact rows (id, title, status, type, entry count). Use this to discover the form_id you need for list-submissions and get-form-stats.', 'fluentform'),
                'input_schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'search'    => ['type' => 'string', 'description' => 'Matches form title.'],
                        'status'    => ['type' => 'string', 'enum' => ['published', 'unpublished']],
                        'sort_by'   => ['type' => 'string', 'enum' => ['ASC', 'DESC'], 'default' => 'DESC'],
                        'page'      => ['type' => 'integer', 'default' => 1],
                        'per_page'  => ['type' => 'integer', 'default' => 15, 'description' => 'Max 100.'],
                    ],
                ],
                'execute_callback'    => [self::class, 'listForms'],
                'permission_callback' => function () {
                    return PermissionGate::can('fluentform_forms_manager') || PermissionGate::can('fluentform_dashboard_access');
                },
                'annotations' => ['readonly' => true],
            ],

            'fluentform/get-form' => [
                'label'       => __('Get Form', 'fluentform'),
                'description' => __('Full detail for one form: status, type, timestamps, and the field schema (each input key, label, and element type) so you know the exact keys that appear in submission responses.', 'fluentform'),
                'input_schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'form_id' => ['type' => 'integer', 'description' => 'The form id (from list-forms).'],
                    ],
                    'required' => ['form_id'],
                ],
                'execute_callback'    => [self::class, 'getForm'],
                'permission_callback' => function () {
                    return PermissionGate::can('fluentform_forms_manager') || PermissionGate::can('fluentform_dashboard_access');
                },
                'annotations' => ['readonly' => true],
            ],
        ];
    }

    public static function listForms($params = [])
    {
        $paging = MCPHelper::pagination($params, 15);
        $scope  = PermissionGate::formScope();

        $query = Form::query()->orderBy('id', strtoupper(isset($params['sort_by']) && 'ASC' === strtoupper($params['sort_by']) ? 'ASC' : 'DESC'));

        if ($scope !== false) {
            $query->whereIn('id', $scope ?: [0]);
        }
        if (!empty($params['search'])) {
            $query->where('title', 'LIKE', '%' . sanitize_text_field($params['search']) . '%');
        }
        if (!empty($params['status'])) {
            $query->where('status', sanitize_text_field($params['status']));
        }

        $paginator = $query->paginate($paging['per_page'], ['*'], 'page', $paging['page']);
        $total     = MCPHelper::paginatorTotal($paginator);

        $rows = [];
        foreach (MCPHelper::paginatorItems($paginator) as $form) {
            $rows[] = [
                'id'         => (int) $form->id,
                'title'      => $form->title,
                'status'     => $form->status,
                'type'       => $form->type,
                'entries'    => self::entryCount($form->id),
                'created_at' => MCPHelper::toIso8601($form->created_at),
            ];
        }

        return MCPHelper::envelope(
            sprintf(
                /* translators: %d: number of matching forms */
                _n('%d form found.', '%d forms found.', $total, 'fluentform'),
                $total
            ),
            ['forms' => $rows],
            MCPHelper::pagingMeta($paginator)
        );
    }

    public static function getForm($params = [])
    {
        $formId = isset($params['form_id']) ? (int) $params['form_id'] : 0;
        if (!$formId) {
            return MCPHelper::error('missing_identifier', __('form_id is required.', 'fluentform'), ['fields' => ['form_id']]);
        }

        if (!PermissionGate::canAccessForm($formId)) {
            return MCPHelper::error('forbidden', __('You do not have access to this form.', 'fluentform'), ['required_perm' => 'fluentform_forms_manager']);
        }

        $form = Form::query()->find($formId);
        if (!$form) {
            return MCPHelper::error('not_found', __('No form found for the given form_id.', 'fluentform'));
        }

        $fields = [];
        try {
            $service = new FormService();
            $schema  = $service->getInputsAndLabels($formId);
            $inputs  = isset($schema['inputs']) ? $schema['inputs'] : [];
            $labels  = isset($schema['labels']) ? $schema['labels'] : [];
            foreach ($inputs as $key => $input) {
                $fields[] = [
                    'key'     => $key,
                    'label'   => isset($labels[$key]) ? $labels[$key] : (isset($input['admin_label']) ? $input['admin_label'] : $key),
                    'element' => isset($input['element']) ? $input['element'] : null,
                ];
            }
        } catch (\Throwable $e) {
            $fields = [];
        }

        return MCPHelper::envelope(
            sprintf(
                /* translators: 1: form title, 2: field count */
                __('Form "%1$s" has %2$d fields.', 'fluentform'),
                $form->title,
                count($fields)
            ),
            [
                'id'         => (int) $form->id,
                'title'      => $form->title,
                'status'     => $form->status,
                'type'       => $form->type,
                'entries'    => self::entryCount($form->id),
                'created_at' => MCPHelper::toIso8601($form->created_at),
                'updated_at' => MCPHelper::toIso8601($form->updated_at),
                'fields'     => $fields,
            ]
        );
    }

    private static function entryCount($formId)
    {
        try {
            return (int) \FluentForm\App\Models\Submission::query()
                ->where('form_id', $formId)
                ->where('status', '!=', 'trashed')
                ->count();
        } catch (\Throwable $e) {
            return null;
        }
    }
}

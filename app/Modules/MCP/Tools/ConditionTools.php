<?php

namespace FluentForm\App\Modules\MCP\Tools;

defined('ABSPATH') || exit;

use FluentForm\App\Models\Form;
use FluentForm\App\Modules\MCP\Support\ErrorCodes;
use FluentForm\App\Modules\MCP\Support\FormAccess;
use FluentForm\App\Modules\MCP\Support\MCPHelper;
use FluentForm\App\Modules\MCP\Support\Mutation;
use FluentForm\App\Modules\MCP\Support\PermissionGate;

/**
 * Field conditional-logic tools (advanced opt-in).
 *
 * Read and write a single field's show/hide rules (settings.conditional_logics)
 * inside the form definition. Writes are per-field: only the targeted field's
 * rules change; every other field and the rest of the definition is preserved.
 */
class ConditionTools
{
    public static function definitions()
    {
        return [
            'fluentform/get-field-conditions' => [
                'label'       => __('Get Field Conditions', 'fluentform'),
                'group'       => __('Design', 'fluentform'),
                'description' => __('List the conditional logic (show/hide rules) configured on a form\'s fields. Returns only fields that have rules, each as { key, label, conditional_logics }. Requires form_id.', 'fluentform'),
                'input_schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'form_id' => ['type' => 'integer', 'description' => 'Required. The form to inspect.'],
                    ],
                    'required' => ['form_id'],
                ],
                'execute_callback'    => [self::class, 'getConditions'],
                'permission_callback' => function () {
                    return PermissionGate::can('fluentform_forms_manager');
                },
                'annotations' => ['readonly' => true],
                'advanced'    => true,
            ],

            'fluentform/update-field-conditions' => [
                'label'       => __('Update Field Conditions', 'fluentform'),
                'group'       => __('Design', 'fluentform'),
                'description' => __('Set or clear the conditional logic on one field, by field key. Pass conditional_logics to set the rules (each rule needs field + operator, and the referenced field must exist on the form), or omit/empty it to clear them. Only the targeted field changes. Requires form_id and field_key.', 'fluentform'),
                'input_schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'form_id'            => ['type' => 'integer', 'description' => 'Required. The form.'],
                        'field_key'          => ['type' => 'string', 'description' => 'Required. The field name/key to update.'],
                        'conditional_logics' => ['type' => 'object', 'description' => 'The conditional logic object; empty/omitted clears the rules.'],
                    ],
                    'required' => ['form_id', 'field_key'],
                ],
                'execute_callback'    => [self::class, 'updateConditions'],
                'permission_callback' => function () {
                    return PermissionGate::can('fluentform_forms_manager');
                },
                'advanced' => true,
            ],
        ];
    }

    public static function getConditions($params = [])
    {
        $form = FormAccess::resolveForm(isset($params['form_id']) ? $params['form_id'] : 0);
        if (is_wp_error($form)) {
            return $form;
        }
        $formId  = (int) $form->id;
        $decoded = self::decodeFields($form);
        $fields  = self::extractConditions($decoded['fields']);

        return MCPHelper::envelope(
            sprintf(
                /* translators: 1: field count, 2: form title */
                _n('%1$d field with conditions on "%2$s".', '%1$d fields with conditions on "%2$s".', count($fields), 'fluentform'),
                count($fields),
                $form->title
            ),
            ['form_id' => $formId, 'fields' => $fields]
        );
    }

    public static function updateConditions($params = [])
    {
        $fieldKey = isset($params['field_key']) ? sanitize_text_field($params['field_key']) : '';
        if ('' === $fieldKey) {
            return MCPHelper::error(ErrorCodes::MISSING_PARAM, __('field_key is required.', 'fluentform'), ['fields' => ['field_key']]);
        }

        $form = FormAccess::resolveForm(isset($params['form_id']) ? $params['form_id'] : 0);
        if (is_wp_error($form)) {
            return $form;
        }
        $formId  = (int) $form->id;
        $decoded = self::decodeFields($form);
        $allKeys = self::fieldKeys($decoded['fields']);

        if (!isset($allKeys[$fieldKey])) {
            return MCPHelper::error(ErrorCodes::NOT_FOUND, __('No field with that field_key exists on this form.', 'fluentform'), ['fields' => ['field_key']]);
        }

        $rawLogics = isset($params['conditional_logics']) ? $params['conditional_logics'] : [];
        $clearing  = empty($rawLogics);

        if (!$clearing) {
            $validation = self::validateLogics($rawLogics, $allKeys);
            if (is_wp_error($validation)) {
                return $validation;
            }
        }

        $logics = $clearing ? [] : fluentFormSanitizer($rawLogics);

        return Mutation::run('fluentform/update-field-conditions', $params, function () use ($formId, $decoded, $fieldKey, $logics, $clearing) {
            self::walkByRef($decoded['fields'], function (&$field) use ($fieldKey, $logics) {
                if (isset($field['attributes']['name']) && $field['attributes']['name'] === $fieldKey) {
                    if (!isset($field['settings']) || !is_array($field['settings'])) {
                        $field['settings'] = [];
                    }
                    $field['settings']['conditional_logics'] = $logics;
                }
            });

            Form::query()->where('id', $formId)->update([
                'form_fields' => wp_json_encode($decoded),
                'updated_at'  => current_time('mysql'),
            ]);

            return MCPHelper::envelope(
                $clearing
                    ? sprintf(/* translators: %s: field key */ __('Cleared conditions on "%s".', 'fluentform'), $fieldKey)
                    : sprintf(/* translators: %s: field key */ __('Updated conditions on "%s".', 'fluentform'), $fieldKey),
                ['form_id' => $formId, 'field_key' => $fieldKey, 'cleared' => $clearing]
            );
        }, ['form_id' => $formId]);
    }

    /** Conditioned fields as [{ key, label, conditional_logics }], recursing into containers. */
    public static function extractConditions(array $fields)
    {
        $out = [];
        self::walk($fields, function ($field) use (&$out) {
            $logics = isset($field['settings']['conditional_logics']) ? $field['settings']['conditional_logics'] : null;
            if (self::hasRules($logics)) {
                $out[] = [
                    'key'                => isset($field['attributes']['name']) ? $field['attributes']['name'] : null,
                    'label'              => isset($field['settings']['label']) ? $field['settings']['label'] : null,
                    'conditional_logics' => $logics,
                ];
            }
        });

        return $out;
    }

    /** Map of every field key on the form (nested included), for existence checks. */
    public static function fieldKeys(array $fields)
    {
        $keys = [];
        self::walk($fields, function ($field) use (&$keys) {
            if (isset($field['attributes']['name']) && '' !== $field['attributes']['name']) {
                $keys[$field['attributes']['name']] = true;
            }
        });

        return $keys;
    }

    public static function hasRules($logics)
    {
        return is_array($logics) && (!empty($logics['conditions']) || !empty($logics['condition_groups']));
    }

    /**
     * Validate a conditional_logics object: at least one rule, each with a
     * non-empty field + operator, and every referenced field present on the form.
     *
     * @return true|\WP_Error
     */
    public static function validateLogics($logics, array $allKeys)
    {
        if (!is_array($logics)) {
            return MCPHelper::error(ErrorCodes::INVALID_PARAM, __('conditional_logics must be an object.', 'fluentform'), ['fields' => ['conditional_logics']]);
        }

        $rules = self::collectRules($logics);
        if (empty($rules)) {
            return MCPHelper::error(ErrorCodes::INVALID_PARAM, __('conditional_logics must contain at least one rule under conditions or condition_groups.', 'fluentform'), ['fields' => ['conditional_logics']]);
        }

        foreach ($rules as $rule) {
            if (!is_array($rule) || !isset($rule['field']) || '' === $rule['field'] || !isset($rule['operator']) || '' === $rule['operator']) {
                return MCPHelper::error(ErrorCodes::INVALID_PARAM, __('Every rule requires a non-empty field and operator.', 'fluentform'), ['fields' => ['conditional_logics']]);
            }
            if (!isset($allKeys[$rule['field']])) {
                return MCPHelper::error(
                    ErrorCodes::INVALID_PARAM,
                    sprintf(/* translators: %s: referenced field key */ __('Rule references unknown field "%s".', 'fluentform'), $rule['field']),
                    ['fields' => ['conditional_logics']]
                );
            }
        }

        return true;
    }

    private static function collectRules($logics)
    {
        $rules = [];
        if (!empty($logics['conditions']) && is_array($logics['conditions'])) {
            foreach ($logics['conditions'] as $rule) {
                $rules[] = $rule;
            }
        }
        if (!empty($logics['condition_groups']) && is_array($logics['condition_groups'])) {
            foreach ($logics['condition_groups'] as $group) {
                if (!empty($group['conditions']) && is_array($group['conditions'])) {
                    foreach ($group['conditions'] as $rule) {
                        $rules[] = $rule;
                    }
                }
            }
        }

        return $rules;
    }

    private static function decodeFields($form)
    {
        $decoded = json_decode($form->form_fields, true);
        if (!is_array($decoded)) {
            $decoded = [];
        }
        if (!isset($decoded['fields']) || !is_array($decoded['fields'])) {
            $decoded['fields'] = [];
        }

        return $decoded;
    }

    private static function walk($fields, callable $cb)
    {
        foreach ($fields as $field) {
            if (!is_array($field)) {
                continue;
            }
            $cb($field);
            if (isset($field['columns']) && is_array($field['columns'])) {
                foreach ($field['columns'] as $column) {
                    if (isset($column['fields']) && is_array($column['fields'])) {
                        self::walk($column['fields'], $cb);
                    }
                }
            }
            if (isset($field['fields']) && is_array($field['fields'])) {
                self::walk($field['fields'], $cb);
            }
        }
    }

    private static function walkByRef(&$fields, callable $cb)
    {
        foreach ($fields as &$field) {
            if (!is_array($field)) {
                continue;
            }
            $cb($field);
            if (isset($field['columns']) && is_array($field['columns'])) {
                foreach ($field['columns'] as &$column) {
                    if (isset($column['fields']) && is_array($column['fields'])) {
                        self::walkByRef($column['fields'], $cb);
                    }
                }
                unset($column);
            }
            if (isset($field['fields']) && is_array($field['fields'])) {
                self::walkByRef($field['fields'], $cb);
            }
        }
        unset($field);
    }
}

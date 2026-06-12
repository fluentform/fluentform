<?php

namespace FluentForm\App\Modules\MCP\Tools;

defined('ABSPATH') || exit;

use FluentForm\App\Models\Form;
use FluentForm\App\Modules\MCP\Support\ErrorCodes;
use FluentForm\App\Modules\MCP\Support\FormAccess;
use FluentForm\App\Modules\MCP\Support\MCPHelper;
use FluentForm\App\Modules\MCP\Support\Mutation;
use FluentForm\App\Services\Form\Updater;
use FluentForm\Framework\Support\Arr;

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
                'capability'          => 'fluentform_forms_manager',
                'annotations' => ['readonly' => true],
                'advanced'    => true,
            ],

            'fluentform/update-field-conditions' => [
                'label'       => __('Update Field Conditions', 'fluentform'),
                'group'       => __('Design', 'fluentform'),
                'description' => __('Set or clear the conditional logic on one field, by field key. The object needs status (boolean; true activates the rules) and type ("any"/"all" with a conditions array of {field, operator, value} rules, or "group" with condition_groups, each holding a rules array). Each rule needs field + operator, and the referenced field must exist on the form. Omit/empty conditional_logics to clear. Only the targeted field changes. Requires form_id and field_key.', 'fluentform'),
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
                'capability'          => 'fluentform_forms_manager',
                'advanced' => true,
            ],
        ];
    }

    public static function getConditions($params = [])
    {
        $form = FormAccess::resolveForm($params);
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

        $form = FormAccess::resolveForm($params);
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

        return Mutation::run('fluentform/update-field-conditions', $params, function () use ($formId, $fieldKey, $logics, $clearing) {
            global $wpdb;

            // Serialize against concurrent form saves: lock the form row, then
            // read-modify-write inside the same transaction so no edit can land
            // between our read and the Updater write (lost update). FOR UPDATE
            // is a no-op on engines without row locks, which degrades to the
            // fresh-read-inside-the-mutation behaviour below.
            $wpdb->query('START TRANSACTION');

            try {
                // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table from $wpdb->prefix, id is %d-prepared
                $wpdb->query($wpdb->prepare("SELECT id FROM {$wpdb->prefix}fluentform_forms WHERE id = %d FOR UPDATE", $formId));

                $fresh = Form::query()->find($formId);
                if (!$fresh) {
                    $wpdb->query('ROLLBACK');
                    return MCPHelper::error(ErrorCodes::STATE_CHANGED, __('The form was deleted while this update was in flight.', 'fluentform'));
                }
                $decoded = self::decodeFields($fresh);
                $allKeys = self::fieldKeys($decoded['fields']);

                if (!isset($allKeys[$fieldKey])) {
                    $wpdb->query('ROLLBACK');
                    return MCPHelper::error(ErrorCodes::STATE_CHANGED, __('The field was removed while this update was in flight; re-read the form and retry.', 'fluentform'), ['fields' => ['field_key']]);
                }
                if (!$clearing && is_wp_error(self::validateLogics($logics, $allKeys))) {
                    $wpdb->query('ROLLBACK');
                    return MCPHelper::error(ErrorCodes::STATE_CHANGED, __('A referenced field changed while this update was in flight; re-read the form and retry.', 'fluentform'), ['fields' => ['conditional_logics']]);
                }

                $decoded = self::applyToField($decoded, $fieldKey, $logics);

                // Through the Updater so the form_fields_update filter,
                // before_updating_form action, and field sanitizer all run — same
                // pipeline as the editor, not a raw DB write.
                (new Updater())->update([
                    'form_id'    => $formId,
                    'title'      => $fresh->title,
                    'status'     => $fresh->status,
                    'formFields' => wp_json_encode($decoded),
                ]);

                $wpdb->query('COMMIT');
            } catch (\Throwable $e) {
                $wpdb->query('ROLLBACK');
                throw $e;
            }

            return MCPHelper::envelope(
                $clearing
                    ? sprintf(/* translators: %s: field key */ __('Cleared conditions on "%s".', 'fluentform'), $fieldKey)
                    : sprintf(/* translators: %s: field key */ __('Updated conditions on "%s".', 'fluentform'), $fieldKey),
                ['form_id' => $formId, 'field_key' => $fieldKey, 'cleared' => $clearing]
            );
        }, ['form_id' => $formId]);
    }

    /**
     * Set one field's conditional_logics in a decoded form definition, leaving
     * every other field untouched. Pure — no IO — so the lost-update contract
     * ("only the targeted field changes") is unit-testable.
     */
    public static function applyToField(array $decoded, $fieldKey, $logics)
    {
        self::walkByRef($decoded['fields'], function (&$field) use ($fieldKey, $logics) {
            if (Arr::get($field, 'attributes.name') === $fieldKey) {
                if (!isset($field['settings']) || !is_array($field['settings'])) {
                    $field['settings'] = [];
                }
                $field['settings']['conditional_logics'] = $logics;
            }
        });

        return $decoded;
    }

    /** Conditioned fields as [{ key, label, conditional_logics }], recursing into containers. */
    public static function extractConditions(array $fields)
    {
        $out = [];
        self::walk($fields, function ($field) use (&$out) {
            $logics = Arr::get($field, 'settings.conditional_logics');
            if (self::hasRules($logics)) {
                $out[] = [
                    'key'                => Arr::get($field, 'attributes.name'),
                    'label'              => Arr::get($field, 'settings.label'),
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
            $name = Arr::get($field, 'attributes.name');
            if (null !== $name && '' !== $name) {
                $keys[$name] = true;
            }
        });

        return $keys;
    }

    public static function hasRules($logics)
    {
        return is_array($logics) && (!empty($logics['conditions']) || !empty($logics['condition_groups']));
    }

    /**
     * Validate a conditional_logics object against the shape the runtime
     * actually evaluates (BaseComponent::hasConditions / ConditionAssesor):
     * status (boolean) is required — without it the saved rules are inert;
     * type 'group' reads condition_groups[].rules, any other type reads the
     * top-level conditions[]. Every rule needs a string field + operator, and
     * the referenced field must exist on the form.
     *
     * @return true|\WP_Error
     */
    public static function validateLogics($logics, array $allKeys)
    {
        if (!is_array($logics)) {
            return MCPHelper::error(ErrorCodes::INVALID_PARAM, __('conditional_logics must be an object.', 'fluentform'), ['fields' => ['conditional_logics']]);
        }

        if (!isset($logics['status']) || !is_bool($logics['status'])) {
            return MCPHelper::error(ErrorCodes::INVALID_PARAM, __('conditional_logics requires a boolean status — without status:true the rules never run.', 'fluentform'), ['fields' => ['conditional_logics']]);
        }

        $isGroup = isset($logics['type']) && 'group' === $logics['type'];

        if ($isGroup) {
            if (empty($logics['condition_groups']) || !is_array($logics['condition_groups'])) {
                return MCPHelper::error(ErrorCodes::INVALID_PARAM, __('type "group" requires a non-empty condition_groups array.', 'fluentform'), ['fields' => ['conditional_logics']]);
            }
            foreach ($logics['condition_groups'] as $group) {
                if (!is_array($group) || empty($group['rules']) || !is_array($group['rules'])) {
                    return MCPHelper::error(ErrorCodes::INVALID_PARAM, __('Every condition group needs a non-empty rules array (the runtime reads rules, not conditions).', 'fluentform'), ['fields' => ['conditional_logics']]);
                }
            }
        } elseif (empty($logics['conditions']) || !is_array($logics['conditions'])) {
            return MCPHelper::error(ErrorCodes::INVALID_PARAM, __('conditional_logics requires a non-empty conditions array (or type "group" with condition_groups).', 'fluentform'), ['fields' => ['conditional_logics']]);
        }

        foreach (self::collectRules($logics) as $rule) {
            if (
                !is_array($rule)
                || !isset($rule['field']) || !is_string($rule['field']) || '' === $rule['field']
                || !isset($rule['operator']) || !is_string($rule['operator']) || '' === $rule['operator']
            ) {
                return MCPHelper::error(ErrorCodes::INVALID_PARAM, __('Every rule requires a non-empty string field and operator.', 'fluentform'), ['fields' => ['conditional_logics']]);
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
                if (!empty($group['rules']) && is_array($group['rules'])) {
                    foreach ($group['rules'] as $rule) {
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
